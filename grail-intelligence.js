(() => {
'use strict';

const KEY='2gen-vault-collector-os-v4';
let tab='brief';
let decision={sealedId:'',sealedValue:'',expected:'',content:15,chase:3};

const A=v=>Array.isArray(v)?v:[];
const N=v=>{const x=Number(v||0);return Number.isFinite(x)?x:0};
const M=v=>`$${N(v).toFixed(2)}`;
const E=(v='')=>String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const Q=x=>Math.max(1,N(x&&x.quantity||1));
const D=x=>x&&((x.createdAt)||(x.date)||(x.purchaseDate)||(x.updatedAt)||(x.finishedAt))||'';
const Name=x=>x&&((x.name)||(x.cardName)||(x.productName)||(x.title))||'Tracked item';
const CardV=x=>N(x&&((x.market)||(x.marketValue)||(x.value)||(x.price)));
const CardC=x=>N(x&&((x.costEach)||(x.cost)||(x.costBasis)||(x.purchasePrice)));
const SealV=x=>N(x&&((x.valueEach)||(x.market)||(x.marketValue)||(x.value)));
const SealC=x=>N(x&&((x.costEach)||(x.cost)||(x.costBasis)||(x.purchasePrice)));
function age(v){if(!v)return Infinity;const t=new Date(v).getTime();return Number.isFinite(t)?Math.max(0,(Date.now()-t)/86400000):Infinity}
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}}
function ensure(s){s.grailEngine=s.grailEngine||{};s.grailEngine.version=14;s.grailEngine.decisionHistory=A(s.grailEngine.decisionHistory);s.grailEngine.unlocked=A(s.grailEngine.unlocked);return s}
function S(){return ensure(read())}
function save(s){localStorage.setItem(KEY,JSON.stringify(ensure(s)))}

function metrics(s){
  const cards=A(s.collection),sealed=A(s.sealed),rips=A(s.ripSessions),sales=A(s.sales),battles=A(s.creatorCommand&&s.creatorCommand.battles);
  return {
    cards,sealed,rips,sales,battles,
    cardQty:cards.reduce((a,x)=>a+Q(x),0),
    sealedQty:sealed.reduce((a,x)=>a+Q(x),0),
    value:cards.reduce((a,x)=>a+Q(x)*CardV(x),0)+sealed.reduce((a,x)=>a+Q(x)*SealV(x),0),
    cost:cards.reduce((a,x)=>a+Q(x)*CardC(x),0)+sealed.reduce((a,x)=>a+Q(x)*SealC(x),0),
    battlesDone:battles.filter(x=>x&&x.status==='finished').length
  };
}
function monthSpend(s){
  const now=new Date(),y=now.getFullYear(),mo=now.getMonth();
  return A(s.purchases).reduce((a,x)=>{const d=new Date(D(x));return d.getFullYear()===y&&d.getMonth()===mo?a+N(x&&(x.amount||x.total||x.price||x.cost)):a},0);
}
function budget(s){return Math.max(0,N(s.settings&&s.settings.monthlyBudget))}
function health(s){
  const m=metrics(s),owned=m.cards.concat(m.sealed);if(!owned.length)return 62;
  const cv=owned.filter(x=>CardV(x)>0||SealV(x)>0).length/owned.length;
  const cc=owned.filter(x=>CardC(x)>0||SealC(x)>0).length/owned.length;
  const loc=owned.filter(x=>String(x&&(x.binder||x.location||x.storageLocation)||'').trim()).length/owned.length;
  const bd=age(s.settings&&s.settings.lastBackupAt);const bk=bd<=14?1:(bd<=30?0.65:0.25);
  const b=budget(s),sp=monthSpend(s);const bg=b>0?Math.max(0.2,1-(sp/b)*0.35):0.75;
  return Math.round((cv*.27+cc*.23+loc*.18+bk*.17+bg*.15)*100);
}
function act(title,detail,priority,route,score){return {title,detail,priority,route,score}}
function actions(s){
  const out=[],b=budget(s),sp=monthSpend(s),left=b-sp;
  const alerts=A(s.notificationInbox).filter(x=>!(x&&x.read)&&(!x||x.status!=='read')).length+A(s.serverWatch&&s.serverWatch.alerts).filter(x=>!(x&&x.read)).length;
  const close=A(s.setGoals).filter(x=>{const p=N(x&&(x.completion||x.percent||x.progress));return p>=70&&p<100}).length;
  const ready=A(s.contentQueue).filter(x=>String(x&&x.status||'').toLowerCase().includes('ready')).length;
  const watches=A(s.stockWatches).filter(x=>!x||x.active!==false).length;
  if(alerts)out.push(act('Review fresh signals',`${alerts} unread collector alert${alerts===1?'':'s'} waiting.`,'high','home',98));
  const bd=age(s.settings&&s.settings.lastBackupAt);if(bd>14)out.push(act('Back up the Vault',bd===Infinity?'No backup is recorded yet.':`Last backup is about ${Math.floor(bd)} days old.`,'high','tools',94));
  if(b>0&&sp>b)out.push(act('Pause new hobby spend',`${M(sp)} logged this month vs ${M(b)} budget.`,'high','tools',92));
  else if(b>0&&left<b*.2)out.push(act('Budget is getting tight',`${M(Math.max(0,left))} remains from this month's hobby budget.`,'medium','tools',82));
  if(close)out.push(act('Finish a nearly-complete set',`${close} tracked set goal${close===1?' is':'s are'} at least 70% complete.`,'medium','tools',78));
  if(ready)out.push(act('Turn ready ideas into posts',`${ready} Creator Queue item${ready===1?' is':'s are'} ready.`,'medium','creator-content',76));
  if(watches&&!alerts)out.push(act('Check your chase watches',`${watches} active stock watch${watches===1?'':'es'} can feed the next hunt.`,'low','stock',64));
  if(!metrics(s).rips.length)out.push(act('Log your first Rip Session','Rip data unlocks opening ROI, episode plans and creator summaries.','low','tools',58));
  if(!out.length)out.push(act('Everything looks organized','Keep the next hunt, opening and backup logged.','low','creator',50));
  return out.sort((a,b)=>b.score-a.score).slice(0,7);
}
function route(r){
  close();
  if(r==='creator'||r==='creator-content'){
    const api=window.VaultSignalCreatorCommand;if(api&&api.open){api.open(r==='creator-content'?'content':'home');return}
  }
  const t=r==='stock'?'stock':r==='vault'?'vault':r==='discover'?'discover':r==='home'?'home':'tools';
  const b=document.querySelector(`.bottom-nav [data-tab="${t}"]`);if(b)b.click();
}

function chases(s){
  const owned=A(s.collection),b=budget(s),left=Math.max(0,b-monthSpend(s));
  const rows=A(s.wishlist).map((x,i)=>{
    const name=Name(x),market=N(x&&(x.market||x.marketValue||x.currentPrice||x.price)),target=N(x&&(x.target||x.targetPrice||x.maxPrice));
    const copies=owned.filter(c=>Name(c).toLowerCase()===name.toLowerCase()).reduce((a,c)=>a+Q(c),0);
    let score=50;const why=[];
    if(target&&market){const d=(target-market)/Math.max(target,1);score+=Math.max(-20,Math.min(25,d*80));if(market<=target)why.push('at/below target')}
    if(!copies){score+=12;why.push('not owned')}else{score-=Math.min(15,copies*5);why.push(`${copies} owned`)}
    if(market&&b>0){if(market<=left){score+=8;why.push('fits remaining budget')}else{score-=15;why.push('above remaining budget')}}
    if(x&&(x.priority==='high'||N(x.priority)>=3)){score+=8;why.push('high priority')}
    return {id:x&&(x.id||x.uid)||`w${i}`,name,game:x&&x.game||'',market,target,copies,score:Math.max(0,Math.min(100,Math.round(score))),why};
  });
  const seen=new Set(rows.map(x=>x.name.toLowerCase()));
  A(s.acquisitionQueue).forEach((x,i)=>{const name=Name(x);if(!seen.has(name.toLowerCase()))rows.push({id:x&&x.id||`a${i}`,name,game:x&&x.game||'',market:N(x&&(x.market||x.price)),target:N(x&&(x.target||x.targetPrice)),copies:0,score:65,why:[String(x&&x.status||'focused chase')]})});
  return rows.sort((a,b)=>b.score-a.score);
}

function latestRip(s){
  const list=A(s.ripSessions).slice().sort((a,b)=>String(D(b)).localeCompare(String(D(a))));if(!list.length)return null;
  const r=list[0],pulls=A(r&&(r.pulls||r.cards)),cost=N(r&&(r.cost||r.openingCost||r.totalCost||r.purchaseCost));
  return {name:r&&(r.productName||r.product||r.name)||'TCG opening',game:r&&(r.game||r.tcg)||'TCG',packs:N(r&&(r.packCount||r.packs)),pulls,cost,value:pulls.reduce((a,p)=>a+CardV(p),0),best:pulls.slice().sort((a,b)=>CardV(b)-CardV(a))[0]||null};
}
function episode(s){
  const r=latestRip(s);if(!r)return null;const best=Name(r.best||{}),packs=r.packs||Math.max(1,Math.ceil(r.pulls.length/10));
  return {r,beats:[
    ['0:00–0:08','Cold open',best!=='Tracked item'?`Tease the reaction to ${best} without giving away the full card.`:'Open with the strongest reaction or chase goal.'],
    ['0:08–0:22','Product reveal',`Show ${r.name}, what it cost, and the chase card in one clean sentence.`],
    ['0:22–0:35','Dad vs Son setup','Set a simple goal: best pull, most hits, or Pack Battle score.'],
    ['0:35–main','Rip sequence',`Move through ${packs} pack${packs===1?'':'s'} quickly; pause only for real hits or fun reactions.`],
    ['Hit moment','Value check','Scan the best pulls in VaultSignal and show the reference value on screen.'],
    ['Final 15 sec','Recap',`Best pull + ${M(r.value)} tracked pull value vs ${M(r.cost)} opening cost, then “Sleeve it and leave it.”`]
  ]};
}
function episodeText(s){const p=episode(s);return p?`2GEN RIPS EPISODE PLAN — ${p.r.name}\n\n${p.beats.map(x=>`${x[0]} — ${x[1]}\n${x[2]}`).join('\n\n')}\n\nTracked pull value: ${M(p.r.value)}\nOpening cost: ${M(p.r.cost)}\nBest pull: ${Name(p.r.best||{})}`:''}
function weekly(s){
  const m=metrics(s),sp=monthSpend(s),b=budget(s),rips=m.rips.filter(x=>age(D(x))<=7),battles=m.battles.filter(x=>x&&x.status==='finished'&&age(x.finishedAt||x.createdAt)<=7),sales=m.sales.filter(x=>age(D(x))<=7);
  const pulls=rips.flatMap(x=>A(x&&(x.pulls||x.cards))),best=pulls.slice().sort((a,b)=>CardV(b)-CardV(a))[0];
  return `VAULTSIGNAL WEEKLY REVIEW\n\nVault: ${m.cardQty} cards + ${m.sealedQty} sealed • ${M(m.value)} tracked value\nData health: ${health(s)}/100\nThis month: ${M(sp)} logged${b?` of ${M(b)} hobby budget`:''}\nLast 7 days: ${rips.length} rip session${rips.length===1?'':'s'} • ${battles.length} pack battle${battles.length===1?'':'s'} • ${sales.length} completed sale${sales.length===1?'':'s'}${best?`\nBest recent pull: ${Name(best)} • ${M(CardV(best))}`:''}\n\nNext move: ${actions(s)[0].title}\n\nReference values can change and are not guaranteed sale prices.`;
}

function quests(s){
  const m=metrics(s),posted=A(s.contentQueue).filter(x=>String(x&&x.status||'').toLowerCase()==='posted').length,profiles=Math.max(1,A(s.collectorProfiles).length);
  const complete=A(s.setGoals).some(x=>N(x&&(x.completion||x.percent||x.progress))>=100);
  return [
    ['first-card','🃏','First Card','Track your first card.',m.cardQty>=1],['100-card','💯','100 Card Club','Track 100 cards.',m.cardQty>=100],
    ['sealed','📦','Sealed Keeper','Track a sealed product.',m.sealedQty>=1],['10-rip','🔥','Rip Regular','Log 10 Rip Sessions.',m.rips.length>=10],
    ['50-rip','⚡','Rip Veteran','Log 50 Rip Sessions.',m.rips.length>=50],['10-battle','⚔','Battle Tested','Finish 10 Pack Battles.',m.battlesDone>=10],
    ['set','📚','Master Set','Complete a tracked set goal.',complete],['creator','🎬','Creator Run','Mark 10 content items posted.',posted>=10],
    ['health','🧠','Vault Master','Reach 90+ data health.',health(s)>=90],['family','👨‍👦','Two Generations','Create at least two collector profiles.',profiles>=2]
  ].map(x=>({id:x[0],icon:x[1],title:x[2],desc:x[3],ok:x[4]}));
}
function sync(s){const u=new Set(A(s.grailEngine.unlocked));let c=false;quests(s).forEach(x=>{if(x.ok&&!u.has(x.id)){u.add(x.id);c=true}});if(c){s.grailEngine.unlocked=[...u];save(s)}return s}

function decisionResult(s){
  const item=A(s.sealed).find(x=>String(x&&(x.uid||x.id))===String(decision.sealedId))||null,owned=item?Q(item):1,minKeep=N(item&&(item.minOnHand||item.minimumKeep));
  const sv=N(decision.sealedValue)||SealV(item),ev=N(decision.expected),cv=N(decision.content),ch=Math.max(1,Math.min(5,N(decision.chase)||3));let keep=50,rip=50;const reasons=[];
  if(sv&&ev){const premium=(sv-ev)/Math.max(sv,1);keep+=Math.max(-20,Math.min(28,premium*70));rip-=Math.max(-18,Math.min(24,premium*55));reasons.push(sv>ev?`Sealed reference is ${M(sv-ev)} above your expected pull value.`:`Your expected pull value is ${M(ev-sv)} above the sealed reference.`)}
  if(owned<=Math.max(1,minKeep)){keep+=16;reasons.push('Opening it would leave you at or below your keep-on-hand level.')}else if(owned>=2){rip+=8;reasons.push(`You have ${owned} sealed copies tracked.`)}
  rip+=Math.min(18,cv*.45);if(cv>=20)reasons.push('This opening has meaningful creator/content value to you.');
  rip+=(ch-3)*6;if(ch>=4)reasons.push('Your chase interest is high.');if(ch<=2)keep+=7;
  const b=budget(s);if(b>0&&monthSpend(s)>b){keep+=12;rip-=10;reasons.push('Logged monthly hobby spend is already above budget.')}
  keep=Math.max(0,Math.min(100,Math.round(keep)));rip=Math.max(0,Math.min(100,Math.round(rip)));const gap=Math.abs(keep-rip);
  return {item,owned,sv,ev,cv,ch,keep,rip,label:gap<9?'EITHER FITS':rip>keep?'RIP FIT':'KEEP FIT',reasons:reasons.slice(0,5)};
}
function saveDecision(){const s=S(),r=decisionResult(s);s.grailEngine.decisionHistory.unshift({id:`d-${Date.now()}`,createdAt:new Date().toISOString(),item:Name(r.item||{}),rip:r.rip,keep:r.keep,label:r.label,sv:r.sv,ev:r.ev});s.grailEngine.decisionHistory=s.grailEngine.decisionHistory.slice(0,30);save(s);toast('Decision saved')}

function toast(t){let e=document.getElementById('giToast');if(!e){e=document.createElement('div');e.id='giToast';e.className='gi-toast';document.body.appendChild(e)}e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1700)}
async function copy(t){try{await navigator.clipboard.writeText(t);toast('Copied')}catch{const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove();toast('Copied')}}
async function share(title,text){if(navigator.share){try{await navigator.share({title,text});return}catch(e){if(e&&e.name==='AbortError')return}}copy(text)}

function brief(s){
  const m=metrics(s),as=actions(s),cs=chases(s).slice(0,3),sp=monthSpend(s),b=budget(s),h=health(s),top=as[0];
  return `<div class="gi-scroll"><section class="gi-hero"><span class="gi-kicker">HOLY GRAIL INTELLIGENCE</span><h2>Your collection, turned into next moves.</h2><p>Grail IQ reads the information already inside VaultSignal and converts it into collector actions. These are workflow signals, not investment ratings.</p><div class="gi-score-ring"><div style="--score:${h}%"><b>${h}</b></div><div><span>Vault data health</span><small>Cost basis, reference values, storage, backups and budget tracking.</small></div></div></section><div class="gi-stat-grid"><div><span>Tracked value</span><b>${M(m.value)}</b><small>${m.cardQty+m.sealedQty} owned items</small></div><div><span>This month</span><b>${M(sp)}</b><small>${b?`${M(Math.max(0,b-sp))} budget left`:'Set a hobby budget'}</small></div><div><span>Rip sessions</span><b>${m.rips.length}</b><small>${m.battlesDone} battles finished</small></div><div><span>Top next move</span><b>${top.priority==='high'?'NOW':'NEXT'}</b><small>${E(top.title)}</small></div></div><section class="gi-panel"><div class="gi-section-head"><div><span class="gi-kicker">NEXT BEST MOVES</span><h3>What deserves attention</h3></div></div><div class="gi-actions">${as.map((a,i)=>`<div class="gi-action-card ${a.priority}"><span class="gi-priority">${i+1}</span><div><strong>${E(a.title)}</strong><small>${E(a.detail)}</small></div><button data-route="${a.route}">GO</button></div>`).join('')}</div></section><section class="gi-panel"><div class="gi-section-head"><div><span class="gi-kicker">CHASE PULSE</span><h3>Best-fit current chases</h3></div><button class="gi-chip" data-tab="chase">Open Chase</button></div>${cs.length?`<div class="gi-chase-list">${cs.map(x=>`<div class="gi-chase"><div><strong>${E(x.name)}</strong><small>${M(x.market)} current ref${x.target?` • ${M(x.target)} target`:''} • ${E(x.why.join(' • '))}</small><div class="gi-progress"><i style="width:${x.score}%"></i></div></div><div class="gi-fit">${x.score}<span>FIT</span></div></div>`).join('')}</div>`:'<div class="gi-empty">Add cards to Wishlist or Acquisition Queue and they will rank here.</div>'}</section><section class="gi-panel"><div class="gi-section-head"><div><span class="gi-kicker">WEEKLY REVIEW</span><h3>One-tap hobby recap</h3></div><button class="gi-chip" data-share-weekly>Share</button></div><div class="gi-week-card">${E(weekly(s))}</div></section></div>`;
}
function chaseView(s){const rows=chases(s),b=budget(s),left=Math.max(0,b-monthSpend(s));return `<div class="gi-scroll"><div class="gi-page-head"><div><span class="gi-kicker">CHASE COMMAND</span><h2>Rank the hunt around your collection.</h2></div></div><section class="gi-panel"><p>Collector Fit weighs target price, current reference, owned copies, priority and remaining hobby budget. It does not predict future prices.</p><div class="gi-stat-grid"><div><span>Remaining budget</span><b>${b?M(left):'—'}</b><small>${b?'This month':'No budget set'}</small></div><div><span>Active chases</span><b>${rows.length}</b><small>Wishlist + queue</small></div></div></section>${rows.length?`<div class="gi-chase-list">${rows.map((x,i)=>`<div class="gi-chase"><div><strong>#${i+1} ${E(x.name)}</strong><small>${E(x.game||'TCG')} • current ${M(x.market)}${x.target?` • target ${M(x.target)}`:''}</small><small>${E(x.why.join(' • ')||'Tracked chase')}</small><div class="gi-progress"><i style="width:${x.score}%"></i></div></div><div class="gi-fit">${x.score}<span>FIT</span></div></div>`).join('')}</div>`:`<section class="gi-panel"><div class="gi-empty">No chase cards yet.</div><button class="gi-primary" data-route="discover">Search cards</button></section>`}</div>`}
function ripKeep(s){const sealed=A(s.sealed),r=decisionResult(s);return `<div class="gi-scroll"><div class="gi-page-head"><div><span class="gi-kicker">RIP / KEEP LAB</span><h2>Make the opening decision personal.</h2></div></div><section class="gi-panel"><p>Compare your sealed reference, expected pull value, copies owned, chase interest, creator value and hobby budget. This is not financial advice or a profit forecast.</p></section><section class="gi-panel"><div class="gi-form"><div class="gi-field"><label>SEALED PRODUCT</label><select id="giSealed"><option value="">Choose tracked sealed item</option>${sealed.map(x=>`<option value="${E(x&&(x.uid||x.id)||'')}" ${String(decision.sealedId)===String(x&&(x.uid||x.id))?'selected':''}>${E(Name(x))} • ${Q(x)} owned</option>`).join('')}</select></div><div class="gi-field-grid"><div class="gi-field"><label>SEALED REFERENCE</label><input id="giSV" type="number" step="0.01" inputmode="decimal" value="${E(decision.sealedValue||r.sv||'')}"></div><div class="gi-field"><label>EXPECTED PULL VALUE</label><input id="giEV" type="number" step="0.01" inputmode="decimal" value="${E(decision.expected)}" placeholder="Optional"></div></div><div class="gi-field"><label>CONTENT VALUE TO YOU (0–50)</label><div class="gi-range-row"><input id="giCV" type="range" min="0" max="50" value="${r.cv}"><b>${r.cv}</b></div></div><div class="gi-field"><label>CHASE EXCITEMENT (1–5)</label><div class="gi-range-row"><input id="giCH" type="range" min="1" max="5" value="${r.ch}"><b>${r.ch}</b></div></div></div></section><section class="gi-decision-card"><div class="gi-decision-top"><div><span class="gi-kicker">CURRENT FIT</span><h3>${r.label}</h3></div><span class="gi-decision-badge">${E(Name(r.item||{}))}</span></div><div class="gi-dual-score"><div><span>RIP FIT</span><b>${r.rip}</b></div><div><span>KEEP FIT</span><b>${r.keep}</b></div></div><div class="gi-reasons">${r.reasons.length?r.reasons.map(x=>`<div>${E(x)}</div>`).join(''):'<div>Select a product and enter the values that matter to you.</div>'}</div><div class="gi-note">Pull outcomes are random. Reference values vary by condition, variant, language and marketplace. Grail IQ never guarantees profit.</div></section><div class="gi-action-row"><button class="gi-primary" data-save-decision>Save decision</button><button class="gi-secondary" data-route="tools">Product Tools</button></div></div>`}
function episodeView(s){const p=episode(s);return `<div class="gi-scroll"><div class="gi-page-head"><div><span class="gi-kicker">EPISODE BUILDER</span><h2>Turn the latest rip into a filming plan.</h2></div></div>${p?`<section class="gi-panel"><div class="gi-section-head"><div><span class="gi-kicker">LATEST OPENING</span><h3>${E(p.r.name)}</h3></div><span class="gi-chip">${E(p.r.game)}</span></div><div class="gi-stat-grid"><div><span>Packs</span><b>${p.r.packs||'—'}</b><small>Logged opening</small></div><div><span>Pull value</span><b>${M(p.r.value)}</b><small>${M(p.r.cost)} cost</small></div></div></section><section class="gi-panel"><div class="gi-section-head"><div><span class="gi-kicker">SHOT LIST</span><h3>Fast father-and-son pacing</h3></div></div><div class="gi-episode">${p.beats.map(x=>`<div class="gi-beat"><b>${E(x[0])}</b><div><strong>${E(x[1])}</strong><small>${E(x[2])}</small></div></div>`).join('')}</div></section><div class="gi-action-row"><button class="gi-primary" data-copy-episode>Copy rundown</button><button class="gi-secondary" data-creator-content>Content Engine</button></div>`:`<section class="gi-panel"><div class="gi-empty">Log a Rip Session and Grail IQ will build an episode rundown automatically.</div><button class="gi-primary" data-route="tools">Open Rip Lab</button></section>`}</div>`}
function questView(s){const list=quests(s),u=list.filter(x=>x.ok).length;return `<div class="gi-scroll"><div class="gi-page-head"><div><span class="gi-kicker">COLLECTION QUEST</span><h2>Make progress visible.</h2></div></div><section class="gi-hero"><span class="gi-kicker">FAMILY PROGRESS</span><h2>${u} / ${list.length} milestones unlocked</h2><p>Milestones reward organizing, collecting and creating — not spending more money than you planned.</p><div class="gi-progress"><i style="width:${u/list.length*100}%"></i></div></section><div class="gi-quest-grid">${list.map(x=>`<div class="gi-quest-card ${x.ok?'unlocked':''}"><b>${x.icon}</b><strong>${E(x.title)}</strong><small>${E(x.desc)}</small><em>${x.ok?'UNLOCKED':'IN PROGRESS'}</em></div>`).join('')}</div></div>`}

function render(){const s=sync(S()),o=document.getElementById('grailIntelligence');if(!o)return;const tabs=[['brief','Brief'],['chase','Chase'],['ripkeep','Rip / Keep'],['episode','Episode'],['quest','Quest']],views={brief,chase:chaseView,ripkeep:ripKeep,episode:episodeView,quest:questView};o.innerHTML=`<div class="gi-shell"><header class="gi-top"><div class="gi-brand"><div class="gi-mark">IQ</div><div><strong>Grail Intelligence</strong><span>VaultSignal v14 • Collector decision layer</span></div></div><button class="gi-close" aria-label="Close">×</button></header><nav class="gi-tabs">${tabs.map(x=>`<button class="${tab===x[0]?'active':''}" data-tab="${x[0]}">${x[1]}</button>`).join('')}</nav>${views[tab](s)}</div>`;bind()}
function bind(){
  const r=document.getElementById('grailIntelligence');if(!r)return;
  r.querySelector('.gi-close')?.addEventListener('click',close);
  r.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.tab;render()}));
  r.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>route(b.dataset.route)));
  r.querySelector('[data-share-weekly]')?.addEventListener('click',()=>share('VaultSignal Weekly Review',weekly(S())));
  r.querySelector('[data-copy-episode]')?.addEventListener('click',()=>copy(episodeText(S())));
  r.querySelector('[data-creator-content]')?.addEventListener('click',()=>{close();if(window.VaultSignalCreatorCommand&&window.VaultSignalCreatorCommand.open)window.VaultSignalCreatorCommand.open('content')});
  const sel=r.querySelector('#giSealed'),sv=r.querySelector('#giSV'),ev=r.querySelector('#giEV'),cv=r.querySelector('#giCV'),ch=r.querySelector('#giCH');
  sel?.addEventListener('change',()=>{const s=S(),item=A(s.sealed).find(x=>String(x&&(x.uid||x.id))===sel.value);decision.sealedId=sel.value;decision.sealedValue=SealV(item)||'';render()});
  const upd=()=>{decision.sealedId=sel?sel.value:decision.sealedId;decision.sealedValue=sv?sv.value:'';decision.expected=ev?ev.value:'';decision.content=cv?N(cv.value):decision.content;decision.chase=ch?N(ch.value):decision.chase;render()};
  sv?.addEventListener('change',upd);ev?.addEventListener('change',upd);cv?.addEventListener('change',upd);ch?.addEventListener('change',upd);
  r.querySelector('[data-save-decision]')?.addEventListener('click',saveDecision);
}
function open(t='brief'){tab=t;let o=document.getElementById('grailIntelligence');if(!o){o=document.createElement('div');o.id='grailIntelligence';o.className='gi-overlay';document.body.appendChild(o)}o.classList.add('open');document.body.classList.add('gi-open');render()}
function close(){document.getElementById('grailIntelligence')?.classList.remove('open');document.body.classList.remove('gi-open')}
function injectTop(){const top=document.querySelector('.topbar');if(!top||document.getElementById('giTopEntry'))return;const b=document.createElement('button');b.id='giTopEntry';b.className='gi-top-entry';b.textContent='GRAIL IQ';b.addEventListener('click',()=>open());top.appendChild(b)}
function injectHome(){const h=document.getElementById('home');if(!h||document.getElementById('giHomeBrief'))return;const a=actions(S())[0];const c=document.createElement('div');c.id='giHomeBrief';c.className='gi-home-brief';c.innerHTML=`<div><span class="gi-label">GRAIL IQ • NEXT MOVE</span><b>${E(a.title)}</b><small>${E(a.detail)}</small></div><button>OPEN</button>`;c.querySelector('button').addEventListener('click',()=>open());h.prepend(c)}
function injectCreator(){const p=document.getElementById('creatorCommandPanel');if(!p||p.querySelector('.gi-creator-link'))return;const h=p.querySelector('.cc-top');if(!h)return;const b=document.createElement('button');b.className='gi-creator-link gi-top-entry';b.textContent='IQ';b.addEventListener('click',()=>{if(window.VaultSignalCreatorCommand&&window.VaultSignalCreatorCommand.close)window.VaultSignalCreatorCommand.close();open()});h.insertBefore(b,h.lastElementChild)}
function init(){sync(S());injectTop();injectHome();injectCreator();const mo=new MutationObserver(()=>{injectTop();injectHome();injectCreator()});mo.observe(document.body,{childList:true,subtree:true});window.VaultSignalGrail={open,close,version:'14.0.0',weeklyReview:()=>weekly(S()),nextActions:()=>actions(S())}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,100));else setTimeout(init,100);
})();
