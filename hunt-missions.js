(() => {
'use strict';

const STORAGE_KEY='2gen-vault-collector-os-v4';
const $=s=>document.querySelector(s);
const arr=v=>Array.isArray(v)?v:[];
const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const cloud=()=>window.TWOGEN_CLOUD||{};
const live=()=>Boolean(cloud().configured&&cloud().client&&cloud().user);
let missions=[];let joined=new Set();let filter='ACTIVE';let activeId='';let loading=false;let realtime=[];

function read(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{return {}}}
function me(){return cloud().user?.id||''}
function age(v){const m=Math.max(0,Math.floor((Date.now()-new Date(v||0).getTime())/60000));if(m<1)return'now';if(m<60)return`${m}m`;const h=Math.floor(m/60);if(h<24)return`${h}h`;return`${Math.floor(h/24)}d`}
function timeLeft(v){const ms=new Date(v||0).getTime()-Date.now();if(ms<=0)return'expired';const h=Math.ceil(ms/3600000);if(h<24)return`${h}h left`;return`${Math.ceil(h/24)}d left`}
function broadRegion(){
  const s=read();const values=[s.settings?.zip,s.settings?.homeZip,s.stockSettings?.zip,s.preferredZip,s.zip];
  const z=values.map(x=>String(x||'').replace(/\D/g,'')).find(x=>x.length===5);return z?`${z.slice(0,3)}xx`:'Online';
}
function watchTerms(){const s=read();return [...new Set([...arr(s.stockWatches),...arr(s.wishlist),...arr(s.acquisitionQueue),...arr(s.chaseList)].flatMap(x=>[x.product,x.name,x.cardName,x.query,x.set].filter(Boolean)).map(String))].slice(0,12)}
function isMine(m){return String(m.created_by)===String(me())}
function isJoined(m){return joined.has(String(m.id))}
function statusClass(s=''){return String(s).toLowerCase()}
function filtered(){return missions.filter(m=>{
  if(filter==='MINE')return isMine(m)
  if(filter==='JOINED')return isJoined(m)
  if(filter==='FOUND')return m.status==='FOUND'
  return ['OPEN','SCOUTING'].includes(m.status)&&new Date(m.deadline_at).getTime()>Date.now()
}).sort((a,b)=>Number(isJoined(b))-Number(isJoined(a))||String(b.last_activity_at).localeCompare(String(a.last_activity_at)))}

async function load(){
  loading=true;render();
  if(!live()){missions=[];joined=new Set();loading=false;render();return}
  try{
    const [{data:m,error:me1},{data:s,error:se}]=await Promise.all([
      cloud().client.from('hunt_missions').select('*').order('last_activity_at',{ascending:false}).limit(100),
      cloud().client.from('hunt_mission_scouts').select('mission_id').eq('user_id',me())
    ]);
    if(me1)throw me1;if(se)throw se;missions=m||[];joined=new Set((s||[]).map(x=>String(x.mission_id)));
  }catch(e){console.warn('hunt load',e)}
  loading=false;render();
}
function card(m){const mine=isMine(m),on=isJoined(m);return `<button class="hm-card ${statusClass(m.status)}" data-mission="${esc(m.id)}">
  <div class="hm-card-top"><span class="hm-status">${esc(m.status)}</span>${on?'<span class="hm-team">ON YOUR TEAM</span>':''}<small>${timeLeft(m.deadline_at)}</small></div>
  <h3>${esc(m.product)}</h3><p>${[m.game,m.retailer,m.broad_region].filter(Boolean).map(esc).join(' • ')}</p>
  <div class="hm-stats"><span><b>${Number(m.scout_count||0)}</b> scouts</span><span><b>${Number(m.checkin_count||0)}</b> updates</span><span><b>${Number(m.found_count||0)}</b> found</span></div>
  <div class="hm-card-foot"><span>${mine?'YOU CREATED THIS':'COMMUNITY MISSION'}</span><span>updated ${age(m.last_activity_at)} ago</span></div>
</button>`}
function listView(){const list=filtered(),active=missions.filter(m=>['OPEN','SCOUTING'].includes(m.status)&&new Date(m.deadline_at).getTime()>Date.now()).length,my=missions.filter(isJoined).length,found=missions.filter(m=>m.status==='FOUND').length;return `<div class="hm-scroll">
  <section class="hm-hero"><div><span class="hm-kicker">HUNT MISSIONS • v23</span><h2>Stop scrolling. Hunt together.</h2><p>Structured collector missions combine scout check-ins, Source Mesh evidence and Signal Fusion intelligence without private DMs or exact home locations.</p></div><button id="hmCreate" ${live()?'':'disabled'}>＋ MISSION</button></section>
  <div class="hm-summary"><div><b>${active}</b><span>active</span></div><div><b>${my}</b><span>your teams</span></div><div><b>${found}</b><span>found</span></div></div>
  ${!live()?'<div class="hm-signin"><b>Sign in for live Hunt Missions</b><p>Hunt Missions are shared community teamwork, so a collector account is required. Your local Vault remains available without signing in.</p><button id="hmSignIn">OPEN COMMUNITY ACCOUNT</button></div>':''}
  <div class="hm-filters"><button data-filter="ACTIVE" class="${filter==='ACTIVE'?'active':''}">ACTIVE</button><button data-filter="JOINED" class="${filter==='JOINED'?'active':''}">JOINED</button><button data-filter="MINE" class="${filter==='MINE'?'active':''}">MY MISSIONS</button><button data-filter="FOUND" class="${filter==='FOUND'?'active':''}">FOUND</button></div>
  ${loading?'<div class="hm-loading">Syncing scout teams…</div>':list.length?`<section class="hm-list">${list.map(card).join('')}</section>`:'<div class="hm-empty"><b>No missions in this view</b><p>Create a hunt for something you actually need, or join another collector’s mission when one appears.</p></div>'}
  <div class="hm-safety">Public teamwork only. Use broad ZIP regions such as <b>287xx</b> or <b>Online</b>. Do not post a home address, school, phone number, or precise family location.</div>
</div>`}
function shell(){return `<div class="hm-shell"><header class="hm-top"><div><div class="hm-mark">⌖</div><div><strong>Hunt Missions</strong><span>Coordinated collector scouting</span></div></div><button id="hmClose">×</button></header><main id="hmBody">${listView()}</main></div>`}
function open(opts={}){let root=$('#huntMissionsPanel');if(!root){root=document.createElement('div');root.id='huntMissionsPanel';root.className='hm-overlay';root.innerHTML=shell();document.body.appendChild(root)}root.classList.add('open');document.body.classList.add('hm-open');bind();load();joinRealtime();const id=typeof opts==='string'?opts:opts.missionId;if(id)setTimeout(()=>detail(id),220);return root}
function close(){leaveRealtime();$('#huntMissionsPanel')?.classList.remove('open');document.body.classList.remove('hm-open');activeId=''}
function render(){if(!$('#huntMissionsPanel')?.classList.contains('open'))return;if(activeId){detail(activeId);return}const b=$('#hmBody');if(b)b.innerHTML=listView();bind()}
function bind(){
  $('#hmClose')?.addEventListener('click',close);$('#hmCreate')?.addEventListener('click',createView);$('#hmSignIn')?.addEventListener('click',()=>{close();window.VaultSignalCommunity?.open?.('account')});
  document.querySelectorAll('#huntMissionsPanel [data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter||'ACTIVE';render()}));
  document.querySelectorAll('#huntMissionsPanel [data-mission]').forEach(b=>b.addEventListener('click',()=>detail(b.dataset.mission)));
}
function createView(){if(!live())return;const terms=watchTerms();const chips=terms.slice(0,6).map(x=>`<button type="button" data-watch="${esc(x)}">${esc(x)}</button>`).join('');const body=$('#hmBody');if(!body)return;body.innerHTML=`<div class="hm-scroll"><button id="hmBack" class="hm-back">← MISSIONS</button><section class="hm-form-card"><span class="hm-kicker">NEW HUNT MISSION</span><h2>What should the community help find?</h2>${chips?`<div class="hm-watch-chips">${chips}</div>`:''}<form id="hmCreateForm"><label>Product<input id="hmProduct" maxlength="140" required placeholder="Prismatic Evolutions ETB"></label><div class="hm-row"><label>Game<select id="hmGame"><option>Pokemon</option><option>Lorcana</option><option>Magic</option><option>Yu-Gi-Oh!</option><option>One Piece</option><option>Sports</option><option>Other</option></select></label><label>Retailer<input id="hmRetailer" maxlength="80" placeholder="Target or Any"></label></div><div class="hm-row"><label>Broad region<input id="hmRegion" maxlength="6" value="${esc(broadRegion())}" placeholder="287xx or Online"></label><label>Target price<input id="hmPrice" type="number" min="0" step="0.01" placeholder="Optional"></label></div><label>Deadline<select id="hmDeadline"><option value="12">12 hours</option><option value="24" selected>24 hours</option><option value="72">3 days</option><option value="168">7 days</option></select></label><label>Mission note<textarea id="hmNote" maxlength="500" placeholder="Public details only. Never include a home address or phone number."></textarea></label><button class="hm-primary" type="submit">LAUNCH HUNT</button></form></section></div>`;
  $('#hmBack')?.addEventListener('click',()=>{activeId='';render()});document.querySelectorAll('[data-watch]').forEach(b=>b.addEventListener('click',()=>{$('#hmProduct').value=b.dataset.watch||''}));$('#hmCreateForm')?.addEventListener('submit',createMission);
}
async function createMission(e){e.preventDefault();const product=$('#hmProduct').value.trim(),region=$('#hmRegion').value.trim();if(!product)return;if(region!=='Online'&&!/^\d{3}xx$/.test(region)){toast('Use a broad region like 287xx or Online');return}const hours=Number($('#hmDeadline').value||24),deadline=new Date(Date.now()+hours*3600000).toISOString(),price=$('#hmPrice').value;const payload={created_by:me(),product,game:$('#hmGame').value,retailer:$('#hmRetailer').value.trim(),broad_region:region,target_price:price?Number(price):null,note:$('#hmNote').value.trim(),deadline_at:deadline};const btn=e.submitter;btn.disabled=true;btn.textContent='LAUNCHING…';try{const {data,error}=await cloud().client.from('hunt_missions').insert(payload).select('*').single();if(error)throw error;toast('Hunt mission launched');await load();if(data?.id)detail(data.id)}catch(err){toast(err?.message||'Could not launch mission');btn.disabled=false;btn.textContent='LAUNCH HUNT'}}
async function detail(id){activeId=id;let m=missions.find(x=>String(x.id)===String(id));if(!m&&live()){const {data}=await cloud().client.from('hunt_missions').select('*').eq('id',id).maybeSingle();m=data;if(m)missions.unshift(m)}if(!m){activeId='';render();return}const body=$('#hmBody');if(!body)return;body.innerHTML='<div class="hm-loading">Opening mission command…</div>';
  let checkins=[],profiles=new Map(),radar=null,sources=[],incident=null;
  if(live())try{
    const [c,r,s,i]=await Promise.all([
      cloud().client.from('hunt_mission_checkins').select('*').eq('mission_id',m.id).order('created_at',{ascending:false}).limit(60),
      cloud().client.from('demand_radar').select('*').eq('normalized_product',m.normalized_product).maybeSingle(),
      cloud().client.from('source_observations').select('id,source_name,source_type,status,available,confidence,observed_at,expires_at,retailer,region,url').eq('normalized_product',m.normalized_product).gt('expires_at',new Date().toISOString()).order('observed_at',{ascending:false}).limit(8),
      cloud().client.from('signal_incidents').select('id,status,confidence,report_count,reporter_count,last_seen_at').eq('normalized_product',m.normalized_product).order('last_seen_at',{ascending:false}).limit(1).maybeSingle()
    ]);checkins=c.data||[];radar=r.data||null;sources=s.data||[];incident=i.data||null;
    const ids=[...new Set(checkins.map(x=>x.user_id).filter(Boolean))];if(ids.length){const {data:p}=await cloud().client.from('community_profiles').select('user_id,display_name').in('user_id',ids);profiles=new Map((p||[]).map(x=>[String(x.user_id),x.display_name||'Scout']))}
  }catch{}
  const mine=isMine(m),on=isJoined(m),active=['OPEN','SCOUTING','FOUND'].includes(m.status)&&new Date(m.deadline_at).getTime()>Date.now();
  body.innerHTML=`<div class="hm-scroll"><button id="hmBack" class="hm-back">← MISSIONS</button><section class="hm-detail ${statusClass(m.status)}"><div class="hm-detail-top"><span class="hm-status">${esc(m.status)}</span>${on?'<span class="hm-team">ON YOUR TEAM</span>':''}<span>${timeLeft(m.deadline_at)}</span></div><h2>${esc(m.product)}</h2><p>${[m.game,m.retailer,m.broad_region].filter(Boolean).map(esc).join(' • ')}</p>${m.target_price!=null?`<div class="hm-target">TARGET ≤ $${Number(m.target_price).toFixed(2)}</div>`:''}${m.note?`<blockquote>${esc(m.note)}</blockquote>`:''}</section>
  <div class="hm-metrics"><div><span>Scouts</span><b>${Number(m.scout_count||0)}</b></div><div><span>Updates</span><b>${Number(m.checkin_count||0)}</b></div><div><span>Found</span><b>${Number(m.found_count||0)}</b></div><div><span>Sold out</span><b>${Number(m.sold_out_count||0)}</b></div></div>
  <div class="hm-actions">${!on&&['OPEN','SCOUTING'].includes(m.status)?'<button id="hmJoin" class="hm-primary">＋ JOIN AS SCOUT</button>':''}${on&&!mine?'<button id="hmLeave">LEAVE TEAM</button>':''}${mine&&m.status!=='CLOSED'?'<button id="hmCloseMission">CLOSE MISSION</button>':''}<button id="hmStock">◎ FIND STOCK</button></div>
  ${on&&active?checkinForm(m):''}
  ${intelPanel(radar,incident,sources,m)}
  <section class="hm-panel"><div class="hm-section-head"><div><span class="hm-kicker">SCOUT TIMELINE</span><h3>${checkins.length} updates</h3></div></div>${checkins.length?checkins.map(c=>checkinRow(c,profiles)).join(''):'<div class="hm-empty small">No scout check-ins yet. Join the mission and post the first store check.</div>'}</section>
  <div class="hm-safety">Store labels should identify a public retailer/location only. Never post a home address, school, phone number, or a child's location.</div></div>`;
  $('#hmBack')?.addEventListener('click',()=>{activeId='';render()});$('#hmJoin')?.addEventListener('click',()=>joinMission(m));$('#hmLeave')?.addEventListener('click',()=>leaveMission(m));$('#hmCloseMission')?.addEventListener('click',()=>closeMission(m));$('#hmStock')?.addEventListener('click',()=>{close();document.querySelector('.bottom-nav [data-tab="stock"]')?.click()});$('#hmCheckForm')?.addEventListener('submit',e=>submitCheckin(e,m));$('#hmFusion')?.addEventListener('click',()=>{close();window.VaultSignalFusion?.open?.(incident?.id?{incidentId:incident.id}:{})});$('#hmRadar')?.addEventListener('click',()=>{close();window.VaultSignalDemandRadar?.open?.()});$('#hmMesh')?.addEventListener('click',()=>{close();window.VaultSignalSourceMesh?.open?.()});
}
function checkinForm(m){return `<section class="hm-panel"><span class="hm-kicker">SCOUT CHECK-IN</span><form id="hmCheckForm"><div class="hm-result-grid">${['CHECKING','FOUND','NOT_FOUND','SOLD_OUT','INFO'].map((x,i)=>`<label><input type="radio" name="hmResult" value="${x}" ${i===0?'checked':''}><span>${x.replace('_',' ')}</span></label>`).join('')}</div><div class="hm-row"><label>Public store label<input id="hmStore" maxlength="120" placeholder="Target - Marion"></label><label>Retailer<input id="hmCheckRetailer" maxlength="80" value="${esc(m.retailer||'')}"></label></div><label>Note<input id="hmCheckNote" maxlength="360" placeholder="2 ETBs near cards aisle; limit 1"></label><button class="hm-primary" type="submit">POST CHECK-IN</button></form><small class="hm-hint">FOUND and SOLD OUT can notify joined scouts. Routine check-ins stay in the live feed.</small></section>`}
function checkinRow(c,profiles){return `<div class="hm-check ${statusClass(c.result)}"><span>${esc(String(c.result).replace('_',' '))}</span><div><b>${esc(c.store_label||c.retailer||'Scout update')}</b><small>${esc(profiles.get(String(c.user_id))||'Scout')} • ${age(c.created_at)} ago${c.note?` • ${esc(c.note)}`:''}</small></div></div>`}
function intelPanel(radar,incident,sources,m){const sourceLive=sources.filter(x=>x.available===true).length;return `<section class="hm-panel"><span class="hm-kicker">MISSION INTELLIGENCE</span><div class="hm-intel"><button id="hmRadar"><span>DEMAND RADAR</span><b>${radar?`${Number(radar.heat_score||0)} ${esc(radar.heat_state||'QUIET')}`:'No crowd heat yet'}</b></button><button id="hmFusion"><span>SIGNAL FUSION</span><b>${incident?`${esc(incident.status)} • ${Number(incident.confidence||0)} confidence`:'No matching War Room'}</b></button><button id="hmMesh"><span>SOURCE MESH</span><b>${sources.length?`${sourceLive} live • ${sources.length} fresh evidence`:'No fresh provider evidence'}</b></button></div>${sources.length?`<div class="hm-source-strip">${sources.slice(0,4).map(x=>`<span>${esc(x.source_name)} • ${esc(x.status)}</span>`).join('')}</div>`:''}</section>`}
async function joinMission(m){try{const {error}=await cloud().client.from('hunt_mission_scouts').insert({mission_id:m.id,user_id:me()});if(error&&error.code!=='23505')throw error;toast('Joined hunt team');await load();detail(m.id)}catch(e){toast(e?.message||'Could not join mission')}}
async function leaveMission(m){try{const {error}=await cloud().client.from('hunt_mission_scouts').delete().eq('mission_id',m.id).eq('user_id',me());if(error)throw error;toast('Left hunt team');await load();detail(m.id)}catch(e){toast(e?.message||'Could not leave mission')}}
async function closeMission(m){try{const {error}=await cloud().client.rpc('close_hunt_mission',{p_mission:m.id});if(error)throw error;toast('Mission closed');await load();detail(m.id)}catch(e){toast(e?.message||'Could not close mission')}}
async function submitCheckin(e,m){e.preventDefault();const result=document.querySelector('input[name="hmResult"]:checked')?.value||'CHECKING';const payload={mission_id:m.id,user_id:me(),result,retailer:$('#hmCheckRetailer').value.trim(),store_label:$('#hmStore').value.trim(),broad_region:m.broad_region,note:$('#hmCheckNote').value.trim()};const btn=e.submitter;btn.disabled=true;try{const {error}=await cloud().client.from('hunt_mission_checkins').insert(payload);if(error)throw error;toast(result==='FOUND'?'FOUND posted — team alert eligible':'Scout check-in posted');await load();detail(m.id)}catch(err){toast(err?.message||'Could not post check-in');btn.disabled=false}}
function toast(msg){const t=$('#toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}}
function leaveRealtime(){for(const ch of realtime)try{cloud().client?.removeChannel(ch)}catch{}realtime=[]}
function joinRealtime(){leaveRealtime();if(!live())return;try{for(const table of ['hunt_missions','hunt_mission_scouts','hunt_mission_checkins']){const ch=cloud().client.channel(`hunt:${table}:v23`).on('postgres_changes',{event:'*',schema:'public',table},()=>load()).subscribe();realtime.push(ch)}}catch{}}
function inject(){const top=$('.topbar');if(top&&!$('#hmTopButton')){const b=document.createElement('button');b.id='hmTopButton';b.className='hm-top-entry';b.textContent='HUNT';b.addEventListener('click',()=>open());top.appendChild(b)}}
function init(){inject();window.VaultSignalHuntMissions={open,close,refresh:load,version:'23.0.0'};new MutationObserver(inject).observe(document.body,{childList:true,subtree:true});window.addEventListener('twogen-auth-changed',()=>{if($('#huntMissionsPanel')?.classList.contains('open'))load()});const q=new URLSearchParams(location.search);const mission=q.get('mission');if(mission)setTimeout(()=>open({missionId:mission}),300)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,220));else setTimeout(init,220);
})();
