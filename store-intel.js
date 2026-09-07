(() => {
'use strict';

const STORAGE_KEY='2gen-vault-collector-os-v4';
const $=s=>document.querySelector(s);
const cloud=()=>window.TWOGEN_CLOUD||{};
const live=()=>Boolean(cloud().configured&&cloud().client&&cloud().user);
const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
let stores=[];let follows=new Set();let filter='ALL';let activeKey='';let loading=false;let realtime=null;

function read(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{return {}}}
function myRegion(){const s=read();const vals=[s.settings?.zip,s.settings?.homeZip,s.stockSettings?.zip,s.preferredZip,s.zip];const z=vals.map(v=>String(v||'').replace(/\D/g,'')).find(v=>v.length===5);return z?`${z.slice(0,3)}xx`:'Online'}
function age(v){const ms=Date.now()-new Date(v||0).getTime();if(!Number.isFinite(ms)||ms<0)return'now';const m=Math.floor(ms/60000);if(m<1)return'now';if(m<60)return`${m}m`;const h=Math.floor(m/60);if(h<24)return`${h}h`;return`${Math.floor(h/24)}d`}
function statusLabel(s){if(!s.latest_trusted_result)return'BUILDING HISTORY';return s.latest_trusted_result==='FOUND'?'RECENTLY FOUND':'RECENTLY SOLD OUT'}
function statusClass(s){return s.latest_trusted_result==='FOUND'?'found':s.latest_trusted_result==='SOLD_OUT'?'soldout':'building'}
function confidenceBand(s){const n=Number(s.average_proof_score||0);return n>=92?'HIGH PROOF':n>=82?'STRONG PROOF':n>0?'EARLY PROOF':'BUILDING'}
function filtered(){return stores.filter(s=>filter==='FOLLOWING'?follows.has(s.store_key):filter==='REGION'?s.broad_region===myRegion():true).sort((a,b)=>Number(follows.has(b.store_key))-Number(follows.has(a.store_key))||Number(b.average_proof_score||0)-Number(a.average_proof_score||0)||String(b.latest_trusted_at||'').localeCompare(String(a.latest_trusted_at||'')))}

async function load(){
  loading=true;render();
  if(!live()){stores=[];follows=new Set();loading=false;render();return}
  try{
    const [a,b]=await Promise.all([
      cloud().client.from('store_intel').select('*').order('average_proof_score',{ascending:false}).order('latest_trusted_at',{ascending:false}).limit(150),
      cloud().client.from('store_intel_follows').select('store_key').eq('user_id',cloud().user.id)
    ]);
    if(a.error)throw a.error;if(b.error)throw b.error;stores=a.data||[];follows=new Set((b.data||[]).map(x=>String(x.store_key)));
  }catch(e){console.warn('store intel load',e)}
  loading=false;render();
}
function card(s){const following=follows.has(s.store_key);return `<button class="si-card ${statusClass(s)}" data-store="${esc(s.store_key)}">
  <div class="si-card-top"><span class="si-status">${esc(statusLabel(s))}</span>${following?'<span class="si-followed">FOLLOWING</span>':''}<small>${s.latest_trusted_at?age(s.latest_trusted_at)+' ago':'new'}</small></div>
  <h3>${esc(s.store_label)}</h3><p>${esc(s.retailer)} • ${esc(s.broad_region)}</p>
  <div class="si-score-row"><div class="si-score"><b>${Number(s.average_proof_score||0)}</b><span>PROOF</span></div><div class="si-mini"><span><b>${Number(s.trusted_claims||0)}</b> trusted</span><span><b>${Number(s.independent_scouts||0)}</b> scouts</span><span><b>${Number(s.product_count||0)}</b> products</span></div></div>
  <div class="si-card-foot"><span>${confidenceBand(s)}</span><span>${Number(s.conflicted_claims||0)} conflicts</span></div>
</button>`}
function listView(){const list=filtered();const region=myRegion(),followCount=stores.filter(s=>follows.has(s.store_key)).length;return `<div class="si-scroll">
  <section class="si-hero"><div><span class="si-kicker">STORE INTEL • v25</span><h2>Turn trusted hunts into store memory.</h2><p>Evidence-backed public-store history persists after a Hunt ends. Follow a store to receive only corroborated or source-verified availability changes.</p></div><div class="si-hero-score"><b>${stores.length}</b><span>TRUSTED STORES</span></div></section>
  <div class="si-summary"><div><b>${followCount}</b><span>following</span></div><div><b>${stores.filter(s=>s.broad_region===region).length}</b><span>${esc(region)}</span></div><div><b>${stores.filter(s=>Number(s.source_verified_claims||0)>0).length}</b><span>source verified</span></div></div>
  ${!live()?'<div class="si-signin"><b>Sign in for Store Intel</b><p>Store history and follows are shared community features. Your collection stays available locally without signing in.</p><button id="siSignIn">OPEN COMMUNITY ACCOUNT</button></div>':''}
  <div class="si-filters"><button data-filter="ALL" class="${filter==='ALL'?'active':''}">ALL STORES</button><button data-filter="FOLLOWING" class="${filter==='FOLLOWING'?'active':''}">FOLLOWING</button><button data-filter="REGION" class="${filter==='REGION'?'active':''}">MY REGION • ${esc(region)}</button></div>
  ${loading?'<div class="si-loading">Rebuilding trusted store memory…</div>':list.length?`<section class="si-list">${list.map(card).join('')}</section>`:'<div class="si-empty"><b>No qualifying Store Intel yet</b><p>A single unverified report is intentionally not enough. Stores appear after provider-backed/corroborated evidence or multiple independent availability claims.</p></div>'}
  <div class="si-truth"><b>Evidence, not ratings.</b> Store Intel summarizes verified community history. It does not guarantee current shelf inventory, reserve merchandise, expose exact household locations, or predict future restocks.</div>
</div>`}
function shell(){return `<div class="si-shell"><header class="si-top"><div><div class="si-mark">⌂</div><div><strong>Store Intel</strong><span>Evidence-backed public store memory</span></div></div><button id="siClose">×</button></header><main id="siBody">${listView()}</main></div>`}
function open(opts={}){let root=$('#storeIntelPanel');if(!root){root=document.createElement('div');root.id='storeIntelPanel';root.className='si-overlay';root.innerHTML=shell();document.body.appendChild(root)}root.classList.add('open');document.body.classList.add('si-open');bind();load();joinRealtime();const key=typeof opts==='string'?opts:opts.storeKey;if(key)setTimeout(()=>detail(key),220);return root}
function close(){leaveRealtime();$('#storeIntelPanel')?.classList.remove('open');document.body.classList.remove('si-open');activeKey=''}
function render(){if(!$('#storeIntelPanel')?.classList.contains('open'))return;if(activeKey){detail(activeKey);return}const body=$('#siBody');if(body)body.innerHTML=listView();bind()}
function bind(){
  $('#siClose')?.addEventListener('click',close);$('#siSignIn')?.addEventListener('click',()=>{close();window.VaultSignalCommunity?.open?.('account')});
  document.querySelectorAll('#storeIntelPanel [data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter||'ALL';render()}));
  document.querySelectorAll('#storeIntelPanel [data-store]').forEach(b=>b.addEventListener('click',()=>detail(b.dataset.store||'')));
}
async function detail(key){
  activeKey=key;let s=stores.find(x=>String(x.store_key)===String(key));
  if(!s&&live()){const {data}=await cloud().client.from('store_intel').select('*').eq('store_key',key).maybeSingle();s=data;if(s)stores.unshift(s)}
  if(!s){activeKey='';render();return}
  const body=$('#siBody');if(!body)return;body.innerHTML='<div class="si-loading">Opening store memory…</div>';
  let claims=[];
  if(live())try{const {data}=await cloud().client.from('store_intel_recent_claims').select('*').eq('store_key',key).order('created_at',{ascending:false}).limit(50);claims=data||[]}catch{}
  const following=follows.has(key),products=Array.isArray(s.recent_products)?s.recent_products:[];
  body.innerHTML=`<div class="si-scroll"><button id="siBack" class="si-back">← STORE INTEL</button>
    <section class="si-detail ${statusClass(s)}"><div class="si-detail-top"><span class="si-status">${esc(statusLabel(s))}</span>${following?'<span class="si-followed">FOLLOWING</span>':''}<span>${s.latest_trusted_at?age(s.latest_trusted_at)+' ago':'building'}</span></div><h2>${esc(s.store_label)}</h2><p>${esc(s.retailer)} • ${esc(s.broad_region)}</p><div class="si-detail-score"><b>${Number(s.average_proof_score||0)}</b><span>${confidenceBand(s)}</span></div></section>
    <div class="si-metrics"><div><span>Trusted claims</span><b>${Number(s.trusted_claims||0)}</b></div><div><span>Source verified</span><b>${Number(s.source_verified_claims||0)}</b></div><div><span>Independent scouts</span><b>${Number(s.independent_scouts||0)}</b></div><div><span>Conflicts</span><b>${Number(s.conflicted_claims||0)}</b></div></div>
    <div class="si-actions"><button id="siFollow" class="${following?'following':''}">${following?'✓ FOLLOWING':'＋ FOLLOW STORE'}</button><button id="siHunt">⌖ HUNT MISSIONS</button><button id="siStock">◎ FIND STOCK</button></div>
    <section class="si-panel"><span class="si-kicker">RECENT PRODUCTS</span><h3>What trusted scouts found here</h3>${products.length?`<div class="si-products">${products.map(p=>`<span>${esc(p)}</span>`).join('')}</div>`:'<div class="si-empty small">No trusted product history yet.</div>'}</section>
    <section class="si-panel"><span class="si-kicker">EVIDENCE TIMELINE</span><h3>${claims.length} recent store observations</h3>${claims.length?claims.map(claimRow).join(''):'<div class="si-empty small">No visible claim history yet.</div>'}</section>
    <div class="si-truth"><b>Store follow alerts are gated.</b> Unverified and conflicted claims stay inside Hunt Missions. Store followers are eligible only when a FOUND/SOLD OUT claim is CORROBORATED or SOURCE VERIFIED, and personal quiet hours/minimum score still apply.</div>
  </div>`;
  $('#siBack')?.addEventListener('click',()=>{activeKey='';render()});$('#siFollow')?.addEventListener('click',()=>toggleFollow(s));$('#siHunt')?.addEventListener('click',()=>{close();window.VaultSignalHuntMissions?.open?.()});$('#siStock')?.addEventListener('click',()=>{close();document.querySelector('.bottom-nav [data-tab="stock"]')?.click()});
}
function claimRow(c){const state=String(c.verification_state||'OBSERVATION');const score=Number(c.verification_score||0);return `<div class="si-claim ${state.toLowerCase()}"><span>${esc(c.result)}</span><div><b>${esc(c.product||'Store observation')}</b><small>${esc(state.replaceAll('_',' '))}${score?` • ${score} proof`:''} • ${age(c.created_at)} ago</small><small>${esc(c.verification_reason||'')}</small></div></div>`}
async function toggleFollow(s){if(!live())return;const key=s.store_key,following=follows.has(key),btn=$('#siFollow');if(btn)btn.disabled=true;try{
  if(following){const {error}=await cloud().client.from('store_intel_follows').delete().eq('user_id',cloud().user.id).eq('store_key',key);if(error)throw error;follows.delete(key);toast('Store unfollowed')}
  else{const {error}=await cloud().client.from('store_intel_follows').insert({user_id:cloud().user.id,store_key:key});if(error)throw error;follows.add(key);toast('Store followed • trusted alerts enabled')}
  detail(key)
}catch(e){toast(e?.message||'Could not update store follow');if(btn)btn.disabled=false}}
function toast(msg){let t=$('#siToast');if(!t){t=document.createElement('div');t.id='siToast';t.className='si-toast';document.body.appendChild(t)}t.textContent=msg;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),2200)}
function joinRealtime(){if(!live()||realtime)return;try{realtime=cloud().client.channel('store-intel-ui').on('postgres_changes',{event:'*',schema:'public',table:'store_intel'},()=>load()).subscribe()}catch{}}
function leaveRealtime(){if(realtime&&cloud().client)try{cloud().client.removeChannel(realtime)}catch{}realtime=null}
function injectTop(){const top=$('.topbar');if(!top||$('.si-top-entry'))return;const b=document.createElement('button');b.className='si-top-entry';b.type='button';b.textContent='STORES';b.addEventListener('click',()=>open());top.appendChild(b)}
function deepLink(){const q=new URLSearchParams(location.search),key=q.get('store');if(key)setTimeout(()=>open({storeKey:key}),450)}
function init(){injectTop();new MutationObserver(injectTop).observe(document.body,{childList:true,subtree:true});window.addEventListener('twogen-auth-changed',()=>{if($('#storeIntelPanel')?.classList.contains('open'))load()});window.VaultSignalStoreIntel={open,close,version:'25.0.0'};deepLink()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,180));else setTimeout(init,180);
})();
