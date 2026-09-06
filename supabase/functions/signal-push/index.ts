import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

type SignalPost = {
  id?: string
  user_id?: string
  room: string
  type: string
  title?: string
  product?: string
  retailer?: string
  region?: string
  body?: string
}

type Preference = {
  user_id: string
  enabled: boolean
  min_score: number
  urgent_only: boolean
  quiet_start: string
  quiet_end: string
  timezone: string
  rooms: string[]
  watch_terms: string[]
  local_region_only: boolean
}

type PushConfig = {
  vapid_public?: string
  vapid_private?: string
  vapid_subject?: string
  webhook_secret?: string
}

const urgentTypes = new Set(['DROP', 'FOUND', 'CHECKOUT', 'LIMIT'])
const stockRooms = new Set(['pokemon-drops', 'local-finds', 'deals'])
const baseScores: Record<string, number> = {
  DROP: 70,
  FOUND: 68,
  CHECKOUT: 72,
  LIMIT: 66,
  DEAL: 58,
  PULL: 44,
  INFO: 42,
  GONE: 34,
}

function localMinutes(timeZone: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date())
    const hour = Number(parts.find((p) => p.type === 'hour')?.value || 0) % 24
    const minute = Number(parts.find((p) => p.type === 'minute')?.value || 0)
    return hour * 60 + minute
  } catch {
    const d = new Date()
    return d.getUTCHours() * 60 + d.getUTCMinutes()
  }
}

function timeToMinutes(value: string): number {
  const [h, m] = String(value || '00:00').slice(0, 5).split(':').map(Number)
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0)
}

function inQuietHours(pref: Preference): boolean {
  const current = localMinutes(pref.timezone)
  const start = timeToMinutes(pref.quiet_start)
  const end = timeToMinutes(pref.quiet_end)
  if (start === end) return false
  return start < end ? current >= start && current < end : current >= start || current < end
}

function clean(value: unknown): string {
  return String(value || '').trim().toLowerCase()
}

function matchesWatch(pref: Preference, post: SignalPost): boolean {
  if (!stockRooms.has(post.room)) return true
  const terms = (pref.watch_terms || []).map(clean).filter((x) => x.length >= 3)
  if (!terms.length) return true
  const hay = clean(`${post.product || ''} ${post.title || ''} ${post.body || ''} ${post.retailer || ''}`)
  return terms.some((term) => hay.includes(term))
}

function broadRegion(value: unknown): string {
  return clean(value).replace(/\s+/g, '')
}

function signalScore(post: SignalPost, reporterReputation = 50): number {
  const base = baseScores[String(post.type || 'INFO').toUpperCase()] ?? 42
  const trustAdjust = Math.round((Math.max(20, Math.min(99, reporterReputation)) - 50) * 0.25)
  return Math.max(0, Math.min(100, base + trustAdjust))
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function serviceKey(): string {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  if (legacy) return legacy
  try {
    const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}')
    return keys.default || ''
  } catch {
    return ''
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const key = serviceKey()
  if (!supabaseUrl || !key) return json({ error: 'server database credential unavailable' }, 503)

  const supabase = createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: configData, error: configError } = await supabase.rpc('vaultsignal_push_config')
  if (configError) return json({ error: 'push configuration unavailable' }, 503)
  const config = (configData || {}) as PushConfig
  if (!config.webhook_secret || req.headers.get('x-vaultsignal-secret') !== config.webhook_secret) {
    return json({ error: 'unauthorized' }, 401)
  }
  if (!config.vapid_public || !config.vapid_private) {
    return json({ error: 'VAPID configuration unavailable' }, 503)
  }

  let payload: { record?: SignalPost; post?: SignalPost }
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'invalid json' }, 400)
  }
  const post = payload.record || payload.post
  if (!post?.room || !post?.type) return json({ error: 'signal post payload required' }, 400)

  let reputation = 50
  if (post.user_id) {
    const { data } = await supabase
      .from('community_reputation')
      .select('reputation_score')
      .eq('user_id', post.user_id)
      .maybeSingle()
    if (data?.reputation_score != null) reputation = Number(data.reputation_score)
  }
  const score = signalScore(post, reputation)

  const { data: prefs, error: prefError } = await supabase
    .from('notification_preferences')
    .select('user_id,enabled,min_score,urgent_only,quiet_start,quiet_end,timezone,rooms,watch_terms,local_region_only')
    .eq('enabled', true)
    .contains('rooms', [post.room])
  if (prefError) return json({ error: prefError.message }, 500)

  let eligible = (prefs || []).filter((pref: Preference) => {
    if (pref.urgent_only && !urgentTypes.has(String(post.type).toUpperCase())) return false
    if (inQuietHours(pref)) return false
    if (score < Number(pref.min_score ?? 60)) return false
    if (!matchesWatch(pref, post)) return false
    return true
  }) as Preference[]

  if (eligible.length && post.room === 'local-finds' && post.region) {
    const userIds = eligible.map((p) => p.user_id)
    const { data: profiles } = await supabase
      .from('community_profiles')
      .select('user_id,broad_region')
      .in('user_id', userIds)
    const regionByUser = new Map((profiles || []).map((p: any) => [p.user_id, broadRegion(p.broad_region)]))
    const postRegion = broadRegion(post.region)
    eligible = eligible.filter((pref) => {
      if (!pref.local_region_only) return true
      const mine = regionByUser.get(pref.user_id) || ''
      return !mine || !postRegion || mine === postRegion
    })
  }

  if (!eligible.length) return json({ delivered: 0, score, reason: 'no eligible subscribers' })

  const userIds = eligible.map((p) => p.user_id)
  const { data: subscriptions, error: subError } = await supabase
    .from('push_subscriptions')
    .select('id,user_id,endpoint,p256dh,auth')
    .in('user_id', userIds)
  if (subError) return json({ error: subError.message }, 500)

  let alreadySent = new Set<string>()
  if (post.id && subscriptions?.length) {
    const ids = subscriptions.map((s: any) => s.id)
    const { data: deliveries } = await supabase
      .from('signal_push_deliveries')
      .select('subscription_id')
      .eq('post_id', post.id)
      .in('subscription_id', ids)
    alreadySent = new Set((deliveries || []).map((d: any) => String(d.subscription_id)))
  }

  const pending = (subscriptions || []).filter((sub: any) => !alreadySent.has(String(sub.id)))
  if (!pending.length) return json({ delivered: 0, score, reason: 'already delivered' })

  webpush.setVapidDetails(
    config.vapid_subject || 'https://2genrips.github.io/2gen-vault/',
    config.vapid_public,
    config.vapid_private,
  )

  const notification = JSON.stringify({
    title: `VaultSignal • ${String(post.type).toUpperCase()}`,
    body: [post.product || post.title || 'New Signal', post.retailer, post.region, `${score} signal`].filter(Boolean).join(' • '),
    tag: post.id ? `signal-${post.id}` : `signal-${Date.now()}`,
    url: post.id ? `./?signal=${encodeURIComponent(post.id)}` : './',
    data: { postId: post.id || null, room: post.room, type: post.type, signalScore: score },
  })

  let delivered = 0
  const expiredIds: string[] = []
  const deliveryRows: any[] = []

  await Promise.allSettled(pending.map(async (sub: any) => {
    try {
      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      }, notification)
      delivered += 1
      if (post.id) deliveryRows.push({post_id: post.id,user_id: sub.user_id,subscription_id: sub.id,signal_score: score,status: 'sent'})
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410) expiredIds.push(sub.id)
      else console.error('push failed', error?.statusCode || error?.message || error)
    }
  }))

  if (deliveryRows.length) {
    await supabase.from('signal_push_deliveries').upsert(deliveryRows,{onConflict:'post_id,subscription_id',ignoreDuplicates:true})
  }
  if (expiredIds.length) await supabase.from('push_subscriptions').delete().in('id', expiredIds)

  return json({
    delivered,
    score,
    expired_removed: expiredIds.length,
    eligible_users: eligible.length,
    skipped_duplicates: alreadySent.size,
  })
})
