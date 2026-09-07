(() => {
'use strict';

const $=s=>document.querySelector(s);
const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const cloud=()=>window.TWOGEN_CLOUD||{};
const live=()=>Boolean(cloud().configured&&cloud().client&&cloud().user);
const me=()=>cloud().user?.id||'';
const proofLabels={SOURCE_VERIFIED:'SOURCE VERIFIED',CORROBORATED:'CORROBORATED',UNVERIFIED:'NEEDS CONFIRMATION',CONFLICTED:'CONFLICTED',OBSERVATION:'OBSERVATION'};
let activeMissionId=new URLSearchParams(location.search).get('mission')||'';
let hydrateTimer=null;
let hydrating=false;
let lastSignature='';

function label(state='UNVERIFIED'){return proofLabels[String(state).toUpperCase()]||String(state).replaceAll('_',' ')}
function stateClass(state='UNVERIFIED'){return String(state).toLowerCase()}
function age(v){const ms=Date.now()-new Date(v||0).getTime();const m=Math.max(0,Math.floor(ms/60000));if(m<1)return'now';if(m<60)return`${m}m`;const h=Math.floor(m/60);if(h<24)return`${h}h`;return`${Math.floor(h/24)}d`}
function schedule(delay=180){clearTimeout(hydrateTimer);hydrateTimer=setTimeout(()=>hydrateMission().catch(()=>{}),delay)}

async function resolveMission(){
  if(!live()||!$('#huntMissionsPanel.open .hm-detail'))return null;
  const c=cloud().client;
  if(activeMissionId){
    const {data}=await c.from('hunt_missions').select('id,created_by,product,broad_region').eq('id',activeMissionId).maybeSingle();
    if(data)return data;
    activeMissionId='';
  }
  const product=$('#huntMissionsPanel .hm-detail h2')?.textContent?.trim()||'';
  const meta=$('#huntMissionsPanel .hm-detail p')?.textContent||'';
  if(!product)return null;
  const {data}=await c.from('hunt_missions').select('id,created_by,product,broad_region,last_activity_at').eq('product',product).order('last_activity_at',{ascending:false}).limit(8);
  let rows=data||[];
  const regionMatches=rows.filter(m=>m.broad_region&&meta.includes(m.broad_region));
  if(regionMatches.length===1)rows=regionMatches;
  if(rows.length>1&&$('#hmCloseMission')){
    const mine=rows.filter(m=>String(m.created_by)===String(me()));
    if(mine.length===1)rows=mine;
  }
  if(rows.length!==1)return null;
  activeMissionId=String(rows[0].id);
  return rows[0];
}

function proofSummary(checkins){
  const claims=checkins.filter(c=>['FOUND','SOLD_OUT'].includes(String(c.result).toUpperCase()));
  const count=s=>claims.filter(c=>String(c.verification_state)===s).length;
  return {claims:claims.length,verified:count('SOURCE_VERIFIED'),corroborated:count('CORROBORATED'),unverified:count('UNVERIFIED'),conflicted:count('CONFLICTED')};
}

async function hydrateMission(){
  if(hydrating||!live()||!$('#huntMissionsPanel.open .hm-detail'))return;
  hydrating=true;
  try{
    const mission=await resolveMission();if(!mission)return;
    const rows=[...document.querySelectorAll('#huntMissionsPanel .hm-check')];
    const {data:checkins,error}=await cloud().client.from('hunt_mission_checkins')
      .select('id,user_id,result,store_label,retailer,note,created_at,verification_state,verification_score,verification_reason,independent_confirmations,source_matches,last_verified_at')
      .eq('mission_id',mission.id).order('created_at',{ascending:false}).limit(Math.max(60,rows.length));
    if(error)throw error;
    const list=checkins||[];
    const ids=[...new Set(list.map(x=>x.user_id).filter(Boolean))];
    let trust=[];
    if(ids.length){const {data}=await cloud().client.from('hunt_scout_trust').select('*').in('user_id',ids);trust=data||[]}
    const trustByUser=new Map(trust.map(t=>[String(t.user_id),t]));
    const signature=`${mission.id}:${list.map(c=>`${c.id}:${c.verification_state}:${c.verification_score}`).join('|')}`;
    if(signature===lastSignature&&$('#spMissionSummary'))return;
    lastSignature=signature;

    document.querySelectorAll('#huntMissionsPanel .sp-proof-badge,#huntMissionsPanel .sp-proof-reason,#huntMissionsPanel .sp-scout-score').forEach(x=>x.remove());
    $('#spMissionSummary')?.remove();

    const sum=proofSummary(list);
    const summary=document.createElement('section');
    summary.id='spMissionSummary';summary.className='sp-mission-summary';
    summary.innerHTML=`<div class="sp-summary-head"><div><span>SCOUT PROOF • v24</span><b>Evidence, not self-assigned trust</b></div><button id="spOpenCenter" type="button">PROOF CENTER</button></div>
      <div class="sp-summary-grid"><div><b>${sum.verified}</b><span>source verified</span></div><div><b>${sum.corroborated}</b><span>corroborated</span></div><div><b>${sum.unverified}</b><span>needs confirmation</span></div><div><b>${sum.conflicted}</b><span>conflicted</span></div></div>
      <small>Provider evidence and independent scouts can strengthen a claim. A single NOT FOUND never proves a whole region is sold out.</small>`;
    const metrics=$('#huntMissionsPanel .hm-metrics');
    if(metrics)metrics.insertAdjacentElement('afterend',summary);else $('#huntMissionsPanel .hm-detail')?.insertAdjacentElement('afterend',summary);
    $('#spOpenCenter')?.addEventListener('click',open);

    rows.forEach((row,i)=>{
      const c=list[i];if(!c)return;
      const body=row.querySelector('div');if(!body)return;
      const badge=document.createElement('span');
      badge.className=`sp-proof-badge ${stateClass(c.verification_state)}`;
      badge.textContent=`${label(c.verification_state)}${Number(c.verification_score)>0?` • ${Number(c.verification_score)}`:''}`;
      body.prepend(badge);
      if(c.verification_reason){const r=document.createElement('small');r.className='sp-proof-reason';r.textContent=c.verification_reason;body.appendChild(r)}
      const t=trustByUser.get(String(c.user_id));
      if(t?.public_visible){const s=document.createElement('span');s.className='sp-scout-score';s.textContent=`SCOUT PROOF ${Number(t.proof_score||0)} • ${Number(t.claim_count||0)} claims`;body.appendChild(s)}
    });
  }finally{hydrating=false}
}

function centerShell(){return `<div class="sp-shell"><header class="sp-top"><div><div class="sp-mark">✓</div><div><strong>Scout Proof</strong><span>Evidence-backed collector trust</span></div></div><button id="spClose" type="button">×</button></header><main id="spBody" class="sp-body"><div class="sp-loading">Checking proof history…</div></main></div>`}
function ensureCenter(){let root=$('#scoutProofPanel');if(root)return root;root=document.createElement('div');root.id='scoutProofPanel';root.className='sp-overlay';root.innerHTML=centerShell();document.body.appendChild(root);$('#spClose')?.addEventListener('click',close);return root}
function close(){$('#scoutProofPanel')?.classList.remove('open');document.body.classList.remove('sp-open')}
async function open(){const root=ensureCenter();root.classList.add('open');document.body.classList.add('sp-open');await renderCenter()}

async function renderCenter(){
  const body=$('#spBody');if(!body)return;
  if(!live()){
    body.innerHTML=`<div class="sp-scroll"><section class="sp-hero"><span>SCOUT PROOF • v24</span><h2>Trust that has to be earned.</h2><p>Scout Proof uses provider evidence and independent community corroboration. Sign in to build a proof history.</p><button id="spSignIn">OPEN COMMUNITY ACCOUNT</button></section>${methodCards()}</div>`;
    $('#spSignIn')?.addEventListener('click',()=>{close();window.VaultSignalCommunity?.open?.('account')});return;
  }
  body.innerHTML='<div class="sp-loading">Checking proof history…</div>';
  const uid=me();
  const [{data:trust},{data:claims,error}]=await Promise.all([
    cloud().client.from('hunt_scout_trust').select('*').eq('user_id',uid).maybeSingle(),
    cloud().client.from('hunt_mission_checkins').select('id,mission_id,result,store_label,retailer,created_at,verification_state,verification_score,verification_reason,independent_confirmations,source_matches').eq('user_id',uid).in('result',['FOUND','SOLD_OUT']).order('created_at',{ascending:false}).limit(30)
  ]);
  if(error){body.innerHTML='<div class="sp-loading">Could not load Scout Proof right now.</div>';return}
  const list=claims||[],missionIds=[...new Set(list.map(x=>x.mission_id).filter(Boolean))];
  let missions=[];if(missionIds.length){const {data}=await cloud().client.from('hunt_missions').select('id,product,retailer,broad_region').in('id',missionIds);missions=data||[]}
  const missionById=new Map(missions.map(m=>[String(m.id),m]));
  const claimCount=Number(trust?.claim_count??list.length),unlocked=Boolean(trust?.public_visible&&claimCount>=3),remaining=Math.max(0,3-claimCount);
  const verified=Number(trust?.source_verified_count||list.filter(x=>x.verification_state==='SOURCE_VERIFIED').length);
  const corroborated=Number(trust?.corroborated_count||list.filter(x=>x.verification_state==='CORROBORATED').length);
  const conflicted=Number(trust?.conflicted_count||list.filter(x=>x.verification_state==='CONFLICTED').length);
  body.innerHTML=`<div class="sp-scroll"><section class="sp-hero"><span>SCOUT PROOF • v24</span><h2>${unlocked?`Your Proof Score is ${Number(trust.proof_score||0)}`:'Build proof before a public score appears.'}</h2><p>${unlocked?`Based on ${claimCount} availability claims. The score reflects evidence quality, not spending or collection value.`:claimCount?`${claimCount}/3 qualifying claims logged. ${remaining} more before a public Scout Proof score can appear.`:'Post real FOUND or SOLD OUT Hunt Mission check-ins to begin. No score is created from routine chatter.'}</p><div class="sp-score-card"><b>${unlocked?Number(trust.proof_score||0):`${claimCount}/3`}</b><small>${unlocked?'PUBLIC SCOUT PROOF':'UNLOCK PROGRESS'}</small></div><button id="spOpenHunt">OPEN HUNT MISSIONS</button></section>
    <div class="sp-stats"><div><b>${claimCount}</b><span>claims</span></div><div><b>${verified}</b><span>source verified</span></div><div><b>${corroborated}</b><span>corroborated</span></div><div><b>${conflicted}</b><span>conflicted</span></div></div>
    ${methodCards()}
    <section class="sp-panel"><div class="sp-section-head"><span>YOUR CLAIM HISTORY</span><b>${list.length} recent</b></div>${list.length?list.map(c=>claimRow(c,missionById.get(String(c.mission_id)))).join(''):'<div class="sp-empty">No FOUND or SOLD OUT claims yet. Scout Proof stays empty rather than inventing reputation.</div>'}</section>
    <div class="sp-footnote">Scout Proof measures the evidence behind Hunt Mission availability claims. It is not a financial rating, purchase recommendation, guarantee of stock, or measure of how much somebody spends.</div></div>`;
  $('#spOpenHunt')?.addEventListener('click',()=>{close();window.VaultSignalHuntMissions?.open?.()});
}

function methodCards(){return `<section class="sp-panel"><div class="sp-section-head"><span>HOW PROOF WORKS</span><b>No self-verification</b></div><div class="sp-method-grid"><div class="source_verified"><b>SOURCE VERIFIED</b><p>Fresh supported provider evidence matches the claim.</p></div><div class="corroborated"><b>CORROBORATED</b><p>An independent scout reports the same outcome nearby in time.</p></div><div class="unverified"><b>NEEDS CONFIRMATION</b><p>A single availability claim is useful, but it remains clearly unverified.</p></div><div class="conflicted"><b>CONFLICTED</b><p>Relevant evidence disagrees, so VaultSignal lowers confidence and does not push the claim.</p></div></div></section>`}
function claimRow(c,m){return `<div class="sp-claim"><div><span class="sp-proof-badge ${stateClass(c.verification_state)}">${label(c.verification_state)} • ${Number(c.verification_score||0)}</span><b>${esc(m?.product||'Hunt Mission claim')}</b><small>${[c.result?.replace('_',' '),c.store_label||c.retailer,m?.broad_region,`${age(c.created_at)} ago`].filter(Boolean).map(esc).join(' • ')}</small>${c.verification_reason?`<p>${esc(c.verification_reason)}</p>`:''}</div></div>`}

function injectTop(){const top=$('.topbar');if(!top||$('#spTopButton'))return;const b=document.createElement('button');b.id='spTopButton';b.className='sp-top-entry';b.type='button';b.textContent='PROOF';b.addEventListener('click',open);top.appendChild(b)}
function init(){
  ensureCenter();injectTop();
  document.addEventListener('click',e=>{const card=e.target.closest?.('#huntMissionsPanel [data-mission]');if(card?.dataset.mission){activeMissionId=card.dataset.mission;lastSignature='';schedule(300)}},true);
  window.addEventListener('twogen-auth-changed',()=>{lastSignature='';schedule(300)});
  const observer=new MutationObserver(muts=>{if(muts.some(m=>m.addedNodes.length||m.removedNodes.length)){injectTop();if($('#huntMissionsPanel.open .hm-detail'))schedule()}});observer.observe(document.body,{childList:true,subtree:true});
  window.VaultSignalScoutProof={open,close,refresh:()=>{lastSignature='';schedule(20);return renderCenter()},version:'24.0.0'};
  if($('#huntMissionsPanel.open .hm-detail'))schedule(300);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,260));else setTimeout(init,260);
})();
