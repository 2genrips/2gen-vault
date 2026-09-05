(() => {
'use strict';

const STORAGE_KEY='2gen-vault-collector-os-v4';
const ROOM_DEFS=[
  {id:'for-you',name:'For You',icon:'✦',desc:'Signals matched to your watches and collection'},
  {id:'pokemon-drops',name:'Pokémon Drops',icon:'⚡',desc:'Restocks, preorders and checkout reports'},
  {id:'local-finds',name:'Local Finds',icon:'◎',desc:'Community shelf reports by broad ZIP area'},
  {id:'deals',name:'Deals',icon:'$',desc:'Price drops and retail deals'},
  {id:'pulls',name:'Big Pulls',icon:'◇',desc:'Hits worth celebrating'},
  {id:'trade-talk',name:'Trade Talk',icon:'⇄',desc:'Trade discussion without DMs'},
  {id:'creator-lab',name:'Creator Lab',icon:'▶',desc:'Titles, thumbnails and creator ideas'}
];
const TYPES={DROP:'DROP',FOUND:'FOUND',GONE:'SOLD OUT',LIMIT:'LIMIT',CHECKOUT:'CHECKOUT',DEAL:'DEAL',PULL:'PULL',INFO:'INFO'};
let activeRoom='for-you';
let selectedPostId='';
let realtimeChannel=null;
let presenceCount=0;

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const arr=v=>Array.isArray(v)?v:[];
const num=v=>{const n=Number(v||0);return Number.isFinite(n)?n:0};
const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const uid=(p='sig')=>`${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
const now=()=>new Date().toISOString();
function read(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{return {}}}
function write(s){localStorage.setItem(STORAGE_KEY,JSON.stringify(s))}
function ensure(s){
  s.signalNetwork=s.signalNetwork||{};
  s.signalNetwork.version=17;
  s.signalNetwork.posts=arr(s.signalNetwork.posts);
  s.signalNetwork.reactions=s.signalNetwork.reactions||{};
  s.signalNetwork.reported=arr(s.signalNetwork.reported);
  s.signalNetwork.followedRooms=arr(s.signalNetwork.followedRooms).length?s.signalNetwork.followedRooms:['pokemon-drops','local-finds'];
  s.signalNetwork.lastSeen=s.signalNetwork.lastSeen||{};
  return s;
}
function state(){return ensure(read())}
function save(s){write(ensure(s))}
function cloud(){return window.TWOGEN_CLOUD||{}}
function cloudLive(){return Boolean(cloud().configured&&cloud().client&&cloud().user)}
function roomDef(id){return ROOM_DEFS.find(r=>r.id===id)||ROOM_DEFS[0]}
function ageMinutes(date){const t=new Date(date||0).getTime();return Number.isFinite(t)?Math.max(0,Math.floor((Date.now()-t)/60000)):99999}
function ageLabel(date){const m=ageMinutes(date);if(m<1)return'now';if(m<60)return`${m}m`;const h=Math.floor(m/60);if(h<24)return`${h}h`;return`${Math.floor(h/24)}d`}
function broadZip(v){const z=String(v||'').replace(/\D/g,'');return z.length>=3?`${z.slice(0,3)}xx`:''}
function cleanRegion(v){const z=broadZip(v);return z||String(v||'').slice(0,28)}
function watchTerms(s){
  const source=[...arr(s.stockWatches),...arr(s.wishlist),...arr(s.acquisitionQueue),...arr(s.chaseList)];
  return [...new Set(source.flatMap(x=>[x.product,x.name,x.cardName,x.query,x.set].filter(Boolean).map(v=>String(v).toLowerCase())).filter(x=>x.length>2))].slice(0,30);
}
function profileName(){return cloud().profile?.display_name||cloud().user?.user_metadata?.display_name||'Collector'}
function authorKey(p){return p.user_id||p.authorId||p.author||'local'}
function reactionsFor(s,id){return s.signalNetwork.reactions[id]||{confirm:0,gone:0,helpful:0}}
function trustFor(s,author){
  const posts=allLocalPosts(s).filter(p=>authorKey(p)===author);
  if(!posts.length)return 50;
  let confirms=0,gone=0,helpful=0;
  posts.forEach(p=>{const r=reactionsFor(s,p.id);confirms+=num(r.confirm);gone+=num(r.gone);helpful+=num(r.helpful)});
  return Math.max(20,Math.min(99,Math.round(50+confirms*5+helpful*2-gone*3)));
}
function freshnessScore(p){const m=ageMinutes(p.created_at||p.createdAt);if(m<=5)return 30;if(m<=15)return 25;if(m<=30)return 20;if(m<=60)return 14;if(m<=180)return 8;return 2}
function signalScore(s,p){const r=reactionsFor(s,p.id);const base=freshnessScore(p)+num(r.confirm)*8+num(r.helpful)*3-num(r.gone)*7;return Math.max(0,Math.min(100,Math.round(base+trustFor(s,authorKey(p))*.35)))}
function seedPosts(){
  return [
    {id:'demo-1',room:'pokemon-drops',type:'DROP',title:'Example drop signal',product:'Pokémon TCG product',retailer:'Retailer',region:'287xx',body:'This is a local preview card showing how a structured drop room works before cloud community mode is connected.',author:'VaultSignal Demo',created_at:new Date(Date.now()-8*60000).toISOString(),demo:true},
    {id:'demo-2',room:'local-finds',type:'FOUND',title:'Example local shelf report',product:'Booster product',retailer:'Local store',region:'287xx',body:'Reports show only a broad ZIP area by default—never a home address or precise family location.',author:'VaultSignal Demo',created_at:new Date(Date.now()-24*60000).toISOString(),demo:true},
    {id:'demo-3',room:'creator-lab',type:'INFO',title:'Creator room',product:'2GEN RIPS',retailer:'',region:'',body:'Turn a confirmed hunt or pull into a Creator Command post kit without copying details into another app.',author:'VaultSignal Demo',created_at:new Date(Date.now()-44*60000).toISOString(),demo:true}
  ];
}
function allLocalPosts(s){return [...s.signalNetwork.posts,...seedPosts()]}
function matchesForYou(s,p){
  if(p.demo&&p.room==='creator-lab')return false;
  const terms=watchTerms(s);if(!terms.length)return ['pokemon-drops','local-finds','deals'].includes(p.room);
  const hay=`${p.title||''} ${p.product||''} ${p.body||''}`.toLowerCase();
  return terms.some(t=>hay.includes(t));
}
function filteredPosts(s){
  let posts=allLocalPosts(s).filter(p=>!s.signalNetwork.reported.includes(p.id));
  if(activeRoom==='for-you')posts=posts.filter(p=>matchesForYou(s,p));else posts=posts.filter(p=>p.room===activeRoom);
  return posts.sort((a,b)=>String(b.created_at||b.createdAt).localeCompare(String(a.created_at||a.createdAt))).slice(0,80);
}
function roomUnread(s,id){const last=new Date(s.signalNetwork.lastSeen[id]||0).getTime();return allLocalPosts(s).filter(p=>p.room===id&&new Date(p.created_at||p.createdAt).getTime()>last).length}
function markSeen(id){const s=state();s.signalNetwork.lastSeen[id]=now();save(s)}

async function fetchCloudPosts(room){
  if(!cloudLive())return [];
  try{
    let q=cloud().client.from('signal_posts').select('id,user_id,room,type,title,product,retailer,region,body,created_at').order('created_at',{ascending:false}).limit(80);
    if(room&&room!=='for-you')q=q.eq('room',room);
    const {data,error}=await q;if(error)throw error;return data||[];
  }catch{return []}
}
async function syncCloud(){
  const s=state(),rows=await fetchCloudPosts(activeRoom);
  if(rows.length){
    const seen=new Set(s.signalNetwork.posts.map(p=>p.id));rows.forEach(p=>{if(!seen.has(p.id))s.signalNetwork.posts.push(p)});
    s.signalNetwork.posts=s.signalNetwork.posts.filter(p=>!p.demo).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).slice(0,250);save(s);render();
  }
}
function leaveRealtime(){if(realtimeChannel&&cloud().client){try{cloud().client.removeChannel(realtimeChannel)}catch{}}realtimeChannel=null;presenceCount=0}
function joinRealtime(){
  leaveRealtime();if(!cloudLive())return;
  const room=activeRoom==='for-you'?'community':activeRoom;
  try{
    realtimeChannel=cloud().client.channel(`signal:${room}`,{config:{presence:{key:cloud().user.id}}});
    realtimeChannel.on('broadcast',{event:'signal'},({payload})=>{if(payload?.post){const s=state();if(!s.signalNetwork.posts.some(p=>p.id===payload.post.id)){s.signalNetwork.posts.unshift(payload.post);save(s);render()}}});
    realtimeChannel.on('presence',{event:'sync'},()=>{const ps=realtimeChannel.presenceState?.()||{};presenceCount=Object.values(ps).reduce((a,v)=>a+arr(v).length,0);updatePresence()});
    realtimeChannel.subscribe(async status=>{if(status==='SUBSCRIBED')await realtimeChannel.track({user_id:cloud().user.id,room,online_at:now()})});
  }catch{}
}
function updatePresence(){const el=$('#snPresence');if(el)el.textContent=cloudLive()?`${presenceCount||1} online`:'Local preview'}
async function publishPost(data){
  const s=state();
  const post={id:uid('post'),user_id:cloud().user?.id||'local-me',author:profileName(),room:data.room,type:data.type,title:data.title||`${data.type}: ${data.product||'Community signal'}`,product:data.product||'',retailer:data.retailer||'',region:cleanRegion(data.region),body:data.body||'',created_at:now()};
  if(cloudLive()){
    try{
      const payload={user_id:cloud().user.id,room:post.room,type:post.type,title:post.title,product:post.product,retailer:post.retailer,region:post.region,body:post.body};
      const {data:row,error}=await cloud().client.from('signal_posts').insert(payload).select().single();if(error)throw error;Object.assign(post,row);
      await realtimeChannel?.send?.({type:'broadcast',event:'signal',payload:{post}});
    }catch(e){toast(`Saved locally • cloud post unavailable`)}
  }
  s.signalNetwork.posts.unshift(post);s.signalNetwork.posts=s.signalNetwork.posts.slice(0,250);save(s);activeRoom=post.room;render();toast(cloudLive()?'Signal posted':'Signal saved in local preview');
}
function react(id,kind){const s=state();const r=reactionsFor(s,id);r[kind]=num(r[kind])+1;s.signalNetwork.reactions[id]=r;save(s);render()}
function reportPost(id){const s=state();if(!s.signalNetwork.reported.includes(id))s.signalNetwork.reported.push(id);save(s);render();toast('Hidden and marked for review locally')}
function followRoom(id){const s=state(),list=s.signalNetwork.followedRooms;const i=list.indexOf(id);if(i>=0)list.splice(i,1);else list.push(id);save(s);render()}
function openRoute(tab){close();document.querySelector(`.bottom-nav [data-tab="${tab}"]`)?.click()}
function openJourney(){close();window.VaultSignalJourney?.open?.('journey')}
function openCreator(){close();window.VaultSignalCreatorCommand?.open?.('home')}
function toast(text){let t=$('#snToast');if(!t){t=document.createElement('div');t.id='snToast';t.className='sn-toast';document.body.appendChild(t)}t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1700)}

function typeClass(t){return `sn-type ${String(t||'INFO').toLowerCase().replace(/\s/g,'-')}`}
function postCard(s,p){const r=reactionsFor(s,p.id),score=signalScore(s,p),trust=trustFor(s,authorKey(p));const war=['DROP','FOUND','CHECKOUT','LIMIT'].includes(p.type);
  return `<article class="sn-post ${war?'war':''}" data-post="${esc(p.id)}"><div class="sn-post-top"><span class="${typeClass(p.type)}">${esc(p.type||'INFO')}</span><span>${ageLabel(p.created_at||p.createdAt)} • ${esc(p.region||'Community')}</span><button data-report="${esc(p.id)}">•••</button></div><h3>${esc(p.title||p.product||'Community signal')}</h3><div class="sn-meta">${p.retailer?`<b>${esc(p.retailer)}</b>`:''}${p.product?`<span>${esc(p.product)}</span>`:''}</div><p>${esc(p.body||'')}</p><div class="sn-author"><span>${esc(p.author||p.display_name||'Collector')} • Trust ${trust}</span><strong>${score} SIGNAL</strong></div><div class="sn-react"><button data-react="confirm" data-id="${esc(p.id)}">✓ ${r.confirm||0}</button><button data-react="gone" data-id="${esc(p.id)}">Gone ${r.gone||0}</button><button data-react="helpful" data-id="${esc(p.id)}">Helpful ${r.helpful||0}</button>${war?`<button class="sn-war-btn" data-war="${esc(p.id)}">WAR ROOM</button>`:''}</div></article>`}
function header(){const live=cloudLive();return `<header class="sn-top"><div><div class="sn-mark">⚡</div><div><strong>Signal Network</strong><span>VaultSignal v17 • structured community intelligence</span></div></div><button id="snClose">×</button></header><div class="sn-livebar"><span class="${live?'live':''}">${live?'● LIVE COMMUNITY':'● LOCAL PREVIEW'}</span><b id="snPresence">${live?'1 online':'Local preview'}</b><small>${live?'Realtime community enabled':'Connect Supabase to make rooms multi-user'}</small></div>`}
function roomsNav(s){return `<nav class="sn-rooms">${ROOM_DEFS.map(r=>{const unread=r.id==='for-you'?0:roomUnread(s,r.id);return `<button data-room="${r.id}" class="${activeRoom===r.id?'active':''}"><b>${r.icon}</b><span>${esc(r.name)}</span>${unread?`<i>${unread}</i>`:''}</button>`}).join('')}</nav>`}
function feedView(){const s=state(),posts=filteredPosts(s),r=roomDef(activeRoom),following=s.signalNetwork.followedRooms.includes(activeRoom);return `<div class="sn-scroll"><section class="sn-hero"><div><span class="sn-kicker"># ${esc(r.name.toUpperCase())}</span><h2>${esc(r.desc)}</h2><p>Fast like Discord, but every report has a type, freshness, confidence, reactions and direct actions.</p></div>${activeRoom!=='for-you'?`<button class="sn-follow ${following?'on':''}" data-follow="${activeRoom}">${following?'FOLLOWING':'FOLLOW'}</button>`:''}</section><div class="sn-actions"><button data-compose="1">+ POST SIGNAL</button><button data-stock="1">◎ STOCK</button><button data-inbox="1">✦ SMART INBOX</button></div><section class="sn-feed">${posts.length?posts.map(p=>postCard(s,p)).join(''):'<div class="sn-empty"><b>Quiet room</b><p>No signals here yet. Follow the room or post the first structured report.</p></div>'}</section></div>`}
function composeView(){const s=state(),homeZip=s.settings?.zip||s.settings?.homeZip||cloud().profile?.home_zip||'';return `<div class="sn-scroll"><section class="sn-hero"><span class="sn-kicker">POST A STRUCTURED SIGNAL</span><h2>Useful information, not chat noise.</h2><p>Precise home locations are never required. Local finds default to a broad ZIP area.</p></section><section class="sn-panel"><div class="sn-form"><label>Room<select id="snRoom">${ROOM_DEFS.filter(r=>r.id!=='for-you').map(r=>`<option value="${r.id}" ${r.id===(activeRoom==='for-you'?'pokemon-drops':activeRoom)?'selected':''}>${esc(r.name)}</option>`).join('')}</select></label><label>Signal type<select id="snType">${Object.values(TYPES).map(t=>`<option>${t}</option>`).join('')}</select></label><label>Product / topic<input id="snProduct" placeholder="Example: Pokémon 151 Booster Bundle"></label><label>Retailer / source<input id="snRetailer" placeholder="Target, Walmart, Pokémon Center..."></label><label>Broad ZIP area<input id="snRegion" inputmode="numeric" value="${esc(broadZip(homeZip))}" placeholder="287xx"></label><label>What happened?<textarea id="snBody" maxlength="420" placeholder="What collectors need to know: quantity, limit, line status, checkout success, etc."></textarea></label><button class="sn-primary" id="snPublish">POST SIGNAL</button></div></section><section class="sn-safety"><b>Community safety</b><p>No home addresses, precise family locations, payment info, harassment, queue bypass instructions or private child contact. Signal Network is built around public structured rooms rather than direct messages.</p></section></div>`}
function inboxView(){const s=state(),terms=watchTerms(s),posts=allLocalPosts(s).filter(p=>matchesForYou(s,p)).sort((a,b)=>signalScore(s,b)-signalScore(s,a)).slice(0,20);return `<div class="sn-scroll"><section class="sn-hero"><span class="sn-kicker">SMART INBOX</span><h2>Let the app read the rooms for you.</h2><p>Instead of checking ten Discord channels, VaultSignal ranks community signals against your existing watches and chase data.</p></section><section class="sn-panel"><span class="sn-kicker">MATCHING TERMS</span><div class="sn-tags">${terms.length?terms.slice(0,12).map(t=>`<span>${esc(t)}</span>`).join(''):'<span>Add product watches to personalize this feed</span>'}</div></section>${posts.map(p=>postCard(s,p)).join('')||'<div class="sn-empty">No matched signals yet.</div>'}</div>`}
function warView(){const s=state(),p=allLocalPosts(s).find(x=>x.id===selectedPostId);if(!p)return feedView();const r=reactionsFor(s,p.id),score=signalScore(s,p);return `<div class="sn-scroll"><section class="sn-war-hero"><span class="${typeClass(p.type)}">${esc(p.type)}</span><h2>${esc(p.product||p.title)}</h2><p>${esc(p.retailer||'Community source')} • ${esc(p.region||'Online')} • ${ageLabel(p.created_at)} ago</p><strong>${score} SIGNAL</strong></section><div class="sn-war-grid"><div><span>Confirmed</span><b>${r.confirm||0}</b></div><div><span>Gone</span><b>${r.gone||0}</b></div><div><span>Helpful</span><b>${r.helpful||0}</b></div><div><span>Freshness</span><b>${freshnessScore(p)}</b></div></div><section class="sn-panel"><span class="sn-kicker">LIVE BRIEF</span><h3>${esc(p.title)}</h3><p>${esc(p.body||'No additional notes.')}</p></section><div class="sn-war-actions"><button data-react="confirm" data-id="${esc(p.id)}">✓ STILL LIVE</button><button data-react="gone" data-id="${esc(p.id)}">SOLD OUT</button><button data-stock="1">OPEN STOCK TOOLS</button></div><section class="sn-safety"><b>Fair-access rule</b><p>War Room helps you react faster to legitimate public availability. It does not bypass retailer queues, CAPTCHAs, purchase limits or checkout controls.</p></section></div>`}
let view='feed';
function render(){let root=$('#signalNetworkPanel');if(!root)return;const s=state();root.innerHTML=`<div class="sn-shell">${header()}${roomsNav(s)}${view==='compose'?composeView():view==='inbox'?inboxView():view==='war'?warView():feedView()}</div>`;bind();updatePresence()}
function bind(){
  $('#snClose')?.addEventListener('click',close);
  $$('[data-room]').forEach(b=>b.addEventListener('click',()=>{activeRoom=b.dataset.room;view='feed';markSeen(activeRoom);joinRealtime();render();syncCloud()}));
  $$('[data-compose]').forEach(b=>b.addEventListener('click',()=>{view='compose';render()}));
  $$('[data-inbox]').forEach(b=>b.addEventListener('click',()=>{view='inbox';render()}));
  $$('[data-stock]').forEach(b=>b.addEventListener('click',()=>openRoute('stock')));
  $$('[data-follow]').forEach(b=>b.addEventListener('click',()=>followRoom(b.dataset.follow)));
  $$('[data-react]').forEach(b=>b.addEventListener('click',()=>react(b.dataset.id,b.dataset.react)));
  $$('[data-war]').forEach(b=>b.addEventListener('click',()=>{selectedPostId=b.dataset.war;view='war';render()}));
  $$('[data-report]').forEach(b=>b.addEventListener('click',()=>reportPost(b.dataset.report)));
  $('#snPublish')?.addEventListener('click',()=>{const product=$('#snProduct')?.value.trim(),body=$('#snBody')?.value.trim();if(!product&&!body){toast('Add a product or report details');return}publishPost({room:$('#snRoom').value,type:$('#snType').value,product,retailer:$('#snRetailer').value.trim(),region:$('#snRegion').value.trim(),body,title:`${$('#snType').value}: ${product||'Community signal'}`})});
}
function open(room='for-you'){activeRoom=room;view='feed';let root=$('#signalNetworkPanel');if(!root){root=document.createElement('div');root.id='signalNetworkPanel';root.className='sn-overlay';document.body.appendChild(root)}root.classList.add('open');document.body.classList.add('sn-open');markSeen(activeRoom);render();joinRealtime();syncCloud()}
function close(){leaveRealtime();$('#signalNetworkPanel')?.classList.remove('open');document.body.classList.remove('sn-open')}
function inject(){
  if(!$('#signalNetworkFab')){const b=document.createElement('button');b.id='signalNetworkFab';b.className='sn-fab';b.innerHTML='<b>⚡</b><span>Signals</span>';b.addEventListener('click',()=>open('for-you'));document.body.appendChild(b)}
  const top=$('.topbar');if(top&&!$('#signalNetworkTop')){const b=document.createElement('button');b.id='signalNetworkTop';b.className='sn-top-entry';b.textContent='SIGNALS';b.addEventListener('click',()=>open('for-you'));top.appendChild(b)}
  const home=$('#home');if(home&&!$('#signalNetworkHome')){const s=state(),matched=allLocalPosts(s).filter(p=>matchesForYou(s,p)).length;const card=document.createElement('div');card.id='signalNetworkHome';card.className='sn-home';card.innerHTML=`<div><span>SIGNAL NETWORK</span><b>${matched} matched signal${matched===1?'':'s'}</b><small>Discord-speed community reports, structured for your watches</small></div><button>OPEN</button>`;card.querySelector('button').addEventListener('click',()=>open('for-you'));home.prepend(card)}
}
function init(){const s=state();save(s);inject();window.VaultSignalNetwork={open,close,version:'17.0.0'};window.addEventListener('twogen-auth-changed',()=>{if($('#signalNetworkPanel')?.classList.contains('open')){joinRealtime();syncCloud()}});const obs=new MutationObserver(()=>inject());obs.observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,100));else setTimeout(init,100);
})();
