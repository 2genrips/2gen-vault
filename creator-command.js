(() => {
'use strict';

const STORAGE_KEY='2gen-vault-collector-os-v4';
const SOCIALS={
  YouTube:'https://youtube.com/@2genrips',
  Facebook:'https://www.facebook.com/profile.php?id=61593461375835',
  TikTok:'https://www.tiktok.com/@2genrips'
};
const RARITY_POINTS={
  common:2,uncommon:4,rare:8,'double rare':12,'ultra rare':18,
  'illustration rare':24,'special illustration rare':35,'hyper rare':40,
  enchanted:45,parallel:30,mythic:20,secret:35,promo:10
};
let activeView='home';
let activeBattleId=null;

function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
function money(v){const n=Number(v||0);return Number.isFinite(n)?`$${n.toFixed(2)}`:'$0.00'}
function num(v){const n=Number(v||0);return Number.isFinite(n)?n:0}
function uid(prefix='id'){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}
function readState(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{return {}}
}
function writeState(state){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function ensureCreator(state){
  state.creatorCommand=state.creatorCommand||{};
  state.creatorCommand.version=13;
  state.creatorCommand.battles=Array.isArray(state.creatorCommand.battles)?state.creatorCommand.battles:[];
  state.creatorCommand.defaultDad=state.creatorCommand.defaultDad||'Dad';
  state.creatorCommand.defaultSon=state.creatorCommand.defaultSon||'Son';
  state.creatorCommand.contentHistory=Array.isArray(state.creatorCommand.contentHistory)?state.creatorCommand.contentHistory:[];
  state.creatorCommand.creatorGoals=state.creatorCommand.creatorGoals||{youtube:1000,tiktok:1000,facebook:5000};
  return state;
}
function getState(){return ensureCreator(readState())}
function saveState(state){writeState(ensureCreator(state))}

function rarityBonus(rarity=''){
  const r=String(rarity).toLowerCase();
  const exact=RARITY_POINTS[r];
  if(exact!=null)return exact;
  const hit=Object.entries(RARITY_POINTS).find(([k])=>r.includes(k));
  return hit?hit[1]:5;
}
function pullScore(p){return Math.max(1,Math.round(num(p.value)*10+rarityBonus(p.rarity)))}
function sideTotals(side){
  const pulls=Array.isArray(side?.pulls)?side.pulls:[];
  return {
    pulls:pulls.length,
    value:pulls.reduce((a,p)=>a+num(p.value),0),
    score:pulls.reduce((a,p)=>a+pullScore(p),0),
    best:pulls.slice().sort((a,b)=>num(b.value)-num(a.value))[0]||null
  };
}
function battleResult(b){
  const a=sideTotals(b.left),c=sideTotals(b.right);
  let winner='Tie';
  if(a.score>c.score)winner=b.left.name;
  if(c.score>a.score)winner=b.right.name;
  return {a,c,winner,totalValue:a.value+c.value,totalPulls:a.pulls+c.pulls};
}
function allBattles(){return getState().creatorCommand.battles}
function currentBattle(){
  const list=allBattles();
  return list.find(b=>b.id===activeBattleId)||list[0]||null;
}
function recentCompletedBattles(limit=6){return allBattles().filter(b=>b.status==='finished').sort((a,b)=>String(b.finishedAt||b.createdAt).localeCompare(String(a.finishedAt||a.createdAt))).slice(0,limit)}

function collectionMetrics(state){
  const cards=Array.isArray(state.collection)?state.collection:[];
  const sealed=Array.isArray(state.sealed)?state.sealed:[];
  const cardQty=cards.reduce((a,x)=>a+Math.max(1,num(x.quantity||1)),0);
  const sealedQty=sealed.reduce((a,x)=>a+Math.max(1,num(x.quantity||1)),0);
  const cardValue=cards.reduce((a,x)=>a+Math.max(1,num(x.quantity||1))*num(x.market||x.marketValue||x.value),0);
  const sealedValue=sealed.reduce((a,x)=>a+Math.max(1,num(x.quantity||1))*num(x.valueEach||x.market||x.value),0);
  return {cardQty,sealedQty,totalValue:cardValue+sealedValue,totalItems:cardQty+sealedQty};
}
function profileStats(state){
  const profiles=Array.isArray(state.collectorProfiles)?state.collectorProfiles:[];
  const cards=Array.isArray(state.collection)?state.collection:[];
  const sealed=Array.isArray(state.sealed)?state.sealed:[];
  if(!profiles.length)return [];
  return profiles.map(p=>{
    const ids=[p.uid,p.id,p.name].filter(Boolean).map(String);
    const owns=x=>ids.includes(String(x.collectorId||x.ownerId||x.profileId||x.owner||''));
    const pc=cards.filter(owns),ps=sealed.filter(owns);
    const value=pc.reduce((a,x)=>a+Math.max(1,num(x.quantity||1))*num(x.market||x.marketValue||x.value),0)+ps.reduce((a,x)=>a+Math.max(1,num(x.quantity||1))*num(x.valueEach||x.market||x.value),0);
    return {name:p.name||'Collector',cards:pc.reduce((a,x)=>a+Math.max(1,num(x.quantity||1)),0),sealed:ps.reduce((a,x)=>a+Math.max(1,num(x.quantity||1)),0),value};
  });
}
function normalizePull(p){return {name:p?.name||p?.cardName||p?.title||'Card',value:num(p?.market||p?.marketValue||p?.value||p?.price),rarity:p?.rarity||'',set:p?.set||p?.setName||''}}
function normalizeRip(s){
  if(!s)return null;
  const pulls=(Array.isArray(s.pulls)?s.pulls:Array.isArray(s.cards)?s.cards:[]).map(normalizePull);
  const cost=num(s.cost||s.openingCost||s.totalCost||s.purchaseCost);
  const value=pulls.reduce((a,p)=>a+p.value,0);
  const product=s.productName||s.product||s.name||s.title||'TCG opening';
  const game=s.game||s.tcg||'TCG';
  const packCount=num(s.packCount||s.packs||s.numberOfPacks||0);
  return {id:s.id||s.uid||'',product,game,pulls,cost,value,packCount,date:s.finishedAt||s.createdAt||s.date||'',best:pulls.slice().sort((a,b)=>b.value-a.value)[0]||null};
}
function latestRip(state){
  const list=(Array.isArray(state.ripSessions)?state.ripSessions:[]).map(normalizeRip).filter(Boolean);
  return list.sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0]||null;
}
function ripSummary(r){
  if(!r)return null;
  const roi=r.cost>0?((r.value-r.cost)/r.cost)*100:null;
  const hits=r.pulls.filter(p=>p.value>=5||rarityBonus(p.rarity)>=18).length;
  return {...r,roi,hits};
}
function contentFromRip(r){
  const s=ripSummary(r);
  if(!s)return null;
  const best=s.best?.name||'our best pull';
  const game=s.game||'TCG';
  const packPhrase=s.packCount?`${s.packCount}-pack`:'pack';
  const outcome=s.roi==null?'':s.roi>=0?`We finished ${s.roi.toFixed(0)}% over our opening cost.`:`The cards came in ${Math.abs(s.roi).toFixed(0)}% under our opening cost — but the chase was worth it.`;
  const title=`${best}?! Dad & Son ${game} ${packPhrase} Opening 🔥 | 2GEN RIPS`;
  const short=`Dad & son rip time 🔥 We opened ${s.product} and our best pull was ${best}. ${s.pulls.length} cards logged • ${money(s.value)} tracked pull value. Sleeve it and leave it!`;
  const description=`Two generations. One collection. Today we opened ${s.product}${s.packCount?` (${s.packCount} packs)`:''}.\n\nBest pull: ${best}\nOpening cost: ${money(s.cost)}\nTracked pull value: ${money(s.value)}\nHits: ${s.hits}\n${outcome}\n\nValues are market references only and can change by condition, printing, language and marketplace.\n\nFollow 2GEN RIPS for more father-and-son TCG openings.`;
  const tags=`#2GENRIPS #${String(game).replace(/[^a-z0-9]/gi,'')} #TCG #CardOpening #PackOpening #TradingCards #DadAndSon #SleeveItAndLeaveIt`;
  return {title,short,description,tags};
}

function toast(text){
  let t=document.getElementById('cc-toast');
  if(!t){t=document.createElement('div');t.id='cc-toast';t.className='cc-toast';document.body.appendChild(t)}
  t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800);
}
async function copyText(text){
  try{await navigator.clipboard.writeText(text);toast('Copied')}
  catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast('Copied')}
}
async function shareText(title,text){
  if(navigator.share){try{await navigator.share({title,text});return}catch(e){if(e?.name==='AbortError')return}}
  await copyText(text);
}
function openMainTab(tab){
  closeCreator();
  const b=document.querySelector(`.bottom-nav [data-tab="${tab}"]`);
  if(b)b.click();
}

function createBattle(){
  const state=getState();
  const b={
    id:uid('battle'),createdAt:new Date().toISOString(),finishedAt:null,status:'active',game:'Pokemon',
    title:'Dad vs Son Pack Battle',
    left:{name:state.creatorCommand.defaultDad||'Dad',pulls:[]},
    right:{name:state.creatorCommand.defaultSon||'Son',pulls:[]}
  };
  state.creatorCommand.battles.unshift(b);activeBattleId=b.id;saveState(state);activeView='battle';render();
}
function updateBattleField(id,path,value){
  const state=getState(),b=state.creatorCommand.battles.find(x=>x.id===id);if(!b)return;
  if(path==='game')b.game=value;
  if(path==='title')b.title=value;
  if(path==='left.name')b.left.name=value;
  if(path==='right.name')b.right.name=value;
  saveState(state);
}
function addPull(id,side){
  const name=document.getElementById(`cc-${side}-name`)?.value?.trim();
  const value=num(document.getElementById(`cc-${side}-value`)?.value);
  const rarity=document.getElementById(`cc-${side}-rarity`)?.value?.trim()||'';
  if(!name){toast('Enter the card name');return}
  const state=getState(),b=state.creatorCommand.battles.find(x=>x.id===id);if(!b)return;
  b[side].pulls.push({id:uid('pull'),name,value,rarity,addedAt:new Date().toISOString()});
  saveState(state);render();
  setTimeout(()=>document.getElementById(`cc-${side}-name`)?.focus(),0);
}
function removePull(id,side,pullId){
  const state=getState(),b=state.creatorCommand.battles.find(x=>x.id===id);if(!b)return;
  b[side].pulls=b[side].pulls.filter(p=>p.id!==pullId);saveState(state);render();
}
function finishBattle(id){
  const state=getState(),b=state.creatorCommand.battles.find(x=>x.id===id);if(!b)return;
  if(!b.left.pulls.length&&!b.right.pulls.length){toast('Add at least one pull first');return}
  b.status='finished';b.finishedAt=new Date().toISOString();saveState(state);render();
}
function reopenBattle(id){const s=getState(),b=s.creatorCommand.battles.find(x=>x.id===id);if(!b)return;b.status='active';b.finishedAt=null;saveState(s);render()}
function deleteBattle(id){const s=getState();s.creatorCommand.battles=s.creatorCommand.battles.filter(x=>x.id!==id);saveState(s);activeBattleId=null;activeView='home';render()}
function battleShareText(b){
  const r=battleResult(b),winner=r.winner==='Tie'?'It ended in a tie!':`${r.winner} wins!`;
  return `2GEN RIPS • ${b.title}\n${b.left.name}: ${r.a.score} pts • ${money(r.a.value)}\n${b.right.name}: ${r.c.score} pts • ${money(r.c.value)}\n${winner}\nBest pulls: ${r.a.best?.name||'—'} vs ${r.c.best?.name||'—'}\n\nFun score only — no wagering. #2GENRIPS #PackBattle #TCG`;
}
function importLatestRipToBattle(id){
  const state=getState(),rip=latestRip(state),b=state.creatorCommand.battles.find(x=>x.id===id);if(!b||!rip){toast('No rip session found');return}
  const side=confirm(`Import the latest rip (${rip.product}) to ${b.left.name}? Press Cancel to import to ${b.right.name}.`)?'left':'right';
  rip.pulls.forEach(p=>b[side].pulls.push({id:uid('pull'),name:p.name,value:p.value,rarity:p.rarity,addedAt:new Date().toISOString()}));
  saveState(state);render();toast(`Imported ${rip.pulls.length} pulls`);
}
function saveContentHistory(kind,text){
  const state=getState();
  state.creatorCommand.contentHistory.unshift({id:uid('content'),kind,text,createdAt:new Date().toISOString()});
  state.creatorCommand.contentHistory=state.creatorCommand.contentHistory.slice(0,30);saveState(state);
}

function homeView(){
  const state=getState(),m=collectionMetrics(state),rip=ripSummary(latestRip(state)),battles=recentCompletedBattles(),profiles=profileStats(state);
  return `<div class="cc-scroll">
    <section class="cc-hero">
      <div><span class="cc-kicker">2GEN RIPS • CREATOR COMMAND</span><h2>The creator side of your collector OS.</h2><p>Turn the cards you hunt, scan and open into battles, family stats and publish-ready content without leaving VaultSignal.</p></div>
      <button class="cc-primary" data-action="new-battle">+ Start Pack Battle</button>
    </section>
    <div class="cc-stat-grid">
      <div><span>Vault items</span><b>${m.totalItems}</b><small>${m.cardQty} cards • ${m.sealedQty} sealed</small></div>
      <div><span>Tracked value</span><b>${money(m.totalValue)}</b><small>Reference value in VaultSignal</small></div>
      <div><span>Pack battles</span><b>${state.creatorCommand.battles.length}</b><small>${battles.length} recently completed</small></div>
      <div><span>Latest rip</span><b>${rip?money(rip.value):'—'}</b><small>${rip?esc(rip.product):'Finish a Rip Session to populate this'}</small></div>
    </div>
    <div class="cc-command-grid">
      <button data-view="battle"><b>⚔</b><span>Pack Battle</span><small>Dad vs Son live scoring</small></button>
      <button data-view="content"><b>🎬</b><span>Content Engine</span><small>Titles, captions, descriptions</small></button>
      <button data-view="family"><b>👨‍👦</b><span>Family Board</span><small>Collection + battle scoreboard</small></button>
      <button data-view="social"><b>📣</b><span>2GEN Hub</span><small>YouTube • TikTok • Facebook</small></button>
      <button data-main-tab="stock"><b>◎</b><span>Find Stock</span><small>Jump to Inventory Command</small></button>
      <button data-main-tab="discover"><b>⌕</b><span>Search Market</span><small>Jump to Universal Search</small></button>
      <button data-main-tab="vault"><b>▣</b><span>My Vault</span><small>Cards + sealed inventory</small></button>
      <button data-main-tab="tools"><b>✦</b><span>All Tools</span><small>Trade, sell, market + more</small></button>
    </div>
    ${rip?`<section class="cc-panel"><div class="cc-head"><div><span class="cc-kicker">LATEST RIP</span><h3>${esc(rip.product)}</h3></div><button class="cc-chip" data-view="content">Create Post</button></div><div class="cc-rip-row"><span>${rip.packCount||'—'} packs</span><span>${rip.pulls.length} pulls</span><span>${money(rip.cost)} cost</span><span>${money(rip.value)} value</span><span>${rip.roi==null?'ROI —':`${rip.roi>=0?'+':''}${rip.roi.toFixed(0)}% ROI`}</span></div></section>`:''}
    ${profiles.length?`<section class="cc-panel"><div class="cc-head"><div><span class="cc-kicker">FAMILY VAULT</span><h3>Who owns what</h3></div><button class="cc-chip" data-view="family">Open board</button></div><div class="cc-profile-strip">${profiles.slice(0,4).map(p=>`<div><b>${esc(p.name)}</b><span>${p.cards} cards • ${p.sealed} sealed</span><strong>${money(p.value)}</strong></div>`).join('')}</div></section>`:''}
    ${battles.length?`<section class="cc-panel"><div class="cc-head"><div><span class="cc-kicker">RECENT BATTLES</span><h3>2GEN scoreboard</h3></div></div>${battles.map(b=>{const r=battleResult(b);return `<button class="cc-battle-row" data-battle="${b.id}"><span>${esc(b.title)}</span><b>${esc(r.winner)}</b><small>${r.a.score} – ${r.c.score}</small></button>`}).join('')}</section>`:''}
  </div>`;
}
function battleSide(b,side){
  const s=b[side],t=sideTotals(s);
  return `<div class="cc-side">
    <div class="cc-side-head"><input value="${esc(s.name)}" data-battle-field="${side}.name" data-battle-id="${b.id}" aria-label="Player name"><b>${t.score} pts</b><small>${money(t.value)}</small></div>
    <div class="cc-add-pull"><input id="cc-${side}-name" placeholder="Card name"><input id="cc-${side}-value" type="number" step="0.01" inputmode="decimal" placeholder="$ value"><input id="cc-${side}-rarity" placeholder="Rarity"><button data-add-pull="${side}" data-battle-id="${b.id}">ADD</button></div>
    <div class="cc-pulls">${s.pulls.length?s.pulls.slice().reverse().map(p=>`<div><span><b>${esc(p.name)}</b><small>${esc(p.rarity||'Card')} • ${money(p.value)}</small></span><strong>${pullScore(p)} pts</strong><button data-remove-pull="${p.id}" data-side="${side}" data-battle-id="${b.id}" aria-label="Remove">×</button></div>`).join(''):'<p class="cc-empty">No pulls yet.</p>'}</div>
  </div>`;
}
function battleView(){
  const b=currentBattle();
  if(!b)return `<div class="cc-scroll"><section class="cc-empty-state"><b>⚔</b><h2>Start your first Pack Battle</h2><p>Dad and Son score pulls using tracked value plus a transparent rarity bonus. It is a fun creator score — never a betting or investment score.</p><button class="cc-primary" data-action="new-battle">Start Dad vs Son Battle</button></section></div>`;
  const r=battleResult(b);
  return `<div class="cc-scroll"><div class="cc-page-head"><button class="cc-back" data-view="home">←</button><div><span class="cc-kicker">2GEN PACK BATTLE</span><h2>${esc(b.title)}</h2></div><button class="cc-chip" data-action="new-battle">New</button></div>
    <section class="cc-battle-banner ${b.status==='finished'?'finished':''}"><div><span>${esc(b.game)}</span><b>${b.status==='finished'?(r.winner==='Tie'?'TIE GAME':`${esc(r.winner)} WINS`):'BATTLE LIVE'}</b><small>${r.totalPulls} pulls • ${money(r.totalValue)} combined value</small></div><div class="cc-score"><b>${r.a.score}</b><span>VS</span><b>${r.c.score}</b></div></section>
    <section class="cc-battle-settings"><input value="${esc(b.title)}" data-battle-field="title" data-battle-id="${b.id}"><select data-battle-field="game" data-battle-id="${b.id}">${['Pokemon','Lorcana','Magic','Yu-Gi-Oh!','One Piece','Sports','Other'].map(g=>`<option ${g===b.game?'selected':''}>${g}</option>`).join('')}</select><button class="cc-chip" data-import-rip="${b.id}">Import latest rip</button></section>
    <div class="cc-versus-grid">${battleSide(b,'left')}${battleSide(b,'right')}</div>
    <section class="cc-panel cc-score-explain"><b>How the fun score works</b><span>Each pull earns roughly 10 points per $1 of tracked reference value, plus a small rarity bonus. The formula is transparent and has no wagering or investment meaning.</span></section>
    <div class="cc-action-bar">${b.status==='finished'?`<button class="cc-primary" data-share-battle="${b.id}">Share Result</button><button class="cc-secondary" data-reopen-battle="${b.id}">Reopen</button>`:`<button class="cc-primary" data-finish-battle="${b.id}">Finish Battle</button><button class="cc-secondary" data-share-battle="${b.id}">Share Live Score</button>`}<button class="cc-danger" data-delete-battle="${b.id}">Delete</button></div>
  </div>`;
}
function contentCard(label,text,kind){return `<div class="cc-copy-card"><span>${label}</span><div>${esc(text).replace(/\n/g,'<br>')}</div><button data-copy-kind="${kind}">Copy</button></div>`}
function contentView(){
  const state=getState(),rip=ripSummary(latestRip(state)),c=contentFromRip(rip);
  return `<div class="cc-scroll"><div class="cc-page-head"><button class="cc-back" data-view="home">←</button><div><span class="cc-kicker">2GEN CONTENT ENGINE</span><h2>Turn an opening into a post.</h2></div></div>
    ${!rip?`<section class="cc-empty-state"><b>🎬</b><h2>No completed rip found</h2><p>Use VaultSignal Rip Lab to log an opening. Creator Command will automatically turn the newest session into titles, captions and descriptions.</p><button class="cc-primary" data-main-tab="tools">Open Collector Tools</button></section>`:`
    <section class="cc-panel"><div class="cc-head"><div><span class="cc-kicker">SOURCE SESSION</span><h3>${esc(rip.product)}</h3></div><span class="cc-live-pill">${esc(rip.game)}</span></div><div class="cc-rip-row"><span>${rip.packCount||'—'} packs</span><span>${rip.pulls.length} pulls</span><span>${rip.hits} hits</span><span>${money(rip.cost)} cost</span><span>${money(rip.value)} pull value</span></div>${rip.best?`<div class="cc-best-pull"><span>Best pull</span><b>${esc(rip.best.name)}</b><strong>${money(rip.best.value)}</strong></div>`:''}</section>
    <div class="cc-copy-grid">${contentCard('YouTube title',c.title,'title')}${contentCard('TikTok / Facebook short caption',c.short,'short')}${contentCard('YouTube / Facebook description',c.description,'description')}${contentCard('Hashtags',c.tags,'tags')}</div>
    <div class="cc-action-bar"><button class="cc-primary" data-share-content="1">Share caption</button><button class="cc-secondary" data-copy-all="1">Copy full post kit</button></div>`}
  </div>`;
}
function familyView(){
  const state=getState(),profiles=profileStats(state),finished=allBattles().filter(b=>b.status==='finished');
  const wins={};finished.forEach(b=>{const w=battleResult(b).winner;if(w!=='Tie')wins[w]=(wins[w]||0)+1});
  const leaderboard=Object.entries(wins).sort((a,b)=>b[1]-a[1]);
  return `<div class="cc-scroll"><div class="cc-page-head"><button class="cc-back" data-view="home">←</button><div><span class="cc-kicker">2GEN FAMILY BOARD</span><h2>Two generations. One collection.</h2></div></div>
    <div class="cc-family-grid">${profiles.length?profiles.map(p=>`<article><span>COLLECTOR</span><h3>${esc(p.name)}</h3><b>${money(p.value)}</b><p>${p.cards} cards • ${p.sealed} sealed</p></article>`).join(''):`<article><span>FAMILY MODE</span><h3>Household</h3><p>Create Dad / Son collector profiles in the Family + Creator Hub to separate ownership while keeping one household Vault.</p></article>`}</div>
    <section class="cc-panel"><div class="cc-head"><div><span class="cc-kicker">PACK BATTLE LEADERBOARD</span><h3>${finished.length} completed battles</h3></div><button class="cc-chip" data-view="battle">Battle now</button></div>${leaderboard.length?leaderboard.map(([name,w],i)=>`<div class="cc-leader-row"><b>#${i+1}</b><span>${esc(name)}</span><strong>${w} win${w===1?'':'s'}</strong></div>`).join(''):'<p class="cc-empty">Finish a Pack Battle to start the family leaderboard.</p>'}</section>
    <section class="cc-panel"><div class="cc-head"><div><span class="cc-kicker">FAMILY WORKFLOW</span><h3>Keep the hobby organized</h3></div></div><div class="cc-mini-grid"><button data-main-tab="vault">Open Family Vault</button><button data-main-tab="tools">Family + Creator Hub</button><button data-view="content">Create content</button><button data-view="battle">Pack Battle</button></div></section>
  </div>`;
}
function socialView(){
  return `<div class="cc-scroll"><div class="cc-page-head"><button class="cc-back" data-view="home">←</button><div><span class="cc-kicker">2GEN RIPS HUB</span><h2>Your creator launchpad.</h2></div></div>
    <section class="cc-social-hero"><div class="cc-round-logo">2G</div><div><h3>2GEN RIPS</h3><p>Dad + son TCG openings • Sleeve it and leave it.</p></div></section>
    <div class="cc-social-grid">${Object.entries(SOCIALS).map(([name,url])=>`<a href="${url}" target="_blank" rel="noopener"><b>${name==='YouTube'?'▶':name==='TikTok'?'♪':'f'}</b><span>${name}</span><small>Open 2GEN RIPS</small></a>`).join('')}</div>
    <section class="cc-panel"><span class="cc-kicker">CREATOR LOOP</span><h3>Hunt → Rip → Scan → Publish</h3><p>VaultSignal already tracks the product, cards and values. Creator Command turns that same activity into content instead of making you retype everything into another app.</p><div class="cc-mini-grid"><button data-main-tab="stock">1. Hunt product</button><button data-main-tab="tools">2. Log Rip Session</button><button data-view="content">3. Generate post kit</button><button data-view="battle">4. Run Pack Battle</button></div></section>
  </div>`;
}
function render(){
  const shell=document.getElementById('creatorCommandPanel');if(!shell)return;
  const views={home:homeView,battle:battleView,content:contentView,family:familyView,social:socialView};
  shell.innerHTML=`<div class="cc-sheet"><header class="cc-top"><div><div class="cc-logo">VS</div><div><strong>Creator Command</strong><span>VaultSignal • by 2GEN RIPS</span></div></div><button id="creatorClose" aria-label="Close">×</button></header>${(views[activeView]||homeView)()}</div>`;
  bind();
}
function bind(){
  const shell=document.getElementById('creatorCommandPanel');if(!shell)return;
  shell.querySelector('#creatorClose')?.addEventListener('click',closeCreator);
  shell.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{activeView=b.dataset.view;render()}));
  shell.querySelectorAll('[data-main-tab]').forEach(b=>b.addEventListener('click',()=>openMainTab(b.dataset.mainTab)));
  shell.querySelector('[data-action="new-battle"]')?.addEventListener('click',createBattle);
  shell.querySelectorAll('[data-battle]').forEach(b=>b.addEventListener('click',()=>{activeBattleId=b.dataset.battle;activeView='battle';render()}));
  shell.querySelectorAll('[data-battle-field]').forEach(el=>el.addEventListener('change',()=>updateBattleField(el.dataset.battleId,el.dataset.battleField,el.value)));
  shell.querySelectorAll('[data-add-pull]').forEach(b=>b.addEventListener('click',()=>addPull(b.dataset.battleId,b.dataset.addPull)));
  shell.querySelectorAll('[data-remove-pull]').forEach(b=>b.addEventListener('click',()=>removePull(b.dataset.battleId,b.dataset.side,b.dataset.removePull)));
  shell.querySelectorAll('[data-finish-battle]').forEach(b=>b.addEventListener('click',()=>finishBattle(b.dataset.finishBattle)));
  shell.querySelectorAll('[data-reopen-battle]').forEach(b=>b.addEventListener('click',()=>reopenBattle(b.dataset.reopenBattle)));
  shell.querySelectorAll('[data-delete-battle]').forEach(b=>b.addEventListener('click',()=>{if(confirm('Delete this Pack Battle?'))deleteBattle(b.dataset.deleteBattle)}));
  shell.querySelectorAll('[data-share-battle]').forEach(btn=>btn.addEventListener('click',()=>{const b=allBattles().find(x=>x.id===btn.dataset.shareBattle);if(b)shareText('2GEN RIPS Pack Battle',battleShareText(b))}));
  shell.querySelectorAll('[data-import-rip]').forEach(btn=>btn.addEventListener('click',()=>importLatestRipToBattle(btn.dataset.importRip)));
  const rip=ripSummary(latestRip(getState())),content=contentFromRip(rip);
  shell.querySelectorAll('[data-copy-kind]').forEach(btn=>btn.addEventListener('click',()=>{const text=content?.[btn.dataset.copyKind]||'';saveContentHistory(btn.dataset.copyKind,text);copyText(text)}));
  shell.querySelector('[data-share-content]')?.addEventListener('click',()=>content&&shareText(content.title,`${content.short}\n\n${content.tags}`));
  shell.querySelector('[data-copy-all]')?.addEventListener('click',()=>content&&copyText(`${content.title}\n\n${content.short}\n\n${content.description}\n\n${content.tags}`));
}
function openCreator(view='home'){
  activeView=view;
  let shell=document.getElementById('creatorCommandPanel');
  if(!shell){shell=document.createElement('div');shell.id='creatorCommandPanel';shell.className='cc-overlay';document.body.appendChild(shell)}
  shell.classList.add('open');document.body.classList.add('cc-open');render();
}
function closeCreator(){document.getElementById('creatorCommandPanel')?.classList.remove('open');document.body.classList.remove('cc-open')}
function injectEntry(){
  if(document.getElementById('creatorCommandEntry'))return;
  const btn=document.createElement('button');btn.id='creatorCommandEntry';btn.className='cc-entry';btn.innerHTML='<span>2G</span><b>Creator</b>';btn.addEventListener('click',()=>openCreator('home'));
  document.body.appendChild(btn);
  const top=document.querySelector('.topbar');
  if(top){const small=document.createElement('button');small.className='cc-top-entry';small.textContent='2GEN';small.title='Open Creator Command';small.addEventListener('click',()=>openCreator('home'));top.appendChild(small)}
}
function init(){
  const state=getState();saveState(state);injectEntry();
  window.VaultSignalCreatorCommand={open:openCreator,close:closeCreator,newBattle:createBattle,version:'13.0.0'};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,40));else setTimeout(init,40);
})();
