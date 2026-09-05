(() => {
'use strict';

const STORAGE_KEY='2gen-vault-collector-os-v4';
let tab='overview';
let activeProduct='';
let activeRip='';

const $=s=>document.querySelector(s);
const arr=v=>Array.isArray(v)?v:[];
const n=v=>{const x=Number(v||0);return Number.isFinite(x)?x:0};
const money=v=>`$${n(v).toFixed(2)}`;
const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const uid=(p='vg')=>`${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const itemId=x=>String(x?.uid||x?.id||x?.cardId||x?.productId||x?.sealedId||'');
const itemName=x=>x?.name||x?.productName||x?.cardName||x?.title||'Untitled';
const itemGame=x=>x?.game||x?.tcg||'';
const itemSet=x=>x?.set||x?.setName||'';
const itemNumber=x=>x?.number||x?.cardNumber||x?.collectorNumber||'';
const dateOf=x=>x?.finishedAt||x?.openedAt||x?.createdAt||x?.date||x?.purchaseDate||x?.updatedAt||'';

function read(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{return {}}}
function ensure(s){
  s.vaultGraph=s.vaultGraph||{};
  s.vaultGraph.version=16;
  s.vaultGraph.productRipLinks=s.vaultGraph.productRipLinks||{};
  s.vaultGraph.pullCardLinks=s.vaultGraph.pullCardLinks||{};
  s.vaultGraph.notes=Array.isArray(s.vaultGraph.notes)?s.vaultGraph.notes:[];
  return s;
}
function state(){return ensure(read())}
function save(s){localStorage.setItem(STORAGE_KEY,JSON.stringify(ensure(s)))}

function cards(s){return arr(s.collection)}
function sealed(s){return arr(s.sealed)}
function products(s){
  const list=[...arr(s.productCatalog),...sealed(s)];
  const seen=new Set();
  return list.filter(x=>{const k=itemId(x)||`${norm(itemName(x))}|${norm(itemGame(x))}|${norm(itemSet(x))}`;if(seen.has(k))return false;seen.add(k);return true});
}
function rips(s){return arr(s.ripSessions)}
function pullsOf(r){return arr(r?.pulls).length?arr(r.pulls):arr(r?.cards)}

function sameCard(a,b){
  const aid=itemId(a),bid=itemId(b);if(aid&&bid&&aid===bid)return {ok:true,kind:'explicit'};
  if(norm(itemName(a))!==norm(itemName(b)))return {ok:false};
  const aset=norm(itemSet(a)),bset=norm(itemSet(b));
  const anum=norm(itemNumber(a)),bnum=norm(itemNumber(b));
  if(anum&&bnum&&anum!==bnum)return {ok:false};
  if(aset&&bset&&aset!==bset)return {ok:false};
  return {ok:true,kind:(anum&&bnum)||(aset&&bset)?'strong':'suggested'};
}
function productMatch(p,r,s){
  const pid=itemId(p),rid=itemId(r);
  if(s.vaultGraph.productRipLinks[rid]===pid)return {ok:true,kind:'manual'};
  const refs=[r?.sourceSealedId,r?.sealedId,r?.productId,r?.sourceProductId].filter(Boolean).map(String);
  if(pid&&refs.includes(pid))return {ok:true,kind:'explicit'};
  const rn=norm(r?.productName||r?.product||r?.name||'');
  if(rn&&rn===norm(itemName(p))){
    const pg=norm(itemGame(p)),rg=norm(itemGame(r));
    if(!pg||!rg||pg===rg)return {ok:true,kind:'suggested'};
  }
  return {ok:false};
}
function pullLink(pull,card,rip,s){
  const rid=itemId(rip),pk=itemId(pull)||`${norm(itemName(pull))}|${norm(itemSet(pull))}|${norm(itemNumber(pull))}`;
  const manual=s.vaultGraph.pullCardLinks[`${rid}::${pk}`];
  if(manual&&manual===itemId(card))return {ok:true,kind:'manual'};
  return sameCard(pull,card);
}

function productTrail(p,s){
  const linked=[];
  rips(s).forEach(r=>{const m=productMatch(p,r,s);if(m.ok)linked.push({rip:r,kind:m.kind})});
  linked.sort((a,b)=>String(dateOf(b.rip)).localeCompare(String(dateOf(a.rip))));
  return linked;
}
function ripPullLinks(r,s){
  return pullsOf(r).map(p=>{
    const matches=cards(s).map(c=>({card:c,match:pullLink(p,c,r,s)})).filter(x=>x.match.ok).sort((a,b)=>rank(b.match.kind)-rank(a.match.kind));
    return {pull:p,matches};
  });
}
function rank(k){return k==='manual'?4:k==='explicit'?3:k==='strong'?2:1}

function downstream(card,s){
  const out=[];
  const tests=[['Grading',arr(s.grading)],['Sale',arr(s.sales)],['Trade',arr(s.trades)],['Giveaway',arr(s.giveawayLocker)],['Content',arr(s.contentQueue)]];
  tests.forEach(([type,list])=>list.forEach(x=>{
    const nested=[x,...arr(x.items),...arr(x.cards),...arr(x.give),...arr(x.receive),...arr(x.pulls)];
    if(nested.some(v=>sameCard(card,v).ok))out.push({type,label:itemName(x),date:dateOf(x)});
  }));
  return out;
}
function provenanceScore(card,s){
  let score=20;
  if(itemSet(card))score+=10;if(itemNumber(card))score+=10;if(itemId(card))score+=10;
  if(n(card?.cost||card?.costBasis||card?.costEach)>0)score+=10;
  if(n(card?.market||card?.marketValue||card?.value)>0)score+=10;
  const linked=rips(s).some(r=>ripPullLinks(r,s).some(x=>x.matches.some(m=>itemId(m.card)===itemId(card)&&rank(m.match.kind)>=2)));
  if(linked)score+=20;if(downstream(card,s).length)score+=10;
  return Math.min(100,score);
}
function graphStats(s){
  const ps=products(s),rs=rips(s),cs=cards(s);
  let pr=0,pc=0,suggested=0;
  ps.forEach(p=>productTrail(p,s).forEach(x=>{pr++;if(x.kind==='suggested')suggested++}));
  rs.forEach(r=>ripPullLinks(r,s).forEach(x=>x.matches.forEach(m=>{pc++;if(m.match.kind==='suggested')suggested++})));
  return {products:ps.length,rips:rs.length,cards:cs.length,productRipLinks:pr,pullCardLinks:pc,suggested};
}
function missingLinks(s){
  const out=[];
  rips(s).forEach(r=>{
    const linked=products(s).some(p=>productMatch(p,r,s).ok);
    if(!linked)out.push({type:'rip',id:itemId(r),title:itemName(r),detail:'No source product is linked to this rip.'});
    ripPullLinks(r,s).forEach(x=>{if(!x.matches.length)out.push({type:'pull',rip:itemId(r),title:itemName(x.pull),detail:`No owned Vault card is linked from ${itemName(r)}.`})});
  });
  return out.slice(0,20);
}

function statusBadge(k){return `<span class="vg-badge ${k}">${k==='manual'?'CONFIRMED':k==='explicit'?'LINKED':k==='strong'?'STRONG MATCH':'SUGGESTED'}</span>`}
function openTab(route){close();if(route==='creator'&&window.VaultSignalCreatorCommand?.open)return window.VaultSignalCreatorCommand.open('home');if(route==='grail'&&window.VaultSignalGrail?.open)return window.VaultSignalGrail.open('brief');if(route==='journey'&&window.VaultSignalJourney?.open)return window.VaultSignalJourney.open('journey');document.querySelector(`.bottom-nav [data-tab="${route}"]`)?.click()}
function fmtDate(v){if(!v)return 'Date not recorded';const d=new Date(v);return Number.isNaN(d.getTime())?'Date not recorded':d.toLocaleDateString()}
function copyText(t){navigator.clipboard?.writeText(t).then(()=>toast('Copied')).catch(()=>{const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove();toast('Copied')})}
function toast(t){let x=$('#vgToast');if(!x){x=document.createElement('div');x.id='vgToast';x.className='vg-toast';document.body.appendChild(x)}x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),1500)}

function overview(s){
  const g=graphStats(s),miss=missingLinks(s);
  return `<div class="vg-scroll">
    <section class="vg-hero"><span class="vg-kicker">VAULTGRAPH • v16</span><h2>Your collection, connected.</h2><p>Trace products into rip sessions, pulls into owned cards, and cards into grading, trades, sales and creator moments.</p></section>
    <div class="vg-stat-grid"><div><span>Products</span><b>${g.products}</b></div><div><span>Rip Sessions</span><b>${g.rips}</b></div><div><span>Cards</span><b>${g.cards}</b></div><div><span>Connections</span><b>${g.productRipLinks+g.pullCardLinks}</b></div></div>
    <section class="vg-panel"><div class="vg-head"><div><span class="vg-kicker">PROVENANCE HEALTH</span><h3>${g.suggested?`${g.suggested} suggested link${g.suggested===1?'':'s'} need review`:'No unresolved suggested links detected'}</h3></div></div><p>VaultGraph only treats explicit IDs and your manual confirmations as confirmed provenance. Name-only matches stay suggestions.</p></section>
    <section class="vg-panel"><div class="vg-head"><div><span class="vg-kicker">MISSING LINK CENTER</span><h3>${miss.length} item${miss.length===1?'':'s'} need context</h3></div></div>${miss.length?miss.slice(0,8).map(x=>`<div class="vg-missing"><b>${esc(x.title)}</b><small>${esc(x.detail)}</small></div>`).join(''):'<div class="vg-empty">Your recorded rip history is well connected.</div>'}</section>
    <section class="vg-panel"><span class="vg-kicker">ONE COLLECTION LOOP</span><div class="vg-flow"><button data-route="stock">Hunt</button><i>→</i><button data-tabgo="products">Product</button><i>→</i><button data-route="tools">Rip</button><i>→</i><button data-tabgo="rips">Pulls</button><i>→</i><button data-route="journey">Journey</button></div></section>
  </div>`;
}
function productsView(s){
  const ps=products(s);if(!ps.length)return empty('No tracked products yet','Add sealed inventory or Product Command records to build product provenance.');
  const p=ps.find(x=>itemId(x)===activeProduct)||ps[0];activeProduct=itemId(p);
  const trail=productTrail(p,s);
  const openQty=arr(s.openingLog).filter(x=>String(x?.productId||x?.sealedId||'')===itemId(p)||norm(itemName(x))===norm(itemName(p))).length;
  return `<div class="vg-scroll"><div class="vg-page-head"><div><span class="vg-kicker">PRODUCT TRAIL</span><h2>${esc(itemName(p))}</h2></div></div>
    <select class="vg-select" id="vgProductSelect">${ps.map(x=>`<option value="${esc(itemId(x))}" ${itemId(x)===activeProduct?'selected':''}>${esc(itemName(x))}</option>`).join('')}</select>
    <div class="vg-stat-grid"><div><span>Game</span><b>${esc(itemGame(p)||'—')}</b></div><div><span>Owned</span><b>${n(p?.quantity||1)}</b></div><div><span>Tracked Value</span><b>${money(p?.valueEach||p?.market||p?.value)}</b></div><div><span>Open events</span><b>${openQty+trail.length}</b></div></div>
    <section class="vg-panel"><div class="vg-head"><div><span class="vg-kicker">LINKED RIP SESSIONS</span><h3>${trail.length} session${trail.length===1?'':'s'}</h3></div></div>${trail.length?trail.map(x=>`<button class="vg-linkrow" data-ripid="${esc(itemId(x.rip))}"><span><b>${esc(itemName(x.rip))}</b><small>${fmtDate(dateOf(x.rip))} • ${pullsOf(x.rip).length} pulls</small></span>${statusBadge(x.kind)}</button>`).join(''):'<div class="vg-empty">No rip session is linked to this product yet.</div>'}</section>
    <section class="vg-panel"><span class="vg-kicker">PROVENANCE NOTE</span><p>If a rip came from this product but VaultSignal cannot prove it automatically, VaultGraph leaves the relationship unresolved instead of inventing it.</p></section>
  </div>`;
}
function ripsView(s){
  const rs=rips(s);if(!rs.length)return empty('No Rip Sessions yet','Start a Rip Session in Collector Tools to build a pull tree.');
  const sorted=rs.slice().sort((a,b)=>String(dateOf(b)).localeCompare(String(dateOf(a))));
  const r=rs.find(x=>itemId(x)===activeRip)||sorted[0];activeRip=itemId(r);
  const links=ripPullLinks(r,s);const source=products(s).map(p=>({p,m:productMatch(p,r,s)})).filter(x=>x.m.ok).sort((a,b)=>rank(b.m.kind)-rank(a.m.kind))[0];
  return `<div class="vg-scroll"><div class="vg-page-head"><div><span class="vg-kicker">PULL TREE</span><h2>${esc(itemName(r))}</h2></div></div>
    <select class="vg-select" id="vgRipSelect">${rs.map(x=>`<option value="${esc(itemId(x))}" ${itemId(x)===activeRip?'selected':''}>${esc(itemName(x))}</option>`).join('')}</select>
    <section class="vg-panel"><span class="vg-kicker">SOURCE PRODUCT</span>${source?`<div class="vg-source"><div><b>${esc(itemName(source.p))}</b><small>${esc(itemGame(source.p)||'TCG')} • ${fmtDate(dateOf(r))}</small></div>${statusBadge(source.m.kind)}</div>`:'<div class="vg-empty">No source product linked.</div>'}</section>
    <section class="vg-panel"><div class="vg-head"><div><span class="vg-kicker">PULLS</span><h3>${links.length} recorded</h3></div></div>${links.length?links.map(x=>{const best=x.matches[0];return `<div class="vg-pull"><div><b>${esc(itemName(x.pull))}</b><small>${esc(itemSet(x.pull)||'Set not recorded')} ${itemNumber(x.pull)?`• #${esc(itemNumber(x.pull))}`:''}</small></div>${best?`<button data-cardjourney="${esc(itemId(best.card).toLowerCase())}">${statusBadge(best.match.kind)}<span>Open Journey</span></button>`:'<span class="vg-unlinked">UNLINKED</span>'}</div>`}).join(''):'<div class="vg-empty">No pulls logged in this session.</div>'}</section>
  </div>`;
}
function cardsView(s){
  const cs=cards(s).slice().sort((a,b)=>provenanceScore(b,s)-provenanceScore(a,s));if(!cs.length)return empty('No Vault cards yet','Scan or add cards to the Vault to build provenance.');
  return `<div class="vg-scroll"><div class="vg-page-head"><div><span class="vg-kicker">CARD PROVENANCE</span><h2>Best documented cards</h2></div></div>${cs.slice(0,40).map(c=>{const score=provenanceScore(c,s),down=downstream(c,s);return `<button class="vg-cardrow" data-cardjourney="${esc(itemId(c).toLowerCase())}"><div><b>${esc(itemName(c))}</b><small>${esc(itemSet(c)||'Set not recorded')} ${itemNumber(c)?`• #${esc(itemNumber(c))}`:''} • ${down.length} downstream event${down.length===1?'':'s'}</small><div class="vg-progress"><i style="width:${score}%"></i></div></div><strong>${score}%</strong></button>`}).join('')}</div>`;
}
function reportView(s){
  const g=graphStats(s),miss=missingLinks(s),best=cards(s).slice().sort((a,b)=>provenanceScore(b,s)-provenanceScore(a,s))[0];
  const text=`VaultSignal VaultGraph Report\nProducts: ${g.products}\nRip Sessions: ${g.rips}\nCards: ${g.cards}\nRecorded connections: ${g.productRipLinks+g.pullCardLinks}\nSuggested links needing review: ${g.suggested}\nMissing-link items: ${miss.length}${best?`\nBest documented card: ${itemName(best)} (${provenanceScore(best,s)}%)`:''}\n\nVaultGraph is provenance/organization tracking, not proof of authenticity or ownership outside the data recorded in VaultSignal.`;
  return `<div class="vg-scroll"><section class="vg-hero"><span class="vg-kicker">PROVENANCE REPORT</span><h2>Share how organized your collection is.</h2><p>This summary contains counts and linkage quality, not private purchase history or addresses.</p></section><section class="vg-panel"><pre class="vg-report">${esc(text)}</pre><button class="vg-primary" id="vgCopyReport">Copy report</button></section></div>`;
}
function empty(title,detail){return `<div class="vg-scroll"><section class="vg-empty-state"><b>◎</b><h2>${esc(title)}</h2><p>${esc(detail)}</p></section></div>`}

function render(){
  const s=state(),host=$('#vaultGraphOverlay');if(!host)return;
  const views={overview,products:productsView,rips:ripsView,cards:cardsView,report:reportView};
  host.innerHTML=`<div class="vg-shell"><header class="vg-top"><div><div class="vg-mark">◎</div><div><strong>VaultGraph</strong><span>Provenance • by VaultSignal</span></div></div><button id="vgClose">×</button></header><nav class="vg-tabs">${[['overview','Overview'],['products','Products'],['rips','Pull Tree'],['cards','Cards'],['report','Report']].map(([k,l])=>`<button class="${tab===k?'active':''}" data-vgtab="${k}">${l}</button>`).join('')}</nav>${(views[tab]||overview)(s)}</div>`;
  bind(s);
}
function bind(s){
  $('#vgClose')?.addEventListener('click',close);
  document.querySelectorAll('[data-vgtab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.vgtab;render()}));
  document.querySelectorAll('[data-tabgo]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.tabgo;render()}));
  document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>openTab(b.dataset.route)));
  $('#vgProductSelect')?.addEventListener('change',e=>{activeProduct=e.target.value;render()});
  $('#vgRipSelect')?.addEventListener('change',e=>{activeRip=e.target.value;render()});
  document.querySelectorAll('[data-ripid]').forEach(b=>b.addEventListener('click',()=>{activeRip=b.dataset.ripid;tab='rips';render()}));
  document.querySelectorAll('[data-cardjourney]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.cardjourney;close();window.VaultSignalJourney?.open?.('journey',id)}));
  $('#vgCopyReport')?.addEventListener('click',()=>{const g=graphStats(s),m=missingLinks(s);copyText(`VaultSignal VaultGraph Report\nProducts: ${g.products}\nRip Sessions: ${g.rips}\nCards: ${g.cards}\nConnections: ${g.productRipLinks+g.pullCardLinks}\nSuggested links: ${g.suggested}\nMissing-link items: ${m.length}`)});
}
function open(view='overview'){tab=view;let host=$('#vaultGraphOverlay');if(!host){host=document.createElement('div');host.id='vaultGraphOverlay';host.className='vg-overlay';document.body.appendChild(host)}host.classList.add('open');document.body.classList.add('vg-open');render()}
function close(){$('#vaultGraphOverlay')?.classList.remove('open');document.body.classList.remove('vg-open')}
function inject(){
  if($('#vaultGraphFab'))return;
  const fab=document.createElement('button');fab.id='vaultGraphFab';fab.className='vg-fab';fab.innerHTML='<b>◎</b><span>Graph</span>';fab.addEventListener('click',()=>open('overview'));document.body.appendChild(fab);
  const top=document.querySelector('.topbar');if(top){const b=document.createElement('button');b.className='vg-top-entry';b.textContent='GRAPH';b.addEventListener('click',()=>open('overview'));top.appendChild(b)}
}
function init(){const s=state();save(s);inject();window.VaultSignalGraph={open,close,version:'16.0.0',stats:()=>graphStats(state())}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,80));else setTimeout(init,80);
})();
