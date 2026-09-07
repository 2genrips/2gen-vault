(() => {
'use strict';

const MOBILE_QUERY='(max-width: 759px)';
const $=s=>document.querySelector(s);

function isMobile(){return window.matchMedia(MOBILE_QUERY).matches}
function cloudLabel(){
  const c=window.TWOGEN_CLOUD||{};
  if(c.configured&&c.user)return 'SIGNED IN • LIVE COMMUNITY READY';
  if(c.configured)return 'CLOUD CONNECTED • SIGN IN FOR COMMUNITY';
  return 'LOCAL-FIRST COLLECTOR MODE';
}
function openMain(tab){document.querySelector(`.bottom-nav [data-tab="${tab}"]`)?.click()}
function fallback(selector){document.querySelector(selector)?.click()}
function close(){
  $('#mobileCommandCenter')?.classList.remove('open');
  document.body.classList.remove('mcc-open');
}
function launch(action){
  close();
  setTimeout(()=>{
    switch(action){
      case 'hunt':
        if(window.VaultSignalHuntMissions?.open)window.VaultSignalHuntMissions.open();
        break;
      case 'store':
        if(window.VaultSignalStoreIntel?.open)window.VaultSignalStoreIntel.open();
        break;
      case 'proof':
        if(window.VaultSignalScoutProof?.open)window.VaultSignalScoutProof.open();
        break;
      case 'radar':
        if(window.VaultSignalDemandRadar?.open)window.VaultSignalDemandRadar.open();
        break;
      case 'mesh':
        if(window.VaultSignalSourceMesh?.open)window.VaultSignalSourceMesh.open();
        break;
      case 'fusion':
        if(window.VaultSignalFusion?.open)window.VaultSignalFusion.open();else fallback('.topbar > .sf-top-entry');
        break;
      case 'creator':
        if(window.VaultSignalCreatorCommand?.open)window.VaultSignalCreatorCommand.open('home');else fallback('.topbar > .cc-top-entry');
        break;
      case 'journey':
        if(window.VaultSignalJourney?.open)window.VaultSignalJourney.open('journey');else fallback('.topbar > .je-top-entry');
        break;
      case 'graph':
        if(window.VaultSignalGraph?.open)window.VaultSignalGraph.open('overview');else fallback('.topbar > .vg-top-entry');
        break;
      case 'grail':
        if(window.VaultSignalGrail?.open)window.VaultSignalGrail.open('brief');else fallback('.topbar > .gi-top-entry');
        break;
      case 'signals':
        if(window.VaultSignalNetwork?.open)window.VaultSignalNetwork.open('for-you');else fallback('.topbar > .sn-top-entry');
        break;
      case 'community':
        if(window.VaultSignalCommunity?.open)window.VaultSignalCommunity.open('account');else fallback('.topbar > .lc-top-entry');
        break;
      case 'stock': openMain('stock'); break;
      case 'search': openMain('discover'); break;
      case 'vault': openMain('vault'); break;
      case 'scan':
        openMain('tools');
        setTimeout(()=>{
          const candidate=[...document.querySelectorAll('#tools button,[data-tool]')].find(el=>/scan|scanner|camera/i.test(`${el.textContent||''} ${el.dataset.tool||''}`));
          candidate?.click();
        },120);
        break;
    }
  },80);
}
function sheetMarkup(){return `
  <div class="mcc-backdrop" data-mcc-close="1"></div>
  <section class="mcc-sheet" role="dialog" aria-modal="true" aria-label="VaultSignal Command Center">
    <div class="mcc-handle" aria-hidden="true"></div>
    <header class="mcc-head">
      <div><span>VAULTSIGNAL</span><h2>Command Center</h2><p id="mccCloudLabel">${cloudLabel()}</p></div>
      <button class="mcc-close" type="button" data-mcc-close="1" aria-label="Close">×</button>
    </header>
    <div class="mcc-section-label">COLLECTOR SYSTEMS</div>
    <div class="mcc-grid">
      <button data-mcc="hunt"><b class="green">⌖</b><span>Hunt Missions</span><small>Coordinate scouts around a product</small></button>
      <button data-mcc="store"><b class="cyan">⌂</b><span>Store Intel</span><small>Trusted history for public stores</small></button>
      <button data-mcc="proof"><b class="green">✓</b><span>Scout Proof</span><small>Evidence-backed claim trust</small></button>
      <button data-mcc="radar"><b class="gold">◉</b><span>Demand Radar</span><small>What collectors are hunting now</small></button>
      <button data-mcc="mesh"><b class="cyan">⌁</b><span>Source Mesh</span><small>Provider evidence + verification</small></button>
      <button data-mcc="fusion"><b class="cyan">≋</b><span>Signal Fusion</span><small>One live War Room per drop</small></button>
      <button data-mcc="signals"><b class="signal">⚡</b><span>Signals</span><small>Raw collector intel</small></button>
      <button data-mcc="grail"><b class="gold">IQ</b><span>Grail IQ</span><small>Next best move</small></button>
      <button data-mcc="journey"><b class="blue">∞</b><span>Journey</span><small>Card life story</small></button>
      <button data-mcc="graph"><b class="cyan">◎</b><span>VaultGraph</span><small>Product provenance</small></button>
      <button data-mcc="community"><b class="green">✓</b><span>Community</span><small>Account, trust & alerts</small></button>
      <button data-mcc="creator"><b class="creator">2G</b><span>2GEN Creator</span><small>Battle & content tools</small></button>
    </div>
    <div class="mcc-section-label">QUICK ACTIONS</div>
    <div class="mcc-quick">
      <button data-mcc="stock"><b>◎</b><span>Find Stock</span></button>
      <button data-mcc="scan"><b>⌾</b><span>Scan & Value</span></button>
      <button data-mcc="search"><b>⌕</b><span>Search Market</span></button>
      <button data-mcc="vault"><b>▣</b><span>My Vault</span></button>
    </div>
    <div class="mcc-note">Hunt Missions coordinate people. Store Intel remembers trusted public-store history. Scout Proof evaluates evidence behind availability claims. Demand Radar shows crowd heat. Source Mesh shows provider evidence. Signal Fusion combines the evidence into one live War Room.</div>
  </section>`}
function ensureSheet(){
  let root=$('#mobileCommandCenter');
  if(root)return root;
  root=document.createElement('div');root.id='mobileCommandCenter';root.className='mcc-overlay';root.innerHTML=sheetMarkup();document.body.appendChild(root);
  root.addEventListener('click',e=>{
    const action=e.target.closest?.('[data-mcc]')?.dataset.mcc;if(action){launch(action);return}
    if(e.target.closest?.('[data-mcc-close]'))close();
  });
  return root;
}
function open(){
  const root=ensureSheet();
  const label=$('#mccCloudLabel');if(label)label.textContent=cloudLabel();
  root.classList.add('open');document.body.classList.add('mcc-open');
}
function injectTop(){
  const top=$('.topbar');if(!top||$('#mccTopButton'))return;
  const b=document.createElement('button');b.id='mccTopButton';b.className='mcc-top-button';b.type='button';b.innerHTML='<span>✦</span><b>COMMAND</b>';b.addEventListener('click',open);top.appendChild(b);
}
function init(){
  ensureSheet();injectTop();
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  window.addEventListener('twogen-auth-changed',()=>{const label=$('#mccCloudLabel');if(label)label.textContent=cloudLabel()});
  const observer=new MutationObserver(()=>injectTop());observer.observe(document.body,{childList:true,subtree:true});
  window.VaultSignalMobileCommand={open,close,launch,version:'25.0.0'};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,150));else setTimeout(init,150);
})();
