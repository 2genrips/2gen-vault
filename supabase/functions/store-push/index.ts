import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

type HuntMission={id:string;created_by:string;product:string;retailer?:string;broad_region?:string}
type HuntCheckin={id:string;mission_id:string;user_id:string;result:string;retailer?:string;store_label?:string;broad_region?:string;verification_state?:string;verification_score?:number;verification_reason?:string}
type Preference={user_id:string;enabled:boolean;min_score:number;urgent_only:boolean;quiet_start:string;quiet_end:string;timezone:string}
type PushConfig={vapid_public?:string;vapid_private?:string;vapid_subject?:string;webhook_secret?:string}

function normalize(v:unknown):string{return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function storeKey(m:HuntMission,c:HuntCheckin):string{
  const retailer=normalize(c.retailer||m.retailer||'')
  const label=normalize(c.store_label||'')
  const region=String(c.broad_region||m.broad_region||'Online').toLowerCase()
  return `${retailer}|${label}|${region}`
}
function clamp(v:unknown,fallback=0):number{const n=Number(v);return Number.isFinite(n)?Math.max(0,Math.min(100,Math.round(n))):fallback}
function minutes(v:string):number{const [h,m]=String(v||'00:00').slice(0,5).split(':').map(Number);return (Number.isFinite(h)?h:0)*60+(Number.isFinite(m)?m:0)}
function localMinutes(zone:string):number{
  try{const p=new Intl.DateTimeFormat('en-US',{timeZone:zone||'UTC',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());return (Number(p.find(x=>x.type==='hour')?.value||0)%24)*60+Number(p.find(x=>x.type==='minute')?.value||0)}catch{const d=new Date();return d.getUTCHours()*60+d.getUTCMinutes()}
}
function quiet(p:Preference):boolean{const now=localMinutes(p.timezone),s=minutes(p.quiet_start),e=minutes(p.quiet_end);if(s===e)return false;return s<e?now>=s&&now<e:now>=s||now<e}
function json(body:unknown,status=200):Response{return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8'}})}
function serviceKey():string{const legacy=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';if(legacy)return legacy;try{const keys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}');return keys.default||''}catch{return ''}}

Deno.serve(async(req:Request):Promise<Response>=>{
  if(req.method!=='POST')return json({error:'POST required'},405)
  const url=Deno.env.get('SUPABASE_URL')||'',key=serviceKey()
  if(!url||!key)return json({error:'server database credential unavailable'},503)
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data:cfgData,error:cfgError}=await db.rpc('vaultsignal_push_config')
  if(cfgError)return json({error:'push configuration unavailable'},503)
  const cfg=(cfgData||{}) as PushConfig
  if(!cfg.webhook_secret||req.headers.get('x-vaultsignal-secret')!==cfg.webhook_secret)return json({error:'unauthorized'},401)
  if(!cfg.vapid_public||!cfg.vapid_private)return json({error:'VAPID configuration unavailable'},503)

  let payload:{mission?:HuntMission;checkin?:HuntCheckin}
  try{payload=await req.json()}catch{return json({error:'invalid json'},400)}
  const mission=payload.mission,checkin=payload.checkin
  if(!mission?.id||!checkin?.id)return json({error:'mission and checkin required'},400)

  const result=String(checkin.result||'').toUpperCase()
  const proof=String(checkin.verification_state||'UNVERIFIED').toUpperCase()
  if(!['FOUND','SOLD_OUT'].includes(result))return json({delivered:0,reason:'routine activity stays in app'})
  if(!['CORROBORATED','SOURCE_VERIFIED'].includes(proof))return json({delivered:0,reason:'store followers require trusted proof',proof_state:proof})

  const sKey=storeKey(mission,checkin)
  if(!sKey.split('|')[0]||!sKey.split('|')[1])return json({delivered:0,reason:'public store identity unavailable'})
  const {data:store,error:storeError}=await db.from('store_intel').select('store_key,retailer,store_label,broad_region').eq('store_key',sKey).maybeSingle()
  if(storeError)return json({error:storeError.message},500)
  if(!store)return json({delivered:0,reason:'store not in trusted directory',store_key:sKey})

  const {data:follows,error:followError}=await db.from('store_intel_follows').select('user_id').eq('store_key',sKey)
  if(followError)return json({error:followError.message},500)
  const followerIds=[...new Set((follows||[]).map((x:any)=>String(x.user_id)).filter(Boolean))]
  if(!followerIds.length)return json({delivered:0,reason:'no store followers',store_key:sKey})

  const {data:prefs,error:prefError}=await db.from('notification_preferences')
    .select('user_id,enabled,min_score,urgent_only,quiet_start,quiet_end,timezone')
    .eq('enabled',true).in('user_id',followerIds)
  if(prefError)return json({error:prefError.message},500)
  const score=clamp(checkin.verification_score,proof==='SOURCE_VERIFIED'?94:88)
  const eligible=(prefs||[] as Preference[]).filter((p:any)=>!quiet(p)&&score>=Number(p.min_score??60)) as Preference[]
  if(!eligible.length)return json({delivered:0,reason:'no eligible store followers',store_key:sKey,score})

  const ids=eligible.map(p=>p.user_id)
  const {data:subs,error:subError}=await db.from('push_subscriptions').select('id,user_id,endpoint,p256dh,auth').in('user_id',ids)
  if(subError)return json({error:subError.message},500)
  const eventKey=`store:${sKey}:checkin:${checkin.id}:${proof}`
  const subIds=(subs||[]).map((s:any)=>s.id)
  let sent=new Set<string>()
  if(subIds.length){const {data:d}=await db.from('signal_push_deliveries').select('subscription_id').eq('event_key',eventKey).in('subscription_id',subIds);sent=new Set((d||[]).map((x:any)=>String(x.subscription_id)))}
  const pending=(subs||[]).filter((s:any)=>!sent.has(String(s.id)))
  if(!pending.length)return json({delivered:0,reason:'already delivered',store_key:sKey,score})

  webpush.setVapidDetails(cfg.vapid_subject||'https://2genrips.github.io/2gen-vault/',cfg.vapid_public,cfg.vapid_private)
  const proofLabel=proof==='SOURCE_VERIFIED'?'SOURCE VERIFIED':'CORROBORATED'
  const title=`VaultSignal • STORE ${result.replace('_',' ')}`
  const body=[mission.product,store.store_label,store.broad_region,`${proofLabel} ${score}`].filter(Boolean).join(' • ')
  const notification=JSON.stringify({
    title,body,tag:`store-${encodeURIComponent(sKey)}`,
    url:`./?store=${encodeURIComponent(sKey)}&claim=${encodeURIComponent(checkin.id)}`,
    data:{storeKey:sKey,missionId:mission.id,missionCheckinId:checkin.id,type:result,proofState:proof,proofScore:score}
  })

  let delivered=0;const expired:string[]=[],rows:any[]=[]
  await Promise.allSettled(pending.map(async(s:any)=>{
    try{
      await webpush.sendNotification({endpoint:s.endpoint,keys:{p256dh:s.p256dh,auth:s.auth}},notification);delivered++
      rows.push({post_id:null,incident_id:null,mission_id:mission.id,mission_checkin_id:checkin.id,event_key:eventKey,user_id:s.user_id,subscription_id:s.id,signal_score:score,status:'sent'})
    }catch(e:any){if(e?.statusCode===404||e?.statusCode===410)expired.push(s.id);else console.error('store push failed',e?.statusCode||e?.message||e)}
  }))
  if(rows.length)await db.from('signal_push_deliveries').upsert(rows,{onConflict:'event_key,subscription_id',ignoreDuplicates:true})
  if(expired.length)await db.from('push_subscriptions').delete().in('id',expired)
  return json({delivered,store_key:sKey,score,proof_state:proof,eligible_followers:eligible.length,expired_removed:expired.length,skipped_duplicates:sent.size})
})
