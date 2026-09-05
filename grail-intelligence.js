(() => {
'use strict';

const STORAGE_KEY='2gen-vault-collector-os-v4';
let activeTab='brief';
let ripDecision={sealedId:'',sealedValue:'',expectedPullValue:'',contentValue:15,chase:3};

function n(v){const x=Number(v||0);return Number.isFinite(x)?x:0}
function money(v){return `$${n(v).toFixed(2)}`}
function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
function pct(v){return `${Math.round(n(v))}%`}
function uid(p='g'){return `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`}
function daysAgo(v){if(!v)return Infinity;const t=new Date(v).getTime();if(!Number.isFinite(t))return Infinity;return Math.max(0,(Date.now()-t)/86400000)}
function read(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{return {}}}
function write(s){localStorage.setItem(STORAGE_KEY,JSON.stringify(s))}
function ensure(s){
  s.grailEngine=s.grailEngine||{};
  s.grailEngine.version=14;
  s.grailEngine.decisionHistory=Array.isArray(s.grailEngine.decisionHistory)?s.grailEngine.decisionHistory:[];
  s.grailEngine.weeklyReviews=Array.isArray(s.grailEngine.weeklyReviews)?s.grailEngine.weeklyReviews:[];
  s.grailEngine.unlocked=Array.isArray(s.grailEngine.unlocked)?s.grailEngine.unlocked:[];
  return s;
}
function state(){return ensure(read())}
function save(s){write(ensure(s))}

function arr(v){return Array.isArray(v)?v:[]}
function qty(x){return Math.max(1,n(x?.quantity||1))}
function cardValue(x){return n(x?.market||x?.marketValue||x?.value||x?.price)}
function cardCost(x){return n(x?.costEach||x?.cost||x?.costBasis||x?.purchasePrice)}
function sealedValue(x){return n(x?.valueEach||x?.market||x?.marketValue||x?.value)}
function sealedCost(x){return n(x?.costEach||x?.cost||x?.costBasis||x?.purchasePrice)}
function itemName(x){return x?.name||x?.cardName||x?.productName||x?.title||'Tracked item'}
function dateOf(x){return x?.createdAt||x?.date||x?.purchaseDate||x?.updatedAt||x?.finishedAt||''}

function metrics(s){
  const cards=arr(s.collection),sealed=arr(s.sealed),rips=arr(s.ripSessions),sales=arr(s.sales),battles=arr(s.creatorCommand?.battles);
  const cardQty=cards.reduce((a,x)=>a+qty(x),0),sealedQty=sealed.reduce((a,x)=>a+qty(x),0);
  const cardVal=cards.reduce((a,x)=>a+qty(x)*cardValue(x),0),sealedVal=sealed.reduce((a,x)=>a+qty(x)*sealedValue(x),0);
  const cost=cards.reduce((a,x)=>a+qty(x)*cardCost(x),0)+sealed.reduce((a,x)=>a+qty(x)*sealedCost(x),0);
  const completedBattles=battles.filter(x=>x?.status==='finished').length;
  return {cards, sealed, rips, sales, battles,cardQty,sealedQty,totalItems:cardQty+sealedQty,totalValue:cardVal+sealedVal,totalCost:cost,completedBattles};
}
function currentMonthSpend(s){
  const now=new Date(),y=now.getFullYear(),m=now.getMonth();
  return arr(s.purchases).reduce((a,x)=>{const d=new Date(dateOf(x));if(d.getFullYear()!==y||d.getMonth()!==m)return a;return a+n(x?.amount||x?.total||x?.price||x?.cost)},0);
}
function monthBudget(s){return Math.max(0,n(s.settings?.monthlyBudget))}
function backupDays(s){return daysAgo(s.settings?.lastBackupAt)}
function profileCount(s){return Math.max(1,arr(s.collectorProfiles).length)}
function dataHealth(s){
  const m=metrics(s),owned=[...m.cards,...m.sealed];
  if(!owned.length)return 62;
  const costCov=owned.filter(x=>cardCost(x)>0||sealedCost(x)>0).length/owned.length;
  const valueCov=owned.filter(x=>cardValue(x)>0||sealedValue(x)>0).length/owned.length;
  const locCov=owned.filter(x=>String(x?.binder||x?.location||x?.storageLocation||'').trim()).length/owned.length;
  const backup=backupDays(s)<=14?1:backupDays(s)<=30?.65:.25;
  const budget=monthBudget(s)>0?Math.max(.2,1-currentMonthSpend(s)/monthBudget(s)*.35):.75;
  return Math.round((costCov*.23+valueCov*.27+locCov*.18+backup*.17+budget*.15)*100);
}
function action(id,title,detail,priority,route,score){return {id,title,detail,priority,route,score}}
function nextActions(s){
  const out=[],budget=monthBudget(s),spent=currentMonthSpend(s),remain=budget-spent;
  const inbox=arr(s.notificationInbox).filter(x=>!x?.read && x?.status!=='read');
  const serverAlerts=arr(s.serverWatch?.alerts).filter(x=>!x?.read);
  const closeSets=arr(s.setGoals).filter(x=>{const p=n(x?.completion||x?.percent||x?.progress);return p>=70&&p<100});
  const content=arr(s.contentQueue).filter(x=>String(x?.status||'').toLowerCase().includes('ready'));
  const staleSales=arr(s.saleQueue).filter(x=>daysAgo(dateOf(x))>10);
  const activeWatches=arr(s.stockWatches).filter(x=>x?.active!==false);
  if(inbox.length+serverAlerts.length)out.push(action('alerts','Review fresh signals',`${inbox.length+serverAlerts.length} unread collector alert${inbox.length+serverAlerts.length===1?'':'s'} waiting.`, 'high','home',98));
  if(backupDays(s)>14)out.push(action('backup','Back up the Vault',backupDays(s)===Infinity?'No backup is recorded yet.':`Last backup is about ${Math.floor(backupDays(s))} days old.`, 'high','tools',94));
  if(budget>0&&spent>budget)out.push(action('budget','Pause new hobby spend',`${money(spent)} logged this month vs ${money(budget)} budget.`, 'high','tools',92));
  else if(budget>0&&remain<budget*.2)out.push(action('budget-low','Budget is getting tight',`${money(Math.max(0,remain))} remains from this month's ${money(budget)} hobby budget.`, 'medium','tools',82));
  if(closeSets.length)out.push(action('set-close','Finish a nearly-complete set',`${closeSets.length} tracked set goal${closeSets.length===1?' is':'s are'} at least 70% complete.`, 'medium','tools',78));
  if(content.length)out.push(action('content','Turn ready ideas into posts',`${content.length} Creator Queue item${content.length===1?' is':'s are'} marked ready.`, 'medium','creator-content',76));
  if(staleSales.length)out.push(action('sales','Review old sale drafts',`${staleSales.length} sale draft${staleSales.length===1?' has':'s have'} been waiting more than 10 days.`, 'medium','tools',70));
  if(activeWatches.length&&!serverAlerts.length)out.push(action('hunt','Check your chase watches',`${activeWatches.length} active product watch${activeWatches.length===1?'':'es'} can feed your next hunt.`, 'low','stock',62));
  if(!metrics(s).rips.length)out.push(action('rip','Log your first Rip Session','Once openings are logged, Grail IQ can build ROI, content and family stats automatically.', 'low','tools',56));
  if(!out.length)out.push(action('clean','Everything looks organized','Use the next opening or hunt to keep your Vault data current.', 'low','creator',50));
  return out.sort((a,b)=>b.score-a.score).slice(0,7);
}
function quickRoute(route){
  close();
  if(route==='creator'&&window.VaultSignalCreatorCommand?.open){window.VaultSignalCreatorCommand.open('home');return}
  if(route==='creator-content'&&window.VaultSignalCreatorCommand?.open){window.VaultSignalCreatorCommand.open('content');return}
  const tab=route==='stock'?'stock':route==='vault'?'vault':route==='discover'?'discover':route==='home'?'home':'tools';
  document.querySelector(`.bottom-nav [data-tab="${tab}"]`)?.click();
}

function wishlistRows(s){
  const collection=arr(s.collection);
  return arr(s.wishlist).map((x,i)=>{
    const name=itemName(x),market=n(x?.market||x?.marketValue||x?.currentPrice||x?.price),target=n(x?.target||x?.targetPrice||x?.maxPrice),owned=collection.filter(c=>String(itemName(c)).toLowerCase()===String(name).toLowerCase()).reduce((a,c)=>a+qty(c),0);
    const budget=monthBudget(s),remaining=Math.max(0,budget-currentMonthSpend(s));
    let score=50,reasons=[];
    if(target&&market){const delta=(target-market)/Math.max(target,1);score+=Math.max(-20,Math.min(25,delta*80));if(market<=target)reasons.push('at/below target');}
    if(!owned){score+=12;reasons.push('not owned');}else{score-=Math.min(15,owned*5);reasons.push(`${owned} owned`)}
    if(market&&remaining>0){if(market<=remaining){score+=8;reasons.push('fits budget')}else{score-=15;reasons.push('over remaining budget')}}
    if(x?.priority==='high'||n(x?.priority)>=3){score+=8;reasons.push('high priority')}
    return {id:x?.id||x?.uid||`wish-${i}`,name,game:x?.game||x?.tcg||'',market,target,owned,score:Math.max(0,Math.min(100,Math.round(score))),reasons};
  }).sort((a,b)=>b.score-a.score);
}
function acquisitionRows(s){
  const existing=wishlistRows(s),seen=new Set(existing.map(x=>x.name.toLowerCase()));
  arr(s.acquisitionQueue).forEach((x,i)=>{const name=itemName(x);if(seen.has(name.toLowerCase()))return;existing.push({id:x?.id||`aq-${i}`,name,game:x?.game||'',market:n(x?.market||x?.price),target:n(x?.target||x?.targetPrice),owned:0,score:65,reasons:[String(x?.status||'focused chase')]})});
  return existing.sort((a,b)=>b.score-a.score);
}

function latestRip(s){
  const list=arr(s.ripSessions).slice().sort((a,b)=>String(dateOf(b)).localeCompare(String(dateOf(a))));
  if(!list.length)return null;
  const r=list[0],pulls=arr(r?.pulls||r?.cards),cost=n(r?.cost||r?.openingCost||r?.totalCost||r?.purchaseCost),value=pulls.reduce((a,p)=>a+cardValue(p),0);
  return {raw:r,name:r?.productName||r?.product||r?.name||'TCG opening',game:r?.game||r?.tcg||'TCG',packs:n(r?.packCount||r?.packs||0),pulls,cost,value,best:pulls.slice().sort((a,b)=>cardValue(b)-cardValue(a))[0]||null};
}
function episodePlan(s){
  const r=latestRip(s);if(!r)return null;
  const best=itemName(r.best||{}),packs=r.packs||Math.max(1,r.pulls.length?Math.ceil(r.pulls.length/10):1);
  return {r,beats:[
    ['0:00–0:08','Cold open',best&&best!=='Tracked item'?`Tease the reaction to ${best} without showing the full card yet.`:'Open with the strongest reaction or chase goal.'],
    ['0:08–0:22','Product reveal',`Show ${r.name}, what it cost, and the chase card in one clean sentence.`],
    ['0:22–0:35','Battle / goal setup',`Give Dad and Son a simple goal: best pull, most hits, or Grail score.`],
    ['0:35–main','Rip sequence',`Keep the pace moving through ${packs} pack${packs===1?'':'s'}; pause only for real hits or funny reactions.`],
    ['Hit moment','Value check',`Scan the best pulls in VaultSignal and show tracked reference values on screen.`],
    ['Final 15 sec','Recap',`Show best pull, ${money(r.value)} tracked pull value vs ${money(r.cost)} opening cost, then close with “Sleeve it and leave it.”`]
  ]};
}
function episodeText(s){const p=episodePlan(s);if(!p)return '';return `2GEN RIPS EPISODE PLAN — ${p.r.name}\n\n${p.beats.map(b=>`${b[0]} — ${b[1]}\n${b[2]}`).join('\n\n')}\n\nTracked pull value: ${money(p.r.value)}\nOpening cost: ${money(p.r.cost)}\nBest pull: ${itemName(p.r.best||{})}`}

function weeklyReview(s){
  const m=metrics(s),spent=currentMonthSpend(s),budget=monthBudget(s),recentRips=m.rips.filter(x=>daysAgo(dateOf(x))<=7),recentSales=m.sales.filter(x=>daysAgo(dateOf(x))<=7),recentBattles=m.battles.filter(x=>x?.status==='finished'&&daysAgo(x?.finishedAt||x?.createdAt)<=7);
  const ripPulls=recentRips.flatMap(x=>arr(x?.pulls||x?.cards)),best=ripPulls.slice().sort((a,b)=>cardValue(b)-cardValue(a))[0];
  return `VAULTSIGNAL WEEKLY REVIEW\n\nVault: ${m.cardQty} cards + ${m.sealedQty} sealed • ${money(m.totalValue)} tracked value\nData health: ${dataHealth(s)}/100\nThis month: ${money(spent)} logged${budget?` of ${money(budget)} hobby budget`:''}\nLast 7 days: ${recentRips.length} rip session${recentRips.length===1?'':'s'} • ${recentBattles.length} pack battle${recentBattles.length===1?'':'s'} • ${recentSales.length} completed sale${recentSales.length===1?'':'s'}${best?`\nBest recent pull: ${itemName(best)} • ${money(cardValue(best))}`:''}\n\nNext move: ${nextActions(s)[0]?.title||'Keep the Vault current'}\n\nValues are collection references, not guaranteed sale prices.`;
}

function achievements(s){
  const m=metrics(s),rips=m.rips.length,battles=m.completedBattles,posted=arr(s.contentQueue).filter(x=>String(x?.status||'').toLowerCase()==='posted').length;
  const closeSet=arr(s.setGoals).some(x=>n(x?.completion||x?.percent||x?.progress)>=100);
  return [
    ['first-card','🃏','First Card','Track your first card in the Vault.',m.cardQty>=1],
    ['hundred-card','💯','100 Card Club','Track 100 cards.',m.cardQty>=100],
    ['first-sealed','📦','Sealed Keeper','Track your first sealed product.',m.sealedQty>=1],
    ['ten-rips','🔥','Rip Regular','Log 10 Rip Sessions.',rips>=10],
    ['fifty-rips','⚡','Rip Veteran','Log 50 Rip Sessions.',rips>=50],
    ['battle-ten','⚔','Battle Tested','Finish 10 Pack Battles.',battles>=10],
    ['master-set','📚','Master Set','Complete one tracked set goal.',closeSet],
    ['creator-ten','🎬','Creator Run','Mark 10 content items posted.',posted>=10],
    ['health-90','🧠','Vault Master','Reach 90+ Vault data health.',dataHealth(s)>=90],
    ['family','👨‍👦','Two Generations','Create at least two collector profiles.',profileCount(s)>=2]
  ].map(([id,icon,title,desc,ok])=>({id,icon,title,desc,ok}));
}
function syncUnlocks(s){const unlocked=new Set(arr(s.grailEngine?.unlocked));let changed=false;achievements(s).forEach(a=>{if(a.ok&&!unlocked.has(a.id)){unlocked.add(a.id);changed=true}});if(changed){s.grailEngine.unlocked=[...unlocked];save(s)}return s}

function ripDecisionResult(s){
  const sealed=arr(s.sealed),item=sealed.find(x=>String(x?.uid||x?.id)===String(ripDecision.sealedId))||null;
  const owned=item?qty(item):1,minKeep=n(item?.minOnHand||item?.minimumKeep||0);
  const sv=n(ripDecision.sealedValue)||sealedValue(item),ev=n(ripDecision.expectedPullValue),cv=n(ripDecision.contentValue),chase=Math.max(1,Math.min(5,n(ripDecision.chase)||3));
  let keep=50,rip=50,reasons=[];
  if(sv&&ev){const premium=(sv-ev)/Math.max(sv,1);keep+=Math.max(-20,Math.min(28,premium*70));rip-=Math.max(-18,Math.min(24,premium*55));if(sv>ev)reasons.push(`Sealed reference is ${money(sv-ev)} above your expected pull value.`);else reasons.push(`Your expected pull value is ${money(ev-sv)} above the sealed reference.`)}
  if(owned<=Math.max(1,minKeep)){keep+=16;reasons.push('Opening it would leave you at or below your keep-on-hand level.')}else if(owned>=2){rip+=8;reasons.push(`You have ${owned} sealed copies tracked.`)}
  rip+=Math.min(18,cv*.45);if(cv>=20)reasons.push('This opening has meaningful content value to you.');
  rip+=(chase-3)*6;if(chase>=4)reasons.push('Your chase interest is high.');if(chase<=2)keep+=7;
  const budget=monthBudget(s),spent=currentMonthSpend(s);if(budget>0&&spent>budget){keep+=12;rip-=10;reasons.push('Your logged monthly hobby spend is already above budget.')}
  keep=Math.max(0,Math.min(100,Math.round(keep)));rip=Math.max(0,Math.min(100,Math.round(rip)));
  const gap=Math.abs(keep-rip),label=gap<9?'EITHER FITS':rip>keep?'RIP FIT':'KEEP FIT';
  return {item,owned,sv,ev,cv,chase,keep,rip,label,reasons:reasons.slice(0,5)};
}
function saveDecision(){const s=state(),r=ripDecisionResult(s);s.grailEngine.decisionHistory.unshift({id:uid('decision'),createdAt:new Date().toISOString(),item:itemName(r.item||{}),...r});s.grailEngine.decisionHistory=s.grailEngine.decisionHistory.slice(0,30);save(s);toast('Decision saved')}

function toast(text){let el=document.getElementById('giToast');if(!el){el=document.createElement('div');el.id='giToast';el.className='gi-toast';document.body.appendChild(el)}el.textContent=text;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1700)}
async function copy(text){try{await navigator.clipboard.writeText(text);toast('Copied')}catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast('Copied')}}
async function share(title,text){if(navigator.share){try{await navigator.share({title,text});return}catch(e){if(e?.name==='AbortError')return}}copy(text)}

function briefView(s){
  const m=metrics(s),actions=nextActions(s),spent=currentMonthSpend(s),budget=monthBudget(s),health=dataHealth(s),chases=acquisitionRows(s).slice(0,3),top=actions[0];
  return `<div class="gi-scroll"><section class="gi-hero"><span class="gi-kicker">HOLY GRAIL INTELLIGENCE</span><h2>Your collection, turned into next moves.</h2><p>Grail IQ reads the data already inside VaultSignal and turns it into simple collector actions. Scores are workflow/organization signals — not investment advice.</p><div class="gi-score-ring"><div style="--score:${health}%"><b>${health}</b></div><div><span>Vault data health</span><small>Cost basis, market references, storage, backups and budget tracking.</small></div></div></section>
  <div class="gi-stat-grid"><div><span>Tracked value</span><b>${money(m.totalValue)}</b><small>${m.totalItems} owned items</small></div><div><span>This month</span><b>${money(spent)}</b><small>${budget?`${money(Math.max(0,budget-spent))} budget left`:'Set a hobby budget'}</small></div><div><span>Rip sessions</span><b>${m.rips.length}</b><small>${m.completedBattles} battles finished</small></div><div><span>Top next move</span><b>${top.priority==='high'?'NOW':'NEXT'}</b><small>${esc(top.title)}</small></div></div>
  <section class="gi-panel"><div class="gi-section-head"><div><span class="gi-kicker">NEXT BEST MOVES</span><h3>What deserves attention</h3></div></div><div class="gi-actions">${actions.map((a,i)=>`<div class="gi-action-card ${a.priority}"><span class="gi-priority">${i+1}</span><div><strong>${esc(a.title)}</strong><small>${esc(a.detail)}</small></div><button data-route="${a.route}">GO</button></div>`).join('')}</div></section>
  <section class="gi-panel"><div class="gi-section-head"><div><span class="gi-kicker">CHASE PULSE</span><h3>Best-fit current chases</h3></div><button class="gi-chip" data-tab="chase">Open Chase</button></div>${chases.length?`<div class="gi-chase-list">${chases.map(x=>`<div class="gi-chase"><div><strong>${esc(x.name)}</strong><small>${money(x.market)} current ref${x.target?` • ${money(x.target)} target`:''} • ${esc(x.reasons.join(' • '))}</small><div class="gi-progress"><i style="width:${x.score}%"></i></div></div><div class="gi-fit">${x.score}<span>FIT</span></div></div>`).join('')}</div>`:'<div class="gi-empty">Add cards to your Wishlist or Acquisition Queue and they will rank here.</div>'}</section>
  <section class="gi-panel"><div class="gi-section-head"><div><span class="gi-kicker">WEEKLY REVIEW</span><h3>One-tap hobby recap</h3></div><button class="gi-chip" data-share-weekly>Share</button></div><div class="gi-week-card">${esc(weeklyReview(s))}</div></section></div>`;
}
function chaseView(s){const rows=acquisitionRows(s),budget=monthBudget(s),remain=Math.max(0,budget-currentMonthSpend(s));return `<div class="gi-scroll"><div class="gi-page-head"><div><span class="gi-kicker">CHASE COMMAND</span><h2>Rank the hunt around your collection.</h2></div></div><section class="gi-panel"><p>Collector Fit weighs your target price, current reference, owned copies, priority and remaining hobby budget. It does not predict future prices.</p><div class="gi-stat-grid"><div><span>Remaining budget</span><b>${budget?money(remain):'—'}</b><small>${budget?'This month':'No monthly budget set'}</small></div><div><span>Active chases</span><b>${rows.length}</b><small>Wishlist + acquisition queue</small></div></div></section>${rows.length?`<div class="gi-chase-list">${rows.map((x,i)=>`<div class="gi-chase"><div><strong>#${i+1} ${esc(x.name)}</strong><small>${esc(x.game||'TCG')} • current ${money(x.market)}${x.target?` • target ${money(x.target)}`:''}</small><small>${esc(x.reasons.join(' • ')||'Tracked chase')}</small><div class="gi-progress"><i style="width:${x.score}%"></i></div></div><div class="gi-fit">${x.score}<span>FIT</span></div></div>`).join('')}</div>`:`<section class="gi-panel"><div class="gi-empty">No chase cards yet. Add cards from Search to your Wishlist, or use VaultIQ Acquisition Queue.</div><button class="gi-primary" data-route="discover">Search cards</button></section>`}</div>`}
function ripKeepView(s){
  const sealed=arr(s.sealed),r=ripDecisionResult(s);
  return `<div class="gi-scroll"><div class="gi-page-head"><div><span class="gi-kicker">RIP / KEEP LAB</span><h2>Make the opening decision personal.</h2></div></div><section class="gi-panel"><p>This tool compares your own sealed reference, expected pull value, copies owned, chase interest, content value and hobby budget. It is a collector-fit tool, not financial advice or a profit forecast.</p></section><section class="gi-panel"><div class="gi-form"><div class="gi-field"><label>SEALED PRODUCT</label><select id="giSealed"> <option value="">Choose tracked sealed item</option>${sealed.map(x=>`<option value="${esc(x?.uid||x?.id||'')}" ${String(ripDecision.sealedId)===String(x?.uid||x?.id)?'selected':''}>${esc(itemName(x))} • ${qty(x)} owned</option>`).join('')}</select></div><div class="gi-field-grid"><div class="gi-field"><label>SEALED REFERENCE VALUE</label><input id="giSealedValue" type="number" step="0.01" inputmode="decimal" value="${esc(ripDecision.sealedValue||r.sv||'')}"></div><div class="gi-field"><label>YOUR EXPECTED PULL VALUE</label><input id="giExpected" type="number" step="0.01" inputmode="decimal" value="${esc(ripDecision.expectedPullValue)}" placeholder="Optional"></div></div><div class="gi-field"><label>CONTENT VALUE TO YOU (0–50)</label><div class="gi-range-row"><input id="giContent" type="range" min="0" max="50" value="${r.cv}"><b>${r.cv}</b></div></div><div class="gi-field"><label>CHASE EXCITEMENT (1–5)</label><div class="gi-range-row"><input id="giChase" type="range" min="1" max="5" value="${r.chase}"><b>${r.chase}</b></div></div></div></section><section class="gi-decision-card"><div class="gi-decision-top"><div><span class="gi-kicker">CURRENT FIT</span><h3>${r.label}</h3></div><span class="gi-decision-badge">${esc(itemName(r.item||{}))}</span></div><div class="gi-dual-score"><div><span>RIP FIT</span><b>${r.rip}</b></div><div><span>KEEP FIT</span><b>${r.keep}</b></div></div><div class="gi-reasons">${r.reasons.length?r.reasons.map(x=>`<div>${esc(x)}</div>`).join(''):'<div>Select a sealed product and add the values that matter to you.</div>'}</div><div class="gi-note">Reference values can change. Pull outcomes are random and condition/variant matters. This tool intentionally does not guarantee profit.</div></section><div class="gi-action-row"><button class="gi-primary" data-save-decision>Save decision</button><button class="gi-secondary" data-route="tools">Open Product Tools</button></div></div>`;
}
function episodeView(s){const p=episodePlan(s);return `<div class="gi-scroll"><div class="gi-page-head"><div><span class="gi-kicker">EPISODE BUILDER</span><h2>Turn the latest rip into a filming plan.</h2></div></div>${p?`<section class="gi-panel"><div class="gi-section-head"><div><span class="gi-kicker">LATEST OPENING</span><h3>${esc(p.r.name)}</h3></div><span class="gi-chip">${esc(p.r.game)}</span></div><div class="gi-stat-grid"><div><span>Packs</span><b>${p.r.packs||'—'}</b><small>Logged opening</small></div><div><span>Pull value</span><b>${money(p.r.value)}</b><small>${money(p.r.cost)} opening cost</small></div></div></section><section class="gi-panel"><div class="gi-section-head"><div><span class="gi-kicker">SHOT LIST</span><h3>Fast father-and-son pacing</h3></div></div><div class="gi-episode">${p.beats.map(b=>`<div class="gi-beat"><b>${esc(b[0])}</b><div><strong>${esc(b[1])}</strong><small>${esc(b[2])}</small></div></div>`).join('')}</div></section><div class="gi-action-row"><button class="gi-primary" data-copy-episode>Copy rundown</button><button class="gi-secondary" data-creator-content>Open Content Engine</button></div>`:`<section class="gi-panel"><div class="gi-empty">No Rip Session found yet. Log an opening in Collector Tools and Grail IQ will build a filming rundown from it.</div><button class="gi-primary" data-route="tools">Open Rip Lab</button></section>`}</div>`}
function questView(s){const list=achievements(s),unlocked=list.filter(x=>x.ok).length;return `<div class="gi-scroll"><div class="gi-page-head"><div><span class="gi-kicker">COLLECTION QUEST</span><h2>Make progress visible.</h2></div></div><section class="gi-hero"><span class="gi-kicker">FAMILY PROGRESS</span><h2>${unlocked} / ${list.length} milestones unlocked</h2><p>Achievements reward organizing, collecting and creating — not spending more money or opening more than you planned.</p><div class="gi-progress"><i style="width:${unlocked/list.length*100}%"></i></div></section><div class="gi-quest-grid">${list.map(x=>`<div class="gi-quest-card ${x.ok?'unlocked':''}"><b>${x.icon}</b><strong>${esc(x.title)}</strong><small>${esc(x.desc)}</small><em>${x.ok?'UNLOCKED':'IN PROGRESS'}</em></div>`).join('')}</div></div>`}
function render(){
  const s=syncUnlocks(state()),overlay=document.getElementById('grailIntelligence');if(!overlay)return;
  const tabs=[['brief','Brief'],['chase','Chase'],['ripkeep','Rip / Keep'],['episode','Episode'],['quest','Quest']];
  const views={brief:briefView,chase:chaseView,ripkeep:ripKeepView,episode:episodeView,quest:questView};
  overlay.innerHTML=`<div class="gi-shell"><header class="gi-top"><div class="gi-brand"><div class="gi-mark">IQ</div><div><strong>Grail Intelligence</strong><span>VaultSignal v14 • Collector decision layer</span></div></div><button class="gi-close" aria-label="Close">×</button></header><nav class="gi-tabs">${tabs.map(([id,l])=>`<button class="${activeTab===id?'active':''}" data-tab="${id}">${l}</button>`).join('')}</nav>${(views[activeTab]||briefView)(s)}</div>`;
  bind();
}
function bind(){
  const root=document.getElementById('grailIntelligence');if(!root)return;
  root.querySelector('.gi-close')?.addEventListener('click',close);
  root.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{activeTab=b.dataset.tab;render()}));
  root.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>quickRoute(b.dataset.route)));
  root.querySelector('[data-share-weekly]')?.addEventListener('click',()=>share('VaultSignal Weekly Review',weeklyReview(state())));
  root.querySelector('[data-copy-episode]')?.addEventListener('click',()=>copy(episodeText(state())));
  root.querySelector('[data-creator-content]')?.addEventListener('click',()=>{close();window.VaultSignalCreatorCommand?.open?.('content')});
  const sealed=root.querySelector('#giSealed'),sv=root.querySelector('#giSealedValue'),ev=root.querySelector('#giExpected'),cv=root.querySelector('#giContent'),ch=root.querySelector('#giChase');
  const updateDecision=()=>{ripDecision={sealedId:sealed?.value||ripDecision.sealedId,sealedValue:sv?.value||'',expectedPullValue:ev?.value||'',contentValue:n(cv?.value),chase:n(ch?.value)};render()};
  sealed?.addEventListener('change',()=>{const s=state(),item=arr(s.sealed).find(x=>String(x?.uid||x?.id)===sealed.value);ripDecision.sealedId=sealed.value;ripDecision.sealedValue=sealedValue(item)||'';render()});
  sv?.addEventListener('change',updateDecision);ev?.addEventListener('change',updateDecision);cv?.addEventListener('change',updateDecision);ch?.addEventListener('change',updateDecision);
  root.querySelector('[data-save-decision]')?.addEventListener('click',saveDecision);
}
function open(tab='brief'){activeTab=tab;let el=document.getElementById('grailIntelligence');if(!el){el=document.createElement('div');el.id='grailIntelligence';el.className='gi-overlay';document.body.appendChild(el)}el.classList.add('open');document.body.classList.add('gi-open');render()}
function close(){document.getElementById('grailIntelligence')?.classList.remove('open');document.body.classList.remove('gi-open')}

function injectTopButton(){
  const top=document.querySelector('.topbar');if(!top||document.getElementById('giTopEntry'))return;
  const b=document.createElement('button');b.id='giTopEntry';b.className='gi-top-entry';b.textContent='GRAIL IQ';b.title='Open Grail Intelligence';b.addEventListener('click',()=>open('brief'));top.appendChild(b);
}
function injectHomeBrief(){
  const home=document.getElementById('home');if(!home||document.getElementById('giHomeBrief'))return;
  const a=nextActions(state())[0];if(!a)return;
  const card=document.createElement('div');card.id='giHomeBrief';card.className='gi-home-brief';card.innerHTML=`<div><span class="gi-label">GRAIL IQ • NEXT MOVE</span><b>${esc(a.title)}</b><small>${esc(a.detail)}</small></div><button>OPEN</button>`;card.querySelector('button').addEventListener('click',()=>open('brief'));
  home.prepend(card);
}
function injectCreatorLink(){
  const panel=document.getElementById('creatorCommandPanel');if(!panel||panel.querySelector('.gi-creator-link'))return;
  const header=panel.querySelector('.cc-top');if(!header)return;
  const b=document.createElement('button');b.className='gi-creator-link gi-top-entry';b.textContent='IQ';b.title='Open Grail Intelligence';b.addEventListener('click',()=>{window.VaultSignalCreatorCommand?.close?.();open('brief')});header.insertBefore(b,header.lastElementChild);
}
function observe(){
  const mo=new MutationObserver(()=>{injectTopButton();injectHomeBrief();injectCreatorLink()});mo.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY){injectHomeBrief();if(document.getElementById('grailIntelligence')?.classList.contains('open'))render()}})
}
function init(){syncUnlocks(state());injectTopButton();injectHomeBrief();injectCreatorLink();observe();window.VaultSignalGrail={open,close,version:'14.0.0',weeklyReview:()=>weeklyReview(state()),nextActions:()=>nextActions(state())}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,80));else setTimeout(init,80);
})();
