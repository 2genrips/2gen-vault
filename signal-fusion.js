(() => {
'use strict';

const STORAGE_KEY='2gen-vault-collector-os-v4';
const STOCK_ROOMS=new Set(['pokemon-drops','local-finds','deals']);
let incidents=[];
let activeId='';
let loading=false;
let realtime=null;

const $=s=>document.querySelector(s);
const arr=v=>Array.isArray(v)?v:[];
const num=v=>{const n=Number(v||0);return Number.isFinite(n)?n:0};
const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const cloud=()=>window.TWOGEN_CLOUD||{};
const live=()=>Boolean(cloud().configured&&cloud().client&&cloud().user);
function read(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{return {}}}
function ageMinutes(v){const t=new Date(v||0).getTime();return Number.isFinite(t)?Math.max(0,Math.floor((Date.now()-t)/60000)):99999}
function ageLabel(v){const m=ageMinutes(v);if(m<1)return'now';if(m<60)return`${m}m`;const h=Math.floor(m/60);if(h<24)return`${h}h`;return`${Math.floor(h/24)}d`}
function watchTerms(){const s=read();const source=[...arr(s.stockWatches),...arr(s.wishlist),...arr(s.acquisitionQueue),...arr(s.chaseList)];return [...new Set(source.flatMap(x=>[x.product,x.name,x.cardName,x.query,x.set].filter(Boolean).map(norm)).filter(x=>x.length>=3))].slice(0,40)}
function matchesWatch(i){const terms=watchTerms();if(!terms.length)return true;const hay=norm(`${i.product||''} ${i.retailer||''}`);return terms.some(t=>hay.includes(t)||t.includes(norm(i.product||'')))}
function displayStatus(i){if(String(i.status).toUpperCase()==='GONE')return'GONE';return ageMinutes(i.last_seen_at||i.lastSeenAt)>90?'STALE':String(i.status||'WATCH').toUpperCase()}
function effectiveScore(i){const base=num(i.confidence);const m=ageMinutes(i.last_seen_at||i.lastSeenAt);const decay=m<=15?0:m<=30?5:m<=60?12:m<=90?20:m<=180?35:50;return Math.max(0,Math.round(base-decay))}
function incidentKey(p){const product=norm(p.product||p.title||'community signal'),retailer=norm(p.retailer),region=p.room==='local-finds'?norm(p.region):'';return `${p.room}|${product}|${retailer}|${region}`}

function localIncidents(){
  const s=read(),posts=arr(s.signalNetwork?.posts).filter(p=>STOCK_ROOMS.has(p.room)).slice().sort((a,b)=>String(a.created_at||a.createdAt).localeCompare(String(b.created_at||b.createdAt)));
  const groups=[];
  for(const p of posts){
    const key=incidentKey(p),when=new Date(p.created_at||p.createdAt||0).getTime();
    let g=[...groups].reverse().find(x=>x.key===key&&when-new Date(x.last_seen_at).getTime()<=90*60000&&x.status!=='GONE');
    if(!g){g={id:`local-${groups.length+1}-${key}`,key,room:p.room,product:p.product||p.title||'Community signal',retailer:p.retailer||'',region:p.region||'',status:'WATCH',confidence:0,report_count:0,reporter_count:0,confirm_count:0,gone_count:0,helpful_count:0,first_seen_at:p.created_at||p.createdAt,last_seen_at:p.created_at||p.createdAt,latest_post_id:p.id,posts:[]};groups.push(g)}
    g.posts.push(p);g.report_count=g.posts.length;g.reporter_count=new Set(g.posts.map(x=>x.user_id||x.author||x.id)).size;g.last_seen_at=p.created_at||p.createdAt;g.latest_post_id=p.id;
    const reactions=g.posts.map(x=>s.signalNetwork?.reactions?.[x.id]||{});g.confirm_count=reactions.reduce((a,r)=>a+num(r.confirm),0);g.gone_count=reactions.reduce((a,r)=>a+num(r.gone),0);g.helpful_count=reactions.reduce((a,r)=>a+num(r.helpful),0);
    const type=String(p.type||'').toUpperCase();g.confidence=Math.max(0,Math.min(100,42+(['DROP','FOUND','CHECKOUT','LIMIT','DEAL'].includes(type)?12:0)+Math.min(g.reporter_count*8,24)+Math.min(Math.max(g.report_count-1,0)*4,16)+Math.min(g.confirm_count*6,24)+Math.min(g.helpful_count*2,8)-Math.min(g.gone_count*10,30)));
    g.status=g.gone_count>=2&&g.gone_count>g.confirm_count?'GONE':g.confidence>=60&&['DROP','FOUND','CHECKOUT','LIMIT','DEAL'].includes(type)?'LIVE':'WATCH';
  }
  return groups.sort((a,b)=>String(b.last_seen_at).localeCompare(String(a.last_seen_at)));
}

async function loadIncidents(){
  loading=true;render();
  if(!live()){incidents=localIncidents();loading=false;render();return}
  try{
    const {data,error}=await cloud().client.from('signal_incidents').select('*').order('last_seen_at',{ascending:false}).limit(80);if(error)throw error;incidents=data||[];
  }catch{incidents=localIncidents()}
  loading=false;render();
}
async function timeline(i){
  if(i?.posts)return i.posts.slice().sort((a,b)=>String(b.created_at||b.createdAt).localeCompare(String(a.created_at||a.createdAt)));
  if(!live()||!i?.id)return [];
  try{const {data,error}=await cloud().client.from('signal_posts').select('id,user_id,type,title,product,retailer,region,body,created_at').eq('incident_id',i.id).order('created_at',{ascending:false}).limit(40);if(error)throw error;return data||[]}catch{return []}
}
function sortedIncidents(){return incidents.slice().sort((a,b)=>{const am=matchesWatch(a)?1:0,bm=matchesWatch(b)?1:0;if(am!==bm)return bm-am;const as=displayStatus(a)==='LIVE'?2:displayStatus(a)==='WATCH'?1:0,bs=displayStatus(b)==='LIVE'?2:displayStatus(b)==='WATCH'?1:0;if(as!==bs)return bs-as;return String(b.last_seen_at).localeCompare(String(a.last_seen_at))})}
function statusClass(i){return displayStatus(i).toLowerCase()}
function card(i){const status=displayStatus(i),score=effectiveScore(i),matched=matchesWatch(i);return `<button class="sf-card ${statusClass(i)}" data-incident="${esc(i.id)}"><div class="sf-card-top"><span class="sf-status">${status}</span>${matched?'<span class="sf-match">YOUR WATCH</span>':''}<small>${ageLabel(i.last_seen_at)} ago</small></div><h3>${esc(i.product||'Community signal')}</h3><p>${[i.retailer,i.region].filter(Boolean).map(esc).join(' • ')||'Community'}</p><div class="sf-card-stats"><span><b>${score}</b> confidence</span><span><b>${num(i.report_count)}</b> reports</span><span><b>${num(i.reporter_count)}</b> collectors</span></div></button>`}
function listView(){const list=sortedIncidents(),active=list.filter(i=>['LIVE','WATCH'].includes(displayStatus(i))).length,matched=list.filter(matchesWatch).length;return `<div class="sf-scroll"><section class="sf-hero"><div><span class="sf-kicker">SIGNAL FUSION • v20</span><h2>One drop. One War Room.</h2><p>Duplicate community reports are fused into a single evolving incident instead of flooding you with repeated messages.</p></div><div class="sf-live-count"><b>${active}</b><span>active</span></div></section><div class="sf-statbar"><span><b>${matched}</b> watch matches</span><span><b>${list.filter(i=>displayStatus(i)==='LIVE').length}</b> live</span><span><b>${list.filter(i=>displayStatus(i)==='GONE').length}</b> gone</span></div>${loading?'<div class="sf-loading">Fusing community intelligence…</div>':list.length?`<section class="sf-list">${list.map(card).join('')}</section>`:'<div class="sf-empty"><b>No fused incidents yet</b><p>As community stock, local-find and deal reports arrive, repeated reports will collapse into live War Rooms here.</p></div>'}<div class="sf-footnote">Confidence is a community-intelligence score, not a guarantee that inventory remains available.</div></div>`}
function shell(){return `<div class="sf-shell"><header class="sf-top"><div><div class="sf-mark">≋</div><div><strong>Signal Fusion</strong><span>Live incident intelligence</span></div></div><button id="sfClose">×</button></header><main id="sfBody">${listView()}</main></div>`}
function close(){leaveRealtime();$('#signalFusionPanel')?.classList.remove('open');document.body.classList.remove('sf-open')}
function openRoot(){let root=$('#signalFusionPanel');if(!root){root=document.createElement('div');root.id='signalFusionPanel';root.className='sf-overlay';root.innerHTML=shell();document.body.appendChild(root)}root.classList.add('open');document.body.classList.add('sf-open');bind();loadIncidents();joinRealtime();return root}
async function openIncident(id){activeId=id;const i=incidents.find(x=>String(x.id)===String(id));if(!i){render();return}const posts=await timeline(i);const status=displayStatus(i),score=effectiveScore(i);const body=$('#sfBody');if(!body)return;body.innerHTML=`<div class="sf-scroll"><button class="sf-back" id="sfBack">← ALL INCIDENTS</button><section class="sf-war ${status.toLowerCase()}"><div class="sf-war-top"><span class="sf-status">${status}</span><span>${ageLabel(i.last_seen_at)} ago</span></div><h2>${esc(i.product||'Community signal')}</h2><p>${[i.retailer,i.region].filter(Boolean).map(esc).join(' • ')||'Community'}</p><div class="sf-score"><b>${score}</b><span>FUSION CONFIDENCE</span></div></section><div class="sf-metrics"><div><span>Reports</span><b>${num(i.report_count)}</b></div><div><span>Collectors</span><b>${num(i.reporter_count)}</b></div><div><span>Confirmed</span><b>${num(i.confirm_count)}</b></div><div><span>Gone</span><b>${num(i.gone_count)}</b></div></div><section class="sf-panel"><span class="sf-kicker">WHY THIS SCORE</span><p>Confidence rises when independent collectors report the same product and when community confirmations agree. Gone reports reduce confidence. Freshness decays automatically on your phone.</p></section><section class="sf-panel"><div class="sf-section-head"><div><span class="sf-kicker">INCIDENT TIMELINE</span><h3>${posts.length} report${posts.length===1?'':'s'} fused</h3></div></div>${posts.length?posts.map(p=>`<div class="sf-report"><span>${esc(p.type||'INFO')}</span><div><b>${esc(p.title||p.product||'Collector report')}</b><small>${ageLabel(p.created_at||p.createdAt)} ago${p.body?` • ${esc(p.body)}`:''}</small></div></div>`).join(''):'<div class="sf-empty small">No timeline rows available yet.</div>'}</section><div class="sf-actions"><button id="sfStock">◎ FIND STOCK</button><button id="sfSignals">⚡ RAW SIGNALS</button><button id="sfShare">↗ SHARE INTEL</button></div><div class="sf-footnote">VaultSignal does not claim a retailer has stock unless a supported provider or community report supplies that information.</div></div>`;bindDetail(i,posts)}
function bindDetail(i,posts){$('#sfBack')?.addEventListener('click',()=>{activeId='';render()});$('#sfStock')?.addEventListener('click',()=>{close();document.querySelector('.bottom-nav [data-tab="stock"]')?.click()});$('#sfSignals')?.addEventListener('click',()=>{close();window.VaultSignalNetwork?.open?.(i.room||'for-you')});$('#sfShare')?.addEventListener('click',()=>shareIncident(i,posts))}
function shareIncident(i,posts){const text=`VaultSignal Signal Fusion\n${displayStatus(i)} • ${effectiveScore(i)} confidence\n${i.product||'Community signal'}\n${[i.retailer,i.region].filter(Boolean).join(' • ')}\n${num(i.report_count)} reports • ${num(i.reporter_count)} collectors • ${num(i.confirm_count)} confirmations • ${num(i.gone_count)} gone reports\nUpdated ${ageLabel(i.last_seen_at)} ago\n\nCommunity intelligence can change quickly.`;if(navigator.share)navigator.share({title:'VaultSignal Signal Fusion',text}).catch(()=>{});else navigator.clipboard?.writeText(text)}
function render(){if(!$('#signalFusionPanel')?.classList.contains('open'))return;if(activeId){const exists=incidents.some(x=>String(x.id)===String(activeId));if(exists){openIncident(activeId);return}activeId=''}const body=$('#sfBody');if(body)body.innerHTML=listView();bind()}
function bind(){$('#sfClose')?.addEventListener('click',close);document.querySelectorAll('#signalFusionPanel [data-incident]').forEach(b=>b.addEventListener('click',()=>openIncident(b.dataset.incident)))}
async function open(opts={}){openRoot();if(typeof opts==='string')opts={incidentId:opts};if(opts.incidentId){activeId=opts.incidentId;await loadIncidents();await openIncident(activeId)}else if(opts.postId){await loadIncidents();if(live()){try{const {data}=await cloud().client.from('signal_posts').select('incident_id').eq('id',opts.postId).maybeSingle();if(data?.incident_id){activeId=data.incident_id;await openIncident(activeId)}}catch{}}}}
function leaveRealtime(){if(realtime&&cloud().client){try{cloud().client.removeChannel(realtime)}catch{}}realtime=null}
function joinRealtime(){leaveRealtime();if(!live())return;try{realtime=cloud().client.channel('signal-fusion:v20').on('postgres_changes',{event:'*',schema:'public',table:'signal_incidents'},()=>loadIncidents()).subscribe()}catch{}}
function inject(){const top=$('.topbar');if(top&&!$('#sfTopButton')){const b=document.createElement('button');b.id='sfTopButton';b.className='sf-top-entry';b.textContent='FUSION';b.addEventListener('click',()=>open());top.appendChild(b)}}
function interceptWarRooms(){document.addEventListener('click',e=>{const b=e.target.closest?.('#signalNetworkPanel [data-war]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();window.VaultSignalNetwork?.close?.();open({postId:b.dataset.war})},true)}
function init(){inject();interceptWarRooms();window.VaultSignalFusion={open,close,refresh:loadIncidents,version:'20.0.0'};const mo=new MutationObserver(inject);mo.observe(document.body,{childList:true,subtree:true});window.addEventListener('twogen-auth-changed',()=>{if($('#signalFusionPanel')?.classList.contains('open'))loadIncidents()});const q=new URLSearchParams(location.search);const incident=q.get('incident');if(incident)setTimeout(()=>open({incidentId:incident}),250)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,160));else setTimeout(init,160);
})();
