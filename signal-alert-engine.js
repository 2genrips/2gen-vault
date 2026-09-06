(() => {
'use strict';

const STORAGE_KEY='2gen-vault-collector-os-v4';
const STOCK_ROOMS=new Set(['pokemon-drops','local-finds','deals']);
let syncTimer=null;

const arr=v=>Array.isArray(v)?v:[];
const norm=v=>String(v||'').trim().toLowerCase();
function state(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{return {}}}
function cloud(){return window.TWOGEN_CLOUD||{}}
function live(){return Boolean(cloud().configured&&cloud().client&&cloud().user)}
function timezone(){try{return Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'}catch{return'UTC'}}
function watchTerms(){
  const s=state();
  const sources=[...arr(s.stockWatches),...arr(s.wishlist),...arr(s.acquisitionQueue),...arr(s.chaseList)];
  const terms=[];
  for(const x of sources){
    for(const v of [x?.product,x?.name,x?.cardName,x?.query,x?.set,x?.setName]){
      const t=norm(v);if(t.length>=3&&!terms.includes(t))terms.push(t);
      if(terms.length>=40)return terms;
    }
  }
  return terms;
}
async function sync(){
  if(!live())return {ok:false,reason:'signed-out'};
  const c=cloud(),terms=watchTerms();
  const payload={user_id:c.user.id,timezone:timezone(),watch_terms:terms,local_region_only:true,updated_at:new Date().toISOString()};
  const {error}=await c.client.from('notification_preferences').upsert(payload,{onConflict:'user_id'});
  if(error)throw error;
  updateStatus();
  return {ok:true,terms:terms.length,timezone:payload.timezone};
}
function scheduleSync(delay=250){clearTimeout(syncTimer);syncTimer=setTimeout(()=>sync().catch(()=>{}),delay)}
function statusText(){
  if(!live())return 'Sign in to sync smart alerts';
  const count=watchTerms().length;
  return count?`${count} watch term${count===1?'':'s'} synced for smart routing`:'Room alerts active • add watches for personalized routing';
}
function updateStatus(){
  const el=document.getElementById('v19AlertStatus');if(el)el.textContent=statusText();
}
function inject(){
  const panel=document.getElementById('liveCommunityPanel');
  if(!panel||!panel.classList.contains('open')||document.getElementById('v19AlertCard'))return;
  const scroll=panel.querySelector('.lc-scroll');if(!scroll)return;
  const card=document.createElement('section');card.id='v19AlertCard';card.className='lc-panel v19-alert-card';
  card.innerHTML='<div class="v19-alert-head"><div><span>SMART ALERT ENGINE</span><b>Watch-aware background routing</b><small id="v19AlertStatus"></small></div><button id="v19SyncAlerts">SYNC</button></div>';
  const anchor=scroll.querySelector('.lc-panel');if(anchor)anchor.insertAdjacentElement('afterend',card);else scroll.prepend(card);
  card.querySelector('#v19SyncAlerts')?.addEventListener('click',async()=>{const b=card.querySelector('#v19SyncAlerts');b.disabled=true;b.textContent='SYNCING';try{await sync();b.textContent='SYNCED'}catch{b.textContent='RETRY'}setTimeout(()=>{b.disabled=false;b.textContent='SYNC'},1300)});
  updateStatus();
}
function init(){
  scheduleSync(600);
  window.addEventListener('twogen-cloud-ready',()=>scheduleSync(150));
  window.addEventListener('twogen-auth-changed',()=>scheduleSync(150));
  window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY)scheduleSync(300)});
  document.addEventListener('click',e=>{
    if(e.target.closest?.('#lcSavePrefs,#lcEnablePush,#lcAuthGo,[data-alert-room]'))scheduleSync(500);
  },true);
  const mo=new MutationObserver(()=>inject());mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  window.VaultSignalAlerts={sync,watchTerms,version:'19.0.0',stockRooms:[...STOCK_ROOMS]};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,100));else setTimeout(init,100);
})();
