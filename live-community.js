(() => {
'use strict';

const STORAGE_KEY='2gen-vault-collector-os-v4';
const ROOMS=[
  ['pokemon-drops','Pokémon Drops'],['local-finds','Local Finds'],['deals','Deals'],['pulls','Big Pulls'],['trade-talk','Trade Talk'],['creator-lab','Creator Lab']
];
let tab='account';
let authMode='signin';
let cloudSnapshot={profile:null,prefs:null,blocks:[],reputation:null};
let hardenedClient=null;

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const arr=v=>Array.isArray(v)?v:[];
const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const now=()=>new Date().toISOString();
function read(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{return {}}}
function write(s){localStorage.setItem(STORAGE_KEY,JSON.stringify(s))}
function ensure(s){
  s.communityCore=s.communityCore||{};
  s.communityCore.version=18;
  s.communityCore.blockedUsers=arr(s.communityCore.blockedUsers);
  s.communityCore.mutedUsers=arr(s.communityCore.mutedUsers);
  s.communityCore.notificationPrefs=s.communityCore.notificationPrefs||{enabled:false,minScore:60,urgentOnly:false,quietStart:'22:00',quietEnd:'07:00',rooms:['pokemon-drops','local-finds','deals']};
  s.communityCore.lastSafetyReview=s.communityCore.lastSafetyReview||null;
  return s;
}
function state(){return ensure(read())}
function save(s){write(ensure(s))}
function cloud(){return window.TWOGEN_CLOUD||{}}
function live(){return Boolean(cloud().configured&&cloud().client&&cloud().user)}
function cfg(){return window.TWOGEN_CONFIG||{}}
function toast(text){let t=$('#lcToast');if(!t){t=document.createElement('div');t.id='lcToast';t.className='lc-toast';document.body.appendChild(t)}t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
function broadRegion(v){const z=String(v||'').replace(/\D/g,'');return z.length>=3?`${z.slice(0,3)}xx`:String(v||'').slice(0,24)}
function profileName(){return cloudSnapshot.profile?.display_name||cloud().profile?.display_name||cloud().user?.user_metadata?.display_name||'Collector'}

function hardenRealtimeClient(){
  const client=cloud().client;
  if(!client||client===hardenedClient||client.__vaultSignalPrivateChannels)return;
  const original=client.channel.bind(client);
  client.channel=(topic,options={})=>{
    if(String(topic||'').startsWith('signal:')){
      const next={...options,config:{...(options.config||{}),private:true}};
      return original(topic,next);
    }
    return original(topic,options);
  };
  client.__vaultSignalPrivateChannels=true;
  hardenedClient=client;
}

async function loadCloudState(){
  if(!live()){cloudSnapshot={profile:null,prefs:null,blocks:[],reputation:null};return cloudSnapshot}
  hardenRealtimeClient();
  const c=cloud().client,u=cloud().user.id;
  try{
    const [p,pr,b,r]=await Promise.all([
      c.from('community_profiles').select('*').eq('user_id',u).maybeSingle(),
      c.from('notification_preferences').select('*').eq('user_id',u).maybeSingle(),
      c.from('user_blocks').select('blocked_id,created_at').eq('blocker_id',u),
      c.from('community_reputation').select('*').eq('user_id',u).maybeSingle()
    ]);
    cloudSnapshot.profile=p.data||null;
    cloudSnapshot.prefs=pr.data||null;
    cloudSnapshot.blocks=b.data||[];
    cloudSnapshot.reputation=r.data||null;
    const s=state();
    s.communityCore.blockedUsers=[...new Set([...s.communityCore.blockedUsers,...cloudSnapshot.blocks.map(x=>x.blocked_id)])];
    if(cloudSnapshot.prefs){
      s.communityCore.notificationPrefs={...s.communityCore.notificationPrefs,enabled:Boolean(cloudSnapshot.prefs.enabled),minScore:Number(cloudSnapshot.prefs.min_score??60),urgentOnly:Boolean(cloudSnapshot.prefs.urgent_only),quietStart:String(cloudSnapshot.prefs.quiet_start||'22:00').slice(0,5),quietEnd:String(cloudSnapshot.prefs.quiet_end||'07:00').slice(0,5),rooms:arr(cloudSnapshot.prefs.rooms)};
    }
    save(s);
  }catch{}
  return cloudSnapshot;
}

async function authAction(){
  const email=$('#lcEmail')?.value.trim();
  const password=$('#lcPassword')?.value||'';
  const name=$('#lcDisplayName')?.value.trim()||'Collector';
  if(!email){toast('Enter your email');return}
  try{
    if(authMode==='signup'){
      if(password.length<6){toast('Use a password with at least 6 characters');return}
      await window.twogenCloudSignUp?.(email,password,name);toast('Account created • check email if confirmation is enabled');
    }else if(authMode==='magic'){
      await window.twogenCloudMagicLink?.(email);toast('Magic sign-in link sent');
    }else{
      if(!password){toast('Enter your password');return}
      await window.twogenCloudSignIn?.(email,password);toast('Signed in');
    }
    setTimeout(async()=>{await loadCloudState();render()},250);
  }catch(e){toast(e?.message||'Account action failed')}
}
async function signOut(){try{await window.twogenCloudSignOut?.();cloudSnapshot={profile:null,prefs:null,blocks:[],reputation:null};render();toast('Signed out')}catch(e){toast(e?.message||'Could not sign out')}}
async function saveProfile(){
  if(!live()){toast('Connect cloud and sign in first');return}
  const display=$('#lcProfileName')?.value.trim()||'Collector';
  const region=broadRegion($('#lcProfileRegion')?.value||'');
  try{
    await window.twogenCloudSaveProfile?.(display,'');
    const {error}=await cloud().client.rpc('update_my_community_profile',{p_display_name:display,p_broad_region:region});
    if(error)throw error;
    await loadCloudState();render();toast('Community profile saved');
  }catch(e){toast(e?.message||'Profile could not be saved')}
}
function localReputation(){
  const s=state(),posts=arr(s.signalNetwork?.posts).filter(p=>(p.user_id||'')===(cloud().user?.id||'local-me'));
  let helpful=0,confirm=0,gone=0;
  posts.forEach(p=>{const r=s.signalNetwork?.reactions?.[p.id]||{};helpful+=Number(r.helpful||0);confirm+=Number(r.confirm||0);gone+=Number(r.gone||0)});
  const score=Math.max(20,Math.min(99,Math.round(50+helpful*2+confirm*4-gone*2)));
  return {score,posts:posts.length,helpful,confirm,gone};
}
function reputation(){const r=cloudSnapshot.reputation;if(r)return{score:Number(r.reputation_score||50),posts:Number(r.post_count||0),helpful:Number(r.helpful_count||0),confirm:Number(r.confirm_count||0),gone:Number(r.gone_count||0)};return localReputation()}

async function savePrefs(){
  const s=state(),p=s.communityCore.notificationPrefs;
  p.enabled=Boolean($('#lcNotifyEnabled')?.checked);
  p.minScore=Math.max(0,Math.min(100,Number($('#lcMinScore')?.value||60)));
  p.urgentOnly=Boolean($('#lcUrgentOnly')?.checked);
  p.quietStart=$('#lcQuietStart')?.value||'22:00';p.quietEnd=$('#lcQuietEnd')?.value||'07:00';
  save(s);
  if(live()){
    try{
      const payload={user_id:cloud().user.id,enabled:p.enabled,min_score:p.minScore,urgent_only:p.urgentOnly,quiet_start:p.quietStart,quiet_end:p.quietEnd,rooms:p.rooms,updated_at:now()};
      const {error}=await cloud().client.from('notification_preferences').upsert(payload,{onConflict:'user_id'});if(error)throw error;
    }catch(e){toast('Saved locally • cloud preference sync unavailable');return}
  }
  toast('Alert preferences saved');render();
}
async function toggleRoom(room){
  const s=state(),rooms=s.communityCore.notificationPrefs.rooms;const i=rooms.indexOf(room);if(i>=0)rooms.splice(i,1);else rooms.push(room);save(s);render();
  if(live())savePrefs();
}
function urlBase64ToUint8Array(base64String){const padding='='.repeat((4-base64String.length%4)%4);const base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');const raw=atob(base64);return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))}
async function enablePush(){
  if(!('Notification'in window)||!('serviceWorker'in navigator)){toast('Push notifications are not supported here');return}
  const permission=await Notification.requestPermission();if(permission!=='granted'){toast('Notification permission was not granted');return}
  const s=state();s.communityCore.notificationPrefs.enabled=true;save(s);
  const publicKey=String(cfg().webPushPublicKey||'').trim();
  if(!publicKey){toast('Notifications allowed • server push key still needs cloud setup');render();return}
  if(!live()){toast('Sign in before registering cross-device push');render();return}
  try{
    const reg=await navigator.serviceWorker.ready;
    let sub=await reg.pushManager.getSubscription();
    if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(publicKey)});
    const json=sub.toJSON();
    const payload={user_id:cloud().user.id,endpoint:sub.endpoint,p256dh:json.keys?.p256dh||'',auth:json.keys?.auth||'',user_agent:navigator.userAgent.slice(0,240),last_seen_at:now()};
    const {error}=await cloud().client.from('push_subscriptions').upsert(payload,{onConflict:'endpoint'});if(error)throw error;
    await savePrefs();toast('Push alerts connected');render();
  }catch(e){toast(e?.message||'Push registration failed')}
}
async function testNotification(){if(Notification.permission!=='granted'){await enablePush();return}const reg=await navigator.serviceWorker.ready;await reg.showNotification('VaultSignal test signal',{body:'Signal Network notifications are enabled on this device.',tag:'vaultsignal-test',data:{url:'./'}})}

function recentAuthors(){
  const s=state(),map=new Map();
  arr(s.signalNetwork?.posts).forEach(p=>{const id=p.user_id||p.authorId;if(id&&id!==cloud().user?.id&&!map.has(id))map.set(id,{id,name:p.author||p.display_name||'Collector'})});
  return [...map.values()].slice(0,12);
}
async function toggleBlock(id){
  const s=state(),list=s.communityCore.blockedUsers;const i=list.indexOf(id),blocking=i<0;if(blocking)list.push(id);else list.splice(i,1);save(s);filterBlockedPosts();render();
  if(live()){
    try{
      if(blocking){const {error}=await cloud().client.from('user_blocks').insert({blocker_id:cloud().user.id,blocked_id:id});if(error&&!String(error.message||'').includes('duplicate'))throw error}
      else{const {error}=await cloud().client.from('user_blocks').delete().eq('blocker_id',cloud().user.id).eq('blocked_id',id);if(error)throw error}
    }catch{toast('Block saved locally • cloud sync unavailable');return}
  }
  toast(blocking?'Collector blocked':'Collector unblocked');
}
async function reportSignal(postId,reportedUserId='',reason='other',details=''){
  const s=state();s.signalNetwork=s.signalNetwork||{};s.signalNetwork.reported=arr(s.signalNetwork.reported);if(!s.signalNetwork.reported.includes(postId))s.signalNetwork.reported.push(postId);save(s);filterBlockedPosts();
  if(live()&&!String(postId).startsWith('demo-')){
    try{const {error}=await cloud().client.from('moderation_reports').insert({reporter_id:cloud().user.id,post_id:postId,reported_user_id:reportedUserId||null,reason,details:String(details||'').slice(0,500)});if(error)throw error;toast('Report sent to moderation');return}catch{}
  }
  toast('Hidden locally • moderation report will sync when cloud is available');
}
function findPost(id){return arr(state().signalNetwork?.posts).find(p=>String(p.id)===String(id))||null}
function filterBlockedPosts(){
  const blocked=new Set(state().communityCore.blockedUsers);
  $$('#signalNetworkPanel .sn-post').forEach(el=>{const p=findPost(el.dataset.post);if(p&&blocked.has(p.user_id||p.authorId))el.remove()});
}
async function persistReaction(postId,kind){if(!live()||String(postId).startsWith('demo-'))return;try{await cloud().client.from('signal_reactions').upsert({post_id:postId,user_id:cloud().user.id,kind},{onConflict:'post_id,user_id,kind'})}catch{}}
async function persistRoomFollow(room){if(!live()||room==='for-you')return;const followed=arr(state().signalNetwork?.followedRooms).includes(room);try{if(followed)await cloud().client.from('signal_room_follows').upsert({user_id:cloud().user.id,room},{onConflict:'user_id,room'});else await cloud().client.from('signal_room_follows').delete().eq('user_id',cloud().user.id).eq('room',room)}catch{}}

function accountView(){
  const c=cloud(),signed=live();
  if(!c.configured)return `<div class="lc-scroll"><section class="lc-hero"><span class="lc-kicker">LIVE COMMUNITY</span><h2>Cloud connection is the final switch.</h2><p>The account, moderation, reputation and push systems are built. Add your Supabase Project URL and public publishable key to activate real multi-user mode.</p></section><section class="lc-panel"><div class="lc-grid"><div><span>App mode</span><b>Preview</b><small>Local data only</small></div><div><span>Realtime</span><b>Ready</b><small>Private-channel policies included</small></div></div><button class="lc-secondary" data-open-signals="1">Open Signal Network</button></section></div>`;
  if(!signed)return `<div class="lc-scroll"><section class="lc-hero"><span class="lc-kicker">COLLECTOR ACCOUNT</span><h2>Join the live Signal Network.</h2><p>Your Vault remains local-first. Signing in adds synced community identity, reputation, room follows, moderation and notification routing.</p></section><section class="lc-panel"><div class="lc-auth-choice"><button data-auth="signin" class="${authMode==='signin'?'active':''}">SIGN IN</button><button data-auth="signup" class="${authMode==='signup'?'active':''}">CREATE</button><button data-auth="magic" class="${authMode==='magic'?'active':''}">MAGIC LINK</button></div><div class="lc-form">${authMode==='signup'?'<label>Display name<input id="lcDisplayName" maxlength="40" placeholder="Collector name"></label>':''}<label>Email<input id="lcEmail" type="email" autocomplete="email" placeholder="you@example.com"></label>${authMode!=='magic'?'<label>Password<input id="lcPassword" type="password" autocomplete="current-password" placeholder="Password"></label>':''}<button class="lc-primary" id="lcAuthGo">${authMode==='signup'?'CREATE ACCOUNT':authMode==='magic'?'SEND MAGIC LINK':'SIGN IN'}</button></div></section></div>`;
  const p=cloudSnapshot.profile||{};return `<div class="lc-scroll"><section class="lc-hero"><span class="lc-kicker">YOUR COMMUNITY IDENTITY</span><h2>${esc(profileName())}</h2><p>One collector identity powers rooms, reputation, moderation, follows and alerts. Exact home location is never part of the public profile.</p></section><section class="lc-panel"><div class="lc-form"><label>Display name<input id="lcProfileName" maxlength="40" value="${esc(p.display_name||profileName())}"></label><label>Broad region only<input id="lcProfileRegion" maxlength="24" value="${esc(p.broad_region||'')}" placeholder="287xx"></label><button class="lc-primary" id="lcSaveProfile">SAVE PROFILE</button></div></section><section class="lc-panel"><div class="lc-head"><div><span class="lc-kicker">ACCOUNT</span><h3>${esc(c.user?.email||'Signed in')}</h3></div></div><div class="lc-actions"><button class="lc-secondary" data-open-signals="1">Open Signal Network</button><button class="lc-danger" id="lcSignOut">Sign out</button></div></section></div>`
}
function reputationView(){const r=reputation();const level=r.score>=85?'Trusted Scout':r.score>=70?'Reliable Collector':r.score>=55?'Active Collector':'New Collector';return `<div class="lc-scroll"><section class="lc-hero"><span class="lc-kicker">REPUTATION</span><h2>Trust should be earned in public.</h2><p>Useful confirmations and helpful reports build reputation. Disagreement is visible; no score guarantees a report is correct.</p></section><section class="lc-panel"><div class="lc-rep"><div class="lc-score"><b>${r.score}</b></div><div><h3>${level}</h3><p>Community reputation is a usefulness signal, not identity verification or a guarantee of stock accuracy.</p></div></div></section><div class="lc-grid"><div><span>Signals posted</span><b>${r.posts}</b><small>Structured reports</small></div><div><span>Helpful marks</span><b>${r.helpful}</b><small>Community usefulness</small></div><div><span>Confirmations</span><b>${r.confirm}</b><small>Positive validation</small></div><div><span>Gone reports</span><b>${r.gone}</b><small>Availability disagreement</small></div></div><section class="lc-safety"><b>Anti-gaming design</b><p>v18 calculates reputation from community activity instead of letting clients write their own score. Moderator actions can be layered in server-side without exposing admin controls in the public app.</p></section></div>`}
function alertsView(){const p=state().communityCore.notificationPrefs;const permission=('Notification'in window)?Notification.permission:'unsupported';return `<div class="lc-scroll"><section class="lc-hero"><span class="lc-kicker">SMART ALERT ROUTER</span><h2>Only wake you for signals you care about.</h2><p>Follow rooms, set a minimum signal score, use quiet hours and keep urgent drop alerts separate from normal community activity.</p></section><section class="lc-panel"><div class="lc-row"><div><b>Signal notifications</b><span>Permission: ${esc(permission)}</span></div><input id="lcNotifyEnabled" type="checkbox" ${p.enabled?'checked':''}></div><div class="lc-row"><div><b>Urgent signals only</b><span>DROP / FOUND / CHECKOUT / LIMIT</span></div><input id="lcUrgentOnly" type="checkbox" ${p.urgentOnly?'checked':''}></div><div class="lc-form" style="margin-top:10px"><label>Minimum Signal Score<input id="lcMinScore" type="number" min="0" max="100" value="${p.minScore}"></label><div class="lc-two"><label>Quiet starts<input id="lcQuietStart" type="time" value="${esc(p.quietStart)}"></label><label>Quiet ends<input id="lcQuietEnd" type="time" value="${esc(p.quietEnd)}"></label></div></div><div class="lc-actions"><button class="lc-primary" id="lcSavePrefs">SAVE ALERT RULES</button><button class="lc-secondary" id="lcEnablePush">ENABLE PUSH</button><button class="lc-chip" id="lcTestPush">TEST</button></div></section><section class="lc-panel"><span class="lc-kicker">ROOM ALERTS</span><div class="lc-room-grid" style="margin-top:9px">${ROOMS.map(([id,name])=>`<button data-alert-room="${id}" class="${p.rooms.includes(id)?'on':''}"><b>${esc(name)}</b><span>${p.rooms.includes(id)?'Alerts on':'Tap to follow alerts'}</span></button>`).join('')}</div></section><section class="lc-safety"><b>Opt-in only</b><p>Web Push requires explicit browser permission. VaultSignal never asks for notification permission on page load and does not use push for generic engagement spam.</p></section></div>`}
function safetyView(){const s=state(),authors=recentAuthors(),blocked=new Set(s.communityCore.blockedUsers);return `<div class="lc-scroll"><section class="lc-hero"><span class="lc-kicker">SIGNAL SHIELD</span><h2>Community controls without private-contact risk.</h2><p>v18 keeps Signal Network public-room based. You can hide/report signals and block collectors without opening direct-message pathways.</p></section><section class="lc-panel"><div class="lc-head"><div><span class="lc-kicker">RECENT COLLECTORS</span><h3>Block controls</h3></div><span class="lc-chip">${blocked.size} blocked</span></div>${authors.length?authors.map(a=>`<div class="lc-user-row"><div><b>${esc(a.name)}</b><span>${esc(a.id)}</span></div><button class="${blocked.has(a.id)?'lc-secondary':'lc-danger'}" data-block="${esc(a.id)}">${blocked.has(a.id)?'UNBLOCK':'BLOCK'}</button></div>`).join(''):'<p>No community authors are stored locally yet.</p>'}</section><section class="lc-panel"><span class="lc-kicker">MODERATION RULES</span><div class="lc-list" style="margin-top:9px"><div class="lc-row"><div><b>No private child contact</b><span>No DMs in the Signal Network surface.</span></div><span>ON</span></div><div class="lc-row"><div><b>Broad location only</b><span>Community profiles use a broad region such as 287xx.</span></div><span>ON</span></div><div class="lc-row"><div><b>Fair-access restock rules</b><span>No queue bypass, CAPTCHA bypass or purchase-limit evasion.</span></div><span>ON</span></div></div></section><section class="lc-safety"><b>Report workflow</b><p>Use the ••• button on a Signal. v18 intercepts it, hides the post immediately, and submits an authenticated moderation report when cloud mode is connected.</p></section></div>`}
function render(){let root=$('#liveCommunityPanel');if(!root)return;const isLive=live();root.innerHTML=`<div class="lc-shell"><header class="lc-top"><div><div class="lc-mark">LIVE</div><div><strong>Community Core</strong><span>VaultSignal v18 • trust, safety & alerts</span></div></div><button class="lc-close" id="lcClose">×</button></header><div class="lc-status ${isLive?'live':''}"><i></i><b>${isLive?'LIVE ACCOUNT MODE':cloud().configured?'CLOUD READY • SIGN IN':'LOCAL PREVIEW'}</b><span>${isLive?'Private Realtime hardening active':'Your Vault still works locally'}</span></div><nav class="lc-tabs">${[['account','Account'],['reputation','Reputation'],['alerts','Alerts'],['safety','Safety']].map(([id,name])=>`<button data-lc-tab="${id}" class="${tab===id?'active':''}">${name}</button>`).join('')}</nav>${tab==='reputation'?reputationView():tab==='alerts'?alertsView():tab==='safety'?safetyView():accountView()}</div>`;bind()}
function bind(){
  $('#lcClose')?.addEventListener('click',close);
  $$('[data-lc-tab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.lcTab;render()}));
  $$('[data-auth]').forEach(b=>b.addEventListener('click',()=>{authMode=b.dataset.auth;render()}));
  $('#lcAuthGo')?.addEventListener('click',authAction);$('#lcSignOut')?.addEventListener('click',signOut);$('#lcSaveProfile')?.addEventListener('click',saveProfile);
  $('#lcSavePrefs')?.addEventListener('click',savePrefs);$('#lcEnablePush')?.addEventListener('click',enablePush);$('#lcTestPush')?.addEventListener('click',testNotification);
  $$('[data-alert-room]').forEach(b=>b.addEventListener('click',()=>toggleRoom(b.dataset.alertRoom)));
  $$('[data-block]').forEach(b=>b.addEventListener('click',()=>toggleBlock(b.dataset.block)));
  $$('[data-open-signals]').forEach(b=>b.addEventListener('click',()=>{close();window.VaultSignalNetwork?.open?.('for-you')}));
}
async function open(next='account'){tab=next;let root=$('#liveCommunityPanel');if(!root){root=document.createElement('div');root.id='liveCommunityPanel';root.className='lc-overlay';document.body.appendChild(root)}root.classList.add('open');document.body.classList.add('lc-open');render();await loadCloudState();render()}
function close(){$('#liveCommunityPanel')?.classList.remove('open');document.body.classList.remove('lc-open')}
function inject(){
  if(!$('#liveCommunityFab')){const b=document.createElement('button');b.id='liveCommunityFab';b.className='lc-fab';b.innerHTML='<b>✓</b><span>Community</span>';b.addEventListener('click',()=>open('account'));document.body.appendChild(b)}
  const top=$('.topbar');if(top&&!$('#liveCommunityTop')){const b=document.createElement('button');b.id='liveCommunityTop';b.className='lc-top-entry';b.textContent='LIVE';b.title='Community Core';b.addEventListener('click',()=>open('account'));top.appendChild(b)}
  const sn=$('#signalNetworkPanel .sn-top');if(sn&&!sn.querySelector('.lc-sn-button')){const b=document.createElement('button');b.className='lc-sn-button';b.textContent='✓';b.title='Community account & safety';b.addEventListener('click',e=>{e.stopPropagation();open('account')});sn.insertBefore(b,sn.lastElementChild)}
  filterBlockedPosts();
}
function interceptCommunityActions(){
  document.addEventListener('click',e=>{
    const report=e.target.closest?.('[data-report]');
    if(report&&report.closest('#signalNetworkPanel')){
      e.preventDefault();e.stopImmediatePropagation();
      const p=findPost(report.dataset.report);const reason=prompt('Report reason: spam, scam, harassment, unsafe location, or other','spam')||'other';const details=prompt('Optional details for moderators','')||'';reportSignal(report.dataset.report,p?.user_id||'',reason.toLowerCase().replace(/\s+/g,'_'),details);return;
    }
    const reaction=e.target.closest?.('[data-react]');if(reaction&&reaction.closest('#signalNetworkPanel'))setTimeout(()=>persistReaction(reaction.dataset.id,reaction.dataset.react),20);
    const follow=e.target.closest?.('[data-follow]');if(follow&&follow.closest('#signalNetworkPanel'))setTimeout(()=>persistRoomFollow(follow.dataset.follow),40);
  },true);
}
function init(){const s=state();save(s);hardenRealtimeClient();inject();interceptCommunityActions();window.VaultSignalCommunity={open,close,reportSignal,isBlocked:id=>state().communityCore.blockedUsers.includes(id),version:'18.0.0'};window.addEventListener('twogen-cloud-ready',()=>{hardenRealtimeClient();loadCloudState()});window.addEventListener('twogen-auth-changed',()=>{hardenRealtimeClient();loadCloudState();if($('#liveCommunityPanel')?.classList.contains('open'))render()});const obs=new MutationObserver(()=>inject());obs.observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,120));else setTimeout(init,120);
})();
