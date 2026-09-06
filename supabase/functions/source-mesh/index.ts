import { createClient } from '@supabase/supabase-js'

type MeshConfig = { webhook_secret?: string; worker_url?: string }
type DropRow = {
  id?: string; sourceId?: string; sourceLabel?: string; store?: string; region?: string;
  game?: string; product?: string; productId?: string; sku?: string; price?: number;
  compareAtPrice?: number; available?: boolean; url?: string; checkedAt?: string;
}
type StockRow = {
  id?: string; provider?: string; retailer?: string; store?: string; product?: string;
  status?: string; quantity?: number | null; price?: number; distanceMiles?: number | null;
  sourceType?: string; sourceAttribution?: string; sourceAttributionUrl?: string;
  checkedAt?: string; updatedAt?: string; url?: string; addToCartUrl?: string;
  confidence?: number;
}

const games = ['Pokemon','Lorcana','Magic','Yu-Gi-Oh!','One Piece']
const stockLive = new Set(['in_stock','low_stock','available','limited'])
const stockGone = new Set(['out_of_stock','sold_out','unavailable'])

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type':'application/json; charset=utf-8' } })
}
function serviceKey(): string {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  if (legacy) return legacy
  try { const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}'); return keys.default || '' } catch { return '' }
}
function clean(v: unknown, max = 160): string { return String(v || '').replace(/\s+/g,' ').trim().slice(0,max) }
function slug(v: unknown): string { return clean(v,100).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'source' }
function clamp(v: unknown, min: number, max: number, fallback: number): number {
  const n = Number(v); return Number.isFinite(n) ? Math.max(min,Math.min(max,n)) : fallback
}
function broadZip(zip: string): string { const z=String(zip||'').replace(/\D/g,''); return z.length===5 ? `${z.slice(0,3)}xx` : '' }
async function fetchJson(url: string): Promise<any> {
  const r = await fetch(url, { headers:{accept:'application/json'}, signal:AbortSignal.timeout(15000) })
  const data = await r.json().catch(()=>({}))
  if (!r.ok) throw new Error(data?.error || `${r.status} from inventory service`)
  return data
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json({error:'POST required'},405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const key = serviceKey()
  if (!supabaseUrl || !key) return json({error:'server database credential unavailable'},503)
  const supabase = createClient(supabaseUrl,key,{auth:{persistSession:false,autoRefreshToken:false}})

  const {data:cfgData,error:cfgError} = await supabase.rpc('vaultsignal_source_mesh_config')
  if (cfgError) return json({error:'Source Mesh configuration unavailable'},503)
  const cfg=(cfgData||{}) as MeshConfig
  const workerBase=String(cfg.worker_url||'').replace(/\/$/,'')
  if (!workerBase) return json({error:'inventory worker URL unavailable'},503)

  let body:any={}
  try { body=await req.json() } catch { return json({error:'invalid json'},400) }
  const mode=String(body?.mode||'global_refresh')

  if (mode==='global_refresh') {
    if (!cfg.webhook_secret || req.headers.get('x-vaultsignal-secret')!==cfg.webhook_secret) return json({error:'unauthorized'},401)

    const now=new Date(), nowIso=now.toISOString(), expires=new Date(now.getTime()+15*60000).toISOString()
    const errors:any[]=[]
    let system:any={}; let drops:any={results:[],meta:{}}
    try { system=await fetchJson(`${workerBase}/system-status`) } catch(e:any) { errors.push({source:'system-status',error:e?.message||String(e)}) }
    try { drops=await fetchJson(`${workerBase}/drop-feed?games=${encodeURIComponent(games.join(','))}&limit=120`) } catch(e:any) { errors.push({source:'drop-feed',error:e?.message||String(e)}) }

    const catalog:any[]=[]
    for (const p of [...(system.providers||[]),...(system.localStockProviders||[])]) {
      const modeName=String(p.mode||'')
      const sourceType=modeName==='official_api'?'official_api':modeName==='partner_feed'?'partner_api':modeName==='retailer_check'?'retailer_check':'system'
      catalog.push({
        source_key:`worker:${p.id||slug(p.name)}`,source_name:clean(p.name,120),source_type:sourceType,
        configured:Boolean(p.configured),health:p.configured?'healthy':'not_configured',description:clean(p.description,500),
        last_checked_at:nowIso,last_success_at:nowIso,updated_at:nowIso
      })
    }
    if (system.alertEngine) catalog.push({
      source_key:'worker:watch-engine',source_name:'VaultSignal Watch Engine',source_type:'system',
      configured:Boolean(system.alertEngine.configured),health:system.alertEngine.configured?'healthy':'not_configured',
      description:clean(system.alertEngine.description||'Cloudflare watch engine',500),last_checked_at:nowIso,last_success_at:nowIso,updated_at:nowIso
    })

    const dropRows=(Array.isArray(drops.results)?drops.results:[]) as DropRow[]
    for (const row of dropRows) {
      const sourceId=clean(row.sourceId||slug(row.store),100)
      catalog.push({
        source_key:`storefront:${sourceId}`,source_name:clean(row.store||sourceId,120),source_type:'public_storefront',
        configured:true,health:'healthy',description:'Public storefront product feed monitored by VaultSignal.',
        last_checked_at:row.checkedAt||nowIso,last_success_at:row.checkedAt||nowIso,updated_at:nowIso
      })
    }
    const catalogMap=new Map(catalog.map(x=>[x.source_key,x]))
    if (catalogMap.size) await supabase.from('source_catalog').upsert([...catalogMap.values()],{onConflict:'source_key'})

    let upserted=0
    for (const row of dropRows) {
      const sourceId=clean(row.sourceId||slug(row.store),100), sourceKey=`storefront:${sourceId}`
      const itemId=clean(row.productId||row.id||row.sku||row.product,180)
      if (!itemId || !row.product) continue
      const available=row.available===true
      const dedupeKey=`${sourceKey}|${itemId}|${available?'available':'unavailable'}`
      await supabase.from('source_observations').update({expires_at:nowIso}).eq('source_key',sourceKey).eq('source_item_id',itemId).neq('dedupe_key',dedupeKey)
      const obs={
        source_key:sourceKey,source_name:clean(row.store||sourceId,120),source_type:'public_storefront',room:'pokemon-drops',
        game:clean(row.game,40),product:clean(row.product,140),retailer:clean(row.store||sourceId,80),region:clean(row.region||'Online',32),
        evidence_kind:'availability',status:available?'available':'unavailable',available,quantity:null,
        price:Number.isFinite(Number(row.price))?Number(row.price):null,confidence:available?74:58,url:clean(row.url,2048),source_item_id:itemId,
        dedupe_key:dedupeKey,observed_at:row.checkedAt||nowIso,expires_at:expires,
        raw:{compareAtPrice:Number(row.compareAtPrice)||0,sourceLabel:clean(row.sourceLabel,80)}
      }
      const {error}=await supabase.from('source_observations').upsert(obs,{onConflict:'dedupe_key'})
      if (error) errors.push({source:sourceKey,item:itemId,error:error.message}); else upserted++
    }

    return json({ok:true,mode,checkedAt:nowIso,sources:catalogMap.size,observations_upserted:upserted,drop_rows:dropRows.length,errors})
  }

  if (mode==='local_verify') {
    const auth=req.headers.get('authorization')||''
    const token=auth.replace(/^Bearer\s+/i,'').trim()
    if (!token) return json({error:'sign in required'},401)
    const {data:userData,error:userError}=await supabase.auth.getUser(token)
    if (userError || !userData?.user) return json({error:'invalid session'},401)

    const zip=String(body?.zip||'').replace(/\D/g,'').slice(0,5)
    if (zip.length!==5) return json({error:'5-digit ZIP required'},400)
    const radius=clamp(body?.radius,1,50,25)
    const queries=[...new Set((Array.isArray(body?.queries)?body.queries:[]).map((x:any)=>clean(x,120)).filter((x:string)=>x.length>=3))].slice(0,4)
    if (!queries.length) return json({error:'at least one watch query required'},400)

    const region=broadZip(zip), now=new Date(), nowIso=now.toISOString(), expires=new Date(now.getTime()+10*60000).toISOString()
    const verified:any[]=[], errors:any[]=[]

    for (const q of queries) {
      try {
        const d=await fetchJson(`${workerBase}/local-stock?zip=${encodeURIComponent(zip)}&radius=${radius}&query=${encodeURIComponent(q)}`)
        for (const p of d.providers||[]) {
          const modeName=String(p.mode||''), sourceType=modeName==='official_api'?'official_api':modeName==='partner_feed'?'partner_api':'system'
          await supabase.from('source_catalog').upsert({
            source_key:`worker:${p.id||slug(p.name)}`,source_name:clean(p.name,120),source_type:sourceType,
            configured:Boolean(p.configured),health:p.configured?'healthy':'not_configured',description:clean(p.description,500),
            last_checked_at:nowIso,last_success_at:p.configured?nowIso:null,updated_at:nowIso
          },{onConflict:'source_key'})
        }

        for (const row of (d.results||[]) as StockRow[]) {
          const sourceType=row.sourceType==='official_api'?'official_api':row.sourceType==='partner_api'?'partner_api':''
          if (!sourceType) continue
          const status=String(row.status||'').toLowerCase(), qty=row.quantity==null?null:Number(row.quantity)
          const live=stockLive.has(status)||(Number.isFinite(qty)&&Number(qty)>0)
          const gone=stockGone.has(status)||(Number.isFinite(qty)&&Number(qty)===0&&status!=='unknown')
          if (!live && !gone) continue
          const provider=clean(row.provider||row.sourceAttribution||row.retailer||'Provider',120)
          const sourceKey=sourceType==='official_api'?'worker:bestbuy':`partner:${slug(provider)}`
          await supabase.from('source_catalog').upsert({
            source_key:sourceKey,source_name:provider,source_type:sourceType,configured:true,health:'healthy',
            description:sourceType==='official_api'?'Official inventory API evidence.':'Licensed/partner inventory feed evidence.',
            last_checked_at:nowIso,last_success_at:nowIso,updated_at:nowIso
          },{onConflict:'source_key'})
          const itemId=clean(row.id||`${row.retailer||provider}:${row.store||''}:${row.product||q}`,180)
          const dedupeKey=`${sourceKey}|${itemId}|${live?'available':'unavailable'}`
          await supabase.from('source_observations').update({expires_at:nowIso}).eq('source_key',sourceKey).eq('source_item_id',itemId).neq('dedupe_key',dedupeKey)
          const confidence=clamp(row.confidence,0,100,sourceType==='official_api'?96:92)
          const obs={
            source_key:sourceKey,source_name:provider,source_type:sourceType,room:'local-finds',game:'Pokemon',
            product:clean(row.product||q,140),retailer:clean(row.retailer||provider,80),region,
            evidence_kind:'availability',status:live?(status||'in_stock'):(status||'out_of_stock'),available:live,
            quantity:Number.isFinite(qty)?Number(qty):null,price:Number.isFinite(Number(row.price))?Number(row.price):null,
            confidence,url:clean(row.url||row.addToCartUrl,2048),source_item_id:itemId,dedupe_key:dedupeKey,
            observed_at:row.checkedAt||row.updatedAt||nowIso,expires_at:expires,
            raw:{store:clean(row.store,120),distanceMiles:Number.isFinite(Number(row.distanceMiles))?Number(row.distanceMiles):null,query:q}
          }
          const {error}=await supabase.from('source_observations').upsert(obs,{onConflict:'dedupe_key'})
          if (error) { errors.push({query:q,source:sourceKey,error:error.message}); continue }
          if (live) verified.push({query:q,provider,retailer:row.retailer||provider,store:row.store||'',product:row.product||q,status:row.status||'in_stock',quantity:qty,price:row.price||0,distanceMiles:row.distanceMiles??null,url:row.url||row.addToCartUrl||'',confidence})
        }
      } catch(e:any) { errors.push({query:q,error:e?.message||String(e)}) }
    }

    return json({ok:true,mode,region,radius,verified,errors,checkedAt:nowIso})
  }

  return json({error:'unsupported mode'},400)
})
