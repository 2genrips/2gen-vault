import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

type SignalPost = {
  id?: string; user_id?: string; room: string; type: string; title?: string;
  product?: string; retailer?: string; region?: string; body?: string;
}
type SignalIncident = {
  id?: string; room?: string; product?: string; retailer?: string; region?: string;
  status?: string; confidence?: number; report_count?: number; reporter_count?: number;
  confirm_count?: number; gone_count?: number; last_seen_at?: string;
}
type HuntMission = {
  id: string; created_by: string; product: string; retailer?: string; broad_region?: string;
  status?: string; scout_count?: number; checkin_count?: number;
}
type HuntCheckin = {
  id: string; mission_id: string; user_id: string; result: string; retailer?: string;
  store_label?: string; broad_region?: string; note?: string; created_at?: string;
  verification_state?: string; verification_score?: number; verification_reason?: string;
  independent_confirmations?: number; source_matches?: number;
}
type Preference = {
  user_id: string; enabled: boolean; min_score: number; urgent_only: boolean;
  quiet_start: string; quiet_end: string; timezone: string; rooms: string[];
  watch_terms: string[]; local_region_only: boolean;
}
type PushConfig = { vapid_public?: string; vapid_private?: string; vapid_subject?: string; webhook_secret?: string }

const urgentTypes=new Set(['DROP','FOUND','CHECKOUT','LIMIT','SOLD OUT'])
const stockRooms=new Set(['pokemon-drops','local-finds','deals'])
const baseScores:Record<string,number>={DROP:70,FOUND:68,CHECKOUT:72,LIMIT:66,DEAL:58,PULL:44,INFO:42,'SOLD OUT':34}
const proofLabels:Record<string,string>={
  SOURCE_VERIFIED:'SOURCE VERIFIED',CORROBORATED:'CORROBORATED',UNVERIFIED:'NEEDS CONFIRMATION',
  CONFLICTED:'CONFLICTED',OBSERVATION:'OBSERVATION'
}

function localMinutes(timeZone:string):number{
  try{
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:timeZone||'UTC',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date())
    const hour=Number(parts.find(p=>p.type==='hour')?.value||0)%24
    const minute=Number(parts.find(p=>p.type==='minute')?.value||0)
    return hour*60+minute
  }catch{const d=new Date();return d.getUTCHours()*60+d.getUTCMinutes()}
}
function timeToMinutes(value:string):number{
  const [h,m]=String(value||'00:00').slice(0,5).split(':').map(Number)
  return (Number.isFinite(h)?h:0)*60+(Number.isFinite(m)?m:0)
}
function inQuietHours(pref:Preference):boolean{
  const current=localMinutes(pref.timezone),start=timeToMinutes(pref.quiet_start),end=timeToMinutes(pref.quiet_end)
  if(start===end)return false
  return start<end?current>=start&&current<end:current>=start||current<end
}
function clean(value:unknown):string{return String(value||'').trim().toLowerCase()}
function clampScore(value:unknown,fallback:number):number{
  const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.min(100,Math.round(n))):fallback
}
function isAutomatedSourcePost(post:SignalPost):boolean{return clean(post.title)==='automated source evidence'}
function matchesWatch(pref:Preference,post:SignalPost):boolean{
  if(!stockRooms.has(post.room))return true
  const terms=(pref.watch_terms||[]).map(clean).filter(x=>x.length>=3)
  if(!terms.length)return !isAutomatedSourcePost(post)
  const hay=clean(`${post.product||''} ${post.title||''} ${post.body||''} ${post.retailer||''}`)
  return terms.some(term=>hay.includes(term))
}
function broadRegion(value:unknown):string{return clean(value).replace(/\s+/g,'')}
function signalScore(post:SignalPost,reporterReputation=50):number{
  const base=baseScores[String(post.type||'INFO').toUpperCase()]??42
  const trustAdjust=Math.round((Math.max(20,Math.min(99,reporterReputation))-50)*0.25)
  return Math.max(0,Math.min(100,base+trustAdjust))
}
function json(body:unknown,status=200):Response{return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8'}})}
function serviceKey():string{
  const legacy=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''
  if(legacy)return legacy
  try{const keys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}');return keys.default||''}catch{return ''}
}

Deno.serve(async(req:Request):Promise<Response>=>{
  if(req.method!=='POST')return json({error:'POST required'},405)
  const supabaseUrl=Deno.env.get('SUPABASE_URL')||'',key=serviceKey()
  if(!supabaseUrl||!key)return json({error:'server database credential unavailable'},503)
  const supabase=createClient(supabaseUrl,key,{auth:{persistSession:false,autoRefreshToken:false}})

  const {data:configData,error:configError}=await supabase.rpc('vaultsignal_push_config')
  if(configError)return json({error:'push configuration unavailable'},503)
  const config=(configData||{}) as PushConfig
  if(!config.webhook_secret||req.headers.get('x-vaultsignal-secret')!==config.webhook_secret)return json({error:'unauthorized'},401)
  if(!config.vapid_public||!config.vapid_private)return json({error:'VAPID configuration unavailable'},503)

  let payload:{record?:SignalPost;post?:SignalPost;incident?:SignalIncident|null;mission?:HuntMission|null;checkin?:HuntCheckin|null}
  try{payload=await req.json()}catch{return json({error:'invalid json'},400)}
  const mission=payload.mission||null,checkin=payload.checkin||null,missionMode=Boolean(mission?.id&&checkin?.id)
  let post=payload.record||payload.post
  const incident=payload.incident||null

  if(missionMode&&mission&&checkin){
    const result=String(checkin.result||'INFO').toUpperCase()
    post={
      id:undefined,user_id:checkin.user_id,room:'local-finds',type:result==='SOLD_OUT'?'SOLD OUT':result,
      title:'Hunt Mission Update',product:mission.product,retailer:checkin.retailer||mission.retailer||'',
      region:checkin.broad_region||mission.broad_region||'',body:[checkin.store_label,checkin.note].filter(Boolean).join(' • ')
    }
  }
  if(!post?.room||!post?.type)return json({error:'signal or mission payload required'},400)

  let reputation=50
  if(post.user_id&&!missionMode){
    const {data}=await supabase.from('community_reputation').select('reputation_score').eq('user_id',post.user_id).maybeSingle()
    if(data?.reputation_score!=null)reputation=Number(data.reputation_score)
  }
  const missionResult=String(checkin?.result||'').toUpperCase()
  const proofState=String(checkin?.verification_state||'UNVERIFIED').toUpperCase()
  const proofFallback=missionResult==='FOUND'?62:missionResult==='SOLD_OUT'?55:0
  const proofScore=clampScore(checkin?.verification_score,proofFallback)
  const score=missionMode
    ? proofScore
    : incident?.confidence!=null?clampScore(incident.confidence,42):signalScore(post,reputation)

  // A conflicting mission claim stays visible in the mission timeline but should never wake phones.
  if(missionMode&&proofState==='CONFLICTED'){
    return json({delivered:0,score,mission_id:mission?.id||null,proof_state:proofState,reason:'conflicted claim stays in app'})
  }
  if(missionMode&&!['FOUND','SOLD_OUT'].includes(missionResult)){
    return json({delivered:0,score,mission_id:mission?.id||null,proof_state:proofState,reason:'routine mission update stays in app'})
  }

  let prefs:Preference[]=[]
  if(missionMode&&mission){
    const {data:scouts}=await supabase.from('hunt_mission_scouts').select('user_id').eq('mission_id',mission.id)
    const targetIds=[...new Set([mission.created_by,...(scouts||[]).map((x:any)=>String(x.user_id))].filter(Boolean))]
    if(targetIds.length){
      const {data,error}=await supabase.from('notification_preferences')
        .select('user_id,enabled,min_score,urgent_only,quiet_start,quiet_end,timezone,rooms,watch_terms,local_region_only')
        .eq('enabled',true).in('user_id',targetIds)
      if(error)return json({error:error.message},500)
      prefs=(data||[]) as Preference[]
    }
  }else{
    const {data,error}=await supabase.from('notification_preferences')
      .select('user_id,enabled,min_score,urgent_only,quiet_start,quiet_end,timezone,rooms,watch_terms,local_region_only')
      .eq('enabled',true).contains('rooms',[post.room])
    if(error)return json({error:error.message},500)
    prefs=(data||[]) as Preference[]
  }

  let eligible=prefs.filter(pref=>{
    if(inQuietHours(pref))return false
    if(score<Number(pref.min_score??60))return false
    if(missionMode){
      if(pref.urgent_only&&!['FOUND','SOLD_OUT'].includes(missionResult))return false
      return true
    }
    const postType=String(post!.type).toUpperCase(),incidentGone=String(incident?.status||'').toUpperCase()==='GONE'
    if(pref.urgent_only&&!urgentTypes.has(postType)&&!incidentGone)return false
    if(!matchesWatch(pref,post!))return false
    return true
  })

  if(!missionMode&&eligible.length&&post.room==='local-finds'&&post.region){
    const userIds=eligible.map(p=>p.user_id)
    const {data:profiles}=await supabase.from('community_profiles').select('user_id,broad_region').in('user_id',userIds)
    const regionByUser=new Map((profiles||[]).map((p:any)=>[p.user_id,broadRegion(p.broad_region)]))
    const postRegion=broadRegion(post.region)
    eligible=eligible.filter(pref=>{
      if(!pref.local_region_only)return true
      const mine=regionByUser.get(pref.user_id)||''
      return !mine||!postRegion||mine===postRegion
    })
  }
  if(!eligible.length)return json({delivered:0,score,incident_id:incident?.id||null,mission_id:mission?.id||null,proof_state:missionMode?proofState:null,reason:'no eligible subscribers'})

  const userIds=eligible.map(p=>p.user_id)
  const {data:subscriptions,error:subError}=await supabase.from('push_subscriptions').select('id,user_id,endpoint,p256dh,auth').in('user_id',userIds)
  if(subError)return json({error:subError.message},500)

  const incidentStatus=String(incident?.status||'').toUpperCase(),scoreBand=Math.floor(score/10)*10
  const eventKey=missionMode&&mission&&checkin
    ?`mission:${mission.id}:checkin:${checkin.id}:${missionResult}:${proofState}`
    :incident?.id?`incident:${incident.id}:${incidentStatus||'UPDATE'}:${scoreBand}`
    :post.id?`post:${post.id}`:''

  let alreadySent=new Set<string>()
  if(subscriptions?.length&&eventKey){
    const ids=subscriptions.map((s:any)=>s.id)
    const {data:deliveries}=await supabase.from('signal_push_deliveries').select('subscription_id').eq('event_key',eventKey).in('subscription_id',ids)
    alreadySent=new Set((deliveries||[]).map((d:any)=>String(d.subscription_id)))
  }
  const pending=(subscriptions||[]).filter((sub:any)=>!alreadySent.has(String(sub.id)))
  if(!pending.length)return json({delivered:0,score,incident_id:incident?.id||null,mission_id:mission?.id||null,proof_state:missionMode?proofState:null,reason:'already delivered'})

  webpush.setVapidDetails(config.vapid_subject||'https://2genrips.github.io/2gen-vault/',config.vapid_public,config.vapid_private)

  const proofLabel=proofLabels[proofState]||proofState.replaceAll('_',' ')
  const resultLabel=missionResult.replaceAll('_',' ')
  const title=missionMode
    ? proofState==='SOURCE_VERIFIED'
      ?`VaultSignal • VERIFIED ${resultLabel}`
      :proofState==='CORROBORATED'
        ?`VaultSignal • CORROBORATED ${resultLabel}`
        :`VaultSignal • ${resultLabel} • ${proofLabel}`
    :incident?.id?`VaultSignal • ${incidentStatus||'FUSION'} ${score}`:`VaultSignal • ${String(post.type).toUpperCase()}`
  const reportLabel=incident?.report_count?`${incident.report_count} report${Number(incident.report_count)===1?'':'s'}`:''
  const missionBody=missionMode&&mission&&checkin
    ?[mission.product,checkin.store_label||checkin.retailer||mission.retailer,checkin.broad_region||mission.broad_region,`${proofLabel} ${score}`,`${mission.scout_count||1} scout${Number(mission.scout_count||1)===1?'':'s'}`].filter(Boolean).join(' • ')
    :''
  const notification=JSON.stringify({
    title,
    body:missionMode?missionBody:[incident?.product||post.product||post.title||'New Signal',incident?.retailer||post.retailer,incident?.region||post.region,reportLabel,`${score} confidence`].filter(Boolean).join(' • '),
    tag:missionMode&&mission?`mission-${mission.id}`:incident?.id?`incident-${incident.id}`:post.id?`signal-${post.id}`:`signal-${Date.now()}`,
    url:missionMode&&mission?`./?mission=${encodeURIComponent(mission.id)}`:incident?.id?`./?incident=${encodeURIComponent(incident.id)}`:post.id?`./?signal=${encodeURIComponent(post.id)}`:'./',
    data:{postId:post.id||null,incidentId:incident?.id||null,missionId:mission?.id||null,missionCheckinId:checkin?.id||null,room:post.room,type:post.type,signalScore:score,incidentStatus:incidentStatus||null,proofState:missionMode?proofState:null,proofScore:missionMode?score:null,proofReason:missionMode?(checkin?.verification_reason||''):null}
  })

  let delivered=0
  const expiredIds:string[]=[],deliveryRows:any[]=[]
  await Promise.allSettled(pending.map(async(sub:any)=>{
    try{
      await webpush.sendNotification({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth}},notification)
      delivered++
      deliveryRows.push({
        post_id:missionMode?null:(post.id||null),incident_id:incident?.id||null,
        mission_id:mission?.id||null,mission_checkin_id:checkin?.id||null,event_key:eventKey,
        user_id:sub.user_id,subscription_id:sub.id,signal_score:score,status:'sent'
      })
    }catch(error:any){
      if(error?.statusCode===404||error?.statusCode===410)expiredIds.push(sub.id)
      else console.error('push failed',error?.statusCode||error?.message||error)
    }
  }))

  if(deliveryRows.length)await supabase.from('signal_push_deliveries').upsert(deliveryRows,{onConflict:'event_key,subscription_id',ignoreDuplicates:true})
  if(expiredIds.length)await supabase.from('push_subscriptions').delete().in('id',expiredIds)

  return json({delivered,score,incident_id:incident?.id||null,mission_id:mission?.id||null,mission_result:missionMode?missionResult:null,proof_state:missionMode?proofState:null,proof_score:missionMode?score:null,incident_status:incidentStatus||null,expired_removed:expiredIds.length,eligible_users:eligible.length,skipped_duplicates:alreadySent.size})
})
