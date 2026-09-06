(() => {
'use strict';

const STORAGE_KEY='2gen-vault-collector-os-v4';
const $=s=>document.querySelector(s);
const arr=v=>Array.isArray(v)?v:[];
const num=v=>{const n=Number(v||0);return Number.isFinite(n)?n:0};
const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const cloud=()=>window.TWOGEN_CLOUD||{};
const live=()=>Boolean(cloud().configured&&cloud().client&&cloud().user);
let rows=[];
let loading=false;
let filter='All';
let active='';
let timer=null;

function read(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{return {}}}
function watchTerms(){
  const s=read();
  return [...new Set([...arr(s.stockWatches),...arr(s.wishlist),...arr(s.acquisitionQueue),...arr(s.chaseList)]
    .flatMap(x=>[x.product,x.name,x.cardName,x.query,x.set].filter(Boolean).map(norm))
    .filter(x=>x.length>=3))].slice(0,60);
}
function watchMatch(r){
  const terms=watchTerms();if(!terms.length)return false;
  const hay=norm(r.product||r.normalized_product||'');
  return terms.some(t=>hay.includes(t)||t.includes(hay));
}
function gameLabel(v=''){const x=String(v||'');return x==='Pokemon'?'Pokémon':x||'TCG'}
function heatClass(v=''){return String(v||'QUIET').toLowerCase()}
function momentumLabel(v){const n=num(v);if(n>=15)return`↑ +${n}`;if(n>0)return`↗ +${n}`;if(n<=-15)return`↓ ${n}`;if(n<0)return`↘ ${n}`;return'→ steady'}
function sourceTotal(r){return num(r.source_evidence)}
function communityTotal(r){return num(r.collector_reports)+num(r.confirmations)}

function localRows(){
  const s=read(),posts=arr(s.signalNetwork?.posts).filter(p=>['pokemon-drops','local-finds','deals'].includes(p.room));
  const map=new Map();
  for(const p of posts){
    const key=norm(p.product||p.title||'');if(!key)continue;
    const when=new Date(p.created_at||p.createdAt||0).getTime();if(Date.now()-when>24*60*60*1000)continue;
    const r=map.get(key)||{normalized_product:key,product:p.product||p.title||'Community signal',game:p.game||'',heat_score:0,heat_state:'QUIET',momentum:0,watcher_count:0,watch_interest_visible:false,incidents_6h:0,live_incidents:0,collector_reports:0,independent_collectors:0,confirmations:0,gone_reports:0,source_evidence:0,official_evidence:0,partner_evidence:0,storefront_evidence:0,source_live:0,source_gone:0};
    r.collector_reports++;
    if(Date.now()-when<=6*60*60*1000)r.incidents_6h++;
    r.independent_collectors++;
    r.heat_score=Math.min(100,20+Math.min(r.collector_reports*8,32)+Math.min(r.independent_collectors*5,20));
    r.heat_state=r.heat_score>=80?'SURGING':r.heat_score>=60?'HOT':r.heat_score>=35?'ACTIVE':r.heat_score>=15?'COOLING':'QUIET';
    map.set(key,r);
  }
  return [...map.values()].sort((a,b)=>b.heat_score-a.heat_score);
}

async function load(){
  loading=true;render();
  if(!live()){rows=localRows();loading=false;render();return}
  try{
    const {data,error}=await cloud().client.from('demand_radar').select('*').order('heat_score',{ascending:false}).order('momentum',{ascending:false}).limit(120);
    if(error)throw error;rows=data||[];
  }catch{rows=localRows()}
  loading=false;render();
}
function games(){return ['All',...new Set(rows.map(r=>r.game).filter(Boolean))]}
function visibleRows(){
  return rows.filter(r=>(filter==='All'||r.game===filter)&&(num(r.heat_score)>=15||watchMatch(r)))
    .sort((a,b)=>Number(watchMatch(b))-Number(watchMatch(a))||num(b.heat_score)-num(a.heat_score)||num(b.momentum)-num(a.momentum));
}
function card(r){
  const watch=watchMatch(r),heat=num(r.heat_score),state=r.heat_state||'QUIET';
  return `<button class="dr-card ${heatClass(state)}" data-radar="${esc(r.normalized_product)}">
    <div class="dr-card-top"><span class="dr-state">${esc(state)}</span>${watch?'<span class="dr-watch">YOUR WATCH</span>':''}<small>${esc(gameLabel(r.game))}</small></div>
    <div class="dr-card-main"><div><h3>${esc(r.product)}</h3><p>${num(r.independent_collectors)} collectors • ${num(r.collector_reports)} reports • ${sourceTotal(r)} source signals</p></div><div class="dr-score"><b>${heat}</b><span>HEAT</span></div></div>
    <div class="dr-card-foot"><span>${momentumLabel(r.momentum)} momentum</span><span>${num(r.live_incidents)} live incident${num(r.live_incidents)===1?'':'s'}</span></div>
  </button>`;
}
function listView(){
  const list=visibleRows(),all=rows.filter(r=>num(r.heat_score)>=15),hot=all.filter(r=>['SURGING','HOT'].includes(r.heat_state)).length,matches=all.filter(watchMatch).length,sourceBacked=all.filter(r=>sourceTotal(r)>0).length;
  const chips=games().map(g=>`<button class="dr-filter ${filter===g?'active':''}" data-game="${esc(g)}">${esc(g==='Pokemon'?'Pokémon':g)}</button>`).join('');
  return `<div class="dr-scroll">
    <section class="dr-hero"><div><span class="dr-kicker">DEMAND RADAR • v22</span><h2>See the hobby heat before chat buries it.</h2><p>Privacy-safe attention and availability intelligence from community incidents, confirmations and Source Mesh evidence.</p></div><div class="dr-hero-score"><b>${all[0]?num(all[0].heat_score):0}</b><span>TOP HEAT</span></div></section>
    <div class="dr-stats"><div><b>${hot}</b><span>hot / surging</span></div><div><b>${matches}</b><span>your matches</span></div><div><b>${sourceBacked}</b><span>source-backed</span></div></div>
    <div class="dr-filters">${chips}</div>
    ${loading?'<div class="dr-loading">Reading crowd + source intelligence…</div>':list.length?`<section class="dr-list">${list.map(card).join('')}</section>`:'<div class="dr-empty"><b>No shared heat yet</b><p>That can be the correct result. Watch interest stays private until at least 3 independent collectors match, and source-only activity is not treated as crowd demand.</p></div>'}
    <section class="dr-method"><b>What HEAT means</b><p>HEAT blends recent incident velocity, independent collector reports, confirmations and supported provider evidence. It does not predict card prices, resale value or future returns.</p><small>Shared watcher counts are suppressed below 3 independent collectors.</small></section>
  </div>`;
}
function shell(){return `<div class="dr-shell"><header class="dr-top"><div><div class="dr-mark">◉</div><div><strong>Demand Radar</strong><span>Crowd intelligence without the noise</span></div></div><button id="drClose" aria-label="Close">×</button></header><main id="drBody">${listView()}</main></div>`}
function close(){document.body.classList.remove('dr-open');$('#demandRadarPanel')?.classList.remove('open');if(timer){clearInterval(timer);timer=null}}
function open(){let root=$('#demandRadarPanel');if(!root){root=document.createElement('div');root.id='demandRadarPanel';root.className='dr-overlay';root.innerHTML=shell();document.body.appendChild(root)}root.classList.add('open');document.body.classList.add('dr-open');bind();load();if(!timer)timer=setInterval(()=>{if(root.classList.contains('open'))load()},60000);return root}
function render(){if(!$('#demandRadarPanel')?.classList.contains('open'))return;if(active){detail(active);return}const b=$('#drBody');if(b)b.innerHTML=listView();bind()}
function bind(){
  $('#drClose')?.addEventListener('click',close);
  document.querySelectorAll('#demandRadarPanel [data-game]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.game||'All';render()}));
  document.querySelectorAll('#demandRadarPanel [data-radar]').forEach(b=>b.addEventListener('click',()=>{active=b.dataset.radar||'';detail(active)}));
}
async function detail(key){
  const r=rows.find(x=>String(x.normalized_product)===String(key));if(!r){active='';render();return}
  const watch=r.watch_interest_visible?`${num(r.watcher_count)} collectors watching`:'Private below 3 collectors';
  const b=$('#drBody');if(!b)return;
  b.innerHTML=`<div class="dr-scroll"><button id="drBack" class="dr-back">← RADAR</button>
    <section class="dr-detail-hero ${heatClass(r.heat_state)}"><div><span class="dr-state">${esc(r.heat_state)}</span>${watchMatch(r)?'<span class="dr-watch">YOUR WATCH</span>':''}<h2>${esc(r.product)}</h2><p>${esc(gameLabel(r.game))}</p></div><div class="dr-detail-score"><b>${num(r.heat_score)}</b><span>HEAT</span></div></section>
    <div class="dr-detail-stats"><div><span>Momentum</span><b>${momentumLabel(r.momentum)}</b></div><div><span>Watch interest</span><b>${esc(watch)}</b></div><div><span>Collectors</span><b>${num(r.independent_collectors)}</b></div><div><span>Reports</span><b>${num(r.collector_reports)}</b></div></div>
    <section class="dr-panel"><span class="dr-kicker">COMMUNITY EVIDENCE</span><div class="dr-bars"><div><span>Live incidents</span><b>${num(r.live_incidents)}</b></div><div><span>Confirmations</span><b>${num(r.confirmations)}</b></div><div><span>Gone reports</span><b>${num(r.gone_reports)}</b></div><div><span>Incidents • 6h</span><b>${num(r.incidents_6h)}</b></div></div></section>
    <section class="dr-panel"><span class="dr-kicker">SOURCE MESH EVIDENCE</span><div class="dr-bars"><div><span>Active source evidence</span><b>${sourceTotal(r)}</b></div><div><span>Official API</span><b>${num(r.official_evidence)}</b></div><div><span>Partner feed</span><b>${num(r.partner_evidence)}</b></div><div><span>Public storefront</span><b>${num(r.storefront_evidence)}</b></div></div></section>
    <section class="dr-panel"><span class="dr-kicker">WHY IT MATTERS</span><p>Demand Radar raises heat when independent collector activity accelerates and when supported availability evidence agrees. A product being available by itself does not equal crowd demand.</p></section>
    <div class="dr-actions"><button id="drWar">≋ OPEN WAR ROOM</button><button id="drStock">◎ FIND STOCK</button><button id="drShare">↗ SHARE RADAR</button></div>
    <div class="dr-footnote">Heat measures current hobby attention and availability evidence. It is not financial advice or a prediction of future value.</div></div>`;
  $('#drBack')?.addEventListener('click',()=>{active='';render()});
  $('#drWar')?.addEventListener('click',()=>openWar(r));
  $('#drStock')?.addEventListener('click',()=>{close();document.querySelector('.bottom-nav [data-tab="stock"]')?.click()});
  $('#drShare')?.addEventListener('click',()=>share(r));
}
async function openWar(r){
  if(live()){
    try{
      const {data}=await cloud().client.from('signal_incidents').select('id').eq('normalized_product',r.normalized_product).order('last_seen_at',{ascending:false}).limit(1).maybeSingle();
      close();if(data?.id)window.VaultSignalFusion?.open?.({incidentId:data.id});else window.VaultSignalFusion?.open?.();return;
    }catch{}
  }
  close();window.VaultSignalFusion?.open?.();
}
function share(r){
  const text=`VaultSignal Demand Radar\n${r.heat_state} • ${num(r.heat_score)} HEAT • ${momentumLabel(r.momentum)}\n${r.product}\n${num(r.independent_collectors)} collectors • ${num(r.collector_reports)} reports • ${sourceTotal(r)} source signals\n\nAttention/availability intelligence only — not price prediction.`;
  if(navigator.share)navigator.share({title:'VaultSignal Demand Radar',text}).catch(()=>{});else navigator.clipboard?.writeText(text);
}
function inject(){const top=$('.topbar');if(top&&!$('#drTopButton')){const b=document.createElement('button');b.id='drTopButton';b.className='dr-top-entry';b.textContent='RADAR';b.addEventListener('click',open);top.appendChild(b)}}
function init(){inject();window.VaultSignalDemandRadar={open,close,refresh:load,version:'22.0.0'};new MutationObserver(inject).observe(document.body,{childList:true,subtree:true});window.addEventListener('twogen-auth-changed',()=>{if($('#demandRadarPanel')?.classList.contains('open'))load()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,190));else setTimeout(init,190);
})();
