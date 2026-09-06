(() => {
'use strict';

const STORAGE_KEY='2gen-vault-collector-os-v4';
const $=s=>document.querySelector(s);
const arr=v=>Array.isArray(v)?v:[];
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const cloud=()=>window.TWOGEN_CLOUD||{};
const config=()=>window.TWOGEN_CONFIG||{};
const live=()=>Boolean(cloud().configured&&cloud().client&&cloud().user);
let catalog=[];
let observations=[];
let workerStatus=null;
let liveDrops=[];
let verifyRows=[];
let loading=false;
let verifying=false;
let activeIncident='';

function read(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{return {}}}
function stateZip(){const s=read();return String(s.settings?.zip||s.settings?.homeZip||s.location?.zip||s.stockZip||'').replace(/\D/g,'').slice(0,5)}
function broadZip(z){const x=String(z||'').replace(/\D/g,'');return x.length===5?`${x.slice(0,3)}xx`:''}
function radius(){const s=read();return Math.max(1,Math.min(50,num(s.settings?.radius||s.settings?.stockRadius||s.stockRadius||25)||25))}
function watchTerms(){
  const s=read();
  const source=[...arr(s.stockWatches),...arr(s.wishlist),...arr(s.acquisitionQueue),...arr(s.chaseList)];
  return [...new Set(source.flatMap(x=>[x.product,x.name,x.cardName,x.query,x.set].filter(Boolean).map(v=>String(v).trim())).filter(x=>x.length>=3))].slice(0,4);
}
function ageMinutes(v){const t=new Date(v||0).getTime();return Number.isFinite(t)?Math.max(0,Math.floor((Date.now()-t)/60000)):99999}
function ageLabel(v){const m=ageMinutes(v);if(m<1)return'now';if(m<60)return`${m}m`;const h=Math.floor(m/60);if(h<24)return`${h}h`;return`${Math.floor(h/24)}d`}
function sourceLabel(t){return ({official_api:'OFFICIAL API',partner_api:'PARTNER FEED',public_storefront:'PUBLIC STOREFRONT',retailer_check:'CHECK ONLY',system:'SYSTEM'})[t]||String(t||'SOURCE').toUpperCase()}
function activeObservation(o){return new Date(o.expires_at||0).getTime()>Date.now()}
function workerBase(){return String(config().inventoryApiBase||'').replace(/\/$/,'')}
async function getJson(path){const base=workerBase();if(!base)throw new Error('Inventory service is not configured');const r=await fetch(`${base}${path}`,{headers:{Accept:'application/json'}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||`Inventory service ${r.status}`);return d}
function toast(text){let t=$('#smToast');if(!t){t=document.createElement('div');t.id='smToast';t.className='sm-toast';document.body.appendChild(t)}t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1900)}

async function loadCloud(){
  if(!live()){catalog=[];observations=[];return}
  try{
    const [c,o]=await Promise.all([
      cloud().client.from('source_catalog').select('*').order('source_name',{ascending:true}).limit(80),
      cloud().client.from('source_observations').select('id,source_key,source_name,source_type,room,game,product,retailer,region,evidence_kind,status,available,quantity,price,confidence,url,source_item_id,observed_at,expires_at,incident_id').order('observed_at',{ascending:false}).limit(160)
    ]);
    if(c.error)throw c.error;if(o.error)throw o.error;catalog=c.data||[];observations=o.data||[];
  }catch{catalog=[];observations=[]}
}
async function loadWorker(){
  try{workerStatus=await getJson('/system-status')}catch{workerStatus=null}
  try{const d=await getJson(`/drop-feed?games=${encodeURIComponent('Pokemon,Lorcana,Magic,Yu-Gi-Oh!,One Piece')}&limit=80`);liveDrops=arr(d.results)}catch{liveDrops=[]}
}
async function refresh(){loading=true;render();await Promise.all([loadCloud(),loadWorker()]);loading=false;render()}

function workerProviders(){
  if(!workerStatus)return [];
  const rows=[];
  for(const p of [...arr(workerStatus.providers),...arr(workerStatus.localStockProviders)]){
    const mode=String(p.mode||'');
    rows.push({source_key:`worker:${p.id||norm(p.name)}`,source_name:p.name||p.id||'Provider',source_type:mode==='official_api'?'official_api':mode==='partner_feed'?'partner_api':mode==='retailer_check'?'retailer_check':'system',configured:Boolean(p.configured),health:p.configured?'healthy':'not_configured',description:p.description||'',last_checked_at:workerStatus.checkedAt});
  }
  if(workerStatus.alertEngine)rows.push({source_key:'worker:watch-engine',source_name:'VaultSignal Watch Engine',source_type:'system',configured:Boolean(workerStatus.alertEngine.configured),health:workerStatus.alertEngine.configured?'healthy':'not_configured',description:workerStatus.alertEngine.description||'Background watch service',last_checked_at:workerStatus.checkedAt});
  for(const name of arr(workerStatus.dropMonitors?.names))rows.push({source_key:`storefront:${norm(name)}`,source_name:name,source_type:'public_storefront',configured:true,health:'healthy',description:'Public storefront monitor',last_checked_at:workerStatus.checkedAt});
  return rows;
}
function providerList(){
  const map=new Map();
  [...workerProviders(),...catalog].forEach(p=>{const key=p.source_key||`${p.source_type}:${norm(p.source_name)}`;const old=map.get(key)||{};map.set(key,{...old,...p})});
  return [...map.values()].sort((a,b)=>String(a.source_type).localeCompare(String(b.source_type))||String(a.source_name).localeCompare(String(b.source_name)));
}
function fallbackEvidence(){
  return liveDrops.map(x=>({
    id:`preview-${x.id}`,source_key:`storefront:${x.sourceId||norm(x.store)}`,source_name:x.store||'Storefront',source_type:'public_storefront',room:'pokemon-drops',game:x.game||'',product:x.product||'',retailer:x.store||'',region:x.region||'Online',evidence_kind:'availability',status:x.available?'available':'unavailable',available:x.available===true,quantity:null,price:x.price||null,confidence:x.available?74:58,url:x.url||'',observed_at:x.checkedAt||new Date().toISOString(),expires_at:new Date(Date.now()+10*60000).toISOString(),incident_id:null,preview:true
  }));
}
function evidenceList(){const rows=observations.length?observations:fallbackEvidence();return rows.slice().sort((a,b)=>Number(activeObservation(b))-Number(activeObservation(a))||String(b.observed_at).localeCompare(String(a.observed_at))).slice(0,100)}
function providerCard(p){const health=p.health||'unknown';return `<article class="sm-card"><div class="sm-card-top"><span class="sm-badge ${esc(p.source_type)}">${esc(sourceLabel(p.source_type))}</span><i class="sm-health ${esc(health)}"></i></div><h4>${esc(p.source_name||'Source')}</h4><p>${esc(p.description||((p.configured===false)?'Not configured':'Evidence source'))}</p></article>`}
function evidenceCard(o){const fresh=activeObservation(o),isLive=o.available===true;const qty=o.quantity==null?'—':o.quantity;const price=num(o.price)>0?`$${num(o.price).toFixed(2)}`:'—';return `<article class="sm-evidence ${fresh&&isLive?'live':''} ${fresh?'':'stale'}"><div class="sm-evidence-top"><span class="sm-badge ${esc(o.source_type)}">${esc(sourceLabel(o.source_type))}</span><span class="sm-badge">${isLive?'AVAILABLE':String(o.status||'UNKNOWN').toUpperCase()}</span><small>${ageLabel(o.observed_at)} ago${fresh?'':' • stale'}</small></div><h4>${esc(o.product||'TCG product')}</h4><p>${[o.retailer,o.region,o.game].filter(Boolean).map(esc).join(' • ')}</p><div class="sm-evidence-stats"><span><b>${num(o.confidence)}</b>source confidence</span><span><b>${qty}</b>quantity</span><span><b>${price}</b>price</span></div><div class="sm-evidence-actions">${o.incident_id?`<button data-war="${esc(o.incident_id)}">≋ WAR ROOM</button>`:''}${o.url?`<button data-link="${esc(o.url)}">↗ SOURCE</button>`:''}</div></article>`}
function verifiedView(){if(!verifyRows.length)return'';return `<section class="sm-section"><div class="sm-section-head"><div><span class="sm-kicker">LOCAL VERIFY RESULTS</span><h3>${verifyRows.length} supported result${verifyRows.length===1?'':'s'}</h3></div><small>${esc(broadZip(stateZip())||'local')}</small></div>${verifyRows.map(r=>`<div class="sm-verify-result"><b>${esc(r.product||r.query||'Product')}</b><span>${[r.provider,r.store,r.status,r.distanceMiles!=null?`${Number(r.distanceMiles).toFixed(1)} mi`:null,r.quantity!=null?`qty ${r.quantity}`:null].filter(Boolean).map(esc).join(' • ')}</span></div>`).join('')}</section>`}
function markup(){
  const providers=providerList(),evidence=evidenceList(),fresh=evidence.filter(activeObservation),official=fresh.filter(x=>x.source_type==='official_api').length,partner=fresh.filter(x=>x.source_type==='partner_api').length,storefront=fresh.filter(x=>x.source_type==='public_storefront'&&x.available===true).length;
  const terms=watchTerms(),zip=stateZip();
  return `<div class="sm-shell"><header class="sm-top"><div><div class="sm-mark">⌁</div><div><strong>Source Mesh</strong><span>Provider + community evidence</span></div></div><button id="smClose">×</button></header><main class="sm-body"><div class="sm-scroll"><section class="sm-hero"><span class="sm-kicker">SOURCE MESH • v21</span><h2>Know why a signal is live.</h2><p>VaultSignal separates automated provider evidence from human reports, then lets Signal Fusion combine them without pretending a retailer search page is stock.</p><div class="sm-pulse"><span><b>${providers.filter(x=>x.health==='healthy').length}</b> healthy sources</span><span><b>${fresh.length}</b> fresh observations</span><span><b>${official}</b> official API</span><span><b>${partner}</b> partner</span><span><b>${storefront}</b> storefront live</span></div></section><div class="sm-actions"><button id="smVerify" ${verifying?'disabled':''}>${verifying?'VERIFYING…':'◎ VERIFY MY WATCHES'}</button><button id="smRefresh" ${loading?'disabled':''}>${loading?'REFRESHING…':'↻ REFRESH MESH'}</button></div><div class="sm-note">${zip?`Local verification uses ${esc(broadZip(zip))} publicly; the exact ZIP is used only for the live provider lookup.`:'Save a ZIP in Stock settings to enable local watch verification.'} ${terms.length?`${terms.length} watch quer${terms.length===1?'y':'ies'} ready.`:'Add products to your watches or chase list to personalize verification.'}</div>${verifiedView()}<section class="sm-section"><div class="sm-section-head"><div><span class="sm-kicker">PROVIDER HEALTH</span><h3>${providers.length} connected / prepared sources</h3></div><small>truth labels</small></div><div class="sm-provider-grid">${providers.length?providers.map(providerCard).join(''):'<div class="sm-empty"><b>No provider status yet</b>Refresh Source Mesh to check the inventory service.</div>'}</div></section><section class="sm-section"><div class="sm-section-head"><div><span class="sm-kicker">AUTOMATED EVIDENCE</span><h3>Fresh source observations</h3></div><small>${live()?'cloud mesh':'live preview'}</small></div><div class="sm-evidence-list">${evidence.length?evidence.map(evidenceCard).join(''):'<div class="sm-empty"><b>No automated evidence yet</b>Provider observations will appear here as Source Mesh discovers supported availability.</div>'}</div></section><div class="sm-truth"><b>Truth rule:</b> OFFICIAL API and PARTNER FEED can represent supported inventory evidence. PUBLIC STOREFRONT represents the source store's published online availability. CHECK ONLY is only a retailer handoff and never raises stock confidence by itself. Community reports remain separate inside Signal Fusion.</div></div></main></div>`;
}
function render(){const root=$('#sourceMeshPanel');if(!root?.classList.contains('open'))return;root.innerHTML=markup();bind()}
function ensure(){let root=$('#sourceMeshPanel');if(root)return root;root=document.createElement('div');root.id='sourceMeshPanel';root.className='sm-overlay';document.body.appendChild(root);return root}
function close(){ensure().classList.remove('open');document.body.classList.remove('sm-open')}
function open(opts={}){if(typeof opts==='string')opts={incidentId:opts};activeIncident=opts.incidentId||'';const root=ensure();root.classList.add('open');document.body.classList.add('sm-open');render();refresh();return root}
function openWar(id){close();window.VaultSignalFusion?.open?.({incidentId:id})}
async function verifyMyWatches(){
  if(verifying)return;
  const zip=stateZip(),queries=watchTerms();if(zip.length!==5){toast('Save a 5-digit ZIP in Stock first');return}if(!queries.length){toast('Add a product to your watches or chase list first');return}
  verifying=true;render();
  try{
    if(live()){
      const {data,error}=await cloud().client.functions.invoke('source-mesh',{body:{mode:'local_verify',zip,radius:radius(),queries}});if(error)throw error;verifyRows=arr(data?.verified);if(data?.errors?.length&&!verifyRows.length)throw new Error(data.errors[0]?.error||'No supported provider results');toast(verifyRows.length?`${verifyRows.length} supported result${verifyRows.length===1?'':'s'} verified`:'No supported live results right now');await loadCloud();
    }else{
      const chunks=await Promise.all(queries.map(async q=>{try{const d=await getJson(`/local-stock?zip=${zip}&radius=${radius()}&query=${encodeURIComponent(q)}`);return arr(d.results).filter(x=>['official_api','partner_api'].includes(x.sourceType)&&(['in_stock','low_stock','available','limited'].includes(String(x.status||'').toLowerCase())||num(x.quantity)>0)).map(x=>({...x,query:q}))}catch{return []}}));verifyRows=chunks.flat();toast(verifyRows.length?`${verifyRows.length} live preview result${verifyRows.length===1?'':'s'}`:'No supported live results right now');
    }
  }catch(e){toast(e?.message||'Verification failed')}
  verifying=false;render();
}
function bind(){
  $('#smClose')?.addEventListener('click',close);$('#smRefresh')?.addEventListener('click',refresh);$('#smVerify')?.addEventListener('click',verifyMyWatches);
  document.querySelectorAll('#sourceMeshPanel [data-war]').forEach(b=>b.addEventListener('click',()=>openWar(b.dataset.war)));
  document.querySelectorAll('#sourceMeshPanel [data-link]').forEach(b=>b.addEventListener('click',()=>{const u=b.dataset.link;if(/^https:\/\//i.test(u||''))window.open(u,'_blank','noopener,noreferrer')}));
}
function init(){window.VaultSignalSourceMesh={open,close,refresh,verify:verifyMyWatches,version:'21.0.0'};document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#sourceMeshPanel')?.classList.contains('open'))close()});window.addEventListener('twogen-auth-changed',()=>{if($('#sourceMeshPanel')?.classList.contains('open'))refresh()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,180));else setTimeout(init,180);
})();
