import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

type SignalPost = {
  id?: string
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
  urgent_only: boolean
  quiet_start: string
  quiet_end: string
  timezone: string
  rooms: string[]
}

const urgentTypes = new Set(['DROP', 'FOUND', 'CHECKOUT', 'LIMIT'])

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

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method !== 'POST') return json({ error: 'POST required' }, 405)

    const expectedSecret = Deno.env.get('SIGNAL_PUSH_WEBHOOK_SECRET') || ''
    if (expectedSecret && req.headers.get('x-vaultsignal-secret') !== expectedSecret) {
      return json({ error: 'unauthorized' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY') || ''
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY') || ''
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:support@example.com'
    if (!supabaseUrl || !serviceKey || !vapidPublic || !vapidPrivate) {
      return json({ error: 'server push secrets are not configured' }, 503)
    }

    let payload: { record?: SignalPost; post?: SignalPost }
    try { payload = await req.json() } catch { return json({ error: 'invalid json' }, 400) }
    const post = payload.record || payload.post
    if (!post?.room || !post?.type) return json({ error: 'signal post payload required' }, 400)

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: prefs, error: prefError } = await supabase
      .from('notification_preferences')
      .select('user_id,enabled,urgent_only,quiet_start,quiet_end,timezone,rooms')
      .eq('enabled', true)
      .contains('rooms', [post.room])
    if (prefError) return json({ error: prefError.message }, 500)

    const eligible = (prefs || []).filter((pref: Preference) => {
      if (pref.urgent_only && !urgentTypes.has(post.type)) return false
      if (inQuietHours(pref)) return false
      return true
    }) as Preference[]
    if (!eligible.length) return json({ delivered: 0, reason: 'no eligible subscribers' })

    const userIds = eligible.map((p) => p.user_id)
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('id,user_id,endpoint,p256dh,auth')
      .in('user_id', userIds)
    if (subError) return json({ error: subError.message }, 500)

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)
    const notification = JSON.stringify({
      title: `VaultSignal • ${post.type}`,
      body: [post.product || post.title || 'New Signal', post.retailer, post.region].filter(Boolean).join(' • '),
      tag: post.id ? `signal-${post.id}` : `signal-${Date.now()}`,
      url: post.id ? `./?signal=${encodeURIComponent(post.id)}` : './',
      data: { postId: post.id || null, room: post.room, type: post.type },
    })

    let delivered = 0
    const expiredIds: string[] = []
    await Promise.allSettled((subscriptions || []).map(async (sub: any) => {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        }, notification)
        delivered += 1
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) expiredIds.push(sub.id)
        else console.error('push failed', error?.statusCode || error?.message || error)
      }
    }))

    if (expiredIds.length) await supabase.from('push_subscriptions').delete().in('id', expiredIds)
    return json({ delivered, expired_removed: expiredIds.length, eligible_users: eligible.length })
  },
}
