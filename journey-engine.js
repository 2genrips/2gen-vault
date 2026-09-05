(() => {
'use strict';

const STORAGE_KEY='2gen-vault-collector-os-v4';
let selectedCardKey='';
let activeTab='journey';

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const arr=v=>Array.isArray(v)?v:[];
const num=v=>{const n=Number(v||0);return Number.isFinite(n)?n:0};
const money=v=>`$${num(v).toFixed(2)}`;
const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const uid=(p='j')=>`${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
const isoNow=()=>new Date().toISOString();

function read(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{return {}}}
function write(s){localStorage.setItem(STORAGE_KEY,JSON.stringify(s))}
function ensure(s){
  s.journeyEngine=s.journeyEngine||{};
  s.journeyEngine.version=15;
  s.journeyEngine.manualEvents=Array.isArray(s.journeyEngine.manualEvents)?s.journeyEngine.manualEvents:[];
  s.journeyEngine.gradeReviews=Array.isArray(s.journeyEngine.gradeReviews)?s.journeyEngine.gradeReviews:[];
  s.journeyEngine.storyExports=Array.isArray(s.journeyEngine.storyExports)?s.journeyEngine.storyExports:[];
  return s;
}
function state(){return ensure(read())}
function save(s){write(ensure(s))}
function cardQty(c){return Math.max(1,num(c?.quantity||1))}
function cardMarket(c){return num(c?.market||c?.marketValue||c?.value||c?.price)}
function cardCost(c){return num(c?.costEach||c?.cost||c?.costBasis||c?.purchasePrice)}
function cardName(c){return c?.name||c?.cardName||c?.title||'Tracked card'}
function cardSet(c){return c?.set||c?.setName||''}
function cardNumber(c){return c?.number||c?.cardNumber||c?.collectorNumber||''}
function cardGame(c){return c?.game||c?.tcg||'TCG'}
function cardKey(c){return String(c?.uid||c?.id||c?.cardId||`${cardGame(c)}|${cardSet(c)}|${cardNumber(c)}|${cardName(c)}`).toLowerCase()}
function norm(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function sameCard(a,b){
  if(!a||!b)return false;
  const ids=[a.uid,a.id,a.cardId,a.providerId].filter(Boolean).map(String);
  const bids=[b.uid,b.id,b.cardId,b.providerId].filter(Boolean).map(String);
  if(ids.some(x=>bids.includes(x)))return true;
  const an=norm(cardName(a)),bn=norm(cardName(b));
  if(!an||!bn||an!==bn)return false;
  const aset=norm(cardSet(a)),bset=norm(cardSet(b));
  const anum=norm(cardNumber(a)),bnum=norm(cardNumber(b));
  if(anum&&bnum&&anum===bnum)return !aset||!bset||aset===bset;
  return aset&&bset&&aset===bset;
}
function dt(v){const d=new Date(v);return Number.isFinite(d.getTime())?d:null}
function prettyDate(v){const d=dt(v);return d?d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'Date not recorded'}
function eventDate(x){return x?.date||x?.createdAt||x?.updatedAt||x?.finishedAt||x?.purchaseDate||x?.submittedAt||x?.soldAt||''}
function eventSort(a,b){return (dt(b.date)?.getTime()||0)-(dt(a.date)?.getTime()||0)}

function collectionCards(s){return arr(s.collection).filter(Boolean)}
function selectedCard(s){const cards=collectionCards(s);if(!cards.length)return null;if(!selectedCardKey)selectedCardKey=cardKey(cards[0]);return cards.find(c=>cardKey(c)===selectedCardKey)||cards[0]}

function timelineFor(s,card){
  if(!card)return [];
  const out=[];
  const acquired=card.purchaseDate||card.acquiredAt||card.createdAt||card.dateAdded||card.date;
  out.push({id:'owned',type:'vault',date:acquired||'',icon:'◆',title:'Entered the Vault',detail:`${cardQty(card)} tracked cop${cardQty(card)===1?'y':'ies'} • ${card.condition||card.grade||'condition not specified'}`,value:cardCost(card)>0?`Cost basis ${money(cardCost(card))}`:''});

  arr(s.ripSessions).forEach(r=>{
    const pulls=arr(r.pulls).length?arr(r.pulls):arr(r.cards);
    const matches=pulls.filter(p=>sameCard(card,p));
    if(matches.length)out.push({id:`rip-${r.id||r.uid||out.length}`,type:'rip',date:eventDate(r),icon:'✦',title:'Pulled in a Rip Session',detail:`${r.productName||r.product||r.name||'Opening session'}${r.packCount||r.packs?` • ${r.packCount||r.packs} packs`:''}`,value:`${matches.length} matching pull${matches.length===1?'':'s'}`});
  });

  arr(s.purchases).forEach(p=>{
    if(sameCard(card,p)||norm(p.item||p.product||p.name).includes(norm(cardName(card))))out.push({id:`buy-${p.id||p.uid||out.length}`,type:'buy',date:eventDate(p),icon:'＋',title:'Purchase logged',detail:p.store||p.retailer||p.source||'Purchase history',value:num(p.amount||p.total||p.price||p.cost)>0?money(p.amount||p.total||p.price||p.cost):''});
  });

  arr(s.grading).forEach(g=>{
    if(sameCard(card,g)||norm(g.cardName||g.name)===norm(cardName(card)))out.push({id:`grade-${g.id||g.uid||out.length}`,type:'grade',date:eventDate(g),icon:'◇',title:`Grading: ${g.status||'tracked'}`,detail:[g.grader,g.grade?`Grade ${g.grade}`:'',g.certNumber?`Cert ${g.certNumber}`:''].filter(Boolean).join(' • '),value:num(g.value||g.gradedValue)>0?`Ref ${money(g.value||g.gradedValue)}`:''});
  });

  arr(s.trades).forEach(t=>{
    const bag=[...arr(t.giveItems),...arr(t.receiveItems),...arr(t.items)];
    if(bag.some(x=>sameCard(card,x)||norm(cardName(x))===norm(cardName(card))))out.push({id:`trade-${t.id||t.uid||out.length}`,type:'trade',date:eventDate(t),icon:'⇄',title:`Trade ${t.status||'recorded'}`,detail:t.partner||t.notes||'Trade Lab activity',value:''});
  });

  arr(s.sales).forEach(x=>{
    if(sameCard(card,x)||norm(x.cardName||x.name||x.item)===norm(cardName(card)))out.push({id:`sale-${x.id||x.uid||out.length}`,type:'sale',date:eventDate(x),icon:'$',title:'Sale recorded',detail:x.marketplace||x.platform||'Sell Lab',value:num(x.net||x.netProceeds||x.salePrice||x.price)>0?`Net ${money(x.net||x.netProceeds||x.salePrice||x.price)}`:''});
  });

  arr(s.giveawayLocker).forEach(x=>{
    if(sameCard(card,x)||norm(x.cardName||x.name||x.item)===norm(cardName(card)))out.push({id:`give-${x.id||x.uid||out.length}`,type:'giveaway',date:eventDate(x),icon:'♥',title:`Giveaway: ${x.status||'reserved'}`,detail:x.notes||'Creator/community giveaway',value:''});
  });

  arr(s.contentQueue).forEach(x=>{
    const hay=norm(`${x.title||''} ${x.notes||''} ${x.description||''}`);
    if(hay&&hay.includes(norm(cardName(card))))out.push({id:`content-${x.id||x.uid||out.length}`,type:'content',date:eventDate(x),icon:'▶',title:`Creator content: ${x.status||'planned'}`,detail:x.title||'2GEN RIPS content queue',value:''});
  });

  const histories=s.cardPriceHistory||{};
  const possibleKeys=[card.id,card.uid,card.cardId,card.providerId,cardKey(card)].filter(Boolean).map(String);
  let hist=[];
  for(const k of possibleKeys){if(Array.isArray(histories[k])){hist=histories[k];break}}
  if(!hist.length){
    const found=Object.entries(histories).find(([k])=>norm(k).includes(norm(cardName(card))));
    if(found&&Array.isArray(found[1]))hist=found[1];
  }
  if(hist.length){
    const first=hist[0],last=hist[hist.length-1];
    out.push({id:'price-first',type:'market',date:first.date||first.at||'',icon:'↗',title:'Price history started',detail:'VaultSignal began tracking a market/reference snapshot.',value:money(first.market||first.value||first.price)});
    if(last!==first)out.push({id:'price-latest',type:'market',date:last.date||last.at||'',icon:'↗',title:'Latest tracked price snapshot',detail:'Most recent local market/reference point.',value:money(last.market||last.value||last.price)});
  }

  arr(s.journeyEngine?.manualEvents).filter(e=>e.cardKey===cardKey(card)).forEach(e=>out.push({...e,icon:e.icon||'•',type:e.type||'note'}));
  return out.sort(eventSort);
}

function journeyStats(s,card,events){
  const market=cardMarket(card),cost=cardCost(card),qty=cardQty(card);
  const ageDates=events.map(e=>dt(e.date)?.getTime()).filter(Boolean);
  const first=ageDates.length?Math.min(...ageDates):null;
  const days=first?Math.max(0,Math.floor((Date.now()-first)/86400000)):null;
  return {market,cost,qty,gain:market-cost,days,eventCount:events.length};
}
function journeyCompleteness(s,card,events){
  if(!card)return 0;
  let score=20;
  if(cardSet(card))score+=10;if(cardNumber(card))score+=10;if(cardCost(card)>0)score+=15;if(cardMarket(card)>0)score+=15;
  if(card.binder||card.location||card.storageLocation)score+=10;if(card.condition||card.grade)score+=10;if(events.length>=3)score+=10;
  return Math.min(100,score);
}

function addManualEvent(card){
  if(!card)return;
  const title=prompt('Journey milestone title (example: Moved to display case)');if(!title)return;
  const detail=prompt('Optional note')||'';
  const s=state();s.journeyEngine.manualEvents.unshift({id:uid('manual'),cardKey:cardKey(card),type:'note',date:isoNow(),icon:'•',title,detail,value:''});save(s);render();
}
function removeManualEvent(id){const s=state();s.journeyEngine.manualEvents=s.journeyEngine.manualEvents.filter(x=>x.id!==id);save(s);render()}

function shareText(title,text){
  if(navigator.share)return navigator.share({title,text}).catch(e=>{if(e?.name!=='AbortError')copyText(text)});
  return copyText(text);
}
async function copyText(text){try{await navigator.clipboard.writeText(text);toast('Copied')}catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast('Copied')}}
function toast(text){let t=$('#journeyToast');if(!t){t=document.createElement('div');t.id='journeyToast';t.className='je-toast';document.body.appendChild(t)}t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1600)}

function passportText(s,card,events){
  const st=journeyStats(s,card,events),complete=journeyCompleteness(s,card,events);
  const best=events.slice(0,5).map(e=>`• ${prettyDate(e.date)} — ${e.title}${e.value?` (${e.value})`:''}`).join('\n');
  return `VaultSignal Card Journey\n${cardName(card)} • ${cardSet(card)} ${cardNumber(card)}\nGame: ${cardGame(card)}\nCopies tracked: ${st.qty}\nCost basis: ${money(st.cost)}\nCurrent tracked reference: ${money(st.market)}\nJourney completeness: ${complete}%\n\nRecent story:\n${best||'No dated events yet.'}\n\n2GEN RIPS • Two Generations. One Collection.`;
}

function gradeReview(card){
  const raw=cardMarket(card);
  const fee=num($('#je-grade-fee')?.value||20);
  const shipping=num($('#je-grade-ship')?.value||10);
  const gradeRef=num($('#je-grade-ref')?.value||0);
  const totalCost=fee+shipping;
  const premium=gradeRef-raw-totalCost;
  const breakEven=raw+totalCost;
  return {raw,fee,shipping,gradeRef,totalCost,premium,breakEven};
}
function saveGradeReview(card){
  const g=gradeReview(card);if(!g.gradeRef){toast('Enter a graded reference value');return}
  const s=state();s.journeyEngine.gradeReviews.unshift({id:uid('gradeReview'),cardKey:cardKey(card),createdAt:isoNow(),...g});s.journeyEngine.gradeReviews=s.journeyEngine.gradeReviews.slice(0,50);save(s);render();toast('Review saved');
}

function topCards(s){return collectionCards(s).slice().sort((a,b)=>cardMarket(b)*cardQty(b)-cardMarket(a)*cardQty(a)).slice(0,8)}

function command(action){
  close();
  if(action==='creator'){window.VaultSignalCreatorCommand?.open?.('home');return}
  if(action==='content'){window.VaultSignalCreatorCommand?.open?.('content');return}
  if(action==='iq'){window.VaultSignalGrail?.open?.('brief');return}
  const map={hunt:'stock',market:'discover',vault:'vault',scan:'tools',rip:'tools',trade:'tools',sell:'tools'};
  document.querySelector(`.bottom-nav [data-tab="${map[action]||'home'}"]`)?.click();
  if(['scan','rip','trade','sell'].includes(action))setTimeout(()=>toast(`Open ${action==='scan'?'Smart Scanner':action==='rip'?'Rip Lab':action==='trade'?'Trade Lab':'Sell Lab'} from Tools`),120);
}

function journeyView(){
  const s=state(),cards=collectionCards(s),card=selectedCard(s);
  if(!cards.length)return `<div class="je-scroll"><section class="je-empty"><b>◇</b><h2>Your Card Journey starts with the Vault</h2><p>Add or scan your first card. Journey will then connect pulls, purchases, market snapshots, grading, trades, sales and creator moments around it.</p><button class="je-primary" data-command="scan">Open Scanner</button></section></div>`;
  const events=timelineFor(s,card),st=journeyStats(s,card,events),complete=journeyCompleteness(s,card,events);
  return `<div class="je-scroll">
    <section class="je-card-hero"><div><span class="je-kicker">CARD JOURNEY</span><h2>${esc(cardName(card))}</h2><p>${esc(cardSet(card))}${cardNumber(card)?` • ${esc(cardNumber(card))}`:''} • ${esc(cardGame(card))}</p></div><div class="je-complete"><b>${complete}%</b><span>story complete</span></div></section>
    <div class="je-selector"><select id="je-card-select">${cards.map(c=>`<option value="${esc(cardKey(c))}" ${cardKey(c)===cardKey(card)?'selected':''}>${esc(cardName(c))} — ${esc(cardSet(c)||cardGame(c))}</option>`).join('')}</select><button class="je-chip" id="je-share-passport">Share Passport</button></div>
    <div class="je-stat-grid"><div><span>Tracked ref</span><b>${money(st.market)}</b><small>${st.gain>=0?'+':''}${money(st.gain)} vs cost</small></div><div><span>Cost basis</span><b>${money(st.cost)}</b><small>${st.qty} cop${st.qty===1?'y':'ies'}</small></div><div><span>Journey events</span><b>${st.eventCount}</b><small>${st.days==null?'Age not recorded':`${st.days} days tracked`}</small></div><div><span>Storage</span><b>${esc(card.binder||card.location||card.storageLocation||'—')}</b><small>${esc(card.condition||card.grade||'Condition not set')}</small></div></div>
    <section class="je-panel"><div class="je-head"><div><span class="je-kicker">LIFE STORY</span><h3>From pull to forever</h3></div><button class="je-chip" id="je-add-event">+ Milestone</button></div><div class="je-timeline">${events.length?events.map(e=>`<div class="je-event"><i>${esc(e.icon||'•')}</i><div><span>${esc(prettyDate(e.date))} • ${esc(e.type||'event')}</span><b>${esc(e.title)}</b><p>${esc(e.detail||'')}</p></div><div class="je-event-value">${esc(e.value||'')}${e.id?.startsWith('manual-')?`<button data-remove-event="${esc(e.id)}">×</button>`:''}</div></div>`).join(''):'<p class="je-muted">No journey events yet.</p>'}</div></section>
    <section class="je-panel"><span class="je-kicker">QUICK CONNECT</span><h3>Continue this card's story</h3><div class="je-mini-grid"><button data-command="market">Refresh market</button><button data-tab-jump="grade">Grade review</button><button data-command="creator">Creator Command</button><button data-command="trade">Trade Lab</button><button data-command="sell">Sell Lab</button><button data-command="vault">Open Vault</button></div></section>
  </div>`;
}

function commandView(){return `<div class="je-scroll"><section class="je-command-hero"><span class="je-kicker">ONE-TAP COMMAND</span><h2>What are you doing right now?</h2><p>VaultSignal should get you from intent to action in one tap.</p></section><div class="je-command-grid">
  <button data-command="scan"><b>▣</b><span>Scan & Value</span><small>Identify a card and add it</small></button><button data-command="hunt"><b>◎</b><span>Find Stock</span><small>Inventory Radar + watches</small></button><button data-command="rip"><b>✦</b><span>Start a Rip</span><small>Log packs and pulls</small></button><button data-command="vault"><b>◇</b><span>My Vault</span><small>Cards + sealed products</small></button><button data-command="market"><b>↗</b><span>Search Market</span><small>Universal card search</small></button><button data-command="trade"><b>⇄</b><span>Trade Lab</span><small>Build and compare a deal</small></button><button data-command="sell"><b>$</b><span>Sell Lab</span><small>Fees, net and profit</small></button><button data-command="creator"><b>▶</b><span>Creator</span><small>Pack Battles + content</small></button><button data-command="iq"><b>IQ</b><span>Grail IQ</span><small>Next best move</small></button><button data-tab-jump="journey"><b>∞</b><span>Card Journey</span><small>Follow a card's whole story</small></button>
</div></div>`}

function gradeView(){
  const s=state(),card=selectedCard(s);
  if(!card)return `<div class="je-scroll"><section class="je-empty"><h2>Add a card first</h2><button class="je-primary" data-command="scan">Open Scanner</button></section></div>`;
  const recent=arr(s.journeyEngine.gradeReviews).filter(x=>x.cardKey===cardKey(card))[0];
  return `<div class="je-scroll"><section class="je-card-hero"><div><span class="je-kicker">GRADING REVIEW</span><h2>${esc(cardName(card))}</h2><p>Decision math only — not a predicted professional grade.</p></div><b>${money(cardMarket(card))}</b></section>
  <section class="je-panel"><div class="je-form"><label>Raw/current tracked reference<input value="${cardMarket(card).toFixed(2)}" disabled></label><label>Graded reference value<input id="je-grade-ref" type="number" step="0.01" inputmode="decimal" value="${recent?.gradeRef||''}" placeholder="Example: 150"></label><div class="je-two"><label>Grading fee<input id="je-grade-fee" type="number" step="0.01" inputmode="decimal" value="${recent?.fee??20}"></label><label>Shipping/insurance<input id="je-grade-ship" type="number" step="0.01" inputmode="decimal" value="${recent?.shipping??10}"></label></div><button class="je-primary" id="je-calc-grade">Calculate review</button></div><div id="je-grade-result"></div></section>
  <section class="je-panel je-note"><b>What this means</b><p>This compares a raw reference with a graded reference after your estimated fees. It does not inspect centering, corners, edges, surface, authenticity or predict PSA/CGC/BGS outcomes.</p></section></div>`;
}
function renderGradeResult(card){const g=gradeReview(card);const verdict=g.gradeRef<=0?'Enter a graded reference value':g.premium>0?'Positive reference spread':'Reference spread does not cover entered costs';$('#je-grade-result').innerHTML=`<div class="je-grade-result"><span>${esc(verdict)}</span><div><b>${money(g.breakEven)}</b><small>break-even graded reference</small></div><div><b>${g.premium>=0?'+':''}${money(g.premium)}</b><small>spread after entered costs</small></div><button class="je-chip" id="je-save-grade">Save review</button></div>`;$('#je-save-grade')?.addEventListener('click',()=>saveGradeReview(card))}

function storyView(){
  const s=state(),card=selectedCard(s),events=timelineFor(s,card);
  if(!card)return `<div class="je-scroll"><section class="je-empty"><h2>No card selected</h2></section></div>`;
  const text=passportText(s,card,events);
  return `<div class="je-scroll"><section class="je-command-hero"><span class="je-kicker">STORY STUDIO</span><h2>Turn the collection into memories.</h2><p>Card Journey gives 2GEN RIPS a story beyond price: where a card came from, who pulled it, what happened next, and why it matters.</p></section><section class="je-panel"><div class="je-head"><div><span class="je-kicker">CARD PASSPORT</span><h3>${esc(cardName(card))}</h3></div></div><div class="je-story-text">${esc(text).replace(/\n/g,'<br>')}</div><div class="je-actions"><button class="je-primary" id="je-story-share">Share</button><button class="je-secondary" id="je-story-copy">Copy</button></div></section><section class="je-panel"><span class="je-kicker">FUTURE CLOUD PASSPORT</span><h3>Public card-story links</h3><p>v15 keeps this private/local. The data shape is now ready for a future opt-in public share page when account/cloud sync is connected.</p></section></div>`;
}

function tabButton(id,label){return `<button data-je-tab="${id}" class="${activeTab===id?'active':''}">${label}</button>`}
function render(){
  const root=$('#journeyEnginePanel');if(!root)return;
  const views={journey:journeyView,command:commandView,grade:gradeView,story:storyView};
  root.innerHTML=`<div class="je-shell"><header class="je-top"><div class="je-brand"><div class="je-mark">∞</div><div><strong>Card Journey</strong><span>VaultSignal v15 • by 2GEN RIPS</span></div></div><button class="je-close" id="je-close">×</button></header><nav class="je-tabs">${tabButton('journey','Journey')}${tabButton('command','Command')}${tabButton('grade','Grade Review')}${tabButton('story','Story')}</nav>${(views[activeTab]||journeyView)()}</div>`;
  bind();
}
function bind(){
  $('#je-close')?.addEventListener('click',close);
  $$('[data-je-tab]').forEach(b=>b.addEventListener('click',()=>{activeTab=b.dataset.jeTab;render()}));
  $$('[data-tab-jump]').forEach(b=>b.addEventListener('click',()=>{activeTab=b.dataset.tabJump;render()}));
  $$('[data-command]').forEach(b=>b.addEventListener('click',()=>command(b.dataset.command)));
  $('#je-card-select')?.addEventListener('change',e=>{selectedCardKey=e.target.value;render()});
  $('#je-add-event')?.addEventListener('click',()=>addManualEvent(selectedCard(state())));
  $$('[data-remove-event]').forEach(b=>b.addEventListener('click',()=>removeManualEvent(b.dataset.removeEvent)));
  $('#je-share-passport')?.addEventListener('click',()=>{const s=state(),c=selectedCard(s);shareText(`${cardName(c)} Card Journey`,passportText(s,c,timelineFor(s,c)))});
  $('#je-calc-grade')?.addEventListener('click',()=>renderGradeResult(selectedCard(state())));
  $('#je-story-share')?.addEventListener('click',()=>{const s=state(),c=selectedCard(s);shareText(`${cardName(c)} Card Journey`,passportText(s,c,timelineFor(s,c)))});
  $('#je-story-copy')?.addEventListener('click',()=>{const s=state(),c=selectedCard(s);copyText(passportText(s,c,timelineFor(s,c)))});
}
function open(tab='journey',card=null){activeTab=tab;if(card)selectedCardKey=typeof card==='string'?card:cardKey(card);let root=$('#journeyEnginePanel');if(!root){root=document.createElement('div');root.id='journeyEnginePanel';root.className='je-overlay';document.body.appendChild(root)}root.classList.add('open');document.body.classList.add('je-open');render()}
function close(){$('#journeyEnginePanel')?.classList.remove('open');document.body.classList.remove('je-open')}

function inject(){
  if(!$('#journeyQuickButton')){const b=document.createElement('button');b.id='journeyQuickButton';b.className='je-fab';b.innerHTML='<b>∞</b><span>Journey</span>';b.addEventListener('click',()=>open('journey'));document.body.appendChild(b)}
  const top=$('.topbar');if(top&&!$('#journeyTopButton')){const b=document.createElement('button');b.id='journeyTopButton';b.className='je-top-entry';b.textContent='JOURNEY';b.addEventListener('click',()=>open('journey'));top.appendChild(b)}
  const home=$('#home');if(home&&!$('#journeyHomeCard')&&collectionCards(state()).length){const c=topCards(state())[0];const box=document.createElement('div');box.id='journeyHomeCard';box.className='je-home-card';box.innerHTML=`<div><span>CARD JOURNEY</span><b>${esc(cardName(c))}</b><small>${esc(cardSet(c)||cardGame(c))} • Follow the full story</small></div><button>OPEN</button>`;box.querySelector('button').addEventListener('click',()=>open('journey',c));home.prepend(box)}
}
function init(){const s=state();save(s);inject();window.VaultSignalJourney={open,close,version:'15.0.0',cardKey};const observer=new MutationObserver(()=>inject());observer.observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,80));else setTimeout(init,80);
})();
