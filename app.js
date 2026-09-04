(() => {
'use strict';

const STORAGE_KEY = '2gen-vault-collector-os-v4';
const retailers = ['Walmart','Target','Best Buy','GameStop',"Sam's Club",'Costco','Walgreens','CVS','Dollar General','Family Dollar','Local Card Shop'];
const games = ['Pokemon','Lorcana','One Piece','Magic','Yu-Gi-Oh!','Sports','Other'];


const sealedCatalogSeed = [
  {id:'sealed-pkm-etb-demo',game:'Pokemon',name:'Elite Trainer Box',set:'Example Set',type:'ETB',msrp:49.99,target:44.99,image:'',notes:'Use as a starter template for Pokémon ETBs.'},
  {id:'sealed-pkm-bundle-demo',game:'Pokemon',name:'Booster Bundle',set:'Example Set',type:'Booster Bundle',msrp:26.94,target:24.99,image:'',notes:'Starter template for 6-pack booster bundles.'},
  {id:'sealed-pkm-tin-demo',game:'Pokemon',name:'Collector Tin',set:'Example Set',type:'Tin',msrp:29.99,target:24.99,image:'',notes:'Starter template for tins.'},
  {id:'sealed-lor-box-demo',game:'Lorcana',name:'Booster Display',set:'Example Set',type:'Booster Box',msrp:143.76,target:130,image:'',notes:'Starter template for Lorcana sealed displays.'},
  {id:'sealed-op-box-demo',game:'One Piece',name:'Booster Box',set:'Example Set',type:'Booster Box',msrp:107.76,target:100,image:'',notes:'Starter template for One Piece booster boxes.'}
];

const demoCards = [
  {id:'demo-pkm-1',provider:'demo',game:'Pokemon',name:'Charizard ex',set:'Demo Scarlet Set',number:'199/198',rarity:'Special Illustration Rare',market:128.42,low:115},
  {id:'demo-pkm-2',provider:'demo',game:'Pokemon',name:'Pikachu ex',set:'Demo Journey Set',number:'238/191',rarity:'Special Illustration Rare',market:84.15,low:72},
  {id:'demo-lor-1',provider:'demo',game:'Lorcana',name:'Elsa — Spirit of Winter',set:'Demo First Chapter',number:'207/204',rarity:'Enchanted',market:412,low:380},
  {id:'demo-op-1',provider:'demo',game:'One Piece',name:'Monkey D. Luffy',set:'Demo Romance Dawn',number:'OP01-024',rarity:'Parallel',market:145.9,low:132},
  {id:'demo-mtg-1',provider:'demo',game:'Magic',name:'Mana Vault',set:'Demo Masters',number:'001',rarity:'Mythic',market:71.25,low:64},
  {id:'demo-ygo-1',provider:'demo',game:'Yu-Gi-Oh!',name:'Blue-Eyes White Dragon',set:'Demo Anniversary',number:'SDK-001',rarity:'Ultra Rare',market:39.9,low:31}
];

const seed = {
  binders: [{uid:'binder-default',name:'Main Binder',game:'All',notes:'Default collection binder'}],
  collection: [
    {uid:uid(),card:demoCards[0],qty:1,condition:'Near Mint',cost:92,location:'Main Binder'},
    {uid:uid(),card:demoCards[1],qty:2,condition:'Near Mint',cost:51,location:'Main Binder'}
  ],
  sealed: [],
  wishlist: [],
  priceAlerts: [],
  stockWatches: [],
  stockReports: [],
  purchases: [],
  trades: [],
  sales: [],
  saleQueue: [],
  collectorProfiles: [{uid:'collector-household',name:'Household',role:'Shared',accent:'blue'}],
  giveawayLocker: [],
  contentQueue: [],
  actionSnoozes: {},
  notificationInbox: [],
  acquisitionQueue: [],
  vaultIQSettings: {
    reserveCash:25,
    maxDuplicateCopies:2
  },
  showcaseSettings: {
    title:'VaultSignal Showcase',
    bio:'Two Generations. One Collection.',
    featuredCardIds:[],
    showCollectionValue:true,
    showWishlist:true,
    showTradeDuplicates:true,
    showSealed:true,
    showSetProgress:true
  },
  notificationSeenKeys: {},
  notificationPrefs: {
    enabled:true,
    browserNotifications:false,
    highOnly:false,
    categories:{
      Market:true,Stock:true,Budget:true,Safety:true,Sets:true,
      Grading:true,Selling:true,Trading:true,Creator:true
    }
  },
  grading: [],
  setGoals: [],
  productCatalog: [],
  productInventoryEvents: [],
  inventoryLedger: [],
  inventoryAudits: [],
  premiumEntitlement: {
    tier:'free',
    status:'inactive',
    source:'none',
    verified:false,
    productId:'',
    expiresAt:null,
    checkedAt:null
  },
  premiumUsage: {
    scannerDay:'',
    scannerCount:0
  },
  inventoryCommandSettings: {
    game:'All',
    type:'All',
    location:'All',
    attention:'All',
    sort:'Attention'
  },
  productCommandSettings: {
    game:'All',
    need:'All',
    sort:'Priority'
  },
  openingLog: [],
  ripSessions: [],
  portfolioSnapshots: [],
  scanQueue: [],
  scannerRecentScans: [],
  cardPriceHistory: {},
  priceRefreshLog: [],
  scannerSettings: {gradingValueThreshold:25, preferredBinder:'Main Binder'},
  inventoryResults: [],
  inventorySearchHistory: [],
  areaInventoryResults: [],
  areaRetailerCheckResults: [],
  liveDropFeed: [],
  liveDropSnapshot: {},
  liveDropMeta: {checkedAt:null,durationMs:0,sourcesChecked:0,sourcesOk:0,errors:[]},
  liveDropFilters: {game:'All',store:'All',watchOnly:false,inStockOnly:true},
  areaScanHistory: [],
  inventoryPulseEvents: [],
  favoriteInventoryStores: [],
  areaScanSettings: {
    games:['Pokemon','Lorcana','Magic','Yu-Gi-Oh!','One Piece'],
    autoRefresh:true,
    autoRefreshHours:4
  },
  inventoryProviderStatus: null,
  nearbyStores: [],
  huntRoute: [],
  communityReports: [],
  communityConfirmationCounts: {},
  setExplorerCache: {},
  settings: {
    zip:'',
    radius:25,
    lat:null,
    lon:null,
    locationLabel:'',
    monthlyBudget:200,
    brand:'VaultSignal',
    tagline:'Two Generations. One Collection.',
    lastBackupAt:null
  }
};

let state = loadState();
if(state?.settings?.brand==='2GEN Vault'||!state?.settings?.brand) state.settings.brand='VaultSignal';
if(state?.showcaseSettings?.title==='2GEN Vault Showcase') state.showcaseSettings.title='VaultSignal Showcase';
let currentTab = 'home';
let vaultTab = 'cards';
let toolsTab = 'menu';
let discoverMode = 'live';
let discoverGame = 'Pokemon';
let discoverResults = [];
let activeCardDetail = null;
let setExplorerResults = [];
let activeSet = null;
let activeSetCards = [];
let setExplorerBusy = false;
let activeRipSessionId = null;
let ripCardSearchResults = [];
let ripScannerPreview = '';
let selectedRetailers = new Set(['Walmart','Target','Best Buy','GameStop','Local Card Shop']);
let stockGame = 'Pokemon';
let stockQuery = '';
let areaScanBusy = false;
let areaSelectedStoreKey = null;
let stockSpecificSearchOpen = false;
let areaAutoScanAttempted = false;
let selectedWatchId = null;
let cameraPreview = '';
let scannerSearchResults = [];
let scannerBusy = false;
let scannerLastQuery = '';
let scannerGame = 'Pokemon';
let scannerOcrBusy = false;
let scannerPhotoBusy = false;
let scannerAutoRunAfterCapture = true;
let scannerBestMatch = null;
let scannerLiveStream = null;
let scannerLiveCameraOpen = false;
let scannerPriceChartingResult = null;
let scannerPriceChartingStatus = 'unknown';
const SCANNER_GAME_OPTIONS=['Pokemon','Lorcana','Magic','Yu-Gi-Oh!','One Piece'];
let scannerCameraZoom=1;
let scannerCameraTorch=false;
let scannerCameraCapabilities={zoom:false,torch:false};

let scannerOcrText = '';
let scannerOcrConfidence = null;
let scannerAutoCandidates = [];
let scannerLastMarketLookupAt = null;
let marketRefreshBusy = false;
let marketSelectedCardId = null;
let tradeGiveDraft = [];
let tradeReceiveDraft = [];
let tradeSearchResults = [];
let tradeSearchBusy = false;
let tradeSearchGame = 'Pokemon';
let sellDraftSource = null;
let sellMarketplace = 'Local / Cash';
let activeCollectorProfileId = 'collector-household';
let watchtowerLastEvaluatedAt = null;
let showcasePreviewProfileId = null;
let vaultIQFocusCard = null;
let toastTimer;


const PREMIUM_PRICE_MONTHLY=4.99;
const PREMIUM_PRODUCT_ID='vaultsignal_premium_monthly';
const PREMIUM_FREE_SCANS_PER_DAY=3;

const PREMIUM_FEATURES=[
  {id:'scanner_unlimited',title:'Unlimited Live Value Scanner',group:'Scan',desc:'Unlimited photo/OCR-assisted identification and live/reference price lookups.'},
  {id:'inventory_command',title:'Inventory Command Pro',group:'Inventory',desc:'Physical audits, movement ledger, replenishment targets, data-health cleanup and location rollups.'},
  {id:'inventory_radar',title:'Nearby Inventory Radar',group:'Hunt',desc:'ZIP/radius area scans, verified store drill-down, favorites, Hunt Score and Inventory Pulse.'},
  {id:'signal_center',title:'Signal Center',group:'Signals',desc:'One prioritized feed for inventory changes, collector alerts, scanner activity and action priorities.'},
  {id:'vaultiq',title:'VaultIQ',group:'Decide',desc:'Personal collector-fit scoring using budget, targets, owned copies, set progress and hunt data.'},
  {id:'market_pulse',title:'Market Pulse',group:'Market',desc:'Bulk refresh, local price snapshots, tracked movement and collection market monitoring.'},
  {id:'analytics',title:'Dashboard Pro',group:'Analytics',desc:'Portfolio snapshots, allocation, inventory health, rip performance and collection analytics.'},
  {id:'trade_sell',title:'Trade Lab + Sell Lab',group:'Trade & Sell',desc:'Two-sided trade builder, sale planning, fee estimates, duplicate workflows and inventory-linked completion.'},
  {id:'showcase',title:'Showcase Studio',group:'Share',desc:'Collection Passport, featured cards, privacy controls and exportable collector showcase.'},
  {id:'cloud_future',title:'Cloud Sync + Multi-device',group:'Cloud',desc:'Premium-ready entitlement for account sync and secure backups when cloud accounts are connected.'}
];

const PREMIUM_TOOL_IDS=new Set(['watchtower','inventory','vaultiq','market','analytics','sell','trades','showcase']);

function ensurePremiumSchema(){
  state.premiumEntitlement={
    tier:'free',status:'inactive',source:'none',verified:false,productId:'',expiresAt:null,checkedAt:null,
    ...(state.premiumEntitlement||{})
  };
  state.premiumUsage={
    scannerDay:'',scannerCount:0,
    ...(state.premiumUsage||{})
  };
}
function premiumConfig(){return window.TWOGEN_CONFIG||{}}
function premiumPreviewEnabled(){return premiumConfig().premiumPreview===true}
function entitlementIsActive(){
  ensurePremiumSchema();
  const e=state.premiumEntitlement;
  if(e.status!=='active'||e.verified!==true)return false;
  if(e.expiresAt && new Date(e.expiresAt).getTime()<=Date.now())return false;
  return true;
}
function hasPremium(){
  return premiumPreviewEnabled()||entitlementIsActive();
}
function premiumStatusLabel(){
  if(premiumPreviewEnabled())return 'Premium Preview';
  if(entitlementIsActive())return 'Premium Active';
  return 'Free';
}
function premiumTodayKey(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function premiumScannerUsage(){
  ensurePremiumSchema();
  const day=premiumTodayKey();
  if(state.premiumUsage.scannerDay!==day){
    state.premiumUsage.scannerDay=day;
    state.premiumUsage.scannerCount=0;
    saveState();
  }
  return Number(state.premiumUsage.scannerCount)||0;
}
function canUseScannerLookup(){
  if(hasPremium())return true;
  return premiumScannerUsage()<PREMIUM_FREE_SCANS_PER_DAY;
}
function consumeScannerLookup(){
  if(hasPremium())return true;
  if(!canUseScannerLookup())return false;
  state.premiumUsage.scannerDay=premiumTodayKey();
  state.premiumUsage.scannerCount=(Number(state.premiumUsage.scannerCount)||0)+1;
  saveState();
  return true;
}
function premiumFeatureByTool(tab){
  const map={
    watchtower:'signal_center',
    inventory:'inventory_command',
    vaultiq:'vaultiq',
    market:'market_pulse',
    analytics:'analytics',
    sell:'trade_sell',
    trades:'trade_sell',
    showcase:'showcase'
  };
  return map[tab]||'premium';
}
function premiumGateMarkup(featureId='premium'){
  const f=PREMIUM_FEATURES.find(x=>x.id===featureId);
  return `<div class="panel premium-gate">
    <div class="premium-lock">◇</div>
    <div><div class="eyebrow">VAULTSIGNAL PREMIUM</div><h2>${esc(f?.title||'Premium tool')}</h2><p>${esc(f?.desc||'This tool is part of VaultSignal Premium.')}</p>
      <div class="premium-price-line"><strong>$${PREMIUM_PRICE_MONTHLY.toFixed(2)}</strong><span>/ month</span></div>
      <div class="action-row"><button class="btn primary" onclick="openTool('premium')">See Premium</button><button class="btn" onclick="premiumRestorePurchases()">Restore purchases</button></div>
    </div>
  </div>`;
}
function premiumPurchaseAction(){
  if(premiumPreviewEnabled()){
    toast('Premium Preview is enabled for development. Store billing is intentionally not live yet.');
    return;
  }
  if(window.VaultSignalBilling?.purchase){
    window.VaultSignalBilling.purchase(PREMIUM_PRODUCT_ID);
    return;
  }
  alert('Store billing is not connected in this web build yet. The Android/iOS release wrapper will open Google Play Billing or Apple StoreKit here.');
}
function premiumRestorePurchases(){
  if(window.VaultSignalBilling?.restore){
    window.VaultSignalBilling.restore();
    return;
  }
  toast('Restore purchases will be enabled in the Android/iOS store build');
}
function premiumToolBadge(id){
  return PREMIUM_TOOL_IDS.has(id)?`<span class="premium-mini">$4.99/mo</span>`:'';
}
function premiumComparisonMarkup(){
  const rows=[
    ['Collection & sealed Vault','✓','✓'],
    ['Basic live card search','✓','✓'],
    [`Live camera/value scans`,`3/day`,`Unlimited`],
    ['Exact product retailer search','✓','✓'],
    ['Nearby Inventory Radar','—','✓'],
    ['Inventory Command audits + ledger','—','✓'],
    ['Signal Center','—','✓'],
    ['VaultIQ','—','✓'],
    ['Market Pulse','—','✓'],
    ['Dashboard Pro','—','✓'],
    ['Trade Lab + Sell Lab','—','✓'],
    ['Showcase Studio','—','✓'],
    ['Cloud sync / multi-device when connected','—','✓']
  ];
  return `<div class="premium-table">
    <div class="premium-table-row head"><b>Feature</b><b>Free</b><b>Premium</b></div>
    ${rows.map(r=>`<div class="premium-table-row"><span>${esc(r[0])}</span><strong>${esc(r[1])}</strong><strong>${esc(r[2])}</strong></div>`).join('')}
  </div>`;
}
function renderPremiumCenter(){
  ensurePremiumSchema();
  const status=premiumStatusLabel();
  const used=premiumScannerUsage();
  const cfg=premiumConfig();
  return `<div class="panel premium-hero">
    <div class="section-head">
      <div><div class="eyebrow">VAULTSIGNAL PREMIUM</div><h2>Make the $4.99 feel obvious</h2><p>Free stays useful. Premium removes limits and unlocks the tools that save collectors time, surface inventory, organize physical stock and connect decisions across the whole app.</p></div>
      <span class="badge signal-gold">${esc(status.toUpperCase())}</span>
    </div>
    <div class="premium-price"><span>$</span><strong>4.99</strong><small>/ month</small></div>
    <div class="premium-value-grid">
      ${PREMIUM_FEATURES.slice(0,6).map(f=>`<div><b>${esc(f.title)}</b><span>${esc(f.desc)}</span></div>`).join('')}
    </div>
    <div class="action-row" style="margin-top:12px">
      <button class="btn primary" onclick="premiumPurchaseAction()">${hasPremium()?'Premium enabled':'Upgrade to Premium'}</button>
      <button class="btn" onclick="premiumRestorePurchases()">Restore purchases</button>
    </div>
    ${premiumPreviewEnabled()?`<div class="notice warn" style="margin-top:10px"><span>!</span><span><b>Development Premium Preview is ON.</b> Every premium tool is unlocked while we build/test. This must be switched off before App Store / Play Store release.</span></div>`:''}
  </div>

  <div class="panel">
    <div class="section-head"><div><div class="eyebrow">FREE VS PREMIUM</div><h2>Useful free app, compelling paid upgrade</h2><p>Premium is focused on automation, intelligence, unlimited scanning and serious inventory operations—not basic access to your own collection.</p></div></div>
    ${premiumComparisonMarkup()}
  </div>

  <div class="panel">
    <div class="section-head"><div><div class="eyebrow">YOUR USAGE</div><h2>Free scanner allowance</h2><p>Free users get ${PREMIUM_FREE_SCANS_PER_DAY} live scanner/value lookups per day. Premium removes the limit.</p></div></div>
    <div class="stat-grid compact-stats">
      <div class="stat-card"><span>Used today</span><strong>${hasPremium()?'∞':used}</strong><small>${hasPremium()?'Unlimited Premium scans':`${Math.max(0,PREMIUM_FREE_SCANS_PER_DAY-used)} free scans remaining`}</small></div>
      <div class="stat-card"><span>Monthly price</span><strong>$4.99</strong><small>${esc(PREMIUM_PRODUCT_ID)}</small></div>
      <div class="stat-card"><span>Release channel</span><strong>${esc(cfg.releaseChannel||'development')}</strong><small>${premiumPreviewEnabled()?'Premium preview enabled':'Store entitlement required'}</small></div>
      <div class="stat-card"><span>Billing bridge</span><strong>${window.VaultSignalBilling?'Ready':'Pending'}</strong><small>Native Android/iOS layer</small></div>
    </div>
  </div>

  <div class="panel mobile-launch-panel">
    <div class="section-head"><div><div class="eyebrow">ANDROID + IOS LAUNCH</div><h2>Store-release foundation</h2><p>The web app remains our shared UI/codebase. Store releases wrap it natively and connect platform billing, secure entitlements, camera permissions and push capabilities.</p></div></div>
    <div class="launch-grid">
      <div><b>Shared VaultSignal app</b><span>Current PWA / HTML / CSS / JS stays the product core.</span><i class="ready">READY</i></div>
      <div><b>Android wrapper</b><span>Capacitor shell + Google Play Billing.</span><i class="next">NEXT</i></div>
      <div><b>iOS wrapper</b><span>Capacitor shell + StoreKit in-app purchase.</span><i class="next">NEXT</i></div>
      <div><b>Premium entitlement verification</b><span>Native purchase receipt → secure backend entitlement → app unlock.</span><i class="next">NEXT</i></div>
      <div><b>Store product</b><span>${esc(PREMIUM_PRODUCT_ID)} • $4.99 monthly.</span><i class="planned">PLANNED</i></div>
      <div><b>Cloud accounts</b><span>Needed for durable cross-device Premium and sync.</span><i class="planned">PLANNED</i></div>
    </div>
  </div>`;
}

function $(id){ return document.getElementById(id); }
function uid(){ return (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())+Math.random().toString(16).slice(2)); }
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return structuredClone(seed);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(seed),
      ...parsed,
      settings:{...seed.settings,...(parsed.settings||{})}
    };
  }catch{ return structuredClone(seed); }
}
function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}


function ensureScannerSchema(){
  if(!Array.isArray(state.scanQueue)) state.scanQueue=[];
  if(!Array.isArray(state.scannerRecentScans)) state.scannerRecentScans=[];
  state.scannerSettings={
    gradingValueThreshold:25,
    preferredBinder:'Main Binder',
    ...(state.scannerSettings||{})
  };
  if(!binderNames().includes(state.scannerSettings.preferredBinder)){
    state.scannerSettings.preferredBinder=binderNames()[0]||'Main Binder';
  }
}

function ensureCollectionSchema(){
  if(!Array.isArray(state.binders) || !state.binders.length){
    state.binders=[{uid:'binder-default',name:'Main Binder',game:'All',notes:'Default collection binder'}];
  }
  for(const item of state.collection||[]){
    if(!item.location || item.location==='Binder' || item.location==='Binder 1') item.location='Main Binder';
    if(!item.format) item.format='Raw';
    if(!item.grader) item.grader='';
    if(!item.grade) item.grade='';
    if(!item.cert) item.cert='';
    if(!item.language) item.language='English';
    if(!item.variant) item.variant='Standard';
  }
}
function binderNames(){
  ensureCollectionSchema();
  return state.binders.map(b=>b.name);
}
function collectionCopiesForCard(cardId){
  return (state.collection||[]).filter(i=>i.card?.id===cardId);
}
function totalOwnedForCard(cardId){
  return collectionCopiesForCard(cardId).reduce((n,i)=>n+(Number(i.qty)||0),0);
}
function collectionValueForCard(cardId){
  return collectionCopiesForCard(cardId).reduce((n,i)=>n+(Number(i.card?.market)||0)*(Number(i.qty)||0),0);
}
function averageCostForCard(cardId){
  const items=collectionCopiesForCard(cardId);
  const qty=items.reduce((n,i)=>n+(Number(i.qty)||0),0);
  if(!qty)return 0;
  return items.reduce((n,i)=>n+(Number(i.cost)||0)*(Number(i.qty)||0),0)/qty;
}

function ripSessionById(id){
  return (state.ripSessions||[]).find(s=>s.uid===id)||null;
}
function ripSessionStats(session){
  const pulls=session?.pulls||[];
  const totalValue=pulls.reduce((n,p)=>n+(Number(p.card?.market)||0)*(Number(p.qty)||0),0);
  const hitCount=pulls.filter(p=>(Number(p.card?.market)||0)>=(Number(session?.hitThreshold)||5)).reduce((n,p)=>n+(Number(p.qty)||0),0);
  const cardsPulled=pulls.reduce((n,p)=>n+(Number(p.qty)||0),0);
  const spent=Number(session?.cost)||0;
  const roi=spent?((totalValue-spent)/spent*100):0;
  const uniqueSets=new Set(pulls.map(p=>p.card?.set).filter(Boolean));
  return {totalValue,hitCount,cardsPulled,spent,roi,uniqueSets:uniqueSets.size};
}
function allRipStats(){
  const sessions=state.ripSessions||[];
  const totals=sessions.map(ripSessionStats);
  const spent=totals.reduce((n,x)=>n+x.spent,0);
  const value=totals.reduce((n,x)=>n+x.totalValue,0);
  const cards=totals.reduce((n,x)=>n+x.cardsPulled,0);
  const hits=totals.reduce((n,x)=>n+x.hitCount,0);
  const roi=spent?((value-spent)/spent*100):0;
  return {sessions:sessions.length,spent,value,cards,hits,roi};
}
function cardOwnedSetProgress(card){
  const setCards=state.collection.filter(i=>i.card?.set===card.set || (card.setId&&i.card?.setId===card.setId));
  const unique=new Set(setCards.map(i=>i.card?.id||i.card?.number));
  const total=Number(card.setPrintedTotal||card.setTotal||0);
  return {owned:unique.size,total,pct:total?unique.size/total*100:0};
}

function duplicateSummary(){
  const map=new Map();
  for(const i of state.collection||[]){
    const id=i.card?.id||`${i.card?.name}|${i.card?.set}|${i.card?.number}`;
    if(!map.has(id)) map.set(id,{card:i.card,qty:0,entries:0});
    const g=map.get(id);g.qty+=Number(i.qty)||0;g.entries++;
  }
  return [...map.values()].filter(x=>x.qty>1).sort((a,b)=>b.qty-a.qty);
}

function esc(v=''){
  return String(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
function money(v){
  if(typeof v !== 'number' || Number.isNaN(v)) return '—';
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(v);
}
function dateShort(v){
  if(!v) return '—';
  try { return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(v)); }
  catch { return '—'; }
}
function todayInput(){ return new Date().toISOString().slice(0,10); }

function reportAgeMinutes(ts){
  const t = new Date(ts).getTime();
  if(!Number.isFinite(t)) return 999999;
  return Math.max(0,(Date.now()-t)/60000);
}
function confidenceScore(report){
  const age = reportAgeMinutes(report.ts);
  let score = age <= 15 ? 92 : age <= 60 ? 82 : age <= 180 ? 68 : age <= 480 ? 50 : age <= 1440 ? 30 : 14;
  score += Math.min(8,(Number(report.confirmations)||0)*2);
  score -= Math.min(25,(Number(report.soldOutConfirmations)||0)*8);
  if(report.status === 'Out of stock') score = Math.min(score,45);
  return Math.max(5,Math.min(99,Math.round(score)));
}
function confidenceLabel(score){
  return score >= 85 ? 'VERY FRESH' : score >= 70 ? 'FRESH' : score >= 50 ? 'AGING' : 'STALE';
}
function humanAge(ts){
  const m = reportAgeMinutes(ts);
  if(m < 1) return 'just now';
  if(m < 60) return `${Math.floor(m)}m ago`;
  if(m < 1440) return `${Math.floor(m/60)}h ago`;
  return `${Math.floor(m/1440)}d ago`;
}

function cloudReady(){
  return Boolean(window.TWOGEN_CLOUD?.configured && window.TWOGEN_CLOUD?.client);
}
function signedIn(){
  return Boolean(window.TWOGEN_CLOUD?.user);
}
function accountLabel(){
  const c=window.TWOGEN_CLOUD;
  if(!c?.configured) return 'Guest • Cloud not configured';
  if(c.error) return 'Cloud unavailable';
  if(c.user) return c.profile?.display_name || c.user.email || 'Signed in';
  return 'Guest mode';
}
function cloudReportConfidence(report){
  const counts=state.communityConfirmationCounts?.[report.id]||{still:0,gone:0};
  const localShape={
    ts:report.updated_at||report.created_at,
    status:report.status==='in_stock'?'In stock':report.status==='low_stock'?'Low stock':report.status==='out_of_stock'?'Out of stock':report.status,
    confirmations:counts.still,
    soldOutConfirmations:counts.gone
  };
  return confidenceScore(localShape);
}


function toast(msg){
  const el = $('toast'); if(!el) return;
  clearTimeout(toastTimer);
  el.textContent = msg; el.classList.add('show');
  toastTimer = setTimeout(()=>el.classList.remove('show'),2400);
}
function cardArt(card, square=false){
  return `<div class="thumb ${square?'square':''}">${card.image?`<img src="${esc(card.image)}" alt="">`:`<b>${esc((card.game||'TC').slice(0,2).toUpperCase())}</b>`}</div>`;
}
function totals(){
  const cards = state.collection.reduce((n,i)=>n+(Number(i.qty)||0),0);
  const cardMarket = state.collection.reduce((n,i)=>n+(Number(i.card.market)||0)*(Number(i.qty)||0),0);
  const cardCost = state.collection.reduce((n,i)=>n+(Number(i.cost)||0)*(Number(i.qty)||0),0);
  const sealedValue = state.sealed.reduce((n,i)=>n+(Number(i.current)||0)*(Number(i.qty)||0),0);
  const sealedCost = state.sealed.reduce((n,i)=>n+(Number(i.cost)||0)*(Number(i.qty)||0),0);
  const market = cardMarket + sealedValue;
  const cost = cardCost + sealedCost;
  return {cards,cardMarket,cardCost,sealedValue,sealedCost,market,cost,gain:market-cost,pct:cost?((market-cost)/cost*100):0};
}


function ensurePriceHistorySchema(){
  if(!state.cardPriceHistory || typeof state.cardPriceHistory!=='object') state.cardPriceHistory={};
  if(!Array.isArray(state.priceRefreshLog)) state.priceRefreshLog=[];
}
function captureCardPrice(card, source='Live card data'){
  ensurePriceHistorySchema();
  if(!card?.id) return;
  const market=Number(card.market);
  const low=Number(card.low);
  if(!Number.isFinite(market) && !Number.isFinite(low)) return;

  const rows=state.cardPriceHistory[card.id] ||= [];
  const now=new Date();
  const day=now.toISOString().slice(0,10);
  const point={
    ts:now.toISOString(),
    day,
    market:Number.isFinite(market)?market:null,
    low:Number.isFinite(low)?low:null,
    source
  };

  const existing=rows.find(r=>r.day===day);
  if(existing) Object.assign(existing, point);
  else rows.push(point);

  state.cardPriceHistory[card.id]=rows
    .sort((a,b)=>new Date(a.ts)-new Date(b.ts))
    .slice(-365);
}
function priceHistoryFor(cardId){
  ensurePriceHistorySchema();
  return (state.cardPriceHistory[cardId]||[]).slice().sort((a,b)=>new Date(a.ts)-new Date(b.ts));
}
function previousMarketFor(cardId){
  const h=priceHistoryFor(cardId).filter(x=>Number.isFinite(Number(x.market)));
  if(h.length<2) return null;
  return Number(h[h.length-2].market);
}
function marketDeltaFor(card){
  const current=Number(card?.market);
  const prev=previousMarketFor(card?.id);
  if(!Number.isFinite(current) || !Number.isFinite(prev) || prev===0) return {amount:null,pct:null,previous:prev};
  const amount=current-prev;
  return {amount,pct:amount/prev*100,previous:prev};
}
function uniqueCollectionCards(){
  const m=new Map();
  for(const i of state.collection||[]){
    if(i.card?.id && !m.has(i.card.id)) m.set(i.card.id,i.card);
  }
  return [...m.values()];
}

const LIVE_CARD_PROVIDERS = {
  Pokemon:{key:'pokemontcg',label:'Pokémon TCG',price:'TCGplayer market fields'},
  Lorcana:{key:'lorcast',label:'Lorcast',price:'USD / foil fields'},
  Magic:{key:'scryfall',label:'Scryfall',price:'USD / foil fields'},
  'Yu-Gi-Oh!':{key:'ygoprodeck',label:'YGOPRODeck',price:'set-price reference'}
};
function providerForGame(game){
  return LIVE_CARD_PROVIDERS[game]||null;
}
function liveProviderSupported(card){
  return ['pokemontcg','lorcast','scryfall','ygoprodeck'].includes(card?.provider);
}
function liveLorcanaCardFromApi(c){
  const normal=Number(c?.prices?.usd);
  const foil=Number(c?.prices?.usd_foil);
  const market=Number.isFinite(normal)&&normal>0?normal:(Number.isFinite(foil)&&foil>0?foil:undefined);
  return {
    id:`lorcast-${c.id}`,provider:'lorcast',providerId:c.id,game:'Lorcana',
    name:[c.name,c.version].filter(Boolean).join(' — '),
    baseName:c.name||'',version:c.version||'',
    set:c.set?.name||'Unknown set',setId:c.set?.id||'',setCode:c.set?.code||'',
    releaseDate:c.released_at||'',number:c.collector_number||'',rarity:String(c.rarity||'').replace(/_/g,' '),
    artist:(c.illustrators||[]).join(', '),
    image:c.image_uris?.digital?.small||c.image_uris?.digital?.normal||'',
    market,low:market,
    finish: normal>0?'Normal':foil>0?'Foil':'',
    providerPrices:{usd:Number.isFinite(normal)?normal:null,usdFoil:Number.isFinite(foil)?foil:null},
    url:c.tcgplayer_id?`https://www.tcgplayer.com/search/lorcana/product?productLineName=lorcana&q=${encodeURIComponent(c.name||'')}&view=grid`:''
  };
}
function liveMagicCardFromApi(c){
  const normal=Number(c?.prices?.usd);
  const foil=Number(c?.prices?.usd_foil);
  const market=Number.isFinite(normal)&&normal>0?normal:(Number.isFinite(foil)&&foil>0?foil:undefined);
  const face=c.image_uris || c.card_faces?.find(f=>f.image_uris)?.image_uris || {};
  return {
    id:`scryfall-${c.id}`,provider:'scryfall',providerId:c.id,game:'Magic',
    name:c.name||'Unknown card',set:c.set_name||'Unknown set',setId:c.set||'',setCode:c.set||'',
    releaseDate:c.released_at||'',number:c.collector_number||'',rarity:c.rarity||'',
    artist:c.artist||'',image:face.small||face.normal||'',
    market,low:market,finish:normal>0?'Nonfoil':foil>0?'Foil':'',
    providerPrices:{usd:Number.isFinite(normal)?normal:null,usdFoil:Number.isFinite(foil)?foil:null},
    url:c.scryfall_uri||''
  };
}
function liveYgoPrintsFromApi(c){
  const vendor=Array.isArray(c.card_prices)?c.card_prices[0]||{}:{};
  const vendorTcg=Number(vendor.tcgplayer_price);
  const sets=Array.isArray(c.card_sets)&&c.card_sets.length?c.card_sets:[null];
  return sets.map((s,idx)=>{
    const setPrice=Number(s?.set_price);
    const market=Number.isFinite(setPrice)&&setPrice>0?setPrice:(Number.isFinite(vendorTcg)&&vendorTcg>0?vendorTcg:undefined);
    return {
      id:`ygopro-${c.id}-${s?.set_code||idx}`,provider:'ygoprodeck',providerId:String(c.id),
      providerSetCode:s?.set_code||'',game:'Yu-Gi-Oh!',name:c.name||'Unknown card',
      set:s?.set_name||'Unknown printing',setId:s?.set_code||'',setCode:s?.set_code||'',
      releaseDate:'',number:s?.set_code||'',rarity:s?.set_rarity||'',
      artist:'',
      // YGOPRODeck asks developers not to continuously hotlink its card images.
      // This static Pages build therefore leaves image blank instead of hammering their image CDN.
      image:'',
      market,low:market,
      providerPrices:{
        setPrice:Number.isFinite(setPrice)?setPrice:null,
        tcgplayer:Number.isFinite(vendorTcg)?vendorTcg:null
      },
      url:''
    };
  });
}
async function universalSearchCards(game,q,limit=24){
  const clean=String(q||'').trim().replace(/"/g,'');
  if(!clean) return [];

  if(game==='Pokemon'){
    const numberLike=/^[a-z0-9-]{1,15}$/i.test(clean)&&/\d/.test(clean);
    const query=numberLike?`(name:"${clean}" OR number:"${clean}")`:`name:"${clean}"`;
    let r=await fetch(`https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}&pageSize=${Math.min(50,limit)}&orderBy=-set.releaseDate`);
    if(!r.ok && numberLike){
      r=await fetch(`https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(`number:"${clean}"`)}&pageSize=${Math.min(50,limit)}&orderBy=-set.releaseDate`);
    }
    if(!r.ok) throw new Error(`Pokémon card API returned ${r.status}`);
    const d=await r.json();
    return (d.data||[]).map(livePokemonCardFromApi).slice(0,limit);
  }

  if(game==='Lorcana'){
    const r=await fetch(`https://api.lorcast.com/v0/cards/search?q=${encodeURIComponent(clean)}&unique=prints`);
    if(!r.ok) throw new Error(`Lorcana card API returned ${r.status}`);
    const d=await r.json();
    return (d.results||[]).map(liveLorcanaCardFromApi).slice(0,limit);
  }

  if(game==='Magic'){
    const r=await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(clean)}&unique=prints&order=released&dir=desc`);
    if(!r.ok) throw new Error(`Magic card API returned ${r.status}`);
    const d=await r.json();
    return (d.data||[]).map(liveMagicCardFromApi).slice(0,limit);
  }

  if(game==='Yu-Gi-Oh!'){
    const r=await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(clean)}&num=20&offset=0`);
    if(!r.ok) throw new Error(`Yu-Gi-Oh! card API returned ${r.status}`);
    const d=await r.json();
    return (d.data||[]).flatMap(liveYgoPrintsFromApi).slice(0,limit);
  }

  throw new Error(`${game} live search is not connected yet. Use manual tracking for now.`);
}
async function refreshUniversalCard(card){
  if(card.provider==='pokemontcg'){
    const r=await fetch(`https://api.pokemontcg.io/v2/cards/${encodeURIComponent(card.providerId||card.id)}`);
    if(!r.ok)throw new Error(`Pokémon lookup ${r.status}`);
    const d=await r.json();return livePokemonCardFromApi(d.data);
  }
  if(card.provider==='lorcast'){
    const r=await fetch(`https://api.lorcast.com/v0/cards/${encodeURIComponent(card.setCode||card.setId)}/${encodeURIComponent(card.number)}`);
    if(!r.ok)throw new Error(`Lorcana lookup ${r.status}`);
    return liveLorcanaCardFromApi(await r.json());
  }
  if(card.provider==='scryfall'){
    const r=await fetch(`https://api.scryfall.com/cards/${encodeURIComponent(card.providerId||String(card.id).replace(/^scryfall-/,''))}`);
    if(!r.ok)throw new Error(`Magic lookup ${r.status}`);
    return liveMagicCardFromApi(await r.json());
  }
  if(card.provider==='ygoprodeck'){
    const r=await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(card.name)}`);
    if(!r.ok)throw new Error(`Yu-Gi-Oh! lookup ${r.status}`);
    const d=await r.json();
    const prints=(d.data||[]).flatMap(liveYgoPrintsFromApi);
    return prints.find(x=>x.providerSetCode===card.providerSetCode)||prints[0]||card;
  }
  throw new Error('This card does not have a live refresh provider.');
}

function livePokemonCardFromApi(c){
  const ps=Object.values(c.tcgplayer?.prices||{});
  const market=ps.find(p=>typeof p.market==='number')?.market;
  const lows=ps.map(p=>p.low).filter(v=>typeof v==='number');
  return {
    id:c.id,provider:'pokemontcg',providerId:c.id,game:'Pokemon',name:c.name,
    set:c.set?.name||'Unknown set',setId:c.set?.id||'',
    setSeries:c.set?.series||'',setPrintedTotal:c.set?.printedTotal||c.set?.total||0,
    setTotal:c.set?.total||0,releaseDate:c.set?.releaseDate||'',
    number:c.number||'',rarity:c.rarity||'',artist:c.artist||'',
    supertype:c.supertype||'',subtypes:c.subtypes||[],
    hp:c.hp||'',
    attacks:Array.isArray(c.attacks)?c.attacks.map(a=>({name:a.name||'',damage:a.damage||'',text:a.text||''})):[],
    image:c.images?.small||c.images?.large||'',
    market,low:lows.length?Math.min(...lows):undefined,
    providerPrices:c.tcgplayer?.prices||{},
    url:c.tcgplayer?.url||''
  };
}
async function fetchLiveCardById(card){
  return refreshUniversalCard(card);
}
function applyLivePriceToVault(card){
  for(const i of state.collection||[]){
    if(i.card?.id===card.id){
      i.card={...i.card,...card};
    }
  }
  for(const w of state.wishlist||[]){
    if(w.card?.id===card.id) w.card={...w.card,...card};
  }
  for(const a of state.priceAlerts||[]){
    if(a.card?.id===card.id) a.card={...a.card,...card};
  }
  for(const s of state.ripSessions||[]){
    for(const p of s.pulls||[]){
      if(p.card?.id===card.id) p.card={...p.card,...card};
    }
  }
  for(const q of state.scanQueue||[]){
    if(q.card?.id===card.id) q.card={...q.card,...card};
  }
}
async function refreshVaultPrices(){
  if(marketRefreshBusy) return;
  const cards=uniqueCollectionCards().filter(liveProviderSupported);
  if(!cards.length){toast('No live-provider cards in the Vault yet');return;}

  marketRefreshBusy=true;
  renderTools();
  let ok=0, failed=0;
  const started=new Date().toISOString();

  for(let idx=0; idx<cards.length; idx++){
    const card=cards[idx];
    const status=$('marketRefreshStatus');
    if(status) status.textContent=`Refreshing ${idx+1}/${cards.length} • ${card.name}`;
    try{
      const live=await fetchLiveCardById(card);
      captureCardPrice(live,'Vault price refresh');
      applyLivePriceToVault(live);
      ok++;
    }catch{
      failed++;
    }
    // Gentle pacing for the public API.
    if(idx<cards.length-1) await new Promise(r=>setTimeout(r,160));
  }

  state.priceRefreshLog.unshift({
    uid:uid(),started,finished:new Date().toISOString(),requested:cards.length,updated:ok,failed
  });
  state.priceRefreshLog=state.priceRefreshLog.slice(0,50);
  saveState();
  ensureDailySnapshot();
  marketRefreshBusy=false;
  renderTools();
  toast(`Prices refreshed • ${ok} updated${failed?` • ${failed} failed`:''}`);
}
function marketMovers(){
  const rows=uniqueCollectionCards().map(card=>{
    const d=marketDeltaFor(card);
    return {card,...d};
  }).filter(x=>Number.isFinite(x.pct));
  return rows.sort((a,b)=>b.pct-a.pct);
}
function marketHistorySvg(cardId,width=500,height=140){
  const h=priceHistoryFor(cardId).filter(x=>Number.isFinite(Number(x.market))).slice(-30);
  if(!h.length) return `<div class="empty">No price history yet. Refresh Vault Prices to begin tracking.</div>`;
  return svgSparkline(h.map(x=>Number(x.market)),width,height);
}
function priceTargetStatus(alert){
  const market=Number(alert.card?.market);
  const target=Number(alert.target);
  if(!Number.isFinite(market)||!Number.isFinite(target)) return {hit:false,diff:null};
  return {hit:market<=target,diff:market-target};
}

function currentSnapshot(){
  const t=totals();
  return {
    uid:uid(),
    ts:new Date().toISOString(),
    day:new Date().toISOString().slice(0,10),
    market:t.market,
    cost:t.cost,
    cardMarket:t.cardMarket,
    sealedValue:t.sealedValue,
    cards:t.cards,
    sealedQty:state.sealed.reduce((n,x)=>n+(Number(x.qty)||0),0)
  };
}
function ensureDailySnapshot(){
  if(!Array.isArray(state.portfolioSnapshots)) state.portfolioSnapshots=[];
  const day=new Date().toISOString().slice(0,10);
  const existing=state.portfolioSnapshots.find(x=>x.day===day);
  const snap=currentSnapshot();
  if(existing){
    Object.assign(existing,snap,{uid:existing.uid});
  }else{
    state.portfolioSnapshots.push(snap);
  }
  state.portfolioSnapshots=state.portfolioSnapshots
    .sort((a,b)=>new Date(a.ts)-new Date(b.ts))
    .slice(-365);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function saveSnapshotNow(){
  if(!Array.isArray(state.portfolioSnapshots)) state.portfolioSnapshots=[];
  state.portfolioSnapshots.push(currentSnapshot());
  state.portfolioSnapshots=state.portfolioSnapshots.sort((a,b)=>new Date(a.ts)-new Date(b.ts)).slice(-365);
  saveState();
  renderTools();
  toast('Portfolio snapshot saved');
}
function monthlySpendSeries(months=6){
  const now=new Date();
  const rows=[];
  for(let i=months-1;i>=0;i--){
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label=d.toLocaleDateString('en-US',{month:'short'});
    const amount=(state.purchases||[]).filter(p=>(p.date||'').startsWith(key)).reduce((n,p)=>n+(Number(p.amount)||0),0);
    rows.push({key,label,amount});
  }
  return rows;
}
function portfolioTrend(){
  const snaps=(state.portfolioSnapshots||[]).slice().sort((a,b)=>new Date(a.ts)-new Date(b.ts));
  if(!snaps.length) return [];
  // Keep one snapshot per calendar day, most recent wins.
  const byDay=new Map();
  snaps.forEach(s=>byDay.set(s.day||String(s.ts).slice(0,10),s));
  return [...byDay.values()].slice(-30);
}
function svgSparkline(values,width=320,height=90){
  if(!values.length) return '';
  const nums=values.map(Number).filter(Number.isFinite);
  if(!nums.length) return '';
  const min=Math.min(...nums), max=Math.max(...nums);
  const range=(max-min)||1;
  const pts=nums.map((v,i)=>{
    const x=nums.length===1?width/2:i*(width/(nums.length-1));
    const y=height-8-((v-min)/range)*(height-16);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return `<svg class="sparkline" viewBox="0 0 ${width} ${height}" role="img" aria-label="Portfolio trend"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function allocationData(){
  const t=totals();
  const total=t.market||1;
  return [
    {name:'Singles',value:t.cardMarket,pct:t.cardMarket/total*100},
    {name:'Sealed',value:t.sealedValue,pct:t.sealedValue/total*100}
  ];
}
function gameAllocation(){
  const map=new Map();
  for(const i of state.collection||[]){
    const game=i.card?.game||'Other';
    map.set(game,(map.get(game)||0)+(Number(i.card?.market)||0)*(Number(i.qty)||0));
  }
  for(const i of state.sealed||[]){
    const game=i.game||'Other';
    map.set(game,(map.get(game)||0)+(Number(i.current)||0)*(Number(i.qty)||0));
  }
  return [...map.entries()].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
}
function positionRows(){
  return (state.collection||[]).map(i=>{
    const qty=Number(i.qty)||0;
    const marketEach=Number(i.card?.market)||0;
    const costEach=Number(i.cost)||0;
    const market=marketEach*qty;
    const cost=costEach*qty;
    const gain=market-cost;
    const pct=cost?gain/cost*100:0;
    return {item:i,market,cost,gain,pct};
  }).sort((a,b)=>b.gain-a.gain);
}
function valuableCards(limit=5){
  return [...(state.collection||[])]
    .map(i=>({item:i,value:(Number(i.card?.market)||0)*(Number(i.qty)||0)}))
    .sort((a,b)=>b.value-a.value)
    .slice(0,limit);
}
function collectionSetAnalytics(){
  const map=new Map();
  for(const i of state.collection||[]){
    const key=i.card?.setId||i.card?.set||'Unknown';
    if(!map.has(key)) map.set(key,{name:i.card?.set||'Unknown',unique:new Set(),total:Number(i.card?.setPrintedTotal||i.card?.setTotal||0)});
    const g=map.get(key);
    g.unique.add(i.card?.id||i.card?.number||i.card?.name);
    g.total=Math.max(g.total,Number(i.card?.setPrintedTotal||i.card?.setTotal||0));
  }
  for(const g of state.setGoals||[]){
    const key=`goal:${g.game}:${g.setName}`;
    if(!map.has(key)) map.set(key,{name:g.setName,unique:new Set(Array.from({length:Number(g.owned)||0},(_,i)=>`goal-${i}`)),total:Number(g.total)||0});
  }
  return [...map.values()].map(g=>{
    const owned=g.unique.size;
    const total=g.total||0;
    return {name:g.name,owned,total,pct:total?Math.min(100,owned/total*100):0};
  }).sort((a,b)=>b.pct-a.pct);
}
function dataHealthScore(){
  const collection=state.collection||[], sealed=state.sealed||[];
  const cardQty=collection.reduce((n,i)=>n+(Number(i.qty)||0),0);
  const sealedQty=sealed.reduce((n,i)=>n+(Number(i.qty)||0),0);
  const cardCostQty=collection.reduce((n,i)=>n+((Number(i.cost)||0)>0?(Number(i.qty)||0):0),0);
  const locatedQty=collection.reduce((n,i)=>n+(i.location?(Number(i.qty)||0):0),0);
  const sealedTracked=sealed.reduce((n,i)=>n+(((Number(i.cost)||0)>0 && (Number(i.current)||0)>0)?(Number(i.qty)||0):0),0);

  const costScore=cardQty?cardCostQty/cardQty*25:25;
  const locationScore=cardQty?locatedQty/cardQty*20:20;
  const sealedScore=sealedQty?sealedTracked/sealedQty*20:20;
  const binderScore=(state.binders||[]).length>=2?10:5;
  const purchaseScore=(state.purchases||[]).length?10:4;
  let backupScore=0;
  if(state.settings?.lastBackupAt){
    const days=(Date.now()-new Date(state.settings.lastBackupAt).getTime())/86400000;
    backupScore=days<=7?15:days<=30?10:5;
  }
  const score=Math.round(Math.min(100,costScore+locationScore+sealedScore+binderScore+purchaseScore+backupScore));
  const label=score>=85?'Excellent':score>=70?'Strong':score>=50?'Building':'Needs data';
  return {score,label};
}
function ripLeaderboard(){
  return (state.ripSessions||[]).map(s=>({session:s,stats:ripSessionStats(s)}))
    .sort((a,b)=>b.stats.roi-a.stats.roi);
}

function monthSpend(){
  const month = new Date().toISOString().slice(0,7);
  return state.purchases.filter(x=>(x.date||'').startsWith(month)).reduce((n,x)=>n+(Number(x.amount)||0),0);
}
function openRetailerSearch(retailer, query){
  const q = encodeURIComponent(query || stockQuery || 'trading cards');
  const urls = {
    'Walmart':`https://www.walmart.com/search?q=${q}`,
    'Target':`https://www.target.com/s?searchTerm=${q}`,
    'Best Buy':`https://www.bestbuy.com/site/searchpage.jsp?st=${q}`,
    'GameStop':`https://www.gamestop.com/search/?q=${q}`,
    "Sam's Club":`https://www.samsclub.com/s/${q}`,
    'Costco':`https://www.costco.com/CatalogSearch?keyword=${q}`,
    'Walgreens':`https://www.walgreens.com/search/results.jsp?Ntt=${q}`,
    'CVS':`https://www.cvs.com/search?searchTerm=${q}`,
    'Dollar General':`https://www.dollargeneral.com/search?searchTerm=${q}`,
    'Family Dollar':`https://www.familydollar.com/searchresults?Ntt=${q}`
  };
  const url = urls[retailer] || `https://www.google.com/search?q=${q}+near+me`;
  window.open(url,'_blank','noopener');
}

function switchTab(tab){
  currentTab = tab;
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id===tab));
  document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  render(tab);
  window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('.bottom-nav button').forEach(b=>b.addEventListener('click',()=>{
  if(b.dataset.tab==='tools')toolsTab='menu';
  switchTab(b.dataset.tab);
}));

function render(which=currentTab){
  if(which==='home') renderHome();
  if(which==='stock') renderStock();
  if(which==='discover') renderDiscover();
  if(which==='vault') renderVault();
  if(which==='tools') renderTools();
  updateStatus();
}

function updateStatus(){
  const pill = $('connectionPill');
  if(!pill) return;
  const backend = (window.TWOGEN_CONFIG?.inventoryApiBase||'').trim();
  const cloud = cloudReady();
  const verifiedLive=liveInventoryProviders().length>0;
  pill.classList.toggle('live', verifiedLive || cloud || !!backend);
  pill.querySelector('span').textContent = signedIn() ? 'Cloud Synced' : verifiedLive ? 'Live Inventory' : backend ? 'Inventory Service' : cloud ? 'Cloud Ready' : 'Collector OS';
}

function renderHome(){
  ensureWatchtowerSchema();
  evaluateWatchtower({notify:false});
  const t = totals();
  const spent = monthSpend();
  const budget = Number(state.settings.monthlyBudget)||0;
  const left = budget - spent;
  const top = [...state.collection].sort((a,b)=>(Number(b.card.market)||0)*b.qty-(Number(a.card.market)||0)*a.qty).slice(0,4);
  const recentStock = [...state.stockReports].sort((a,b)=>new Date(b.ts)-new Date(a.ts)).slice(0,3);
  const trend = portfolioTrend();
  const health = dataHealthScore();
  const homeActions = buildActionCenter();
  const homeActionCounts = actionCounts(homeActions);
  const homeWatchtowerUnread = watchtowerUnread();
  const homeWatchtowerHigh = watchtowerHighUnread();
  $('home').innerHTML = `
    <div class="hero">
      <div class="eyebrow">VAULTSIGNAL • BY 2GEN RIPS</div>
      <h1>${esc(state.settings.brand)}</h1>
      <p>${esc(state.settings.tagline)}</p>
      <p class="sub">Scan • Value • Track • Hunt • Trade • Sell — one collector operating system.</p>
      <div class="hero-badges">
        <span class="badge primary">◆ COLLECTOR OS</span>
        <span class="badge">◎ ${state.stockWatches.length} STOCK WATCHES</span>
        <span class="badge">◈ ${(state.productCatalog||[]).length} PRODUCTS</span>
        <span class="badge">⌖ ${state.huntRoute.filter(x=>!x.visited).length} HUNT STOPS</span>
        <span class="badge signal-gold">BY 2GEN RIPS</span>
        <span class="badge">${signedIn()?'☁ SYNCED':'☁ GUEST'}</span>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card"><span>Total vault value</span><strong>${money(t.market)}</strong><small class="${t.gain>=0?'good':'bad'}">${t.gain>=0?'+':''}${money(t.gain)} • ${t.pct.toFixed(1)}%</small></div>
      <div class="stat-card"><span>Cards owned</span><strong>${t.cards}</strong><small>${state.collection.length} unique entries</small></div>
      <div class="stat-card"><span>Sealed value</span><strong>${money(t.sealedValue)}</strong><small>${state.sealed.reduce((n,x)=>n+(Number(x.qty)||0),0)} sealed items</small></div>
      <div class="stat-card"><span>Budget left</span><strong class="${left>=0?'good':'bad'}">${money(left)}</strong><small>${money(spent)} spent this month</small></div>
    </div>

    <div class="panel">
      <div class="section-head"><div><h2>Collector command center</h2><p>Fast access to the things collectors actually use.</p></div></div>
      <div class="quick-grid">
        <button class="quick-card premium-quick" onclick="openTool('premium')"><span class="big-icon">★</span><b>VaultSignal Premium</b><span>$4.99/month • unlimited scanning, Inventory Radar, Signal Center, VaultIQ, analytics and pro inventory tools.</span></button>
        <button class="quick-card signal-quick" onclick="openTool('watchtower')"><span class="big-icon">◉</span><b>Signal Center</b><span>${homeWatchtowerUnread} unread • inventory changes, collector alerts and priorities in one feed.</span></button>
        <button class="quick-card inventory-command-quick" onclick="openTool('inventory')"><span class="big-icon">▤</span><b>Inventory Command</b><span>Cards + sealed • cost basis • locations • replenishment • audits • movement ledger.</span></button>
        <button class="quick-card" onclick="switchTab('stock')"><span class="big-icon">◎</span><b>Find inventory</b><span>Nearby stores, live connector, watchlists and stock reports.</span></button>
        <button class="quick-card" onclick="switchTab('discover')"><span class="big-icon">⌕</span><b>Search cards</b><span>Universal live Pokémon, Lorcana, Magic and Yu-Gi-Oh! card network.</span></button>
        <button class="quick-card" onclick="openTool('products')"><span class="big-icon">◈</span><b>Product Command</b><span>UPC/SKU, retailer stock, sealed lots, goals, sightings, pricing and restock intelligence.</span></button>
        <button class="quick-card" onclick="openTool('scanner')"><span class="big-icon">◉</span><b>Smart Scanner</b><span>Batch intake, duplicates, set gaps, binder suggestions and grading review flags.</span></button>
        <button class="quick-card" onclick="openTool('sets')"><span class="big-icon">▦</span><b>Master sets</b><span>Live set checklists, owned progress and missing-card tracking.</span></button>
        <button class="quick-card" onclick="openTool('rips')"><span class="big-icon">✦</span><b>Rip sessions</b><span>Track openings, pulls, value, hits, ROI and set progress.</span></button>
        <button class="quick-card" onclick="openTool('analytics')"><span class="big-icon">⌁</span><b>Dashboard Pro</b><span>Growth, spending, allocation, positions, sets and rip performance.</span></button>
        <button class="quick-card" onclick="openTool('market')"><span class="big-icon">↗</span><b>Market Pulse</b><span>Refresh live card pricing, track snapshots and watch price targets.</span></button>
        <button class="quick-card" onclick="openTool('trades')"><span class="big-icon">⇄</span><b>Trade Lab</b><span>Build deals from your Vault and wishlist with reference-value balancing.</span></button>
        <button class="quick-card" onclick="openTool('sell')"><span class="big-icon">$</span><b>Sell Lab</b><span>Estimate fees, protect cost basis, create listings and track profit.</span></button>
        <button class="quick-card" onclick="openTool('family')"><span class="big-icon">2G</span><b>2GEN Hub</b><span>Family collections, giveaways and creator content in one place.</span></button>
        <button class="quick-card" onclick="openTool('actions')"><span class="big-icon">✓</span><b>Action Center</b><span>${homeActionCounts.total} priorities • ${homeActionCounts.high} high • know what to do next.</span></button>
        <button class="quick-card" onclick="openTool('watchtower')"><span class="big-icon">◉</span><b>Signal Center</b><span>${homeWatchtowerUnread} unread signals • ${homeWatchtowerHigh} high priority.</span></button>
        <button class="quick-card" onclick="openTool('showcase')"><span class="big-icon">★</span><b>Showcase Studio</b><span>Build a privacy-safe Collection Passport and shareable collector page.</span></button>
        <button class="quick-card" onclick="openTool('vaultiq')"><span class="big-icon">IQ</span><b>VaultIQ</b><span>Rank what to buy next using your budget, wishlist, targets, sets and stock watches.</span></button>
      </div>
    </div>



    ${homeWatchtowerUnread?`<div class="panel watchtower-home-preview">
      <div class="section-head"><div><div class="eyebrow">WATCHTOWER</div><h2>${homeWatchtowerUnread} unread alert${homeWatchtowerUnread===1?'':'s'}</h2><p>${homeWatchtowerHigh?`${homeWatchtowerHigh} high-priority alert${homeWatchtowerHigh===1?'':'s'} waiting.`:'No unread high-priority alerts.'}</p></div><button class="btn primary" onclick="openTool('watchtower')">Open inbox</button></div>
      ${(state.notificationInbox||[]).filter(n=>!n.read).slice(0,2).map(n=>watchtowerNotificationMarkup(n)).join('')}
    </div>`:''}

    <div class="panel action-home-preview">
      <div class="section-head"><div><div class="eyebrow">ACTION CENTER</div><h2>${homeActionCounts.total?`${homeActionCounts.total} collector priorities`:'All caught up'}</h2><p>${homeActionCounts.high?`${homeActionCounts.high} high-priority item${homeActionCounts.high===1?'':'s'} need attention.`:'No high-priority collector actions right now.'}</p></div><button class="btn" onclick="openTool('actions')">Open Action Center</button></div>
      ${homeActions.length?homeActions.slice(0,3).map(a=>actionCardMarkup(a,true)).join(''):`<div class="empty">Your price targets, stock watches, budget, trades, grading and creator workflow are all clear.</div>`}
    </div>

    <div class="panel">
      <div class="section-head"><div><h2>Portfolio pulse</h2><p>Collection + sealed value compared with total cost basis.</p></div></div>
      <div class="meter"><div style="width:${Math.min(100,Math.max(5,t.cost?t.market/t.cost*50:50))}%"></div></div>
      <div class="split"><span>Cost ${money(t.cost)}</span><span>Market ${money(t.market)}</span></div>
    </div>


    <div class="panel pro-preview">
      <div class="section-head"><div><div class="eyebrow">DASHBOARD PRO</div><h2>Collection intelligence</h2><p>Growth snapshots and organization health from the data already in your Vault.</p></div><button class="btn" onclick="openTool('analytics')">Open analytics</button></div>
      <div class="pro-preview-grid">
        <div>
          <span class="analytics-label">30-day portfolio trend</span>
          ${trend.length?svgSparkline(trend.map(x=>Number(x.market)||0),360,95):`<div class="empty mini-empty">Snapshots begin today.</div>`}
          <div class="split"><span>${trend.length?money(Number(trend[0].market)||0):money(t.market)}</span><span>${money(t.market)} now</span></div>
        </div>
        <div class="health-card"><span>Vault data health</span><strong>${health.score}</strong><b>${health.label}</b><small>Organization/data completeness — not an investment rating.</small></div>
      </div>
    </div>

    <div class="panel">
      <div class="section-head"><div><h2>Top holdings</h2><p>Your largest card positions right now.</p></div><button class="link-btn" onclick="switchTab('vault')">View vault →</button></div>
      ${top.length ? top.map(i=>`
        <div class="compact-row">${cardArt(i.card)}<div class="grow"><strong>${esc(i.card.name)}</strong><span>${esc(i.card.set)} • Qty ${i.qty}</span></div><div class="right"><strong>${money((Number(i.card.market)||0)*i.qty)}</strong></div></div>
      `).join('') : `<div class="empty">Add cards from Search to start your vault.</div>`}
    </div>

    <div class="panel">
      <div class="section-head"><div><h2>Recent stock reports</h2><p>Your most recent inventory sightings in this Pages build.</p></div><button class="link-btn" onclick="switchTab('stock')">Stock center →</button></div>
      ${recentStock.length ? recentStock.map(r=>`
        <div class="compact-row"><div class="thumb square"><b>◎</b></div><div class="grow"><strong>${esc(r.product)}</strong><span>${esc(r.store)} • ${esc(r.status)} • ${dateShort(r.ts)}</span></div><div class="right"><strong>${money(Number(r.price))}</strong></div></div>
      `).join('') : `<div class="empty">No stock reports yet. Add one when you find products in store.</div>`}
    </div>`;
}




function ensureProductInventorySchema(){
  if(!Array.isArray(state.inventoryLedger)) state.inventoryLedger=[];
  if(!Array.isArray(state.inventoryAudits)) state.inventoryAudits=[];
  state.inventoryCommandSettings={
    game:'All',type:'All',location:'All',attention:'All',sort:'Attention',
    ...(state.inventoryCommandSettings||{})
  };

  if(!Array.isArray(state.productInventoryEvents)) state.productInventoryEvents=[];
  state.productCommandSettings={game:'All',need:'All',sort:'Priority',...(state.productCommandSettings||{})};
  ensureCatalogSeed();

  for(const p of state.productCatalog){
    if(!p.uid) p.uid=uid();
    p.game=p.game||'Pokemon';
    p.name=p.name||'Sealed Product';
    p.set=p.set||'';
    p.type=p.type||'Sealed';
    p.upc=p.upc||'';
    p.sku=p.sku||'';
    p.releaseDate=p.releaseDate||'';
    p.packCount=Math.max(0,Number(p.packCount)||0);
    p.desiredQty=Math.max(0,Number(p.desiredQty)||0);
    p.minOnHand=Math.max(0,Number(p.minOnHand)||0);
    p.retailerSkus=(p.retailerSkus && typeof p.retailerSkus==='object')?p.retailerSkus:{};
    p.notes=p.notes||'';
  }

  for(const s of state.sealed||[]){
    if(!s.productId){
      const p=state.productCatalog.find(p=>p.game===s.game && watchMatchesText({product:p.name},s.name));
      if(p) s.productId=p.uid;
    }
    s.retailer=s.retailer||'';
    s.purchaseDate=s.purchaseDate||String(s.addedAt||'').slice(0,10)||'';
    s.upc=s.upc||'';
    s.sku=s.sku||'';
  }
}
function productIdentityText(p){
  const retailerIds=Object.entries(p.retailerSkus||{}).map(([r,id])=>`${r} ${id}`).join(' ');
  return `${p.game||''} ${p.set||''} ${p.name||''} ${p.type||''} ${p.upc||''} ${p.sku||''} ${p.releaseDate||''} ${retailerIds}`;
}
function productMatchesRecord(product,record){
  if(!product||!record)return false;
  if(record.productId && (record.productId===product.uid || record.productId===product.id)) return true;
  const text=record.product||record.name||record.item||'';
  if(!text)return false;
  return watchMatchesText({product:product.name},text) && (!record.game || !product.game || record.game===product.game);
}
function productObservationRows(product){
  const rows=[];
  const add=(r,source)=>{
    if(!productMatchesRecord(product,r))return;
    const status=r.status||'';
    const ts=r.ts||r.updatedAt||r.updated_at||r.created_at||new Date().toISOString();
    const store=r.store||r.retailer||'Retailer';
    rows.push({
      uid:r.uid||r.id||uid(),
      productId:product.uid,
      product:r.product||product.name,
      game:r.game||product.game,
      store,
      retailer:r.retailer||r.store||store,
      status,
      qty:Number(r.qty??r.quantity)||0,
      price:Number(r.price)||0,
      ts,
      source,
      confirmations:Number(r.confirmations)||0,
      soldOutConfirmations:Number(r.soldOutConfirmations)||0,
      notes:r.notes||'',
      upc:r.upc||product.upc||'',
      sku:r.sku||product.sku||''
    });
  };
  (state.stockReports||[]).forEach(r=>add(r,'Your sighting'));
  (state.communityReports||[]).forEach(r=>add(r,'Community'));
  (state.inventoryResults||[])
    .filter(r=>r.sourceType!=='retailer_verified'&&r.status!=='retailer_check')
    .forEach(r=>add(r,r.sourceAttribution||r.provider||'Official inventory source'));
  (state.areaInventoryResults||[])
    .filter(r=>r.sourceType!=='retailer_verified'&&r.status!=='retailer_check')
    .forEach(r=>add(r,r.sourceAttribution||r.provider||'Official inventory source'));
  return rows.sort((a,b)=>new Date(b.ts)-new Date(a.ts));
}
function productObservationConfidence(o){
  const t=new Date(o.ts||0).getTime();
  const ageH=Number.isFinite(t)?Math.max(0,(Date.now()-t)/3600000):9999;
  let base=o.source==='Inventory connector'?78:o.source==='Your sighting'?72:60;
  if(ageH<=1)base+=17;
  else if(ageH<=6)base+=11;
  else if(ageH<=24)base+=5;
  else if(ageH>72)base-=18;
  base+=Math.min(8,(Number(o.confirmations)||0)*2);
  base-=Math.min(18,(Number(o.soldOutConfirmations)||0)*4);
  return Math.max(10,Math.min(99,Math.round(base)));
}
function latestProductStoreRows(product){
  const m=new Map();
  for(const o of productObservationRows(product)){
    const key=normalizeName(o.store||o.retailer||'retailer');
    if(!m.has(key))m.set(key,o);
  }
  return [...m.values()].map(o=>({...o,confidence:productObservationConfidence(o)}))
    .sort((a,b)=>{
      const aIn=/in|low/i.test(String(a.status))&&!/out/i.test(String(a.status));
      const bIn=/in|low/i.test(String(b.status))&&!/out/i.test(String(b.status));
      return Number(bIn)-Number(aIn) || b.confidence-a.confidence || new Date(b.ts)-new Date(a.ts);
    });
}
function productRestockPattern(product){
  const obs=productObservationRows(product).filter(o=>!/out/i.test(String(o.status||'')));
  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dayCounts=Array(7).fill(0);
  const parts={Morning:0,Afternoon:0,Evening:0,Overnight:0};
  for(const o of obs){
    const d=new Date(o.ts);
    if(!Number.isFinite(d.getTime()))continue;
    dayCounts[d.getDay()]++;
    const h=d.getHours();
    const part=h>=5&&h<12?'Morning':h>=12&&h<17?'Afternoon':h>=17&&h<22?'Evening':'Overnight';
    parts[part]++;
  }
  const peakDay=Math.max(...dayCounts)>0?days[dayCounts.indexOf(Math.max(...dayCounts))]:'—';
  const peakPart=Math.max(...Object.values(parts))>0?Object.entries(parts).sort((a,b)=>b[1]-a[1])[0][0]:'—';
  return {count:obs.length,days:days.map((name,i)=>({name,count:dayCounts[i]})),peakDay,peakPart};
}
function productMovementTimeline(product){
  const rows=[];
  for(const s of state.sealed||[]){
    if(!productMatchesRecord(product,{productId:s.productId,product:s.name,game:s.game}))continue;
    rows.push({ts:s.addedAt||s.purchaseDate||'',type:'Inventory lot',title:`${s.qty} sealed in inventory`,detail:`${s.retailer||'Source not set'} • ${money((Number(s.cost)||0)*(Number(s.qty)||0))}`});
  }
  for(const p of state.purchases||[]){
    if(productMatchesRecord(product,{product:p.item,game:product.game})){
      rows.push({ts:p.date||'',type:'Purchase',title:p.item,detail:`${p.merchant||'Merchant'} • ${money(Number(p.amount))}`});
    }
  }
  for(const o of state.openingLog||[]){
    if(productMatchesRecord(product,{product:o.product,game:o.game})){
      rows.push({ts:o.date||'',type:'Opened',title:`Opened ${o.qty||1}`,detail:o.notes||'Opening logged'});
    }
  }
  for(const s of state.sales||[]){
    if(productMatchesRecord(product,{product:s.name,game:s.game})){
      rows.push({ts:s.soldAt||s.date||'',type:'Sold',title:`Sold ${s.qty||1}`,detail:`Net ${money(Number(s.net))}`});
    }
  }
  for(const e of state.productInventoryEvents||[]){
    if(e.productId===product.uid)rows.push({ts:e.ts||e.date||'',type:e.type||'Event',title:e.title||e.type||'Event',detail:e.detail||''});
  }
  return rows.filter(x=>x.ts).sort((a,b)=>new Date(b.ts)-new Date(a.ts)).slice(0,30);
}
function recordProductInventoryEvent(productId,type,title,detail=''){
  state.productInventoryEvents.unshift({uid:uid(),productId,type,title,detail,ts:new Date().toISOString()});
  state.productInventoryEvents=state.productInventoryEvents.slice(0,500);
}

function inventoryItemKey(kind,id){return `${kind}:${id}`}
function recordInventoryLedger(kind,itemId,event,qtyDelta=0,detail='',meta={}){
  if(!Array.isArray(state.inventoryLedger))state.inventoryLedger=[];
  state.inventoryLedger.unshift({
    uid:uid(),kind,itemId,event,
    qtyDelta:Number(qtyDelta)||0,
    detail:detail||'',
    meta:meta||{},
    ts:new Date().toISOString()
  });
  state.inventoryLedger=state.inventoryLedger.slice(0,1000);
}
function inventoryLocations(){
  const set=new Set();
  for(const x of state.collection||[])set.add((x.location||'Unassigned').trim()||'Unassigned');
  for(const x of state.sealed||[])set.add((x.location||'Unassigned').trim()||'Unassigned');
  return [...set].sort((a,b)=>a.localeCompare(b));
}
function inventoryRows(){
  ensureProductInventorySchema();
  const rows=[];

  for(const i of state.collection||[]){
    const qty=Math.max(0,Number(i.qty)||0);
    const costEach=Math.max(0,Number(i.cost)||0);
    const valueEach=Math.max(0,Number(i.card?.market)||0);
    rows.push({
      key:inventoryItemKey('card',i.uid),
      kind:'Card',
      uid:i.uid,
      game:i.card?.game||'Other',
      name:i.card?.name||'Unknown card',
      set:i.card?.set||'',
      number:i.card?.number||'',
      qty,
      costEach,
      valueEach,
      costTotal:qty*costEach,
      valueTotal:qty*valueEach,
      gain:qty*(valueEach-costEach),
      location:i.location||'Unassigned',
      identifier:i.card?.id||'',
      format:i.format||'Raw',
      productId:'',
      upc:'',
      sku:'',
      desiredQty:0,
      minOnHand:0,
      attention:{
        missingCost:costEach<=0,
        missingValue:valueEach<=0,
        missingLocation:!(i.location||'').trim(),
        missingId:!(i.card?.id||'').trim(),
        belowMin:false,
        belowDesired:false
      }
    });
  }

  for(const s of state.sealed||[]){
    const qty=Math.max(0,Number(s.qty)||0);
    const costEach=Math.max(0,Number(s.cost)||0);
    const valueEach=Math.max(0,Number(s.current)||0);
    const product=s.productId?catalogProductById(s.productId):null;
    const stats=product?productStats(product):null;
    rows.push({
      key:inventoryItemKey('sealed',s.uid),
      kind:'Sealed',
      uid:s.uid,
      game:s.game||product?.game||'Other',
      name:s.name||product?.name||'Sealed product',
      set:product?.set||'',
      number:'',
      qty,
      costEach,
      valueEach,
      costTotal:qty*costEach,
      valueTotal:qty*valueEach,
      gain:qty*(valueEach-costEach),
      location:s.location||'Unassigned',
      identifier:s.productId||'',
      format:product?.type||'Sealed',
      productId:s.productId||'',
      upc:s.upc||product?.upc||'',
      sku:s.sku||product?.sku||'',
      desiredQty:Number(stats?.desiredQty)||Number(product?.desiredQty)||0,
      minOnHand:Number(product?.minOnHand)||0,
      retailer:s.retailer||'',
      purchaseDate:s.purchaseDate||'',
      attention:{
        missingCost:costEach<=0,
        missingValue:valueEach<=0,
        missingLocation:!(s.location||'').trim(),
        missingId:!(s.productId||s.upc||s.sku||'').trim(),
        belowMin:false,
        belowDesired:false
      }
    });
  }

  // Product-level replenishment conditions apply to all lots of that product.
  const productTotals=new Map();
  for(const r of rows.filter(x=>x.kind==='Sealed'&&x.productId)){
    productTotals.set(r.productId,(productTotals.get(r.productId)||0)+r.qty);
  }
  for(const r of rows.filter(x=>x.kind==='Sealed')){
    const owned=productTotals.get(r.productId)||r.qty;
    r.attention.belowMin=!!r.minOnHand && owned<r.minOnHand;
    r.attention.belowDesired=!!r.desiredQty && owned<r.desiredQty;
  }
  return rows;
}
function inventorySummary(){
  const rows=inventoryRows();
  const cards=rows.filter(x=>x.kind==='Card');
  const sealed=rows.filter(x=>x.kind==='Sealed');
  const units=rows.reduce((n,x)=>n+x.qty,0);
  const cost=rows.reduce((n,x)=>n+x.costTotal,0);
  const value=rows.reduce((n,x)=>n+x.valueTotal,0);
  const locations=inventoryLocations();
  const missingCost=rows.filter(x=>x.attention.missingCost).length;
  const missingValue=rows.filter(x=>x.attention.missingValue).length;
  const missingLocation=rows.filter(x=>x.attention.missingLocation).length;
  const missingId=rows.filter(x=>x.attention.missingId).length;
  const belowMin=rows.filter(x=>x.attention.belowMin).length;
  const belowDesired=rows.filter(x=>x.attention.belowDesired).length;
  const completeFields=rows.reduce((n,x)=>n+[
    !x.attention.missingCost,
    !x.attention.missingValue,
    !x.attention.missingLocation,
    !x.attention.missingId
  ].filter(Boolean).length,0);
  const possible=Math.max(1,rows.length*4);
  const dataHealth=Math.round(completeFields/possible*100);
  return {
    rows,cards,sealed,units,cost,value,gain:value-cost,
    locations,missingCost,missingValue,missingLocation,missingId,
    belowMin,belowDesired,dataHealth
  };
}
function inventoryAttentionRows(){
  const s=inventorySummary();
  const rows=[];
  for(const x of s.rows){
    const reasons=[];
    if(x.attention.belowMin)reasons.push('below minimum');
    else if(x.attention.belowDesired)reasons.push('below target');
    if(x.attention.missingCost)reasons.push('missing cost');
    if(x.attention.missingValue)reasons.push('missing value');
    if(x.attention.missingLocation)reasons.push('missing location');
    if(x.attention.missingId)reasons.push('missing identifier');
    if(reasons.length)rows.push({...x,reasons});
  }
  return rows.sort((a,b)=>{
    const ar=(a.attention.belowMin?6:0)+(a.attention.belowDesired?4:0)+(a.attention.missingLocation?3:0)+(a.attention.missingCost?2:0)+(a.attention.missingValue?2:0)+(a.attention.missingId?1:0);
    const br=(b.attention.belowMin?6:0)+(b.attention.belowDesired?4:0)+(b.attention.missingLocation?3:0)+(b.attention.missingCost?2:0)+(b.attention.missingValue?2:0)+(b.attention.missingId?1:0);
    return br-ar||b.valueTotal-a.valueTotal;
  });
}
function inventoryByLocation(){
  const map=new Map();
  for(const x of inventoryRows()){
    const loc=x.location||'Unassigned';
    if(!map.has(loc))map.set(loc,{location:loc,entries:0,units:0,cost:0,value:0,cards:0,sealed:0});
    const g=map.get(loc);
    g.entries++;g.units+=x.qty;g.cost+=x.costTotal;g.value+=x.valueTotal;
    if(x.kind==='Card')g.cards+=x.qty;else g.sealed+=x.qty;
  }
  return [...map.values()].sort((a,b)=>b.value-a.value||a.location.localeCompare(b.location));
}
function inventoryReorderProducts(){
  ensureProductInventorySchema();
  const out=[];
  for(const p of state.productCatalog||[]){
    const st=productStats(p);
    const min=Math.max(0,Number(p.minOnHand)||0);
    const desired=Math.max(min,Number(st.desiredQty)||Number(p.desiredQty)||0);
    const owned=Number(st.ownedQty)||0;
    if((min&&owned<min)||(desired&&owned<desired)){
      out.push({
        product:p,
        owned,
        min,
        desired,
        gapMin:Math.max(0,min-owned),
        gapDesired:Math.max(0,desired-owned),
        watch:st.watch,
        bestObserved:st.bestObserved,
        inventoryStatus:st.inventoryStatus
      });
    }
  }
  return out.sort((a,b)=>(b.gapMin-a.gapMin)||(b.gapDesired-a.gapDesired)||a.product.name.localeCompare(b.product.name));
}
function inventoryControlSignals(){
  const s=inventorySummary();
  const signals=[];
  const reorder=inventoryReorderProducts();
  for(const x of reorder.slice(0,8)){
    signals.push({
      priority:x.gapMin>0?'high':'medium',
      title:`Replenish ${x.product.name}`,
      detail:`Owned ${x.owned} • minimum ${x.min||'—'} • target ${x.desired||'—'}${x.bestObserved?` • best observed ${money(x.bestObserved)}`:''}`,
      action:`openTool('inventory')`
    });
  }
  if(s.missingLocation)signals.push({priority:'medium',title:'Inventory locations need cleanup',detail:`${s.missingLocation} inventory entr${s.missingLocation===1?'y':'ies'} have no storage location.`,action:`openTool('inventory')`});
  if(s.missingCost)signals.push({priority:'low',title:'Cost basis incomplete',detail:`${s.missingCost} inventory entr${s.missingCost===1?'y':'ies'} have no cost basis.`,action:`openTool('inventory')`});
  if(s.missingValue)signals.push({priority:'low',title:'Tracked values incomplete',detail:`${s.missingValue} inventory entr${s.missingValue===1?'y':'ies'} have no current reference value.`,action:`openTool('inventory')`});
  return signals.slice(0,12);
}
function setInventoryFilter(key,value){
  ensureProductInventorySchema();
  state.inventoryCommandSettings[key]=value;
  saveState();renderTools();
}
function inventoryFilteredRows(){
  const cfg=state.inventoryCommandSettings||{};
  let rows=inventoryRows();
  if(cfg.game&&cfg.game!=='All')rows=rows.filter(x=>x.game===cfg.game);
  if(cfg.type&&cfg.type!=='All')rows=rows.filter(x=>x.kind===cfg.type);
  if(cfg.location&&cfg.location!=='All')rows=rows.filter(x=>x.location===cfg.location);
  if(cfg.attention==='Needs Attention')rows=rows.filter(x=>Object.values(x.attention).some(Boolean));
  if(cfg.attention==='Below Target')rows=rows.filter(x=>x.attention.belowMin||x.attention.belowDesired);
  if(cfg.attention==='Missing Cost')rows=rows.filter(x=>x.attention.missingCost);
  if(cfg.attention==='Missing Value')rows=rows.filter(x=>x.attention.missingValue);
  if(cfg.attention==='Missing Location')rows=rows.filter(x=>x.attention.missingLocation);
  const sort=cfg.sort||'Attention';
  rows=rows.slice().sort((a,b)=>{
    if(sort==='Name')return a.name.localeCompare(b.name);
    if(sort==='Value')return b.valueTotal-a.valueTotal;
    if(sort==='Quantity')return b.qty-a.qty;
    if(sort==='Location')return a.location.localeCompare(b.location)||a.name.localeCompare(b.name);
    const ar=Object.values(a.attention).filter(Boolean).length,br=Object.values(b.attention).filter(Boolean).length;
    return br-ar||b.valueTotal-a.valueTotal;
  });
  return rows;
}
function inventoryRowMarkup(x){
  const flags=[];
  if(x.attention.belowMin)flags.push('<span class="inventory-flag danger">BELOW MIN</span>');
  else if(x.attention.belowDesired)flags.push('<span class="inventory-flag warn">BELOW TARGET</span>');
  if(x.attention.missingLocation)flags.push('<span class="inventory-flag">NO LOCATION</span>');
  if(x.attention.missingCost)flags.push('<span class="inventory-flag">NO COST</span>');
  if(x.attention.missingValue)flags.push('<span class="inventory-flag">NO VALUE</span>');
  return `<div class="inventory-command-row">
    <div class="inventory-kind">${x.kind==='Card'?'▤':'◈'}</div>
    <div class="grow">
      <div class="eyebrow">${esc(x.kind.toUpperCase())} • ${esc(x.game)}${x.set?` • ${esc(x.set)}`:''}</div>
      <strong>${esc(x.name)}</strong>
      <span>${x.kind==='Card'?(x.number?`#${esc(x.number)} • `:'')+esc(x.format||'Raw'):(x.upc?`UPC ${esc(x.upc)} • `:'')+(x.sku?`SKU ${esc(x.sku)} • `:'')+esc(x.format||'Sealed')}</span>
      <div class="inventory-flags">${flags.join('')}</div>
    </div>
    <div class="inventory-command-qty"><span>QTY</span><strong>${x.qty}</strong><small>${esc(x.location||'Unassigned')}</small></div>
    <div class="inventory-command-money"><span>VALUE</span><strong>${money(x.valueTotal)}</strong><small>${money(x.costTotal)} cost</small></div>
    <div class="inventory-row-actions">
      <button class="link-btn" onclick="quickInventoryCount('${x.kind.toLowerCase()}','${x.uid}')">Count</button>
      ${x.kind==='Card'?`<button class="link-btn" onclick="openCollectionCardDetail('${x.uid}')">Open</button>`:`<button class="link-btn" onclick="openProductFromInventory('${x.uid}')">Product</button>`}
    </div>
  </div>`;
}
function quickInventoryCount(kind,id){
  const isCard=kind==='card';
  const item=isCard?state.collection.find(x=>x.uid===id):state.sealed.find(x=>x.uid===id);
  if(!item)return;
  const oldQty=Math.max(0,Number(item.qty)||0);
  const name=isCard?(item.card?.name||'Card'):(item.name||'Sealed product');
  const val=prompt(`Physical count for ${name}`,String(oldQty));
  if(val===null)return;
  const newQty=Math.max(0,Math.floor(Number(val)||0));
  if(newQty===oldQty){toast('Count already matches');return;}
  item.qty=newQty;
  recordInventoryLedger(isCard?'Card':'Sealed',id,'AUDIT_ADJUSTMENT',newQty-oldQty,`${name}: ${oldQty} → ${newQty}`,{before:oldQty,after:newQty});
  state.inventoryAudits.unshift({uid:uid(),kind:isCard?'Card':'Sealed',itemId:id,name,before:oldQty,after:newQty,delta:newQty-oldQty,ts:new Date().toISOString()});
  state.inventoryAudits=state.inventoryAudits.slice(0,300);
  saveState();renderTools();toast(`Count updated ${oldQty} → ${newQty}`);
}
function inventoryAuditAll(){
  const location=prompt('Audit which storage location? Enter exact location name or ALL','ALL');
  if(location===null)return;
  const loc=location.trim();
  const rows=inventoryRows().filter(x=>!loc||/^all$/i.test(loc)||x.location.toLowerCase()===loc.toLowerCase());
  if(!rows.length){toast('No inventory found for that location');return;}
  if(!confirm(`Start a guided count for ${rows.length} inventory entries? You can cancel any item to skip it.`))return;
  let adjusted=0;
  for(const x of rows){
    const val=prompt(`${x.name}\n${x.location} • expected qty ${x.qty}`,String(x.qty));
    if(val===null)continue;
    const newQty=Math.max(0,Math.floor(Number(val)||0));
    if(newQty!==x.qty){
      const target=x.kind==='Card'?state.collection.find(i=>i.uid===x.uid):state.sealed.find(i=>i.uid===x.uid);
      if(target){
        const before=x.qty;target.qty=newQty;adjusted++;
        recordInventoryLedger(x.kind,x.uid,'AUDIT_ADJUSTMENT',newQty-before,`${x.name}: ${before} → ${newQty}`,{before,after:newQty,location:x.location});
        state.inventoryAudits.unshift({uid:uid(),kind:x.kind,itemId:x.uid,name:x.name,before,after:newQty,delta:newQty-before,location:x.location,ts:new Date().toISOString()});
      }
    }
  }
  state.inventoryAudits=state.inventoryAudits.slice(0,300);
  saveState();renderTools();toast(`Audit complete • ${adjusted} adjustment${adjusted===1?'':'s'}`);
}
function exportUnifiedInventoryCsv(){
  const rows=inventoryRows();
  const headers=['Type','Game','Name','Set','Number','Format','Qty','Cost Each','Value Each','Cost Total','Value Total','Gain Loss','Location','UPC','SKU','Product ID'];
  const escCsv=v=>`"${String(v??'').replace(/"/g,'""')}"`;
  const csv=[headers,...rows.map(x=>[
    x.kind,x.game,x.name,x.set,x.number,x.format,x.qty,x.costEach,x.valueEach,x.costTotal,x.valueTotal,x.gain,x.location,x.upc,x.sku,x.productId
  ])].map(r=>r.map(escCsv).join(',')).join('\n');
  downloadText(`vaultsignal-inventory-${new Date().toISOString().slice(0,10)}.csv`,csv,'text/csv');
  toast('Unified inventory CSV exported');
}
function openProductFromInventory(sealedId){
  const s=state.sealed.find(x=>x.uid===sealedId);
  if(!s)return;
  if(s.productId){
    activeProductId=s.productId;
    openTool('products');
  }else{
    toast('This sealed lot is not linked to a Product Command record yet');
  }
}
function renderInventoryCommandTool(){
  ensureProductInventorySchema();
  const s=inventorySummary();
  const rows=inventoryFilteredRows();
  const cfg=state.inventoryCommandSettings||{};
  const locations=['All',...inventoryLocations()];
  const reorder=inventoryReorderProducts();
  const attention=inventoryAttentionRows();
  const ledger=(state.inventoryLedger||[]).slice(0,20);

  return `<div class="panel inventory-command-hero">
    <div class="section-head"><div><div class="eyebrow">VAULTSIGNAL • INVENTORY COMMAND</div><h2>One inventory system for cards + sealed products</h2><p>Know exactly what you own, where it is, what it cost, its current tracked value, what needs replenishing, and where your inventory records need cleanup.</p></div>
    <div class="action-row"><button class="btn primary" onclick="inventoryAuditAll()">✓ Start audit</button><button class="btn" onclick="exportUnifiedInventoryCsv()">CSV export</button></div></div>

    <div class="stat-grid compact-stats">
      <div class="stat-card"><span>Total units</span><strong>${s.units}</strong><small>${s.cards.reduce((n,x)=>n+x.qty,0)} cards • ${s.sealed.reduce((n,x)=>n+x.qty,0)} sealed</small></div>
      <div class="stat-card"><span>Cost basis</span><strong>${money(s.cost)}</strong><small>Across all inventory</small></div>
      <div class="stat-card"><span>Tracked value</span><strong>${money(s.value)}</strong><small class="${s.gain>=0?'good':'bad'}">${s.gain>=0?'+':''}${money(s.gain)} vs cost</small></div>
      <div class="stat-card"><span>Inventory data health</span><strong>${s.dataHealth}%</strong><small>${s.locations.length} storage location${s.locations.length===1?'':'s'}</small></div>
    </div>
  </div>

  <div class="panel inventory-control-strip">
    <div class="section-head"><div><div class="eyebrow">ATTENTION QUEUE</div><h2>Inventory that needs action</h2><p>Operational inventory issues, not investment recommendations.</p></div><span class="badge ${attention.length?'signal-gold':''}">${attention.length} ITEMS</span></div>
    <div class="inventory-attention-grid">
      <div><b>${s.belowMin}</b><span>below minimum</span></div>
      <div><b>${s.belowDesired}</b><span>below target</span></div>
      <div><b>${s.missingLocation}</b><span>missing location</span></div>
      <div><b>${s.missingCost}</b><span>missing cost</span></div>
      <div><b>${s.missingValue}</b><span>missing value</span></div>
      <div><b>${s.missingId}</b><span>missing identifier</span></div>
    </div>
  </div>

  ${reorder.length?`<div class="panel">
    <div class="section-head"><div><div class="eyebrow">REPLENISHMENT</div><h2>Products below your inventory targets</h2><p>Uses your own desired quantity and minimum-on-hand settings.</p></div><button class="btn" onclick="openTool('products')">Product Command</button></div>
    <div class="reorder-grid">${reorder.slice(0,12).map(x=>`
      <button class="reorder-card" onclick="activeProductId='${x.product.uid}';openTool('products')">
        <div class="eyebrow">${esc(x.product.game)} • ${esc(x.product.type||'Sealed')}</div>
        <strong>${esc(x.product.name)}</strong>
        <span>Owned ${x.owned} • Min ${x.min||'—'} • Target ${x.desired||'—'}</span>
        <div><b>${x.gapMin?`${x.gapMin} BELOW MIN`:`${x.gapDesired} TO TARGET`}</b>${x.bestObserved?`<small>Best observed ${money(x.bestObserved)}</small>`:''}</div>
      </button>`).join('')}</div>
  </div>`:''}

  <div class="panel">
    <div class="section-head"><div><div class="eyebrow">INVENTORY BY LOCATION</div><h2>Where everything lives</h2><p>Cards and sealed products grouped by physical storage location.</p></div></div>
    <div class="location-inventory-grid">${inventoryByLocation().map(x=>`
      <div class="location-inventory-card"><strong>${esc(x.location)}</strong><span>${x.units} units • ${x.entries} entries</span><b>${money(x.value)}</b><small>${x.cards} cards • ${x.sealed} sealed</small></div>`).join('')||`<div class="empty">Add storage locations to cards and sealed inventory.</div>`}</div>
  </div>

  <div class="panel inventory-filter-panel">
    <div class="section-head"><div><div class="eyebrow">MASTER INVENTORY</div><h2>Every owned item</h2><p>Cards and sealed lots in one operational table.</p></div><span class="badge">${rows.length} ENTRIES</span></div>
    <div class="inventory-filter-grid">
      <label class="field"><span>TCG</span><select onchange="setInventoryFilter('game',this.value)"><option>All</option>${games.map(g=>`<option ${cfg.game===g?'selected':''}>${esc(g)}</option>`).join('')}</select></label>
      <label class="field"><span>Type</span><select onchange="setInventoryFilter('type',this.value)">${['All','Card','Sealed'].map(v=>`<option ${cfg.type===v?'selected':''}>${v}</option>`).join('')}</select></label>
      <label class="field"><span>Location</span><select onchange="setInventoryFilter('location',this.value)">${locations.map(v=>`<option ${cfg.location===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
      <label class="field"><span>Attention</span><select onchange="setInventoryFilter('attention',this.value)">${['All','Needs Attention','Below Target','Missing Cost','Missing Value','Missing Location'].map(v=>`<option ${cfg.attention===v?'selected':''}>${v}</option>`).join('')}</select></label>
      <label class="field"><span>Sort</span><select onchange="setInventoryFilter('sort',this.value)">${['Attention','Value','Quantity','Location','Name'].map(v=>`<option ${cfg.sort===v?'selected':''}>${v}</option>`).join('')}</select></label>
    </div>
    <div class="inventory-command-list">${rows.length?rows.slice(0,100).map(inventoryRowMarkup).join(''):`<div class="empty">No inventory matches the selected filters.</div>`}</div>
  </div>

  <div class="panel">
    <div class="section-head"><div><div class="eyebrow">MOVEMENT LEDGER</div><h2>Inventory adjustments</h2><p>Audit corrections and quantity changes are logged so counts are traceable.</p></div></div>
    ${ledger.length?`<div class="inventory-ledger">${ledger.map(e=>`
      <div class="ledger-row"><span class="${e.qtyDelta>0?'good':e.qtyDelta<0?'bad':''}">${e.qtyDelta>0?'+':''}${e.qtyDelta}</span><div class="grow"><strong>${esc(e.event)}</strong><small>${esc(e.detail||'')} • ${humanAge(e.ts)}</small></div></div>`).join('')}</div>`:`<div class="empty">No inventory adjustments logged yet. Use Count or Start audit.</div>`}
  </div>`;
}

function productCommandSummary(){
  ensureProductInventorySchema();
  const products=state.productCatalog||[];
  const ownedQty=(state.sealed||[]).reduce((n,x)=>n+(Number(x.qty)||0),0);
  const ownedCost=(state.sealed||[]).reduce((n,x)=>n+(Number(x.cost)||0)*(Number(x.qty)||0),0);
  const ownedValue=(state.sealed||[]).reduce((n,x)=>n+(Number(x.current)||0)*(Number(x.qty)||0),0);
  const watched=products.filter(p=>productStats(p).watch).length;
  const need=products.filter(p=>productStats(p).gap>0).length;
  const recent=products.reduce((n,p)=>n+productObservationRows(p).filter(o=>reportAgeMinutes(o.ts)<=1440).length,0);
  return {products:products.length,ownedQty,ownedCost,ownedValue,gain:ownedValue-ownedCost,watched,need,recent};
}
function productInventoryStatus(product){
  const latest=latestProductStoreRows(product);
  const fresh=latest.filter(o=>reportAgeMinutes(o.ts)<=360);
  const available=fresh.filter(o=>!/out/i.test(String(o.status||'')));
  if(available.length)return {label:'RECENTLY SEEN',tone:'in',count:available.length,best:available.map(x=>x.price).filter(x=>x>0).sort((a,b)=>a-b)[0]||null};
  if(fresh.length)return {label:'RECENTLY OUT',tone:'out',count:fresh.length,best:null};
  if(latest.length)return {label:'STALE DATA',tone:'low',count:latest.length,best:null};
  return {label:'NO DATA',tone:'unknown',count:0,best:null};
}
function setProductGameFilter(v){state.productCommandSettings.game=v;saveState();renderTools()}
function setProductNeedFilter(v){state.productCommandSettings.need=v;saveState();renderTools()}
function setProductSort(v){state.productCommandSettings.sort=v;saveState();renderTools()}
function openProductStockReport(id){
  const p=catalogProductById(id);if(!p)return;
  window._stockReportPrefill={productId:p.uid,product:p.name,game:p.game,upc:p.upc||'',sku:p.sku||''};
  stockGame=p.game||'Pokemon';
  toolsTab='stockreport';renderTools();
}
function huntProductNow(id){
  const p=catalogProductById(id);if(!p)return;
  const s=productStats(p);
  stockQuery=p.name;stockGame=p.game||'Pokemon';
  if(s.watch?.retailers?.length)selectedRetailers=new Set(s.watch.retailers);
  switchTab('stock');
  setTimeout(()=>{
    const q=$('stockQuery');if(q)q.value=p.name;
    toast('Product loaded into Stock Finder');
  },0);
}
function openProductVaultIQ(id){
  const p=catalogProductById(id);if(!p)return;
  let w=state.stockWatches.find(w=>productMatchesRecord(p,{product:w.product,game:w.game}));
  if(!w){
    w={uid:`temp-${p.uid}`,product:p.name,game:p.game,retailers:[...selectedRetailers],radius:Number(state.settings.radius)||25,maxPrice:Number(p.target)||Number(p.msrp)||null,priority:'High',desiredQty:Math.max(1,Number(p.desiredQty)||1),enabled:true,createdAt:new Date().toISOString()};
  }
  const iq=vaultIQProductScore(w);
  alert(`VaultIQ Product Fit: ${iq.score}/100 — ${iq.label}\n\n${iq.reasons.join('\n')}`);
}
function editProductIdentifiers(id){
  const p=catalogProductById(id);if(!p)return;
  const upc=prompt('UPC / barcode (optional)',p.upc||'');if(upc!==null)p.upc=upc.trim();
  const sku=prompt('Primary SKU / item number (optional)',p.sku||'');if(sku!==null)p.sku=sku.trim();
  const release=prompt('Release date YYYY-MM-DD (optional)',p.releaseDate||'');if(release!==null)p.releaseDate=release.trim();
  const packs=prompt('Pack count / packs inside (optional)',String(p.packCount||''));if(packs!==null)p.packCount=Math.max(0,Number(packs)||0);
  const desired=prompt('Desired sealed quantity',String(p.desiredQty||0));if(desired!==null)p.desiredQty=Math.max(0,Number(desired)||0);
  const min=prompt('Minimum keep-on-hand quantity',String(p.minOnHand||0));if(min!==null)p.minOnHand=Math.max(0,Number(min)||0);
  const retailer=prompt('Retailer name for a SKU mapping (optional)','');
  if(retailer && retailer.trim()){
    const rid=prompt(`${retailer.trim()} SKU / item ID`,p.retailerSkus?.[retailer.trim()]||'');
    if(rid!==null){
      p.retailerSkus=p.retailerSkus||{};
      if(rid.trim())p.retailerSkus[retailer.trim()]=rid.trim();
      else delete p.retailerSkus[retailer.trim()];
    }
  }
  saveState();renderTools();toast('Product identity updated');
}
function editSealedLotFromProduct(id){
  const s=state.sealed.find(x=>x.uid===id);if(!s)return;
  const beforeQty=Number(s.qty)||0;
  const qty=prompt('Quantity',String(s.qty||1));if(qty!==null)s.qty=Math.max(0,Number(qty)||0);
  if(Number(s.qty)!==beforeQty)recordInventoryLedger('Sealed',id,'QUANTITY_CHANGE',Number(s.qty)-beforeQty,`${s.name}: ${beforeQty} → ${s.qty}`);
  const cost=prompt('Cost EACH',String(s.cost||0));if(cost!==null)s.cost=Math.max(0,Number(cost)||0);
  const current=prompt('Current tracked value EACH',String(s.current||0));if(current!==null)s.current=Math.max(0,Number(current)||0);
  const retailer=prompt('Purchased from',s.retailer||'');if(retailer!==null)s.retailer=retailer.trim();
  const date=prompt('Purchase date YYYY-MM-DD',s.purchaseDate||String(s.addedAt||'').slice(0,10));if(date!==null)s.purchaseDate=date.trim();
  const loc=prompt('Storage location',s.location||'');if(loc!==null)s.location=loc.trim();
  saveState();renderTools();toast('Inventory lot updated');
}

function productKeyFromParts(game='',set='',name=''){
  return normalizeName(`${game}|${set}|${name}`);
}
function ensureCatalogSeed(){
  if(!Array.isArray(state.productCatalog)) state.productCatalog=[];
  if(!state.productCatalog.length){
    state.productCatalog = sealedCatalogSeed.map(x=>({...x,uid:uid(),createdAt:new Date().toISOString()}));
    saveState();
  }
}
function findCatalogMatches(query=''){
  ensureProductInventorySchema();
  const q=normalizeName(query);
  if(!q)return state.productCatalog;
  return state.productCatalog.filter(p=>normalizeName(productIdentityText(p)).includes(q));
}
function productStats(product){
  ensureProductInventorySchema();
  const owned=(state.sealed||[]).filter(s=>productMatchesRecord(product,{productId:s.productId,product:s.name,game:s.game}));
  const ownedQty=owned.reduce((n,x)=>n+(Number(x.qty)||0),0);
  const costTotal=owned.reduce((n,x)=>n+(Number(x.cost)||0)*(Number(x.qty)||0),0);
  const valueTotal=owned.reduce((n,x)=>n+(Number(x.current)||0)*(Number(x.qty)||0),0);
  const costAvg=ownedQty?costTotal/ownedQty:0;
  const currentAvg=ownedQty?valueTotal/ownedQty:0;

  const reports=productObservationRows(product);
  const inStock=reports.filter(r=>!/out/i.test(String(r.status||'')));
  const prices=inStock.map(r=>Number(r.price)).filter(v=>v>0).sort((a,b)=>a-b);
  const bestObserved=prices.length?prices[0]:null;
  const observedAvg=prices.length?prices.reduce((a,b)=>a+b,0)/prices.length:null;
  const observedMedian=prices.length?(prices.length%2?prices[(prices.length-1)/2]:(prices[prices.length/2-1]+prices[prices.length/2])/2):null;
  const newest=inStock.map(r=>r.ts).filter(Boolean).sort((a,b)=>new Date(b)-new Date(a))[0]||null;

  const watch=(state.stockWatches||[]).find(w=>productMatchesRecord(product,{product:w.product,game:w.game}));
  const opened=(state.openingLog||[]).filter(o=>productMatchesRecord(product,{product:o.product,game:o.game})).reduce((n,o)=>n+(Number(o.qty)||0),0);
  const desiredQty=Math.max(0,Number(watch?.desiredQty)||Number(product.desiredQty)||0);
  const gap=Math.max(0,desiredQty-ownedQty);
  const minOnHand=Math.max(0,Number(product.minOnHand)||0);
  const latestStores=latestProductStoreRows(product);
  const inventoryStatus=productInventoryStatus(product);
  const pattern=productRestockPattern(product);

  return {
    owned,ownedQty,costTotal,valueTotal,gain:valueTotal-costTotal,
    costAvg,currentAvg,reports,inStock,bestObserved,observedAvg,observedMedian,newest,
    watch,opened,desiredQty,gap,minOnHand,latestStores,inventoryStatus,pattern
  };
}
function addCatalogProduct(product){
  ensureProductInventorySchema();
  const key=productKeyFromParts(product.game,product.set,product.name);
  const existing=state.productCatalog.find(p=>productKeyFromParts(p.game,p.set,p.name)===key);
  if(existing){
    if(product.upc&&!existing.upc)existing.upc=product.upc;
    if(product.sku&&!existing.sku)existing.sku=product.sku;
    saveState();return existing;
  }
  const next={
    uid:uid(),id:product.id||uid(),game:product.game||'Pokemon',name:product.name||'Sealed Product',
    set:product.set||'',type:product.type||'Sealed',msrp:Number(product.msrp)||0,target:Number(product.target)||0,
    image:product.image||'',notes:product.notes||'',upc:product.upc||'',sku:product.sku||'',
    releaseDate:product.releaseDate||'',packCount:Math.max(0,Number(product.packCount)||0),
    desiredQty:Math.max(0,Number(product.desiredQty)||0),minOnHand:Math.max(0,Number(product.minOnHand)||0),
    retailerSkus:product.retailerSkus||{},createdAt:new Date().toISOString()
  };
  state.productCatalog.unshift(next);saveState();return next;
}
function catalogProductById(id){
  ensureCatalogSeed();
  return state.productCatalog.find(p=>p.uid===id || p.id===id) || null;
}

function normalizeName(v=''){
  return String(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}
function watchMatchesText(watch, text){
  const w=normalizeName(watch.product), t=normalizeName(text);
  if(!w || !t) return false;
  const tokens=w.split(' ').filter(x=>x.length>2);
  return t.includes(w) || (tokens.length && tokens.filter(x=>t.includes(x)).length >= Math.max(1,Math.ceil(tokens.length*.6)));
}
function watchRadar(watch){
  const now=Date.now();
  let sightings=0, fresh=0, bestPrice=null, stores=new Set(), newest=null;
  const consume=(product,store,price,ts,status)=>{
    if(!watchMatchesText(watch,product)) return;
    if(status && /out/i.test(String(status))) return;
    const t=new Date(ts||0).getTime();
    if(!Number.isFinite(t)) return;
    const ageH=(now-t)/3600000;
    sightings++;
    if(ageH<=6) fresh++;
    if(store) stores.add(store);
    if(typeof Number(price)==='number' && Number.isFinite(Number(price)) && Number(price)>0){
      bestPrice=bestPrice===null?Number(price):Math.min(bestPrice,Number(price));
    }
    newest=newest===null?ts:(new Date(ts)>new Date(newest)?ts:newest);
  };
  state.stockReports.forEach(r=>consume(r.product,r.store,r.price,r.ts,r.status));
  (state.communityReports||[]).forEach(r=>consume(r.product,r.store,r.price,r.updated_at||r.created_at,r.status));
  (state.inventoryResults||[]).forEach(r=>consume(r.product,r.store||r.retailer,r.price,r.updatedAt,r.status));
  const priority=watch.priority==='High'?18:watch.priority==='Medium'?10:4;
  let score=Math.min(100, priority + sightings*12 + fresh*15 + stores.size*5);
  if(bestPrice!==null && watch.maxPrice && bestPrice<=watch.maxPrice) score=Math.min(100,score+18);
  const label=score>=75?'HOT':score>=45?'WARM':score>=20?'WATCH':'QUIET';
  return {score,label,sightings,fresh,bestPrice,stores:stores.size,newest};
}
function buildHotDrops(){
  const rows=[];
  const add=(product,store,price,ts,status,source)=>{
    if(!product || (status && /out/i.test(String(status)))) return;
    rows.push({product,store,price:Number(price)||0,ts,status,source});
  };
  state.stockReports.forEach(r=>add(r.product,r.store,r.price,r.ts,r.status,'Your reports'));
  (state.communityReports||[]).forEach(r=>add(r.product,r.store,r.price,r.updated_at||r.created_at,r.status,'Community'));
  (state.inventoryResults||[]).forEach(r=>add(r.product,r.store||r.retailer,r.price,r.updatedAt,r.status,'Live connector'));
  const groups=new Map();
  for(const row of rows){
    const key=normalizeName(row.product);
    if(!key) continue;
    if(!groups.has(key)) groups.set(key,{name:row.product,count:0,stores:new Set(),best:null,newest:null,sources:new Set()});
    const g=groups.get(key);g.count++;if(row.store)g.stores.add(row.store);g.sources.add(row.source);
    if(row.price>0)g.best=g.best===null?row.price:Math.min(g.best,row.price);
    if(!g.newest||new Date(row.ts)>new Date(g.newest))g.newest=row.ts;
  }
  return [...groups.values()].map(g=>{
    const age=reportAgeMinutes(g.newest);
    let heat=Math.min(100,g.count*18+g.stores.size*8+(age<=60?30:age<=360?18:age<=1440?7:0));
    return {...g,heat};
  }).sort((a,b)=>b.heat-a.heat).slice(0,8);
}
function compareRetailersForWatch(watch){
  const rows=[];
  const add=(product,retailer,price,status,ts)=>{
    if(!watchMatchesText(watch,product) || (status&&/out/i.test(String(status)))) return;
    if(!retailer) return;
    rows.push({retailer,price:Number(price)||0,ts});
  };
  state.stockReports.forEach(r=>add(r.product,r.store,r.price,r.status,r.ts));
  (state.communityReports||[]).forEach(r=>add(r.product,r.store,r.price,r.status,r.updated_at||r.created_at));
  (state.inventoryResults||[]).forEach(r=>add(r.product,r.retailer||r.store,r.price,r.status,r.updatedAt));
  const m=new Map();
  rows.forEach(r=>{
    const key=r.retailer;
    if(!m.has(key))m.set(key,{retailer:key,count:0,best:null,newest:null});
    const g=m.get(key);g.count++;
    if(r.price>0)g.best=g.best===null?r.price:Math.min(g.best,r.price);
    if(!g.newest||new Date(r.ts)>new Date(g.newest))g.newest=r.ts;
  });
  return [...m.values()].sort((a,b)=>(a.best??999999)-(b.best??999999)||new Date(b.newest)-new Date(a.newest));
}
function renderRestockRadar(){
  if(!state.stockWatches.length) return `<div class="empty">Save product watches to activate Restock Radar.</div>`;
  return state.stockWatches.slice().sort((a,b)=>watchRadar(b).score-watchRadar(a).score).map(w=>{
    const r=watchRadar(w);
    return `<div class="radar-card ${selectedWatchId===w.uid?'selected':''}">
      <div class="radar-head">
        <div><span class="priority-pill ${String(w.priority||'High').toLowerCase()}">${esc(w.priority||'High')}</span><strong>${esc(w.product)}</strong><small>${esc(w.game)} • ${w.desiredQty||1} wanted • ${w.retailers.length} retailers</small></div>
        <div class="radar-score ${r.score>=75?'hot':r.score>=45?'warm':'cool'}"><b>${r.score}</b><span>${r.label}</span></div>
      </div>
      <div class="radar-metrics">
        <span>${r.sightings} sightings</span><span>${r.stores} stores</span><span>${r.bestPrice!==null?`best ${money(r.bestPrice)}`:'no price yet'}</span><span>${r.newest?humanAge(r.newest):'no recent hit'}</span>
      </div>
      <div class="action-row">
        <button class="btn primary" onclick="selectWatch('${w.uid}')">Details</button>
        <button class="btn" onclick="huntWatch('${w.uid}')">Hunt</button>
        <button class="btn" onclick="editWatch('${w.uid}')">Edit</button>
      </div>
    </div>`;
  }).join('');
}
function renderSelectedWatch(){
  const w=state.stockWatches.find(x=>x.uid===selectedWatchId);
  if(!w) return `<div class="empty">Tap Details on a watch to see its product dashboard.</div>`;
  const r=watchRadar(w), comps=compareRetailersForWatch(w);
  return `<div class="watch-detail">
    <div class="section-head"><div><div class="eyebrow">PRODUCT WATCH</div><h2>${esc(w.product)}</h2><p>${esc(w.game)} • priority ${esc(w.priority||'High')} • target ${w.maxPrice?money(w.maxPrice):'not set'}</p></div><span class="radar-score ${r.score>=75?'hot':r.score>=45?'warm':'cool'}"><b>${r.score}</b><span>${r.label}</span></span></div>
    <div class="meta-grid">
      <div class="meta"><span>Recent sightings</span><strong>${r.sightings}</strong></div>
      <div class="meta"><span>Stores seen</span><strong>${r.stores}</strong></div>
      <div class="meta"><span>Best observed</span><strong>${r.bestPrice!==null?money(r.bestPrice):'—'}</strong></div>
    </div>
    <div class="eyebrow" style="margin:11px 0 5px">RETAILER COMPARISON</div>
    ${comps.length?comps.slice(0,8).map(c=>`<div class="compact-row"><div class="grow"><strong>${esc(c.retailer)}</strong><span>${c.count} sighting${c.count===1?'':'s'} • ${humanAge(c.newest)}</span></div><div class="right"><strong>${c.best!==null?money(c.best):'—'}</strong></div></div>`).join(''):`<div class="notice"><span>ℹ</span><span>No observed retailer prices yet. This comparison only uses real reports/inventory results already collected by the app.</span></div>`}
    <div class="action-row" style="margin-top:10px">
      ${w.retailers.map(ret=>`<button class="btn" onclick='openRetailerSearch(${JSON.stringify(ret)}, ${JSON.stringify(w.product)})'>${esc(ret)} ↗</button>`).join('')}
    </div>
  </div>`;
}
function renderHotDrops(){
  const drops=buildHotDrops();
  if(!drops.length) return `<div class="empty">Hot Drops will populate from recent inventory/community reports. Nothing is fabricated.</div>`;
  return drops.map(d=>`<div class="hot-drop">
    <div class="grow"><strong>${esc(d.name)}</strong><span>${d.count} sighting${d.count===1?'':'s'} • ${d.stores.size} store${d.stores.size===1?'':'s'} • ${humanAge(d.newest)}</span></div>
    <div class="heat-wrap"><div class="heat-bar"><i style="width:${d.heat}%"></i></div><span>${d.heat}% heat</span></div>
    <div class="right"><strong>${d.best!==null?money(d.best):'—'}</strong></div>
  </div>`).join('');
}
function selectWatch(id){ selectedWatchId=id; renderStock(); }
function editWatch(id){
  const w=state.stockWatches.find(x=>x.uid===id);if(!w)return;
  const p=prompt('Priority: High, Medium, or Low',w.priority||'High');
  if(p!==null) w.priority=/^low$/i.test(p)?'Low':/^med/i.test(p)?'Medium':'High';
  const q=prompt('Desired quantity',String(w.desiredQty||1));
  if(q!==null) w.desiredQty=Math.max(1,Number(q)||1);
  const max=prompt('Maximum price (leave blank for none)',w.maxPrice??'');
  if(max!==null) w.maxPrice=max===''?null:Math.max(0,Number(max)||0);
  saveState();renderStock();toast('Watch updated');
}


function ensureRealInventorySchema(){
  if(!Array.isArray(state.inventoryResults))state.inventoryResults=[];
  if(!Array.isArray(state.inventorySearchHistory))state.inventorySearchHistory=[];
  if(!Array.isArray(state.areaInventoryResults))state.areaInventoryResults=[];
  if(!Array.isArray(state.areaRetailerCheckResults))state.areaRetailerCheckResults=[];
  if(!Array.isArray(state.liveDropFeed))state.liveDropFeed=[];
  if(!state.liveDropSnapshot||typeof state.liveDropSnapshot!=='object')state.liveDropSnapshot={};
  state.liveDropMeta={checkedAt:null,durationMs:0,sourcesChecked:0,sourcesOk:0,errors:[],...(state.liveDropMeta||{})};
  state.liveDropFilters={game:'All',store:'All',watchOnly:false,inStockOnly:true,...(state.liveDropFilters||{})};
  if(!Array.isArray(state.areaScanHistory))state.areaScanHistory=[];
  if(!Array.isArray(state.inventoryPulseEvents))state.inventoryPulseEvents=[];
  if(!Array.isArray(state.favoriteInventoryStores))state.favoriteInventoryStores=[];
  state.areaScanSettings={
    games:['Pokemon','Lorcana','Magic','Yu-Gi-Oh!','One Piece'],
    autoRefresh:true,
    autoRefreshHours:4,
    ...(state.areaScanSettings||{})
  };
  if(!Array.isArray(state.areaScanSettings.games))state.areaScanSettings.games=['Pokemon','Lorcana','Magic','Yu-Gi-Oh!','One Piece'];
  if(!('inventoryProviderStatus' in state))state.inventoryProviderStatus=null;
}
function inventoryBackendBase(){
  return (window.TWOGEN_CONFIG?.inventoryApiBase||'').trim().replace(/\/+$/,'');
}
function inventoryBackendConnected(){
  return !!inventoryBackendBase();
}
function selectedProductForStockQuery(){
  ensureProductInventorySchema();
  const q=($('stockQuery')?.value||stockQuery||'').trim();
  if(!q)return null;
  const matches=findCatalogMatches(q);
  return matches.find(p=>normalizeName(p.name)===normalizeName(q))||matches[0]||null;
}
function normalizeInventoryResult(x={}){
  const status=String(x.status||'unknown').toLowerCase();
  return {
    id:x.id||uid(),
    provider:x.provider||x.retailer||'Inventory source',
    retailer:x.retailer||x.provider||'Retailer',
    store:x.store||x.retailer||x.provider||'Retailer',
    storeId:x.storeId||null,
    address:x.address||'',
    city:x.city||'',
    state:x.state||'',
    postalCode:x.postalCode||'',
    distanceMiles:(x.distanceMiles===null||x.distanceMiles===undefined||x.distanceMiles==='')?null:(Number.isFinite(Number(x.distanceMiles))?Number(x.distanceMiles):null),
    product:x.product||x.name||stockQuery||'Product',
    productId:x.productId||'',
    retailerSku:x.retailerSku||x.sku||'',
    upc:x.upc||'',
    game:x.game||stockGame||'Pokemon',
    price:Number(x.price)||0,
    regularPrice:Number(x.regularPrice)||0,
    status,
    quantity:(x.quantity===null||x.quantity===undefined||x.quantity==='')?null:Number(x.quantity),
    pickupEligible:x.pickupEligible===true,
    lowStock:x.lowStock===true,
    sourceType:x.sourceType||'official_api',
    sourceAttribution:x.sourceAttribution||x.provider||x.retailer||'Inventory provider',
    sourceAttributionUrl:x.sourceAttributionUrl||'',
    updatedAt:x.updatedAt||x.checkedAt||new Date().toISOString(),
    checkedAt:x.checkedAt||x.updatedAt||new Date().toISOString(),
    url:x.url||'',
    addToCartUrl:x.addToCartUrl||'',
    image:x.image||'',
    rawConfidence:Number.isFinite(Number(x.confidence))?Number(x.confidence):null
  };
}
function inventoryResultConfidence(x){
  if(x.sourceType==='retailer_verified'||x.status==='retailer_check')return null;
  if(Number.isFinite(x.rawConfidence))return Math.max(1,Math.min(99,Math.round(x.rawConfidence)));
  const age=reportAgeMinutes(x.checkedAt||x.updatedAt);
  let score=x.sourceType==='official_api'?92:68;
  if(age<=5)score+=5;
  else if(age<=30)score+=2;
  else if(age>180)score-=18;
  if(x.lowStock)score-=7;
  return Math.max(10,Math.min(99,Math.round(score)));
}
function inventoryStatusLabel(x){
  const s=String(x.status||'unknown').toLowerCase();
  if(s==='in_stock')return 'IN STOCK';
  if(s==='low_stock')return 'LOW STOCK';
  if(s==='out_of_stock')return 'OUT OF STOCK';
  if(s==='online')return 'ONLINE';
  if(s==='retailer_check')return 'CHECK RETAILER';
  return s.replace(/_/g,' ').toUpperCase();
}
function inventoryStatusClass(x){
  const s=String(x.status||'unknown').toLowerCase();
  if(s==='in_stock')return 'in';
  if(s==='low_stock')return 'low';
  if(s==='out_of_stock')return 'out';
  if(s==='online')return 'online';
  if(s==='retailer_check')return 'check';
  return 'unknown';
}
function inventoryResultDedupeKey(x){
  return normalizeName(`${x.provider}|${x.storeId||x.store}|${x.retailerSku||x.product}|${x.status}`);
}
function mergeInventoryResults(results){
  const m=new Map();
  for(const raw of results||[]){
    const x=normalizeInventoryResult(raw);
    const key=inventoryResultDedupeKey(x);
    const prior=m.get(key);
    if(!prior || new Date(x.checkedAt)>new Date(prior.checkedAt))m.set(key,x);
  }
  return [...m.values()].sort((a,b)=>{
    const rank=s=>s==='in_stock'?4:s==='low_stock'?3:s==='online'?2:s==='retailer_check'?1:0;
    return rank(b.status)-rank(a.status)
      || (a.distanceMiles??9999)-(b.distanceMiles??9999)
      || (a.price||999999)-(b.price||999999);
  });
}
function saveInventorySearchHistory(entry){
  state.inventorySearchHistory.unshift({
    uid:uid(),
    query:entry.query||'',
    game:entry.game||'',
    zip:entry.zip||'',
    radius:Number(entry.radius)||0,
    retailers:entry.retailers||[],
    resultCount:Number(entry.resultCount)||0,
    providers:entry.providers||[],
    checkedAt:entry.checkedAt||new Date().toISOString()
  });
  state.inventorySearchHistory=state.inventorySearchHistory.slice(0,50);
}
async function checkInventoryBackendHealth(showToast=false){
  ensureRealInventorySchema();
  const base=inventoryBackendBase();
  if(!base){
    state.inventoryProviderStatus={connected:false,providers:[],checkedAt:new Date().toISOString(),message:'No backend URL configured'};
    if(showToast)toast('Inventory backend is not configured');
    return state.inventoryProviderStatus;
  }
  try{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),8000);
    const r=await fetch(`${base}/health`,{headers:{Accept:'application/json'},signal:controller.signal});
    clearTimeout(timer);
    if(!r.ok)throw new Error(`Health check returned ${r.status}`);
    const data=await r.json();
    state.inventoryProviderStatus={
      connected:true,
      providers:Array.isArray(data.providers)?data.providers:[],
      checkedAt:new Date().toISOString(),
      message:data.message||'Inventory service connected',
      version:data.version||''
    };
    saveState();
    if(showToast)toast('Inventory service connected');
    return state.inventoryProviderStatus;
  }catch(e){
    state.inventoryProviderStatus={connected:false,providers:[],checkedAt:new Date().toISOString(),message:e.name==='AbortError'?'Inventory service timed out':(e.message||'Inventory service unavailable')};
    saveState();
    if(showToast)toast(state.inventoryProviderStatus.message);
    return state.inventoryProviderStatus;
  }
}
function inventoryProviderRows(){
  const health=state.inventoryProviderStatus;
  const returned=new Map((health?.providers||[]).map(p=>[String(p.id||p.name||'').toLowerCase(),p]));
  const fallback=[
    {id:'bestbuy',name:'Best Buy',mode:'official_api',configured:false,description:'Official developer API supports near-real-time SKU store availability.'},
    {id:'target',name:'Target',mode:'retailer_check',configured:true,description:'Retailer-verified availability handoff; no 2GEN stock count is invented.'},
    {id:'walmart',name:'Walmart',mode:'retailer_check',configured:true,description:'Retailer-verified shopping handoff; Marketplace seller inventory API is not shopper store stock.'},
    {id:'gamestop',name:'GameStop',mode:'retailer_check',configured:true,description:'Retailer search handoff until a supported inventory connector is configured.'}
  ];
  return fallback.map(p=>({...p,...(returned.get(p.id)||{})}));
}

function liveInventoryProviders(){return inventoryProviderRows().filter(p=>p.mode==='official_api'&&p.configured)}
function inventoryBackendOnline(){return state.inventoryProviderStatus?.connected===true}
function retailerCheckProviders(){return inventoryProviderRows().filter(p=>p.mode==='retailer_check'&&p.configured)}
function retailerFamily(name=''){
  const n=String(name).toLowerCase();
  if(n.includes('walmart'))return 'Walmart';
  if(n.includes('target'))return 'Target';
  if(n.includes('best buy'))return 'Best Buy';
  if(n.includes('gamestop'))return 'GameStop';
  if(n.includes("sam's")||n.includes('sams club'))return "Sam's Club";
  if(n.includes('costco'))return 'Costco';
  if(n.includes('walgreens'))return 'Walgreens';
  if(n.includes('cvs'))return 'CVS';
  if(n.includes('dollar general'))return 'Dollar General';
  if(n.includes('family dollar'))return 'Family Dollar';
  return '';
}
function areaRetailerQuery(){
  const s=areaScanGames();
  if(s.length===1)return `${s[0]} trading cards`;
  if(s.includes('Pokemon'))return 'Pokemon trading cards';
  return 'trading cards';
}
function retailerSearchUrl(name,query=areaRetailerQuery()){
  const family=retailerFamily(name)||name,q=encodeURIComponent(query);
  const u={
    'Target':`https://www.target.com/s?searchTerm=${q}`,
    'Walmart':`https://www.walmart.com/search?q=${q}`,
    'Best Buy':`https://www.bestbuy.com/site/searchpage.jsp?st=${q}`,
    'GameStop':`https://www.gamestop.com/search/?q=${q}`,
    "Sam's Club":`https://www.samsclub.com/s/${q}`,
    'Costco':`https://www.costco.com/CatalogSearch?keyword=${q}`,
    'Walgreens':`https://www.walgreens.com/search/results.jsp?Ntt=${q}`,
    'CVS':`https://www.cvs.com/search?searchTerm=${q}`,
    'Dollar General':`https://www.dollargeneral.com/search?searchTerm=${q}`,
    'Family Dollar':`https://www.familydollar.com/searchresults?Ntt=${q}`
  };
  return u[family]||'';
}

function storeDiscoveryProvider(){
  const p=(state.inventoryProviderStatus?.storeDiscovery||state.inventoryProviderStatus?.storeDiscoveryProvider||null);
  if(p)return p;
  return {name:'Development store discovery',configured:false,mode:'development_fallback'};
}
function stockCoverageSummary(){
  const live=liveInventoryProviders();
  const nearby=(state.nearbyStores||[]).length;
  const checks=retailerCheckProviders();
  const sd=storeDiscoveryProvider();
  return {
    liveProviders:live.length,
    liveNames:live.map(x=>x.name),
    nearby,
    retailerChecks:checks.length,
    discoveryName:sd.name||'Store discovery',
    discoveryMode:sd.mode||'development_fallback',
    discoveryConfigured:sd.configured===true
  };
}

function inventoryConnectionSummary(){
  const live=liveInventoryProviders(),checks=retailerCheckProviders();
  if(live.length)return {mode:'live',badge:`${live.length} LIVE SOURCE${live.length===1?'':'S'}`,title:'Verified inventory source connected',detail:`Live store inventory is available through ${live.map(x=>x.name).join(', ')}. Unsupported retailers remain retailer checks.`};
  if(inventoryBackendOnline()||inventoryBackendConnected())return {mode:'checks',badge:'RETAILER CHECK MODE',title:'Inventory service online — no live store feed configured',detail:`VaultSignal can find nearby retailers and open ${checks.map(x=>x.name).join(', ')||'retailer'} availability searches, but will not claim “in stock” without an authorized live source.`};
  return {mode:'off',badge:'SETUP REQUIRED',title:'Inventory service is not connected',detail:'Connect the VaultSignal inventory Worker in Settings.'};
}

function retailerCapabilityMarkup(){
  return `<div class="provider-status-grid">${inventoryProviderRows().map(p=>{
    const live=p.mode==='official_api'&&p.configured;
    const cls=live?'live':p.mode==='retailer_check'?'check':'off';
    const label=live?'LIVE API':p.mode==='retailer_check'?'RETAILER CHECK':'NOT CONNECTED';
    return `<div class="provider-status-card ${cls}">
      <div class="provider-status-head"><strong>${esc(p.name||p.id)}</strong><span>${label}</span></div>
      <p>${esc(p.description||'')}</p>
      ${p.id==='bestbuy'&&live?`<a class="provider-attribution" href="https://developer.bestbuy.com" target="_blank" rel="noreferrer"><img src="https://developer.bestbuy.com/images/bestbuy-logo.png" alt="Best Buy Developer API"><span>Data via Best Buy Developer API</span></a>`:''}
    </div>`;
  }).join('')}</div>`;
}
function buildInventoryParams(product=null){
  const q=($('stockQuery')?.value||stockQuery||product?.name||'').trim();
  const game=$('stockGame')?.value||stockGame||product?.game||'Pokemon';
  const params=new URLSearchParams({
    q,
    game,
    zip:state.settings.zip||'',
    radius:String(Number(state.settings.radius)||25),
    retailers:[...selectedRetailers].join(',')
  });
  if(state.settings.lat)params.set('lat',String(state.settings.lat));
  if(state.settings.lon)params.set('lon',String(state.settings.lon));
  if(product){
    params.set('productId',product.uid||'');
    if(product.upc)params.set('upc',product.upc);
    if(product.sku)params.set('sku',product.sku);
    const bb=product.retailerSkus?.['Best Buy']||product.retailerSkus?.['BestBuy']||'';
    if(bb)params.set('bestBuySku',bb);
  }
  return params;
}
async function fetchRealInventory(product=null){
  ensureRealInventorySchema();
  const base=inventoryBackendBase();
  if(!base)throw new Error('Real Inventory backend is not configured yet');
  const params=buildInventoryParams(product);
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),18000);
  try{
    const r=await fetch(`${base}/inventory?${params.toString()}`,{headers:{Accept:'application/json'},signal:controller.signal});
    if(!r.ok){
      let detail='';
      try{detail=(await r.json())?.error||''}catch{}
      throw new Error(detail||`Inventory service returned ${r.status}`);
    }
    const data=await r.json();
    const results=mergeInventoryResults(Array.isArray(data.results)?data.results:[]);
    if(Array.isArray(data.providers)){
      state.inventoryProviderStatus={connected:true,providers:data.providers,checkedAt:new Date().toISOString(),message:'Inventory service connected',version:data.version||''};
    }
    return {results,meta:data.meta||{},providers:data.providers||[]};
  }catch(e){
    if(e.name==='AbortError')throw new Error('Inventory search timed out. Try again.');
    throw e;
  }finally{clearTimeout(timer)}
}
function applyInventoryResultsToProductCommand(results,product){
  if(!product)return;
  for(const x of results){
    x.productId=x.productId||product.uid;
    x.product=x.product||product.name;
    x.game=x.game||product.game;
    if(x.upc&&!product.upc)product.upc=x.upc;
    if(x.retailer==='Best Buy'&&x.retailerSku){
      product.retailerSkus=product.retailerSkus||{};
      if(!product.retailerSkus['Best Buy'])product.retailerSkus['Best Buy']=String(x.retailerSku);
    }
  }
}
async function runProductInventorySearch(id){
  const p=catalogProductById(id);if(!p)return;
  stockQuery=p.name;stockGame=p.game||'Pokemon';
  const base=inventoryBackendBase();
  if(!base){toast('Connect the Real Inventory backend first');return}
  toast(`Checking real inventory for ${p.name}…`);
  try{
    const data=await fetchRealInventory(p);
    applyInventoryResultsToProductCommand(data.results,p);
    state.inventoryResults=data.results;
    saveInventorySearchHistory({
      query:p.name,game:p.game,zip:state.settings.zip,radius:state.settings.radius,
      retailers:[...selectedRetailers],resultCount:data.results.length,
      providers:[...new Set(data.results.map(x=>x.provider))],checkedAt:new Date().toISOString()
    });
    saveState();renderTools();
    toast(data.results.length?`${data.results.length} current inventory results`:'No in-stock API results found');
  }catch(e){toast(e.message||'Inventory search failed')}
}
function openInventorySetup(){
  toolsTab='settings';switchTab('tools');
  setTimeout(()=>toast('Inventory connection status is in Settings'),100);
}


const AREA_SCAN_QUERIES={
  Pokemon:['pokemon trading cards'],
  Lorcana:['lorcana trading cards'],
  Magic:['magic the gathering cards'],
  'Yu-Gi-Oh!':['yu gi oh cards'],
  'One Piece':['one piece trading cards']
};
function areaScanGames(){
  ensureRealInventorySchema();
  return state.areaScanSettings.games||[];
}
function toggleAreaGame(game){
  const set=new Set(areaScanGames());
  set.has(game)?set.delete(game):set.add(game);
  state.areaScanSettings.games=[...set];
  saveState();renderStock();
}
function setAreaAutoRefresh(enabled){
  state.areaScanSettings.autoRefresh=!!enabled;saveState();renderStock();
}
function setAreaAutoRefreshHours(v){
  state.areaScanSettings.autoRefreshHours=Math.max(1,Math.min(24,Number(v)||4));saveState();renderStock();
}
function areaStoreKey(x){
  return `${normalizeName(x.provider||x.retailer)}|${x.storeId||normalizeName(x.store)}|${x.postalCode||''}`;
}
function officialAreaResults(){
  return (state.areaInventoryResults||[]).map(normalizeInventoryResult)
    .filter(x=>x.sourceType==='official_api'&&x.status!=='retailer_check');
}
function areaStoreGroups(){
  const groups=new Map();
  for(const x of officialAreaResults()){
    const key=areaStoreKey(x);
    if(!groups.has(key)){
      groups.set(key,{
        key,provider:x.provider,retailer:x.retailer,store:x.store,storeId:x.storeId,
        address:x.address,city:x.city,state:x.state,postalCode:x.postalCode,
        distanceMiles:x.distanceMiles,checkedAt:x.checkedAt,products:[]
      });
    }
    const g=groups.get(key);
    g.products.push(x);
    if(typeof x.distanceMiles==='number'&&(typeof g.distanceMiles!=='number'||x.distanceMiles<g.distanceMiles))g.distanceMiles=x.distanceMiles;
    if(new Date(x.checkedAt)>new Date(g.checkedAt))g.checkedAt=x.checkedAt;
  }
  return [...groups.values()].map(g=>{
    const unique=new Map();
    for(const p of g.products){
      const k=normalizeName(`${p.retailerSku||''}|${p.product}`);
      if(!unique.has(k))unique.set(k,p);
    }
    g.products=[...unique.values()].sort((a,b)=>(a.price||999999)-(b.price||999999));
    g.games=[...new Set(g.products.map(p=>p.game).filter(Boolean))];
    g.bestPrice=g.products.map(p=>p.price).filter(v=>v>0).sort((a,b)=>a-b)[0]||null;
    g.lowStock=g.products.filter(p=>p.lowStock||p.status==='low_stock').length;
    g.inStock=g.products.filter(p=>p.status==='in_stock'||p.status==='low_stock').length;
    g.watchMatches=storeWatchMatches(g);
    g.huntScore=storeHuntScore(g);
    g.favorite=state.favoriteInventoryStores.includes(g.key);
    return g;
  }).sort((a,b)=>Number(b.favorite)-Number(a.favorite)||b.huntScore-a.huntScore||(a.distanceMiles??9999)-(b.distanceMiles??9999));
}
function storeWatchMatches(g){
  const matches=[];
  for(const p of g.products){
    for(const w of state.stockWatches||[]){
      if(!w.enabled)continue;
      if(watchMatchesText({product:p.product},w.product) || watchMatchesText({product:w.product},p.product)){
        matches.push({product:p.product,watch:w,price:p.price});
      }
    }
  }
  return matches;
}
function storeHuntScore(g){
  let score=25;
  score+=Math.min(20,g.products.length*3);
  const d=Number(g.distanceMiles);
  if(Number.isFinite(d)){
    if(d<=10)score+=20; else if(d<=25)score+=13; else if(d<=50)score+=7;
  }
  const matches=storeWatchMatches(g);
  score+=Math.min(24,matches.length*12);
  const targetHits=matches.filter(m=>m.watch.maxPrice&&m.price&&m.price<=Number(m.watch.maxPrice)).length;
  score+=Math.min(20,targetHits*10);
  if(g.lowStock)score+=3;
  return Math.max(0,Math.min(100,Math.round(score)));
}
function toggleFavoriteInventoryStore(key){
  const set=new Set(state.favoriteInventoryStores||[]);
  set.has(key)?set.delete(key):set.add(key);
  state.favoriteInventoryStores=[...set];
  saveState();renderStock();
}
function selectAreaStore(key){
  areaSelectedStoreKey=key;renderStock();
  setTimeout(()=>document.getElementById('areaStoreDetail')?.scrollIntoView({behavior:'smooth',block:'start'}),50);
}
function selectedAreaStore(){
  return areaStoreGroups().find(x=>x.key===areaSelectedStoreKey)||null;
}
function areaSnapshotRows(results){
  return (results||[]).filter(x=>x.sourceType==='official_api').slice(0,180).map(x=>({
    key:normalizeName(`${x.provider}|${x.storeId||x.store}|${x.retailerSku||x.product}`),
    provider:x.provider,store:x.store,storeId:x.storeId||'',postalCode:x.postalCode||'',
    product:x.product,retailerSku:x.retailerSku||'',game:x.game||'',price:Number(x.price)||0,
    status:x.status,lowStock:!!x.lowStock,distanceMiles:x.distanceMiles,checkedAt:x.checkedAt
  }));
}
function inventoryPulseDiff(previous,current){
  const prev=new Map((previous||[]).map(x=>[x.key,x]));
  const cur=new Map((current||[]).map(x=>[x.key,x]));
  const events=[];
  const now=new Date().toISOString();

  for(const [key,x] of cur){
    const p=prev.get(key);
    if(!p){
      events.push({uid:uid(),type:'new',priority:'high',title:`Newly detected: ${x.product}`,detail:`${x.store}${x.price?` • ${money(x.price)}`:''}`,store:x.store,product:x.product,ts:now});
      continue;
    }
    if(x.price&&p.price&&Math.abs(x.price-p.price)>=0.01){
      const down=x.price<p.price;
      events.push({uid:uid(),type:down?'price_down':'price_up',priority:down?'high':'medium',title:`Price ${down?'drop':'change'}: ${x.product}`,detail:`${x.store} • ${money(p.price)} → ${money(x.price)}`,store:x.store,product:x.product,ts:now});
    }
    if(!p.lowStock&&x.lowStock){
      events.push({uid:uid(),type:'low_stock',priority:'high',title:`Low stock: ${x.product}`,detail:`${x.store} flagged low stock`,store:x.store,product:x.product,ts:now});
    }
  }
  for(const [key,p] of prev){
    if(!cur.has(key)){
      events.push({uid:uid(),type:'not_seen',priority:'low',title:`Not returned in latest scan: ${p.product}`,detail:`${p.store} • availability may have changed`,store:p.store,product:p.product,ts:now});
    }
  }
  return events.slice(0,80);
}

function latestAreaScanSpeed(){
  const s=latestAreaScan();
  if(!s?.durationMs)return '—';
  return `${(Number(s.durationMs)/1000).toFixed(1)}s`;
}
function stockFeedSourceLabel(x){
  if(x?.sourceType==='official_api')return x.sourceAttribution||x.provider||'Official API';
  return 'Retailer check';
}
function stockQuantityLabel(x){
  if(x?.quantity!==null&&x?.quantity!==undefined&&Number.isFinite(Number(x.quantity)))return String(Number(x.quantity));
  return x?.sourceType==='official_api'?'Not supplied':'—';
}
function stockFreshnessLabel(x){
  const at=x?.checkedAt||x?.updatedAt;
  if(!at)return '—';
  const ms=Date.now()-new Date(at).getTime();
  if(ms<60000)return 'JUST NOW';
  if(ms<5*60000)return `${Math.max(1,Math.round(ms/60000))}M AGO`;
  return humanAge(at);
}

function latestAreaScan(){
  return (state.areaScanHistory||[])[0]||null;
}
function lastAreaScanAgeMinutes(){
  const last=latestAreaScan();
  return last?reportAgeMinutes(last.checkedAt):Infinity;
}
async function maybeAutoScanArea(){
  if(areaAutoScanAttempted||areaScanBusy)return;
  areaAutoScanAttempted=true;
  if(!state.areaScanSettings.autoRefresh)return;
  if(!state.settings.zip||!inventoryBackendConnected())return;
  const threshold=Math.max(1,Number(state.areaScanSettings.autoRefreshHours)||4)*60;
  if(lastAreaScanAgeMinutes()<threshold)return;
  await runAreaInventoryScan(true);
}

let liveDropBusy=false;
let liveDropAutoTimer=null;
function liveDropKey(x){return `${x.sourceId||x.store}|${x.productId||x.handle||x.url||x.product}`;}
function dropWatchMatch(x){
  const text=`${x.product||''} ${x.game||''} ${x.store||''}`.toLowerCase();
  return stockWatchQueriesForScan().find(q=>text.includes(q.toLowerCase()))||'';
}
function classifyLiveDropChanges(rows){
  const prev=state.liveDropSnapshot||{},next={};
  const enriched=rows.map(x=>{
    const key=liveDropKey(x),before=prev[key];
    const now={available:x.available===true,price:Number(x.price)||0,seenAt:new Date().toISOString()};
    next[key]=now;
    let eventType='IN STOCK';
    if(!before)eventType='NEW LISTING';
    else if(before.available===false&&now.available===true)eventType='RESTOCK';
    else if(before.price&&now.price&&now.price<before.price)eventType='PRICE DROP';
    return {...x,eventType,previousPrice:before?.price||null,watchMatch:dropWatchMatch(x)};
  });
  state.liveDropSnapshot=next;
  return enriched;
}
function liveDropStores(){return [...new Set((state.liveDropFeed||[]).map(x=>x.store).filter(Boolean))].sort();}
function setLiveDropFilter(key,value){state.liveDropFilters[key]=value;saveState();renderStock();}
function filteredLiveDrops(){
  const f=state.liveDropFilters||{};let rows=(state.liveDropFeed||[]).slice();
  if(f.game&&f.game!=='All')rows=rows.filter(x=>x.game===f.game);
  if(f.store&&f.store!=='All')rows=rows.filter(x=>x.store===f.store);
  if(f.watchOnly)rows=rows.filter(x=>x.watchMatch);
  if(f.inStockOnly)rows=rows.filter(x=>x.available===true);
  const rank={'RESTOCK':4,'NEW LISTING':3,'PRICE DROP':2,'IN STOCK':1};
  return rows.sort((a,b)=>(rank[b.eventType]||0)-(rank[a.eventType]||0)||new Date(b.checkedAt)-new Date(a.checkedAt));
}
async function refreshLiveDrops(silent=false){
  if(liveDropBusy)return;
  if(!inventoryBackendConnected()){if(!silent)toast('Inventory service is not connected');return;}
  liveDropBusy=true;if(!silent)renderStock();
  try{
    const gs=areaScanGames().length?areaScanGames():['Pokemon'];
    const p=new URLSearchParams({games:gs.join(','),limit:'120'});
    const c=new AbortController();const timer=setTimeout(()=>c.abort(),9000);
    let r;try{r=await fetch(`${inventoryBackendBase()}/drop-feed?${p}`,{headers:{Accept:'application/json'},signal:c.signal});}finally{clearTimeout(timer)}
    const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||`Drop feed returned ${r.status}`);
    state.liveDropFeed=classifyLiveDropChanges(d.results||[]);
    state.liveDropMeta={checkedAt:d.checkedAt||new Date().toISOString(),durationMs:Number(d.meta?.durationMs)||0,sourcesChecked:Number(d.meta?.sourcesChecked)||0,sourcesOk:Number(d.meta?.sourcesOk)||0,errors:d.meta?.errors||[]};
    saveState();
    if(!silent){const hits=state.liveDropFeed.filter(x=>x.watchMatch&&x.available).length;toast(`${state.liveDropFeed.length} live products • ${hits} watch hit${hits===1?'':'s'} • ${state.liveDropMeta.sourcesOk}/${state.liveDropMeta.sourcesChecked} sources`);}
  }catch(e){if(!silent)toast(e.name==='AbortError'?'Live Drops timed out after 9 seconds':(e.message||'Live Drops failed'));}
  finally{liveDropBusy=false;renderStock();}
}
function startLiveDropAutoRefresh(){
  if(liveDropAutoTimer)clearInterval(liveDropAutoTimer);
  liveDropAutoTimer=setInterval(()=>{if(currentTab==='stock'&&!liveDropBusy)refreshLiveDrops(true);},60000);
}
function liveDropEventClass(t=''){return t==='RESTOCK'?'restock':t==='NEW LISTING'?'new':t==='PRICE DROP'?'price':'stock';}
function renderLiveDropCard(x){
  return `<div class="drop-alert-card ${liveDropEventClass(x.eventType)}"><div class="drop-alert-top"><div class="drop-alert-type">${esc(x.eventType)}</div><div class="drop-alert-age">${stockFreshnessLabel(x)}</div></div><div class="drop-alert-body">${x.image?`<img src="${esc(x.image)}" alt="">`:`<div class="drop-alert-fallback">◈</div>`}<div class="grow"><div class="eyebrow">${esc(x.store)} • ${esc(x.game||'TCG')}</div><strong>${esc(x.product)}</strong><span>${esc(x.productType||'Sealed TCG product')}</span>${x.watchMatch?`<b class="drop-watch-hit">WATCH HIT • ${esc(x.watchMatch)}</b>`:''}</div><div class="drop-alert-price"><strong>${x.price?money(x.price):'—'}</strong>${x.previousPrice&&x.price<x.previousPrice?`<small>${money(x.previousPrice)} → ${money(x.price)}</small>`:''}<span>${x.available?'● IN STOCK':'○ OUT'}</span></div></div><div class="drop-alert-foot"><span>${esc(x.sourceLabel||'Public storefront feed')} • ${esc(x.region||'Online')}</span>${x.url?`<a class="btn primary" href="${esc(x.url)}" target="_blank" rel="noreferrer">BUY / VIEW ↗</a>`:''}</div></div>`;
}
function renderLiveDropNetwork(){
  const rows=filteredLiveDrops(),f=state.liveDropFilters||{},stores=liveDropStores(),meta=state.liveDropMeta||{};
  const hits=(state.liveDropFeed||[]).filter(x=>x.watchMatch&&x.available).length;
  const restocks=(state.liveDropFeed||[]).filter(x=>x.eventType==='RESTOCK').length;
  return `<div class="panel live-drops-panel"><div class="section-head"><div><div class="eyebrow">VAULTSIGNAL • LIVE DROPS</div><h2>Restock alert feed</h2><p>New listings, restocks, price drops and in-stock sealed products from connected online storefront monitors.</p></div><button class="btn primary" ${liveDropBusy?'disabled':''} onclick="refreshLiveDrops(false)">${liveDropBusy?'Checking…':'↻ Refresh feed'}</button></div><div class="drop-network-stats"><div><span>Live products</span><strong>${state.liveDropFeed.length}</strong></div><div><span>Watch hits</span><strong>${hits}</strong></div><div><span>Restocks</span><strong>${restocks}</strong></div><div><span>Sources online</span><strong>${meta.sourcesOk||0}/${meta.sourcesChecked||0}</strong></div><div><span>Feed speed</span><strong>${meta.durationMs?`${(meta.durationMs/1000).toFixed(1)}s`:'—'}</strong></div></div><div class="drop-filter-row"><select onchange="setLiveDropFilter('game',this.value)">${['All','Pokemon','Lorcana','Magic','Yu-Gi-Oh!','One Piece'].map(v=>`<option ${f.game===v?'selected':''}>${v}</option>`).join('')}</select><select onchange="setLiveDropFilter('store',this.value)"><option>All</option>${stores.map(v=>`<option ${f.store===v?'selected':''}>${esc(v)}</option>`).join('')}</select><label><input type="checkbox" ${f.inStockOnly?'checked':''} onchange="setLiveDropFilter('inStockOnly',this.checked)"> In stock only</label><label><input type="checkbox" ${f.watchOnly?'checked':''} onchange="setLiveDropFilter('watchOnly',this.checked)"> My watch hits</label></div><div class="drop-alert-feed">${rows.length?rows.slice(0,80).map(renderLiveDropCard).join(''):`<div class="empty">${liveDropBusy?'Checking storefront monitors…':'No products match these filters yet. Tap Refresh feed.'}</div>`}</div><div class="drop-feed-note">Live Drops is online-product intelligence. Local shelf quantity remains separate and is shown only when an authorized retailer source supplies it.</div></div>`;
}

function stockWatchQueriesForScan(){
  const q=[];
  for(const w of state.stockWatches||[]){
    if(!w.enabled||!String(w.product||'').trim())continue;
    q.push(String(w.product).trim());
  }
  for(const p of state.productCatalog||[]){
    const st=productStats(p);
    if(st.watch?.enabled && p.name)q.push(String(p.name).trim());
  }
  return [...new Set(q.map(x=>x.toLowerCase()))]
    .map(k=>{
      const fromWatch=(state.stockWatches||[]).find(w=>String(w.product||'').trim().toLowerCase()===k);
      if(fromWatch)return String(fromWatch.product).trim();
      const fromProduct=(state.productCatalog||[]).find(p=>String(p.name||'').trim().toLowerCase()===k);
      return fromProduct?.name||k;
    })
    .slice(0,8);
}
function stockScanModeLabel(){
  const watches=stockWatchQueriesForScan();
  return watches.length?`${watches.length} WATCH${watches.length===1?'':'ES'} + CATEGORY`:'CATEGORY SCAN';
}

async function runAreaInventoryScan(silent=false){
  if(!hasPremium()){
    if(!silent){toolsTab='premium';renderTools();toast('Inventory Radar is included with VaultSignal Premium');}
    return;
  }

  ensureRealInventorySchema();
  const zip=($('stockZip')?.value||state.settings.zip||'').trim();
  const radius=Number($('stockRadius')?.value||state.settings.radius)||25;
  if(!zip){if(!silent)toast('Enter a ZIP code first');return;}
  if(!inventoryBackendConnected()){if(!silent)toast('Inventory service is not connected');return;}

  const scanGames=areaScanGames();
  if(!scanGames.length){if(!silent)toast('Select at least one TCG');return;}

  state.settings.zip=zip;
  state.settings.radius=radius;
  state.settings.locationLabel=zip;
  const previous=latestAreaScan()?.snapshot||[];

  areaScanBusy=true;
  if(!silent)renderStock();
  const started=performance.now();

  try{
    const params=new URLSearchParams({
      zip,
      radius:String(radius),
      games:scanGames.join(','),
      retailers:[...selectedRetailers].join(','),
      watchQueries:stockWatchQueriesForScan().join('||')
    });

    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),12000);

    let r;
    try{
      r=await fetch(`${inventoryBackendBase()}/area-scan?${params.toString()}`,{
        headers:{Accept:'application/json'},
        signal:controller.signal
      });
    }finally{
      clearTimeout(timer);
    }

    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.error||`Area scan returned ${r.status}`);

    state.areaInventoryResults=mergeInventoryResults((d.results||[]).map(normalizeInventoryResult));
    state.areaRetailerCheckResults=mergeInventoryResults((d.retailerChecks||[]).map(normalizeInventoryResult));
    state.nearbyStores=(d.nearbyStores||[]).map(s=>({
      id:s.id||`${s.name}|${s.lat}|${s.lon}`,
      name:s.name||'Retailer',
      brand:s.brand||'',
      operator:s.operator||'',
      family:s.family||retailerFamily(s.name||s.brand||s.operator||''),
      address:s.address||'',
      lat:Number(s.lat),
      lon:Number(s.lon),
      distance:Number(s.distanceMiles??s.distance??0),
      shop:s.shop||'',
      website:s.website||'',
      source:s.source||'VaultSignal Worker'
    })).filter(s=>Number.isFinite(s.lat)&&Number.isFinite(s.lon));

    if(Array.isArray(d.providers)){
      state.inventoryProviderStatus={
        connected:true,
        providers:d.providers,
        checkedAt:new Date().toISOString(),
        message:'Inventory service connected',
        version:d.version||'',
        storeDiscovery:d.storeDiscovery||d.meta?.storeDiscovery||null
      };
    }

    if(d.location?.lat && d.location?.lon){
      state.settings.lat=Number(d.location.lat);
      state.settings.lon=Number(d.location.lon);
    }

    const snapshot=areaSnapshotRows(state.areaInventoryResults);
    const pulse=inventoryPulseDiff(previous,snapshot);
    state.inventoryPulseEvents=[...pulse,...(state.inventoryPulseEvents||[])].slice(0,120);

    const elapsed=Math.max(1,Math.round(performance.now()-started));
    state.areaScanHistory.unshift({
      uid:uid(),zip,radius,
      games:[...scanGames],
      retailers:[...selectedRetailers],
      stores:areaStoreGroups().length,
      nearbyStores:state.nearbyStores.length,
      results:state.areaInventoryResults.length,
      retailerChecks:state.areaRetailerCheckResults.length,
      errors:d.meta?.errors||[],
      storeDiscoverySource:d.meta?.storeDiscoverySource||'',
      watchQueryCount:Number(d.meta?.watchQueryCount)||0,
      durationMs:Number(d.meta?.durationMs)||elapsed,
      snapshot,
      checkedAt:new Date().toISOString()
    });
    state.areaScanHistory=state.areaScanHistory.slice(0,20);
    areaSelectedStoreKey=areaStoreGroups()[0]?.key||null;
    saveState();

    if(!silent){
      const liveStores=areaStoreGroups().length;
      const nearby=state.nearbyStores.length;
      const seconds=((Number(d.meta?.durationMs)||elapsed)/1000).toFixed(1);
      if(liveStores){
        toast(`${liveStores} live store${liveStores===1?'':'s'} • ${state.areaInventoryResults.length} stock result${state.areaInventoryResults.length===1?'':'s'} • ${seconds}s`);
      }else if(nearby){
        toast(`${nearby} nearby store${nearby===1?'':'s'} found • live shelf feed not connected • ${seconds}s`);
      }else if(state.areaRetailerCheckResults.length){
        toast(`${state.areaRetailerCheckResults.length} retailer checks ready • ${seconds}s`);
      }else{
        toast(`Scan finished in ${seconds}s • no stock feed or mapped retailers returned`);
      }
    }
  }catch(e){
    if(!silent){
      if(e.name==='AbortError')toast('Stock scan timed out after 12 seconds — try a smaller radius');
      else toast(e.message||'Stock scan failed');
    }
  }finally{
    areaScanBusy=false;
    renderStock();
  }
}
function clearAreaInventory(){
  state.areaInventoryResults=[];state.areaRetailerCheckResults=[];areaSelectedStoreKey=null;saveState();renderStock();
}
function clearInventoryPulse(){
  state.inventoryPulseEvents=[];saveState();renderStock();
}
function toggleSpecificProductSearch(){
  stockSpecificSearchOpen=!stockSpecificSearchOpen;renderStock();
}
function renderInventoryPulse(){
  const rows=(state.inventoryPulseEvents||[]).slice(0,12);
  if(!rows.length)return `<div class="empty">After two verified area scans, Inventory Pulse will show newly detected products, price changes, low-stock flags, and items no longer returned by the provider.</div>`;
  return rows.map(e=>`<div class="pulse-row ${esc(e.priority||'low')}">
    <div class="pulse-icon">${e.type==='price_down'?'↓':e.type==='price_up'?'↗':e.type==='low_stock'?'!':e.type==='new'?'＋':'○'}</div>
    <div class="grow"><strong>${esc(e.title)}</strong><span>${esc(e.detail)} • ${humanAge(e.ts)}</span></div>
  </div>`).join('');
}
function renderAreaStoreCard(g){
  const knownQty=g.products.filter(x=>x.quantity!==null&&x.quantity!==undefined);
  const totalKnownQty=knownQty.reduce((n,x)=>n+(Number(x.quantity)||0),0);
  const available=g.products.filter(x=>x.status!=='out_of_stock').length;

  return `<div class="area-store-card stock-intel-card ${areaSelectedStoreKey===g.key?'active':''}">
    <button class="area-store-main" onclick='selectAreaStore(${JSON.stringify(g.key)})'>
      <div class="store-radar-icon">◉</div>
      <div class="grow">
        <div class="eyebrow">${esc(g.retailer)} • LIVE STOCK FEED</div>
        <strong>${esc(g.store)}</strong>
        <span>${esc(g.address||'Provider supplied store')}${typeof g.distanceMiles==='number'?` • ${g.distanceMiles.toFixed(1)} mi`:''}</span>
      </div>
      <div class="freshness-pill">${stockFreshnessLabel(g.products[0]||{})}</div>
    </button>

    <div class="stock-intel-kpis">
      <div><b>${g.products.length}</b><span>products</span></div>
      <div><b>${available}</b><span>available</span></div>
      <div><b>${knownQty.length?totalKnownQty:'—'}</b><span>${knownQty.length?'known units':'qty not supplied'}</span></div>
      <div><b>${g.bestPrice?money(g.bestPrice):'—'}</b><span>lowest price</span></div>
    </div>

    <div class="stock-intel-preview">
      ${g.products.slice(0,3).map(x=>`
        <div>
          <span class="stock-dot ${x.lowStock?'low':x.status==='out_of_stock'?'out':'live'}"></span>
          <div class="grow">
            <strong>${esc(x.product)}</strong>
            <small>${x.price?money(x.price):'Price not supplied'} • Qty ${stockQuantityLabel(x)}</small>
          </div>
        </div>`).join('')}
    </div>

    <div class="area-store-foot">
      <span>${esc(stockFeedSourceLabel(g.products[0]||{}))}</span>
      <button class="mini-icon-btn ${g.favorite?'on':''}" onclick='toggleFavoriteInventoryStore(${JSON.stringify(g.key)})'>${g.favorite?'★':'☆'}</button>
      <button class="link-btn" onclick='selectAreaStore(${JSON.stringify(g.key)})'>Open store feed →</button>
    </div>
  </div>`;
}
function renderAreaProductCard(x){
  const matching=(state.stockWatches||[]).find(w=>w.enabled&&(watchMatchesText({product:x.product},w.product)||watchMatchesText({product:w.product},x.product)));
  const targetHit=matching?.maxPrice&&x.price&&x.price<=Number(matching.maxPrice);

  return `<div class="area-product-card stock-feed-row">
    <div class="stock-feed-status">
      <span class="stock-dot ${x.lowStock?'low':x.status==='out_of_stock'?'out':'live'}"></span>
      <span>${x.lowStock?'LOW':x.status==='out_of_stock'?'OUT':'LIVE'}</span>
    </div>

    ${x.image?`<img src="${esc(x.image)}" alt="">`:`<div class="product-image-fallback">◈</div>`}

    <div class="grow">
      <div class="eyebrow">${esc(x.game||'TCG')} • ${esc(x.retailer||'RETAILER')}</div>
      <strong>${esc(x.product)}</strong>
      <span>${x.retailerSku?`SKU ${esc(String(x.retailerSku))} • `:''}${x.upc?`UPC ${esc(x.upc)} • `:''}${esc(String(x.status||'unknown').replace(/_/g,' ').toUpperCase())}</span>
      <small>${esc(stockFeedSourceLabel(x))} • ${stockFreshnessLabel(x)}</small>
      ${matching?`<span class="watch-match">${targetHit?'TARGET HIT':'WATCH MATCH'}</span>`:''}
    </div>

    <div class="stock-feed-price">
      <strong>${x.price?money(x.price):'—'}</strong>
      <span>QTY ${stockQuantityLabel(x)}</span>
      <small>${typeof x.distanceMiles==='number'?`${x.distanceMiles.toFixed(1)} mi`:''}</small>
    </div>

    <div class="stock-feed-actions">
      ${x.url?`<a class="btn primary" href="${esc(x.url)}" target="_blank" rel="noreferrer">Open product ↗</a>`:''}
      ${x.addToCartUrl?`<a class="btn green" href="${esc(x.addToCartUrl)}" target="_blank" rel="noreferrer">Add to cart ↗</a>`:''}
      <button class="btn" onclick='openInventoryProduct(${JSON.stringify(x).replace(/'/g,"&#39;")})'>Product</button>
      <button class="btn" onclick='saveInventoryResultAsReport(${JSON.stringify(x).replace(/'/g,"&#39;")})'>Snapshot</button>
    </div>
  </div>`;
}
function renderAreaStoreDetail(){
  const g=selectedAreaStore();
  if(!g)return `<div class="empty">Tap a verified store above to see its stock feed.</div>`;

  const knownQty=g.products.filter(x=>x.quantity!==null&&x.quantity!==undefined);
  const totalKnownQty=knownQty.reduce((n,x)=>n+(Number(x.quantity)||0),0);

  return `<div class="area-store-detail stock-feed-detail">
    <div class="section-head">
      <div>
        <div class="eyebrow">${esc(g.retailer)} • STORE STOCK FEED</div>
        <h2>${esc(g.store)}</h2>
        <p>${esc(g.address||'')}${typeof g.distanceMiles==='number'?` • ${g.distanceMiles.toFixed(1)} miles`:''}</p>
      </div>
      <span class="badge primary">${g.products.length} PRODUCT${g.products.length===1?'':'S'}</span>
    </div>

    <div class="store-answer-grid">
      <div><span>Products found</span><strong>${g.products.length}</strong></div>
      <div><span>Known quantity</span><strong>${knownQty.length?totalKnownQty:'Not supplied'}</strong></div>
      <div><span>Freshness</span><strong>${stockFreshnessLabel(g.products[0]||{})}</strong></div>
      <div><span>Source</span><strong>${esc(stockFeedSourceLabel(g.products[0]||{}))}</strong></div>
    </div>

    <div class="action-row">
      ${g.address?`<a class="btn primary" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(g.address)}" target="_blank" rel="noreferrer">Directions ↗</a>`:''}
      <button class="btn" onclick='toggleFavoriteInventoryStore(${JSON.stringify(g.key)})'>${g.favorite?'★ Favorite':'☆ Favorite'}</button>
    </div>

    <div class="stock-feed-list">${g.products.map(renderAreaProductCard).join('')}</div>

    ${knownQty.length===0?`<div class="notice warn"><span>!</span><span>This provider verifies product/store availability but does not expose an exact shelf quantity. VaultSignal will never invent a count.</span></div>`:''}
  </div>`;
}
function renderQuickRetailerChecks(){
  const q=areaRetailerQuery();
  const providerNames=(state.areaRetailerCheckResults||[]).map(x=>x.retailer).filter(Boolean);
  const names=[...new Set(providerNames.length?providerNames:['Walmart','Target','GameStop'])];
  return `<div class="quick-retailer-checks">${names.map(name=>{
    const url=retailerSearchUrl(name,q);
    return url?`<a class="quick-retailer-btn" href="${esc(url)}" target="_blank" rel="noreferrer"><b>${esc(name)}</b><span>Check ${esc(q)} ↗</span></a>`:'';
  }).join('')}</div>`;
}

function renderNearbyStoreChecks(){
  const rows=(state.nearbyStores||[]).slice(0,20),q=areaRetailerQuery(),quick=renderQuickRetailerChecks();
  if(rows.length)return quick+rows.map(s=>{
    const family=retailerFamily(s.name||s.brand||s.operator||''),checkUrl=family?retailerSearchUrl(family,q):'';
    return `<div class="nearby-check-row"><div class="grow"><strong>${esc(s.name||'Retailer')}</strong><span>${esc(s.address||s.shop||'Nearby store')} • ${Number(s.distance||0).toFixed(1)} mi</span><small>${family?'Retailer-site availability check — not a verified VaultSignal stock count':'Nearby retailer discovered from map data'}</small></div><span class="stock-pill check">${family?'RETAILER CHECK':'NEARBY'}</span><div class="nearby-check-actions">${checkUrl?`<a class="btn primary" href="${esc(checkUrl)}" target="_blank" rel="noreferrer">Check ${esc(family)} ↗</a>`:''}<a class="btn" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.lat+','+s.lon)}" target="_blank" rel="noreferrer">Map ↗</a></div></div>`;
  }).join('');
  const fallback=mergeInventoryResults(state.areaRetailerCheckResults||[]).filter(x=>x.sourceType==='retailer_verified'||x.status==='retailer_check').filter((x,i,a)=>a.findIndex(y=>y.retailer===x.retailer)===i);
  if(fallback.length)return quick+`<div class="retailer-check-fallback-grid">${fallback.map(x=>`<div class="retailer-check-fallback-card"><div><strong>${esc(x.retailer)}</strong><span>Retailer-site availability search</span></div>${x.url?`<a class="btn primary" href="${esc(x.url)}" target="_blank" rel="noreferrer">Check retailer ↗</a>`:''}</div>`).join('')}</div>`;
  return quick||`<div class="empty">Run SCAN MY AREA to find nearby retailers.</div>`;
}
function renderStock(){
  ensureRealInventorySchema();
  const radius=Number(state.settings.radius)||25,groups=areaStoreGroups(),last=latestAreaScan();
  const scanGames=['Pokemon','Lorcana','Magic','Yu-Gi-Oh!','One Piece'];
  const connection=inventoryConnectionSummary(),backendOnline=inventoryBackendOnline()||inventoryBackendConnected(),liveProviders=liveInventoryProviders();
  const nearbyCount=(state.nearbyStores||[]).length;
  const coverage=stockCoverageSummary();
  const watchScanQueries=stockWatchQueriesForScan();
  const retailerCheckCount=new Set([...(state.areaRetailerCheckResults||[]).map(x=>x.retailer),...(state.nearbyStores||[]).map(x=>retailerFamily(x.name||x.brand||'')).filter(Boolean)]).size;
  $('stock').innerHTML=`
    <div class="page-title"><div><h1>Inventory Radar</h1><p>Verified live inventory when an authorized source is connected, plus nearby retailer checks everywhere else.</p></div><span class="badge ${connection.mode==='live'?'primary':connection.mode==='checks'?'signal-gold':''}">${backendOnline?'● INVENTORY SERVICE ONLINE':'○ SETUP REQUIRED'}</span></div>
    <div class="panel inventory-source-truth ${connection.mode}"><div class="inventory-source-icon">${connection.mode==='live'?'●':connection.mode==='checks'?'↗':'!'}</div><div class="grow"><div class="eyebrow">SOURCE MODE</div><strong>${esc(connection.title)}</strong><span>${esc(connection.detail)}</span></div><b>${esc(connection.badge)}</b></div>
    ${renderLiveDropNetwork()}
    <div class="panel stock-command-panel">
      <div class="section-head">
        <div><div class="eyebrow">VAULTSIGNAL • STOCK COMMAND</div><h2>Inventory intelligence, not manual searching</h2><p>VaultSignal scans your area once, prioritizes watched products, groups live results by physical store and shows exactly where each result came from.</p></div>
        <span class="badge primary">${stockScanModeLabel()}</span>
      </div>
      <div class="stock-command-grid">
        <div><span>Live inventory feeds</span><strong>${coverage.liveProviders}</strong><small>${coverage.liveNames.length?esc(coverage.liveNames.join(', ')):'Waiting for authorized retailer feeds'}</small></div>
        <div><span>Store discovery</span><strong>${coverage.discoveryConfigured?'PRO':'DEV'}</strong><small>${esc(coverage.discoveryName)}</small></div>
        <div><span>Active product watches</span><strong>${watchScanQueries.length}</strong><small>${watchScanQueries.length?'Included automatically in scans':'Add watches for precise scans'}</small></div>
        <div><span>Last scan</span><strong>${latestAreaScanSpeed()}</strong><small>${last?.storeDiscoverySource?esc(last.storeDiscoverySource):'No scan source recorded'}</small></div>
      </div>
      ${watchScanQueries.length?`<div class="watch-query-strip">${watchScanQueries.map(q=>`<span>${esc(q)}</span>`).join('')}</div>`:
      `<div class="notice"><span>◎</span><span><b>Precision tip:</b> add exact sealed products to Stock Watches. VaultSignal will include up to 8 watched product names automatically in each area scan.</span></div>`}
    </div>
    <div class="panel area-radar-hero">
      <div class="section-head"><div><div class="eyebrow">VAULTSIGNAL INVENTORY RADAR</div><h2>Scan my area</h2><p>Choose ZIP, radius and TCGs. VaultSignal scans nearby stores, category inventory and your watched products in one backend request.</p></div><span class="badge ${connection.mode==='live'?'primary':'signal-gold'}">${areaScanBusy?'SCANNING…':esc(connection.badge)}</span></div>
      <div class="form-grid"><label class="field"><span>ZIP code</span><input id="stockZip" inputmode="numeric" value="${esc(state.settings.zip||'')}" placeholder="28752"></label><label class="field"><span>Radius</span><select id="stockRadius">${[5,10,15,25,50,75,100].map(v=>`<option value="${v}" ${v===radius?'selected':''}>${v} miles</option>`).join('')}</select></label></div>
      <div class="area-game-selector">${scanGames.map(g=>`<button class="${areaScanGames().includes(g)?'on':''}" onclick='toggleAreaGame(${JSON.stringify(g)})'>${esc(g)}</button>`).join('')}</div>
      <div class="action-row radar-actions"><button class="btn primary area-scan-btn" ${areaScanBusy?'disabled':''} onclick="runAreaInventoryScan(false)">${areaScanBusy?'Finding stores + stock…':'◉ SCAN MY AREA'}</button><button class="btn" onclick="saveStockArea()">Save area</button><button class="btn" onclick="useMyLocation()">⌖ Use location</button></div>
      <div class="auto-refresh-strip"><label><input type="checkbox" ${state.areaScanSettings.autoRefresh?'checked':''} onchange="setAreaAutoRefresh(this.checked)"> Smart refresh when Stock opens</label><select onchange="setAreaAutoRefreshHours(this.value)">${[1,2,4,6,12,24].map(h=>`<option value="${h}" ${Number(state.areaScanSettings.autoRefreshHours)===h?'selected':''}>after ${h}h</option>`).join('')}</select><span>${last?`Last scan ${humanAge(last.checkedAt)}`:'No scan yet'}</span></div>
    </div>
    <div class="stat-grid compact-stats"><div class="stat-card"><span>Verified stores</span><strong>${groups.length}</strong><small>${liveProviders.length?liveProviders.map(x=>x.name).join(', '):'No authorized live feed yet'}</small></div><div class="stat-card"><span>Mapped nearby stores</span><strong>${nearbyCount}</strong><small>${nearbyCount?`${radius} mile area`:"Map lookup returned none • retailer checks still work"}</small></div><div class="stat-card"><span>Retailer checks</span><strong>${retailerCheckCount}</strong><small>Direct retailer handoffs</small></div><div class="stat-card"><span>Last scan speed</span><strong>${latestAreaScanSpeed()}</strong><small>Single backend scan</small></div></div>
    ${retailerCheckCount?`<div class="panel quick-check-panel"><div class="section-head"><div><div class="eyebrow">CHECK RETAILERS NOW</div><h2>${retailerCheckCount} retailer check${retailerCheckCount===1?'':'s'} ready</h2><p>These open the retailer's own current search/availability flow. They do not claim inventory is in stock.</p></div></div>${renderQuickRetailerChecks()}</div>`:''}
    ${groups.length?`<div class="panel"><div class="section-head"><div><div class="eyebrow">VERIFIED LIVE INVENTORY</div><h2>Provider-confirmed stores</h2><p>Only authorized live inventory results appear here.</p></div><button class="link-btn" onclick="clearAreaInventory()">Clear</button></div><div class="area-store-grid">${groups.map(renderAreaStoreCard).join('')}</div></div><div class="panel" id="areaStoreDetail">${renderAreaStoreDetail()}</div>`:`<div class="panel verified-empty-panel"><div class="section-head"><div><div class="eyebrow">VERIFIED LIVE INVENTORY</div><h2>No verified live store result</h2><p>${liveProviders.length?'The connected live source returned no matching inventory in this scan.':'No authorized live store-inventory provider is configured yet. VaultSignal will not pretend a store is in stock.'}</p></div></div></div>`}
    <div class="panel retailer-check-panel"><div class="section-head"><div><div class="eyebrow">NEARBY RETAILER CHECKS</div><h2>Nearby stores + retailer verification</h2><p>Real nearby store locations with direct retailer/map handoffs. These are not labeled in stock without a verified feed.</p></div><button class="btn" onclick="findNearbyStores()">Refresh stores</button></div>${renderNearbyStoreChecks()}</div>
    <div class="panel pulse-panel"><div class="section-head"><div><div class="eyebrow">INVENTORY PULSE</div><h2>Verified-source changes</h2><p>Compares authorized provider results between scans.</p></div>${state.inventoryPulseEvents.length?`<button class="link-btn" onclick="clearInventoryPulse()">Clear</button>`:''}</div>${renderInventoryPulse()}</div>
    <div class="panel specific-search-panel"><div class="section-head"><div><div class="eyebrow">EXACT PRODUCT CHECK</div><h2>Check one exact product</h2><p>Search by product, UPC or SKU. Unsupported retailers return retailer checks instead of fake stock.</p></div><button class="btn" onclick="toggleSpecificProductSearch()">${stockSpecificSearchOpen?'Hide':'Open search'}</button></div>${stockSpecificSearchOpen?`<div class="form-grid"><label class="field full"><span>Product / UPC / SKU</span><input id="stockQuery" value="${esc(stockQuery)}" placeholder="Prismatic Evolutions ETB"></label><label class="field"><span>TCG</span><select id="stockGame">${games.map(g=>`<option ${g===stockGame?'selected':''}>${g}</option>`).join('')}</select></label><label class="field"><span>Max price</span><input id="stockMaxPrice" type="number" min="0" step=".01" placeholder="49.99"></label></div><div style="margin:11px 0 7px" class="eyebrow">RETAILERS</div><div class="retailer-grid">${retailers.map(r=>`<button class="retailer-chip ${selectedRetailers.has(r)?'on':''}" onclick='toggleRetailer(${JSON.stringify(r)})'>${esc(r)}</button>`).join('')}</div><div class="action-row" style="margin-top:11px"><button class="btn primary live-search-btn" onclick="runInventorySearch()">◎ CHECK PRODUCT</button><button class="btn green" onclick="saveStockWatch()">＋ Save watch</button></div><div style="margin-top:10px">${renderInventoryResults()}</div>`:''}</div>
    <div class="panel inventory-provider-panel"><div class="section-head"><div><div class="eyebrow">SOURCE STATUS</div><h2>What VaultSignal can actually verify</h2><p>Backend connectivity and live inventory are shown separately.</p></div><button class="btn" onclick="checkInventoryBackendHealth(true).then(()=>renderStock())">Refresh status</button></div>${retailerCapabilityMarkup()}</div>
    <div class="panel radar-panel"><div class="section-head"><div><div class="eyebrow">RESTOCK RADAR</div><h2>Saved product intelligence</h2><p>Your targeted product watches remain connected to Product Command and Inventory Command.</p></div></div>${renderRestockRadar()}</div>
    <div class="panel"><div class="section-head"><div><h2>Stock watches</h2><p>Specific products you want prioritized.</p></div></div>${renderStockWatches()}</div>`;
  setTimeout(()=>{maybeAutoScanArea();if(!state.liveDropFeed.length)refreshLiveDrops(true);startLiveDropAutoRefresh();},0);
}
function toggleRetailer(name){
  selectedRetailers.has(name) ? selectedRetailers.delete(name) : selectedRetailers.add(name);
  renderStock();
}
function saveStockArea(){
  const z = $('stockZip')?.value.trim() || '';
  const radius = Number($('stockRadius')?.value)||25;
  state.settings.zip = z;
  state.settings.radius = radius;
  if(z) state.settings.locationLabel = z;
  saveState(); renderStock(); toast('Search area saved');
}
function saveStockWatch(){
  stockQuery = $('stockQuery')?.value.trim() || '';
  stockGame = $('stockGame')?.value || 'Pokemon';
  if(!stockQuery){ toast('Enter a product or set first'); return; }
  const maxPriceRaw = $('stockMaxPrice')?.value;
  const priority = prompt('Watch priority? Type High, Medium, or Low','High') || 'High';
  const desiredRaw = prompt('How many do you want to find?','1');
  const watch = {
    uid:uid(), product:stockQuery, game:stockGame,
    retailers:[...selectedRetailers], radius:Number(state.settings.radius)||25,
    maxPrice:maxPriceRaw ? Number(maxPriceRaw) : null,
    priority:/^low$/i.test(priority)?'Low':/^med/i.test(priority)?'Medium':'High',
    desiredQty:Math.max(1,Number(desiredRaw)||1),
    enabled:true, createdAt:new Date().toISOString()
  };
  state.stockWatches.unshift(watch); selectedWatchId=watch.uid; saveState(); renderStock(); toast('Stock watch saved');
}
function renderStockWatches(){
  if(!state.stockWatches.length) return `<div class="empty">Save your first product hunt to build a restock watchlist.</div>`;
  return state.stockWatches.map(w=>`
    <div class="compact-row"><div class="thumb square"><b>◎</b></div><div class="grow"><strong>${esc(w.product)}</strong><span>${esc(w.game)} • ${esc(w.priority||'High')} priority • want ${w.desiredQty||1} • ${w.radius} mi • ${w.retailers.length} retailers${w.maxPrice?` • max ${money(w.maxPrice)}`:''}</span></div>
      <div class="right">
        <button class="btn primary" onclick="huntWatch('${w.uid}')">Hunt</button>
        <button class="btn ${w.enabled?'green':''}" onclick="toggleWatch('${w.uid}')">${w.enabled?'On':'Off'}</button>
        <button class="remove" onclick="removeWatch('${w.uid}')">Delete</button>
      </div></div>
  `).join('');
}
function toggleWatch(id){ const w=state.stockWatches.find(x=>x.uid===id); if(w) w.enabled=!w.enabled; saveState(); renderStock(); }
function removeWatch(id){ state.stockWatches=state.stockWatches.filter(x=>x.uid!==id); saveState(); renderStock(); }
function removeStockReport(id){ state.stockReports=state.stockReports.filter(x=>x.uid!==id); saveState(); renderStock(); }
function clearInventoryResults(){ state.inventoryResults=[]; saveState(); renderStock(); }

async function runInventorySearch(){
  ensureRealInventorySchema();
  stockQuery=$('stockQuery')?.value.trim()||'';
  stockGame=$('stockGame')?.value||'Pokemon';
  if(!stockQuery){toast('Enter a product, UPC or SKU first');return;}
  const product=selectedProductForStockQuery();
  if(!inventoryBackendConnected()){
    toast('Real Inventory backend is not connected yet');
    openInventorySetup();
    return;
  }

  const cap=$('inventoryResultCaption');
  if(cap)cap.textContent='Checking connected retailer sources…';
  const btn=document.querySelector('.live-search-btn');
  if(btn){btn.disabled=true;btn.textContent='Checking retailers…'}

  try{
    const data=await fetchRealInventory(product);
    applyInventoryResultsToProductCommand(data.results,product);
    state.inventoryResults=data.results;
    saveInventorySearchHistory({
      query:stockQuery,game:stockGame,zip:state.settings.zip,radius:state.settings.radius,
      retailers:[...selectedRetailers],resultCount:data.results.length,
      providers:[...new Set(data.results.map(x=>x.provider))],checkedAt:new Date().toISOString()
    });
    saveState();renderStock();
    toast(data.results.length?`${data.results.length} real inventory result${data.results.length===1?'':'s'}`:'No in-stock API results found nearby');
  }catch(e){
    renderStock();toast(e.message||'Inventory lookup failed');
  }
}
function renderInventoryResults(){
  ensureRealInventorySchema();
  if(!state.inventoryResults.length)return `<div class="empty">No exact-product results yet.</div>`;
  return state.inventoryResults.map(raw=>{
    const x=normalizeInventoryResult(raw);
    const retailerCheck=x.sourceType==='retailer_verified'||x.status==='retailer_check';
    const confidence=inventoryResultConfidence(x);
    if(retailerCheck){
      return `<div class="inventory-card real-inventory-card retailer-check-card">
        <div class="topline"><div class="grow"><div class="eyebrow">${esc(x.retailer)} • RETAILER CHECK</div><h3>${esc(x.product)}</h3><p>Open ${esc(x.retailer)} to verify availability on the retailer's own site.</p></div><span class="stock-pill check">CHECK RETAILER</span></div>
        <div class="retailer-check-note"><span>↗</span><div><strong>Not an in-stock result</strong><p>No stock, distance, quantity, price or confidence is being claimed.</p></div></div>
        <div class="action-row">${x.url?`<a class="btn primary" href="${esc(x.url)}" target="_blank" rel="noreferrer">Open ${esc(x.retailer)} ↗</a>`:''}<button class="btn" onclick='openInventoryProduct(${JSON.stringify(x).replace(/'/g,"&#39;")})'>Product</button></div>
      </div>`;
    }
    const qty=x.quantity===null?'Not provided':x.quantity;
    return `<div class="inventory-card real-inventory-card">
      <div class="topline">${x.image?`<img class="inventory-product-img" src="${esc(x.image)}" alt="">`:''}<div class="grow"><div class="eyebrow">${esc(x.retailer)} • OFFICIAL API</div><h3>${esc(x.product)}</h3><p>${esc(x.store||'')} ${x.address?`• ${esc(x.address)}`:''}</p></div><span class="stock-pill ${inventoryStatusClass(x)}">${inventoryStatusLabel(x)}</span></div>
      <div class="meta-grid"><div class="meta"><span>Price</span><strong>${x.price?money(x.price):'—'}</strong></div><div class="meta"><span>Quantity</span><strong>${esc(String(qty))}</strong></div><div class="meta"><span>Distance</span><strong>${typeof x.distanceMiles==='number'?x.distanceMiles.toFixed(1)+' mi':'—'}</strong></div><div class="meta"><span>Checked</span><strong>${humanAge(x.checkedAt)}</strong></div></div>
      <div class="inventory-trust-row">${confidence!==null?`<span class="confidence-badge ${confidence>=85?'high':confidence>=60?'mid':'low'}">${confidence}% source confidence</span>`:''}${x.lowStock?`<span class="stock-pill low">LOW STOCK FLAG</span>`:''}</div>
      <div class="action-row">${x.url?`<a class="btn primary" href="${esc(x.url)}" target="_blank" rel="noreferrer">Retailer ↗</a>`:''}${x.addToCartUrl?`<a class="btn green" href="${esc(x.addToCartUrl)}" target="_blank" rel="noreferrer">Cart ↗</a>`:''}<button class="btn" onclick='saveInventoryResultAsReport(${JSON.stringify(x).replace(/'/g,"&#39;")})'>Snapshot</button><button class="btn green" onclick='buyInventoryResult(${JSON.stringify(x).replace(/'/g,"&#39;")})'>$ Bought it</button><button class="btn" onclick='openInventoryProduct(${JSON.stringify(x).replace(/'/g,"&#39;")})'>Product</button></div>
    </div>`;
  }).join('');
}
function saveInventoryResultAsReport(raw){
  const x=normalizeInventoryResult(raw);
  if(x.sourceType==='retailer_verified'||x.status==='retailer_check'){
    toast('Retailer checks are links, not verified inventory snapshots');
    return;
  }
  const p=x.productId?catalogProductById(x.productId):findCatalogMatches(x.product)[0]||null;
  const report={
    uid:uid(),productId:p?.uid||x.productId||'',store:x.store||x.retailer||'',retailer:x.retailer||'',
    product:x.product||'',game:x.game||p?.game||stockGame||'Pokemon',
    status:x.status==='in_stock'?'In stock':x.status==='low_stock'?'Low stock':x.status==='out_of_stock'?'Out of stock':inventoryStatusLabel(x),
    qty:x.quantity===null?'':x.quantity,price:Number(x.price)||0,upc:x.upc||p?.upc||'',sku:x.retailerSku||p?.sku||'',
    notes:`Saved from ${x.sourceAttribution||'inventory connector'}`,ts:x.checkedAt||new Date().toISOString(),
    confirmations:x.sourceType==='official_api'?2:1,soldOutConfirmations:0,source:x.sourceType||'inventory_connector'
  };
  state.stockReports.unshift(report);
  if(p)recordProductInventoryEvent(p.uid,'Inventory snapshot',`${report.status} at ${report.store}`,`${report.price?money(report.price):'Price unknown'} • ${x.sourceAttribution}`);
  saveState();renderStock();toast('Inventory snapshot saved');
}

async function useMyLocation(){
  if(!navigator.geolocation){ toast('Location is not supported by this browser'); return; }
  toast('Requesting your location…');
  navigator.geolocation.getCurrentPosition(async pos=>{
    state.settings.lat = pos.coords.latitude;
    state.settings.lon = pos.coords.longitude;
    state.settings.locationLabel = 'Current location';
    saveState();
    try{
      const url=`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(pos.coords.latitude)}&lon=${encodeURIComponent(pos.coords.longitude)}`;
      const r=await fetch(url,{headers:{'Accept':'application/json'}});
      const d=await r.json();
      const zip=d.address?.postcode||'';
      if(zip) state.settings.zip=zip;
      state.settings.locationLabel=[d.address?.city||d.address?.town||d.address?.village,d.address?.state,zip].filter(Boolean).join(', ')||'Current location';
      saveState();
    }catch{}
    renderStock(); toast('Location saved');
  },err=>toast(err.message||'Could not get location'),{enableHighAccuracy:false,timeout:12000,maximumAge:600000});
}
async function geocodeSavedArea(){
  if(state.settings.lat && state.settings.lon) return {lat:Number(state.settings.lat),lon:Number(state.settings.lon)};
  const zip=(state.settings.zip||'').trim();
  if(!zip) throw new Error('Enter a ZIP or use your location first.');
  const url=`https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=us&postalcode=${encodeURIComponent(zip)}&limit=1`;
  const r=await fetch(url,{headers:{'Accept':'application/json'}});
  if(!r.ok) throw new Error('ZIP lookup failed.');
  const data=await r.json();
  if(!data[0]) throw new Error('ZIP could not be located.');
  state.settings.lat=Number(data[0].lat); state.settings.lon=Number(data[0].lon);
  state.settings.locationLabel=zip; saveState();
  return {lat:Number(data[0].lat),lon:Number(data[0].lon)};
}
function haversine(lat1,lon1,lat2,lon2){
  const R=3958.8, toRad=x=>x*Math.PI/180;
  const dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
async function findNearbyStores(options={}){
  const silent=options?.silent===true,skipRender=options?.skipRender===true;
  try{
    const {lat,lon}=await geocodeSavedArea();
    const radiusMiles=Number(state.settings.radius)||25;
    const meters=radiusMiles*1609.344;
    const names=['Walmart','Target','Best Buy','GameStop',"Sam's Club",'Costco','Walgreens','CVS','Dollar General','Family Dollar'];
    const regex=names.join('|');
    const q=`[out:json][timeout:28];(
      nwr(around:${Math.round(meters)},${lat},${lon})["name"~"${regex}",i];
      nwr(around:${Math.round(meters)},${lat},${lon})["brand"~"${regex}",i];
      nwr(around:${Math.round(meters)},${lat},${lon})["operator"~"${regex}",i];
      nwr(around:${Math.round(meters)},${lat},${lon})["shop"~"games|toys|department_store|supermarket|variety_store|chemist"];
    );out center tags;`;
    const endpoints=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
    let elements=[];
    for(const ep of endpoints){
      try{
        const r=await fetch(ep,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:'data='+encodeURIComponent(q)});
        if(!r.ok)throw new Error(`Store lookup ${r.status}`);
        const d=await r.json();
        if(Array.isArray(d.elements))elements=d.elements;
        if(elements.length)break;
      }catch{}
    }
    const seen=new Set();
    let stores=elements.map(e=>{
      const t=e.tags||{},slat=e.lat??e.center?.lat,slon=e.lon??e.center?.lon;
      if(typeof slat!=='number'||typeof slon!=='number')return null;
      const name=t.name||t.brand||t.operator||'Local store';
      const family=retailerFamily(name)||retailerFamily(t.brand||'')||retailerFamily(t.operator||'');
      const shop=t.shop||'';
      if(!family&&!/games|toys|department_store|supermarket|variety_store|chemist/i.test(shop))return null;
      const distance=haversine(lat,lon,slat,slon);
      if(distance>radiusMiles+1)return null;
      const key=`${name}|${slat.toFixed(4)}|${slon.toFixed(4)}`;
      if(seen.has(key))return null;seen.add(key);
      const address=[t['addr:housenumber'],t['addr:street'],t['addr:city'],t['addr:state'],t['addr:postcode']].filter(Boolean).join(' ');
      return {id:key,name,brand:t.brand||'',operator:t.operator||'',family,address,lat:slat,lon:slon,distance,shop,openingHours:t.opening_hours||'',phone:t.phone||t['contact:phone']||'',website:t.website||t['contact:website']||'',source:'OpenStreetMap'};
    }).filter(Boolean).sort((a,b)=>a.distance-b.distance).slice(0,40);

    // Chain-name fallback when Overpass is sparse.
    if(stores.length<2){
      const more=[];
      for(const chain of names){
        try{
          const u=new URL('https://nominatim.openstreetmap.org/search');
          u.searchParams.set('format','jsonv2');u.searchParams.set('limit','4');u.searchParams.set('q',`${chain} ${state.settings.zip||state.settings.locationLabel||''}`);
          const r=await fetch(u.toString(),{headers:{Accept:'application/json'}}); if(!r.ok)continue;
          const list=await r.json();
          for(const x of list||[]){
            const slat=Number(x.lat),slon=Number(x.lon);if(!Number.isFinite(slat)||!Number.isFinite(slon))continue;
            const distance=haversine(lat,lon,slat,slon);if(distance>radiusMiles+3)continue;
            const key=`${chain}|${slat.toFixed(4)}|${slon.toFixed(4)}`;if(seen.has(key))continue;seen.add(key);
            more.push({id:key,name:(x.display_name||chain).split(',')[0]||chain,brand:chain,family:chain,address:x.display_name||'',lat:slat,lon:slon,distance,shop:x.type||'',source:'OpenStreetMap'});
          }
        }catch{}
        if(more.length>=8)break;
      }
      stores=[...stores,...more].sort((a,b)=>a.distance-b.distance).slice(0,40);
    }
    state.nearbyStores=stores;saveState();
    if(!skipRender)renderStock();
    if(!silent)toast(stores.length?`${stores.length} nearby retailer${stores.length===1?'':'s'} found`:'No mapped retailers found • retailer website checks are still ready');
    return stores;
  }catch(e){if(!silent)toast(e.message||'Nearby store lookup failed');return []}
}
function renderNearbyStores(){
  if(!state.nearbyStores.length) return `<div class="empty">Save a ZIP or use GPS, then tap “Nearby stores.”</div>`;
  return state.nearbyStores.map(s=>`
    <div class="nearby-store-card">
      <div class="compact-row"><div class="thumb square"><b>⌖</b></div><div class="grow"><strong>${esc(s.name)}</strong><span>${esc(s.address||s.shop||'Store')} • ${s.distance.toFixed(1)} mi${s.openingHours?' • '+esc(s.openingHours):''}</span></div></div>
      <div class="action-row" style="margin-left:56px">
        <a class="btn" target="_blank" rel="noreferrer" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.lat+','+s.lon)}">Map ↗</a>
        <a class="btn primary" target="_blank" rel="noreferrer" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.lat+','+s.lon)}">Directions ↗</a>
        ${s.website?`<a class="btn" target="_blank" rel="noreferrer" href="${esc(s.website)}">Website ↗</a>`:''}
      </div>
    </div>
  `).join('');
}



function openInventoryProduct(x){
  const p=addCatalogProduct({game:x.game||stockGame||'Pokemon',name:x.product||'TCG Product',set:x.set||'',type:x.type||'Sealed',msrp:Number(x.msrp)||0,target:Number(x.price)||0,image:x.image||''});
  activeProductId=p.uid;toolsTab='products';switchTab('tools');
}
function openCommunityProduct(r){
  const p=addCatalogProduct({game:r.game||stockGame||'Pokemon',name:r.product||'TCG Product',set:'',type:'Sealed',msrp:0,target:Number(r.price)||0});
  activeProductId=p.uid;toolsTab='products';switchTab('tools');
}

function buildHuntRoute(){
  if(!state.nearbyStores.length){
    toast('Find nearby stores first');
    findNearbyStores();
    return;
  }
  const selected=[...selectedRetailers].map(x=>x.toLowerCase());
  let stores=state.nearbyStores.filter(s=>{
    const name=(s.name||'').toLowerCase();
    if(selected.includes('local card shop') && /card|game|hobby|comic|collect/.test(name)) return true;
    return selected.some(r=>r!=='local card shop' && name.includes(r.toLowerCase()));
  });
  if(!stores.length) stores=[...state.nearbyStores];
  state.huntRoute=stores.slice(0,8).map(s=>({
    uid:uid(),storeId:s.id,name:s.name,address:s.address||'',lat:s.lat,lon:s.lon,distance:s.distance,visited:false,visitedAt:null
  }));
  saveState();renderStock();toast(`${state.huntRoute.length} hunt stops ready`);
}
function clearHuntRoute(){ state.huntRoute=[];saveState();renderStock(); }
function renderHuntRoute(){
  if(!state.huntRoute.length) return `<div class="empty">Find nearby stores, then build a hunt route. VaultSignal will prioritize nearby selected retailers.</div>`;
  const completed=state.huntRoute.filter(x=>x.visited).length;
  const furthest=Math.max(...state.huntRoute.map(x=>Number(x.distance)||0),0);
  return `<div class="hunt-summary"><strong>${completed}/${state.huntRoute.length} stops visited</strong><span>Furthest stop ${furthest.toFixed(1)} mi from your search point</span></div>`+
    state.huntRoute.map((s,idx)=>`<div class="hunt-stop ${s.visited?'visited':''}">
      <div class="hunt-number">${s.visited?'✓':idx+1}</div>
      <div class="grow"><strong>${esc(s.name)}</strong><span>${esc(s.address||'Nearby store')} • ${Number(s.distance||0).toFixed(1)} mi${s.visited&&s.visitedAt?' • visited '+humanAge(s.visitedAt):''}</span></div>
      <div class="hunt-actions">
        <a class="btn" target="_blank" rel="noreferrer" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.lat+','+s.lon)}">Directions ↗</a>
        <button class="btn ${s.visited?'':'primary'}" onclick="toggleHuntStop('${s.uid}')">${s.visited?'Undo':'Visited'}</button>
        <button class="btn green" onclick="reportAtHuntStop('${s.uid}')">Report</button>
      </div>
    </div>`).join('');
}
function toggleHuntStop(id){
  const s=state.huntRoute.find(x=>x.uid===id);if(!s)return;
  s.visited=!s.visited;s.visitedAt=s.visited?new Date().toISOString():null;saveState();renderStock();
}
function reportAtHuntStop(id){
  const s=state.huntRoute.find(x=>x.uid===id);if(!s)return;
  toolsTab='stockreport';switchTab('tools');
  setTimeout(()=>{
    const store=$('reportStore'); if(store) store.value=s.name;
    const product=$('reportProduct'); if(product && stockQuery) product.value=stockQuery;
  },0);
}
function confirmStockReport(id,kind){
  const r=state.stockReports.find(x=>x.uid===id);if(!r)return;
  if(kind==='still'){
    r.confirmations=(Number(r.confirmations)||0)+1;
    r.status=r.status==='Out of stock'?'In stock':r.status;
    r.ts=new Date().toISOString();
    toast('Stock sighting refreshed');
  }else{
    r.soldOutConfirmations=(Number(r.soldOutConfirmations)||0)+1;
    r.status='Out of stock';
    r.ts=new Date().toISOString();
    toast('Marked sold out');
  }
  saveState();renderStock();
}
function buyFromReport(id){
  const r=state.stockReports.find(x=>x.uid===id);if(!r)return;
  logPurchaseAndSealed(r.product,r.store,Number(r.price)||0);
}
function buyInventoryResult(x){
  x=normalizeInventoryResult(x);
  if(x.sourceType==='retailer_verified'||x.status==='retailer_check'){
    toast('Open the retailer first, then log a purchase after you actually buy it');
    return;
  }
  logPurchaseAndSealed(x.product||'TCG product',x.store||x.retailer||'Retailer',Number(x.price)||0);
}
function logPurchaseAndSealed(product,merchant,defaultPrice){
  ensureProductInventorySchema();
  const qRaw=prompt(`How many ${product} did you buy?`,'1');
  if(qRaw===null)return;
  const qty=Math.max(1,Number(qRaw)||1);
  const pRaw=prompt('Price paid EACH:',defaultPrice?String(defaultPrice.toFixed(2)):'');
  if(pRaw===null)return;
  const each=Math.max(0,Number(pRaw)||0);
  const date=todayInput();
  let p=findCatalogMatches(product).find(x=>x.game===(stockGame||'Pokemon'))||findCatalogMatches(product)[0]||null;
  if(!p)p=addCatalogProduct({game:stockGame||'Pokemon',name:product,type:'Sealed',msrp:each,target:each});
  const addSealedChoice=confirm('Add this purchase to your Sealed Vault too?');
  state.purchases.unshift({uid:uid(),merchant,item:product,category:'Stock Finder purchase',amount:each*qty,qty,date,notes:'Logged from Stock Finder / Product Command'});
  if(addSealedChoice){
    const location=(prompt('Storage location','New purchase')||'New purchase').trim();
    state.sealed.unshift({uid:uid(),name:product,game:p.game,qty,cost:each,current:each,location,productId:p.uid,retailer:merchant||'',purchaseDate:date,upc:p.upc||'',sku:p.sku||'',ownerProfileId:activeCollectorProfileId,addedAt:new Date().toISOString()});
    recordProductInventoryEvent(p.uid,'Acquired',`Bought ${qty} from Stock Finder`,`${merchant||'Retailer'} • ${money(each)} each`);
  }
  saveState();renderStock();toast(addSealedChoice?'Purchase + product inventory updated':'Purchase logged');
}
function huntWatch(id){
  const w=state.stockWatches.find(x=>x.uid===id);if(!w)return;
  stockQuery=w.product;stockGame=w.game||'Pokemon';selectedRetailers=new Set(w.retailers||[]);
  renderStock();
  setTimeout(()=>{
    const q=$('stockQuery');if(q)q.value=stockQuery;
    if((window.TWOGEN_CONFIG?.inventoryApiBase||'').trim()) runInventorySearch();
    else toast('Watch loaded — use Nearby stores or retailer checks');
  },0);
}


async function refreshCommunityReports(showToast=true){
  if(!cloudReady()){
    if(showToast) toast('Cloud is not configured yet. Use the setup file in the ZIP.');
    return;
  }
  try{
    const reports=await twogenCloudFetchReports({
      zip:state.settings.zip||'',
      game:stockGame||'',
      product:stockQuery||'',
      hours:72,
      limit:100
    });
    state.communityReports=reports;
    try{
      state.communityConfirmationCounts=await twogenCloudFetchConfirmationCounts(reports.map(r=>r.id));
    }catch{
      state.communityConfirmationCounts={};
    }
    saveState();
    if(currentTab==='stock') renderStock();
    if(showToast) toast(`${reports.length} community reports loaded`);
  }catch(e){
    if(showToast) toast(e.message||'Community reports could not be loaded');
  }
}
function renderCommunityReports(){
  if(!cloudReady()){
    return `<div class="notice warn"><span>!</span><span>Community accounts are built into this version but not connected yet. Follow <b>START-HERE-CLOUD.txt</b> once to create the free cloud project, then paste the two public client values into config.js.</span></div>`;
  }
  if(!state.communityReports?.length){
    return `<div class="empty">No matching community reports loaded yet. Tap Refresh reports. Reports can be filtered by your saved ZIP, TCG and current product hunt.</div>`;
  }
  return state.communityReports.slice(0,30).map(r=>{
    const c=state.communityConfirmationCounts?.[r.id]||{still:0,gone:0};
    const cs=cloudReportConfidence(r);
    const displayStatus=r.status==='in_stock'?'In stock':r.status==='low_stock'?'Low stock':r.status==='out_of_stock'?'Out of stock':r.status;
    return `<div class="community-report">
      <div class="stock-report-head">
        <div class="thumb square"><b>${displayStatus==='In stock'?'✓':displayStatus==='Low stock'?'!':'×'}</b></div>
        <div class="grow"><strong>${esc(r.product)}</strong><span>${esc(r.store)} • ${esc(displayStatus)} • ${humanAge(r.updated_at||r.created_at)}</span></div>
        <div class="right"><strong>${money(Number(r.price))}</strong><span class="confidence-badge ${cs>=85?'high':cs>=50?'mid':'low'}">${cs}%</span></div>
      </div>
      <div class="report-proof"><span>✓ ${c.still||0} still-there</span><span>× ${c.gone||0} sold-out</span>${r.quantity?`<span>Qty ${r.quantity}</span>`:''}</div>
      <div class="report-actions">
        <button class="btn green" onclick="confirmCommunityReport('${r.id}','still')">✓ Still there</button>
        <button class="btn red" onclick="confirmCommunityReport('${r.id}','gone')">× Sold out</button>
        <button class="btn" onclick='buyCommunityReport(${JSON.stringify(r).replace(/'/g,"&#39;")})'>$ Bought it</button><button class="btn" onclick='openCommunityProduct(${JSON.stringify(r).replace(/'/g,"&#39;")})'>◈ Product page</button>
      </div>
    </div>`;
  }).join('');
}
async function confirmCommunityReport(id,kind){
  if(!signedIn()){
    toast('Sign in to confirm community reports');
    openTool('account');
    return;
  }
  try{
    await twogenCloudConfirmReport(id,kind);
    await refreshCommunityReports(false);
    toast(kind==='still'?'Thanks — sighting confirmed':'Thanks — marked sold out');
  }catch(e){toast(e.message||'Confirmation failed')}
}
function buyCommunityReport(r){
  logPurchaseAndSealed(r.product||'TCG product',r.store||'Retailer',Number(r.price)||0);
}
function renderAccountTool(){
  const c=window.TWOGEN_CLOUD||{};
  if(!c.configured){
    return `<div class="panel">
      <div class="eyebrow">2GEN CLOUD</div><h2>Connect your collector account</h2>
      <p>Accounts are ready, but this GitHub Pages copy has not been connected to a cloud project yet.</p>
      <div class="notice warn" style="margin-top:10px"><span>!</span><span>Open <b>START-HERE-CLOUD.txt</b> from the ZIP. It walks you through a free Supabase setup from your phone. You only do this once.</span></div>
      <div class="feature-stack">
        <div><b>☁ Cross-device backup</b><span>Save and restore the whole vault.</span></div>
        <div><b>◎ Community stock reports</b><span>Publish and confirm real collector sightings.</span></div>
        <div><b>♢ Collector profile</b><span>Your 2GEN identity follows you between devices.</span></div>
      </div>
    </div>`;
  }
  if(!c.user){
    return `<div class="panel">
      <div class="eyebrow">2GEN ACCOUNT</div><h2>Sign in or create an account</h2><p>Your local vault keeps working in Guest mode. Signing in enables community reports and cloud backup.</p>
      <div class="form-grid" style="margin-top:12px">
        <label class="field"><span>Display name</span><input id="accountName" placeholder="Collector name"></label>
        <label class="field"><span>Email</span><input id="accountEmail" type="email" autocomplete="email" placeholder="you@example.com"></label>
        <label class="field full"><span>Password</span><input id="accountPassword" type="password" autocomplete="current-password" minlength="6" placeholder="At least 6 characters"></label>
      </div>
      <div class="action-row" style="margin-top:10px">
        <button class="btn primary" onclick="cloudSignIn()">Sign in</button>
        <button class="btn" onclick="cloudSignUp()">Create account</button>
        <button class="btn" onclick="cloudMagicLink()">Email me a magic link</button>
      </div></div>`;
  }
  const profile=c.profile||{};
  return `<div class="panel">
    <div class="eyebrow">SIGNED IN</div><h2>${esc(profile.display_name||c.user.email||'Collector')}</h2><p>${esc(c.user.email||'')} • ${accountLabel()}</p>
    <div class="form-grid" style="margin-top:12px">
      <label class="field"><span>Display name</span><input id="profileName" value="${esc(profile.display_name||'')}"></label>
      <label class="field"><span>Home ZIP</span><input id="profileZip" value="${esc(profile.home_zip||state.settings.zip||'')}" inputmode="numeric"></label>
    </div>
    <div class="action-row" style="margin-top:10px">
      <button class="btn primary" onclick="saveCloudProfile()">Save profile</button>
      <button class="btn" onclick="syncVaultToCloud()">☁ Back up vault</button>
      <button class="btn" onclick="restoreVaultFromCloud()">↓ Restore vault</button>
      <button class="btn red" onclick="cloudSignOut()">Sign out</button>
    </div>
    <div class="notice good" style="margin-top:10px"><span>✓</span><span>Your account is connected. Community reports and private vault backup are available.</span></div>
  </div>`;
}
async function cloudSignUp(){
  const email=$('accountEmail')?.value.trim(), password=$('accountPassword')?.value||'', name=$('accountName')?.value.trim()||'Collector';
  if(!email||password.length<6){toast('Enter an email and password of at least 6 characters');return;}
  try{
    await twogenCloudSignUp(email,password,name);
    toast('Account created. Check your email if confirmation is enabled.');
    renderTools();
  }catch(e){toast(e.message||'Could not create account')}
}
async function cloudSignIn(){
  const email=$('accountEmail')?.value.trim(), password=$('accountPassword')?.value||'';
  if(!email||!password){toast('Enter email and password');return;}
  try{await twogenCloudSignIn(email,password);toast('Signed in');renderTools();refreshCommunityReports(false)}catch(e){toast(e.message||'Sign in failed')}
}
async function cloudMagicLink(){
  const email=$('accountEmail')?.value.trim();if(!email){toast('Enter your email first');return;}
  try{await twogenCloudMagicLink(email);toast('Magic link sent — check your email')}catch(e){toast(e.message||'Magic link failed')}
}
async function cloudSignOut(){
  try{await twogenCloudSignOut();toast('Signed out');renderTools()}catch(e){toast(e.message||'Sign out failed')}
}
async function saveCloudProfile(){
  try{
    const name=$('profileName')?.value.trim()||'Collector', zip=$('profileZip')?.value.trim()||'';
    await twogenCloudSaveProfile(name,zip);
    if(zip){state.settings.zip=zip;state.settings.locationLabel=zip;saveState()}
    toast('Profile saved');renderTools();
  }catch(e){toast(e.message||'Profile update failed')}
}
async function syncVaultToCloud(){
  if(!signedIn()){toast('Sign in first');return;}
  try{
    state.settings.lastBackupAt=new Date().toISOString();
    saveState();
    await twogenCloudSaveBackup(state);
    toast('Vault backed up to your account')
  }catch(e){toast(e.message||'Cloud backup failed')}
}
async function restoreVaultFromCloud(){
  if(!signedIn()){toast('Sign in first');return;}
  if(!confirm('Replace this device’s current local data with your cloud backup?'))return;
  try{
    const backup=await twogenCloudLoadBackup();
    if(!backup?.payload){toast('No cloud backup found');return;}
    state={...structuredClone(seed),...backup.payload,settings:{...seed.settings,...(backup.payload.settings||{})}};
    saveState();render(currentTab);toast('Cloud backup restored');
  }catch(e){toast(e.message||'Restore failed')}
}

function renderDiscover(){
  const liveGames=Object.keys(LIVE_CARD_PROVIDERS);
  const provider=providerForGame(discoverGame);
  $('discover').innerHTML = `
    <div class="page-title"><div><h1>Universal Card Search</h1><p>Live multi-TCG discovery, market references, VaultIQ scoring and one-tap collection tracking.</p></div></div>
    ${activeCardDetail?`<div class="panel card-detail-panel">${renderCardDetail(activeCardDetail)}</div>`:''}
    <div class="segmented">
      <button class="${discoverMode==='live'?'active':''}" onclick="setDiscoverMode('live')">Live Network</button>
      <button class="${discoverMode==='demo'?'active':''}" onclick="setDiscoverMode('demo')">Demo / Manual</button>
      <button onclick="openTool('sets')">Set Explorer</button>
    </div>

    ${discoverMode==='live'?`<div class="provider-tabs">${liveGames.map(g=>`<button class="${discoverGame===g?'active':''}" onclick='setDiscoverGame(${JSON.stringify(g)})'><b>${esc(g)}</b><span>${esc(LIVE_CARD_PROVIDERS[g].label)}</span></button>`).join('')}</div>`:''}

    <form class="searchbar" onsubmit="doCardSearch(event)"><span>⌕</span><input id="cardSearchQ" placeholder="${discoverMode==='live'?`Search ${esc(discoverGame)} card name / number...`:'Search game, card, set...'}"><button class="btn primary">Search</button></form>
    <div class="notice" style="margin-top:9px"><span>ℹ</span><span>${discoverMode==='live'
      ? `${esc(discoverGame)} is connected through ${esc(provider?.label||'a live provider')}. Prices are reference fields supplied by that provider when available and are not guaranteed sale values.`
      : 'Demo/manual mode remains available for games and products that do not yet have a connected live provider.'}</span></div>
    <div class="result-grid">${discoverResults.map(cardResultMarkup).join('')}</div>`;
}
function setDiscoverMode(m){discoverMode=m;discoverResults=m==='demo'?demoCards:[];renderDiscover()}
function setDiscoverGame(g){discoverGame=g;discoverResults=[];activeCardDetail=null;renderDiscover()}
async function doCardSearch(e){
  e.preventDefault();
  const q=$('cardSearchQ')?.value.trim()||'';
  if(!q){discoverResults=discoverMode==='demo'?demoCards:[];renderDiscover();return;}
  if(discoverMode==='demo'){
    const z=q.toLowerCase();
    discoverResults=demoCards.filter(c=>`${c.name} ${c.set} ${c.game} ${c.number} ${c.rarity}`.toLowerCase().includes(z));
    renderDiscover();return;
  }
  toast(`Searching live ${discoverGame} data…`);
  try{
    discoverResults=await universalSearchCards(discoverGame,q,24);
    discoverResults.forEach(c=>captureCardPrice(c,'Universal Card Search'));
    saveState();renderDiscover();toast(`${discoverResults.length} ${discoverGame} cards found`);
  }catch(e){discoverResults=[];renderDiscover();toast(e.message||'Card search failed')}
}
function cardResultMarkup(c){
  const owned=totalOwnedForCard(c.id);
  return `<article class="card-result">${cardArt(c)}<div><div class="eyebrow">${esc(c.game)} • ${esc(c.set)}</div><h3>${esc(c.name)}</h3><div class="tiny">${esc(c.number||'—')} ${c.rarity?'• '+esc(c.rarity):''}${owned?` • <span class="good">${owned} owned</span>`:''}</div><div class="price-row"><strong>${money(Number(c.market))}</strong>${typeof c.low==='number'?`<span>Low ${money(c.low)}</span>`:''}</div><div class="action-row"><button class="btn primary" onclick='openCardDetail(${JSON.stringify(c).replace(/'/g,"&#39;")})'>Details</button><button class="btn iq-btn" onclick='openVaultIQCard(${JSON.stringify(c).replace(/'/g,"&#39;")})'>IQ</button><button class="btn" onclick='addCard(${JSON.stringify(c).replace(/'/g,"&#39;")})'>＋ Raw</button><button class="btn" onclick='addGradedCard(${JSON.stringify(c).replace(/'/g,"&#39;")})'>◇ Graded</button><button class="btn" onclick='addWishlist(${JSON.stringify(c).replace(/'/g,"&#39;")})'>♡</button>${c.url?`<a class="btn" href="${esc(c.url)}" target="_blank" rel="noreferrer">Market ↗</a>`:''}</div></div></article>`;
}
function addCard(card){
  ensureCollectionSchema();
  const location=binderNames()[0]||'Main Binder';
  const ex=state.collection.find(x=>x.card.id===card.id&&x.condition==='Near Mint'&&(x.format||'Raw')==='Raw'&&x.location===location);
  if(ex) ex.qty+=1;
  else state.collection.unshift({uid:uid(),card,qty:1,condition:'Near Mint',cost:Number(card.market)||0,location,format:'Raw',grader:'',grade:'',cert:'',language:'English',variant:'Standard',ownerProfileId:activeCollectorProfileId});
  saveState(); toast('Raw copy added to vault'); renderDiscover();
}
function addGradedCard(card){
  ensureCollectionSchema();
  const grader=(prompt('Grading company','PSA')||'PSA').trim();
  const grade=(prompt('Grade','10')||'').trim();
  const cert=(prompt('Certification number (optional)','')||'').trim();
  const paid=Math.max(0,Number(prompt('Cost paid',card.market?String(card.market):'0'))||0);
  const location=binderNames()[0]||'Main Binder';
  state.collection.unshift({uid:uid(),card,qty:1,condition:'Graded',cost:paid,location,format:'Graded',grader,grade,cert,language:'English',variant:'Standard',ownerProfileId:activeCollectorProfileId});
  saveState(); toast('Graded copy added'); renderDiscover();
}
function openCardDetail(card){
  activeCardDetail=card;
  renderDiscover();
  window.scrollTo({top:0,behavior:'smooth'});
}
function closeCardDetail(){ activeCardDetail=null; renderDiscover(); }
function renderCardDetail(card){
  ensureCollectionSchema();
  const copies=collectionCopiesForCard(card.id);
  const rawQty=copies.filter(x=>(x.format||'Raw')==='Raw').reduce((n,x)=>n+(Number(x.qty)||0),0);
  const gradedQty=copies.filter(x=>x.format==='Graded').reduce((n,x)=>n+(Number(x.qty)||0),0);
  const total=rawQty+gradedQty;
  const avg=averageCostForCard(card.id);
  const market=Number(card.market)||0;
  const gain=total ? collectionValueForCard(card.id)-avg*total : 0;
  const priceDelta=marketDeltaFor(card);
  return `<div class="card-detail">
    <div class="card-detail-hero">
      ${cardArt(card)}
      <div class="grow"><div class="eyebrow">${esc(card.game)} • ${esc(card.set)}</div><h2>${esc(card.name)}</h2><p>${esc(card.number||'—')} ${card.rarity?'• '+esc(card.rarity):''}${card.artist?' • Artist '+esc(card.artist):''}</p></div>
      <button class="btn" onclick="closeCardDetail()">Close</button>
    </div>
    <div class="stat-grid compact-stats">
      <div class="stat-card"><span>Market</span><strong>${money(market)}</strong><small>${typeof card.low==='number'?'Low '+money(card.low):'Market reference'}</small></div>
      <div class="stat-card"><span>Owned</span><strong>${total}</strong><small>${rawQty} raw • ${gradedQty} graded</small></div>
      <div class="stat-card"><span>Avg cost</span><strong>${total?money(avg):'—'}</strong><small>Your copies</small></div>
      <div class="stat-card"><span>Unrealized</span><strong class="${gain>=0?'good':'bad'}">${total?money(gain):'—'}</strong><small>Using card market</small></div>
      <div class="stat-card"><span>Snapshot move</span><strong class="${Number(priceDelta.pct)>=0?'good':'bad'}">${Number.isFinite(priceDelta.pct)?(priceDelta.pct>=0?'+':'')+priceDelta.pct.toFixed(1)+'%':'—'}</strong><small>Vs prior saved price</small></div>
    </div>
    <div class="action-row">
      <button class="btn primary" onclick='addCard(${JSON.stringify(card).replace(/'/g,"&#39;")})'>＋ Add raw</button>
      <button class="btn" onclick='addGradedCard(${JSON.stringify(card).replace(/'/g,"&#39;")})'>◇ Add graded</button>
      <button class="btn" onclick='addWishlist(${JSON.stringify(card).replace(/'/g,"&#39;")})'>♡ Wishlist</button>
      <button class="btn" onclick='addPriceAlert(${JSON.stringify(card).replace(/'/g,"&#39;")})'>◎ Alert</button>
      ${card.setId?`<button class="btn" onclick='openSetByCard(${JSON.stringify(card).replace(/'/g,"&#39;")})'>▦ Open set</button>`:''}
      ${card.url?`<a class="btn" href="${esc(card.url)}" target="_blank" rel="noreferrer">Market ↗</a>`:''}
    </div>
    <div class="subpanel" style="margin-top:10px">
      <div class="section-head"><div><h2>Your copies</h2><p>Raw and graded copies are tracked separately.</p></div></div>
      ${copies.length?copies.map(i=>`<div class="compact-row"><div class="grow"><strong>${esc(i.format||'Raw')}${i.format==='Graded'?` • ${esc(i.grader)} ${esc(i.grade)}`:''}</strong><span>${esc(i.location||'Main Binder')} • Qty ${i.qty} • cost ${money(Number(i.cost))}${i.cert?' • cert '+esc(i.cert):''}</span></div><div class="right"><strong>${money((Number(card.market)||0)*(Number(i.qty)||0))}</strong></div></div>`).join(''):`<div class="empty">No copies owned yet.</div>`}
    </div>
  </div>`;
}
function addWishlist(card){
  if(!state.wishlist.some(x=>x.card.id===card.id)) state.wishlist.unshift({uid:uid(),card,target:null,createdAt:new Date().toISOString()});
  saveState(); toast('Added to wishlist');
}
function addPriceAlert(card){
  const raw=prompt(`Alert when ${card.name} falls below:`,card.market?(card.market*.9).toFixed(2):'');
  if(!raw) return;
  const n=Number(raw); if(!Number.isFinite(n)) return;
  state.priceAlerts.unshift({uid:uid(),card,target:n,enabled:true,createdAt:new Date().toISOString()}); saveState(); toast('Price alert saved');
}

function openVault(tab){ vaultTab=tab; switchTab('vault'); }
function renderVault(){
  const t=totals();
  $('vault').innerHTML = `
    <div class="page-title"><div><h1>My Vault</h1><p>Cards, sealed products and set completion in one collection.</p></div><button class="btn" onclick="exportCollectionCSV()">CSV</button></div>
    <div class="stat-grid">
      <div class="stat-card"><span>Card value</span><strong>${money(t.cardMarket)}</strong><small>${t.cards} cards</small></div>
      <div class="stat-card"><span>Sealed value</span><strong>${money(t.sealedValue)}</strong><small>${state.sealed.length} products</small></div>
      <div class="stat-card"><span>Total cost</span><strong>${money(t.cost)}</strong><small>Cards + sealed</small></div>
      <div class="stat-card"><span>Gain / loss</span><strong class="${t.gain>=0?'good':'bad'}">${money(t.gain)}</strong><small>${t.pct.toFixed(1)}%</small></div>
    </div>
    <div class="segmented wrap"><button class="${vaultTab==='cards'?'active':''}" onclick="setVaultTab('cards')">Cards</button><button class="${vaultTab==='sealed'?'active':''}" onclick="setVaultTab('sealed')">Sealed</button><button class="${vaultTab==='binders'?'active':''}" onclick="setVaultTab('binders')">Binders</button><button class="${vaultTab==='duplicates'?'active':''}" onclick="setVaultTab('duplicates')">Duplicates</button><button class="${vaultTab==='sets'?'active':''}" onclick="setVaultTab('sets')">Set goals</button></div>
    <div id="vaultBody">${vaultTab==='cards'?renderCardVault():vaultTab==='sealed'?renderSealedVault():vaultTab==='binders'?renderBinders():vaultTab==='duplicates'?renderDuplicates():renderSetGoals()}</div>`;
}
function setVaultTab(t){ vaultTab=t; renderVault(); }
function renderCardVault(){
  ensureCollectionSchema();
  if(!state.collection.length) return `<div class="panel"><div class="empty">Your card vault is empty. Add cards from Search.</div></div>`;
  const raw=state.collection.filter(i=>(i.format||'Raw')==='Raw').reduce((n,i)=>n+(Number(i.qty)||0),0);
  const graded=state.collection.filter(i=>i.format==='Graded').reduce((n,i)=>n+(Number(i.qty)||0),0);
  return `<div class="panel">
    <div class="section-head"><div><h2>Card collection</h2><p>${raw} raw • ${graded} graded • ${duplicateSummary().length} duplicate card types</p></div><button class="btn" onclick="openTool('sets')">Set Explorer</button></div>
    ${state.collection.map(i=>{
      const val=(Number(i.card.market)||0)*(Number(i.qty)||0), gain=((Number(i.card.market)||0)-Number(i.cost||0))*(Number(i.qty)||0);
      return `<div class="vault-item">${cardArt(i.card)}<div><div class="eyebrow">${esc(i.card.game)} • ${esc(i.card.set)}</div><h3><button class="card-name-link" onclick='openCollectionCardDetail("${i.uid}")'>${esc(i.card.name)}</button></h3>
      <div class="collection-badges"><span>${esc(i.format||'Raw')}</span>${i.format==='Graded'?`<span>${esc(i.grader||'Graded')} ${esc(i.grade||'')}</span>`:''}<span>${esc(i.location||'Main Binder')}</span></div>
      <div class="mini-grid four">
        <label class="field"><span>Qty</span><input type="number" min="1" value="${i.qty}" onchange="updateCollection('${i.uid}','qty',this.value)"></label>
        <label class="field"><span>Cost ea.</span><input type="number" min="0" step=".01" value="${i.cost}" onchange="updateCollection('${i.uid}','cost',this.value)"></label>
        <label class="field"><span>Condition</span><select onchange="updateCollection('${i.uid}','condition',this.value)">${['Near Mint','Lightly Played','Moderately Played','Heavily Played','Graded'].map(c=>`<option ${c===i.condition?'selected':''}>${c}</option>`).join('')}</select></label>
        <label class="field"><span>Binder</span><select onchange="updateCollection('${i.uid}','location',this.value)">${binderNames().map(b=>`<option ${b===i.location?'selected':''}>${esc(b)}</option>`).join('')}</select></label>
      </div></div>
      <div class="right"><strong>${money(val)}</strong><small class="${gain>=0?'good':'bad'}">${gain>=0?'+':''}${money(gain)}</small><button class="remove" onclick="removeCollection('${i.uid}')">Remove</button></div></div>`;
    }).join('')}
  </div>`;
}
function openCollectionCardDetail(id){
  const i=state.collection.find(x=>x.uid===id);if(!i)return;
  activeCardDetail=i.card;switchTab('discover');
}
function updateCollection(id,key,val){
  const i=state.collection.find(x=>x.uid===id); if(!i) return;
  const beforeQty=Number(i.qty)||0;
  if(['condition','location','format','grader','grade','cert','language','variant'].includes(key)) i[key]=val;
  else i[key]=Math.max(key==='qty'?1:0,Number(val)||0);
  if(key==='qty'&&Number(i.qty)!==beforeQty){
    recordInventoryLedger('Card',id,'QUANTITY_CHANGE',Number(i.qty)-beforeQty,`${i.card?.name||'Card'}: ${beforeQty} → ${i.qty}`);
  }
  saveState(); renderVault();
}
function removeCollection(id){ state.collection=state.collection.filter(x=>x.uid!==id); saveState(); renderVault(); }
function renderBinders(){
  ensureCollectionSchema();
  return `<div class="panel">
    <div class="section-head"><div><h2>Binder manager</h2><p>Organize cards by physical binder, box or storage location.</p></div><button class="btn primary" onclick="addBinder()">＋ Binder</button></div>
    ${state.binders.map(b=>{
      const items=state.collection.filter(i=>i.location===b.name);
      const qty=items.reduce((n,i)=>n+(Number(i.qty)||0),0);
      const value=items.reduce((n,i)=>n+(Number(i.card.market)||0)*(Number(i.qty)||0),0);
      return `<div class="binder-card"><div class="binder-icon">▣</div><div class="grow"><strong>${esc(b.name)}</strong><span>${esc(b.game||'All')} • ${qty} cards • ${money(value)}${b.notes?' • '+esc(b.notes):''}</span></div><div class="right"><button class="btn" onclick="renameBinder('${b.uid}')">Edit</button>${state.binders.length>1?`<button class="remove" onclick="deleteBinder('${b.uid}')">Delete</button>`:''}</div></div>`;
    }).join('')}
  </div>`;
}
function addBinder(){
  ensureCollectionSchema();
  const name=(prompt('Binder / storage name','Binder 2')||'').trim();if(!name)return;
  if(state.binders.some(b=>b.name.toLowerCase()===name.toLowerCase())){toast('That binder already exists');return;}
  const game=(prompt('Game / category','All')||'All').trim();
  const notes=(prompt('Notes (optional)','')||'').trim();
  state.binders.push({uid:uid(),name,game,notes});saveState();renderVault();toast('Binder added');
}
function renameBinder(id){
  const b=state.binders.find(x=>x.uid===id);if(!b)return;
  const old=b.name,newName=(prompt('Binder name',b.name)||'').trim();if(!newName)return;
  b.name=newName;
  b.game=(prompt('Game / category',b.game||'All')||b.game||'All').trim();
  b.notes=(prompt('Notes',b.notes||'')||'').trim();
  state.collection.forEach(i=>{if(i.location===old)i.location=newName});
  saveState();renderVault();
}
function deleteBinder(id){
  const b=state.binders.find(x=>x.uid===id);if(!b)return;
  const fallback=state.binders.find(x=>x.uid!==id);if(!fallback)return;
  if(!confirm(`Delete ${b.name}? Its cards will move to ${fallback.name}.`))return;
  state.collection.forEach(i=>{if(i.location===b.name)i.location=fallback.name});
  state.binders=state.binders.filter(x=>x.uid!==id);saveState();renderVault();
}
function renderDuplicates(){
  const d=duplicateSummary();
  return `<div class="panel"><div class="section-head"><div><h2>Duplicate Center</h2><p>Quickly see extra copies that may be useful for trades, sales or another binder.</p></div></div>
    ${d.length?d.map(x=>`<div class="duplicate-row">${cardArt(x.card)}<div class="grow"><strong>${esc(x.card.name)}</strong><span>${esc(x.card.set)} • ${esc(x.card.number||'')} • ${x.qty} total copies</span></div><div class="right"><strong>${money((Number(x.card.market)||0)*x.qty)}</strong><button class="btn" onclick='openCardDetail(${JSON.stringify(x.card).replace(/'/g,"&#39;")});switchTab("discover")'>Details</button></div></div>`).join(''):`<div class="empty">No duplicate cards yet.</div>`}
  </div>`;
}
function renderSealedVault(){
  return `
    <div class="panel">
      <div class="section-head"><div><h2>Add sealed product</h2><p>Track what you own, what you paid and current estimated value.</p></div></div>
      <div class="form-grid">
        <label class="field"><span>Product</span><input id="sealedName" placeholder="Elite Trainer Box"></label>
        <label class="field"><span>TCG</span><select id="sealedGame">${games.map(g=>`<option>${g}</option>`).join('')}</select></label>
        <label class="field"><span>Quantity</span><input id="sealedQty" type="number" min="1" value="1"></label>
        <label class="field"><span>Cost each</span><input id="sealedCost" type="number" min="0" step=".01" placeholder="49.99"></label>
        <label class="field"><span>Current value each</span><input id="sealedCurrent" type="number" min="0" step=".01" placeholder="54.99"></label>
        <label class="field"><span>Storage location</span><input id="sealedLocation" placeholder="Shelf / bin"></label>
      </div><button class="btn primary" style="margin-top:10px" onclick="addSealed()">＋ Add sealed product</button>
    </div>
    <div class="panel">${state.sealed.length?state.sealed.map(i=>`
      <div class="compact-row"><div class="thumb square"><b>◈</b></div><div class="grow"><strong>${esc(i.name)}</strong><span>${esc(i.game)} • Qty ${i.qty} • ${esc(i.location||'No location')}</span></div><div class="right"><strong>${money((Number(i.current)||0)*i.qty)}</strong><div><button class="link-btn" onclick="openSealedProductPage('${i.uid}')">Product page</button><button class="link-btn" onclick="openOneSealed('${i.uid}')">Open one</button><button class="remove" onclick="removeSealed('${i.uid}')">Delete</button></div></div></div>
    `).join(''):`<div class="empty">No sealed products tracked yet.</div>`}</div>`;
}
function addSealed(){
  const name=$('sealedName')?.value.trim(); if(!name){toast('Enter a product name');return;}
  const game=$('sealedGame')?.value||'Pokemon';
  const cat=addCatalogProduct({game,name,set:'',type:'Sealed',msrp:Number($('sealedCurrent')?.value)||0,target:Number($('sealedCost')?.value)||0});
  const lot={uid:uid(),name,game,qty:Math.max(1,Number($('sealedQty')?.value)||1),cost:Number($('sealedCost')?.value)||0,current:Number($('sealedCurrent')?.value)||0,location:$('sealedLocation')?.value.trim()||'',productId:cat.uid,ownerProfileId:activeCollectorProfileId,addedAt:new Date().toISOString()};
  state.sealed.unshift(lot);
  recordInventoryLedger('Sealed',lot.uid,'PURCHASE_OR_ADD',lot.qty,`${name} added to inventory`,{costEach:lot.cost,location:lot.location});
  saveState(); renderVault(); toast('Sealed product added');
}
function openOneSealed(id){
  const i=state.sealed.find(x=>x.uid===id); if(!i) return;
  if(!confirm(`Mark one ${i.name} as opened?`)) return;
  const cost=Number(i.cost)||0;
  i.qty-=1;
  state.openingLog.unshift({uid:uid(),product:i.name,game:i.game,qty:1,date:todayInput(),notes:'Opened from sealed tracker'});
  state.purchases.unshift({uid:uid(),merchant:'Vault',item:`Opened: ${i.name}`,category:'Opened sealed',amount:0,qty:1,date:todayInput(),notes:'Marked opened from sealed tracker'});
  if(i.qty<=0) state.sealed=state.sealed.filter(x=>x.uid!==id);
  if(confirm('Start a Rip Session for this opening?')){
    const packs=Math.max(0,Number(prompt('How many packs are you opening?','1'))||0);
    const session={uid:uid(),name:`${i.name} Opening`,game:i.game,product:i.name,packs,cost,hitThreshold:5,date:todayInput(),notes:'Created from Sealed Vault',pulls:[],createdAt:new Date().toISOString()};
    state.ripSessions.unshift(session);activeRipSessionId=session.uid;
  }
  saveState();
  if(activeRipSessionId){toolsTab='rips';switchTab('tools')}else renderVault();
  toast('Opening logged');
}
function openSealedProductPage(id){
  const i=state.sealed.find(x=>x.uid===id);if(!i)return;
  let p=i.productId?catalogProductById(i.productId):null;
  if(!p){
    p=addCatalogProduct({game:i.game,name:i.name,set:'',type:'Sealed',msrp:Number(i.current)||0,target:Number(i.cost)||0});
    i.productId=p.uid;saveState();
  }
  activeProductId=p.uid;toolsTab='products';switchTab('tools');
}
function removeSealed(id){ state.sealed=state.sealed.filter(x=>x.uid!==id); saveState(); renderVault(); }
function renderSetGoals(){
  return `<div class="panel">
    <div class="section-head"><div><h2>Set completion goals</h2><p>Track master-set progress even when a provider does not support it yet.</p></div></div>
    <div class="form-grid"><label class="field"><span>TCG</span><select id="goalGame">${games.map(g=>`<option>${g}</option>`).join('')}</select></label><label class="field"><span>Set name</span><input id="goalSet" placeholder="Set name"></label><label class="field"><span>Owned</span><input id="goalOwned" type="number" min="0" value="0"></label><label class="field"><span>Total cards</span><input id="goalTotal" type="number" min="1" value="100"></label></div>
    <button class="btn primary" style="margin-top:10px" onclick="addSetGoal()">＋ Add goal</button>
  </div>
  <div class="panel">${state.setGoals.length?state.setGoals.map(g=>{const pct=Math.min(100,g.total?g.owned/g.total*100:0);return `<div style="padding:9px 0;border-bottom:1px solid var(--line-soft)"><div class="kpi-line"><div><strong>${esc(g.setName)}</strong><span style="display:block">${esc(g.game)}</span></div><strong>${g.owned}/${g.total} • ${pct.toFixed(1)}%</strong></div><div class="progress"><div style="width:${pct}%"></div></div><div class="action-row" style="margin-top:7px"><button class="btn" onclick="editSetGoal('${g.uid}')">Update</button><button class="remove" onclick="removeSetGoal('${g.uid}')">Delete</button></div></div>`}).join(''):`<div class="empty">No set goals yet.</div>`}</div>`;
}
function addSetGoal(){
  const setName=$('goalSet')?.value.trim(); if(!setName){toast('Enter a set name');return;}
  state.setGoals.unshift({uid:uid(),game:$('goalGame')?.value||'Pokemon',setName,owned:Math.max(0,Number($('goalOwned')?.value)||0),total:Math.max(1,Number($('goalTotal')?.value)||1)});
  saveState(); renderVault();
}
function editSetGoal(id){
  const g=state.setGoals.find(x=>x.uid===id); if(!g)return;
  const v=prompt(`How many ${g.setName} cards do you own?`,String(g.owned)); if(v===null)return;
  g.owned=Math.max(0,Number(v)||0); saveState(); renderVault();
}
function removeSetGoal(id){state.setGoals=state.setGoals.filter(x=>x.uid!==id);saveState();renderVault();}


const TOOL_META={
  premium:{icon:'★',title:'VaultSignal Premium',sub:'$4.99/month • premium tools'},
  watchtower:{icon:'◉',title:'Signal Center',sub:'Inventory, price & collector signals'},
  inventory:{icon:'▤',title:'Inventory Command',sub:'Cards + sealed + locations + audits'},
  actions:{icon:'✓',title:'Action Center',sub:'Smart collector priorities'},
  vaultiq:{icon:'IQ',title:'VaultIQ',sub:'Personal collector-fit decisions'},
  market:{icon:'↗',title:'Market Pulse',sub:'Live/reference price tracking'},
  analytics:{icon:'⌁',title:'Dashboard Pro',sub:'Collection analytics'},
  rips:{icon:'✦',title:'Rip Sessions',sub:'Openings & pull analytics'},
  sets:{icon:'▦',title:'Sets',sub:'Master-set explorer'},
  products:{icon:'◈',title:'Product Command',sub:'Retail + sealed inventory'},
  scanner:{icon:'◉',title:'Smart Scanner',sub:'Camera identification + value lookup'},
  wishlist:{icon:'♡',title:'Wishlist',sub:'Cards you want'},
  stockreport:{icon:'◎',title:'Stock Report',sub:'Log store inventory'},
  budget:{icon:'$',title:'Budget',sub:'Spending & purchases'},
  grading:{icon:'◇',title:'Grading',sub:'Submission tracker'},
  showcase:{icon:'★',title:'Showcase Studio',sub:'Collection Passport'},
  family:{icon:'2G',title:'2GEN Hub',sub:'Family + creator tools'},
  sell:{icon:'$',title:'Sell Lab',sub:'Selling workflow + estimates'},
  trades:{icon:'⇄',title:'Trade Lab',sub:'Two-sided trade builder'},
  alerts:{icon:'!',title:'Alerts',sub:'Price targets'},
  account:{icon:'☁',title:'Account',sub:'Cloud sync & profile'},
  settings:{icon:'⚙',title:'Settings',sub:'Backup & integrations'}
};
function toolsHome(){
  toolsTab='menu';
  renderTools();
  window.scrollTo({top:0,behavior:'instant'});
}
function toolDetailHeader(){
  const m=TOOL_META[toolsTab]||{icon:'◇',title:'Collector Tool',sub:''};
  return `<div class="tool-detail-nav">
    <button class="tool-back-btn" onclick="toolsHome()">← Tools</button>
    <div class="tool-detail-title"><span>${m.icon}</span><div><strong>${esc(m.title)}</strong><small>${esc(m.sub)}</small></div></div>
    ${PREMIUM_TOOL_IDS.has(toolsTab)?`<button class="premium-price-chip" onclick="openTool('premium')">$4.99/mo</button>`:`<span></span>`}
  </div>`;
}
function openTool(tab){
  if(PREMIUM_TOOL_IDS.has(tab)&&!hasPremium()){
    toolsTab='premium';switchTab('tools');
    toast(`${TOOL_META[tab]?.title||'This tool'} is included with Premium`);
    return;
  }
  toolsTab=tab;switchTab('tools');
  window.scrollTo({top:0,behavior:'instant'});
}
function renderTools(){
  if(toolsTab!=='menu'){
    $('tools').innerHTML=`${toolDetailHeader()}<div class="tool-detail-page">${renderToolBody()}</div>`;
    return;
  }
  $('tools').innerHTML=`
    <div class="page-title"><div><h1>Collector Tools</h1><p>Choose a tool. Each tool now opens as its own screen.</p></div></div>
    <button class="premium-banner-card" onclick="setToolTab('premium')">
      <div><div class="eyebrow">VAULTSIGNAL PREMIUM</div><strong>$4.99 <small>/ month</small></strong><span>Unlimited scanner + Inventory Radar + Signal Center + Inventory Command Pro + VaultIQ + Market Pulse + analytics.</span></div>
      <b>See Premium →</b>
    </button>
    <div class="tool-menu">
      ${toolButton('watchtower','◉','Signal Center','Inventory, price & collector signals')}
      ${toolButton('inventory','▤','Inventory Command','Cards + sealed + locations + audits')}
      ${toolButton('actions','✓','Action Center','Smart collector priorities')}
      ${toolButton('vaultiq','IQ','VaultIQ','Personal buy decisions')}
      ${toolButton('market','↗','Market Pulse','Live price tracking')}
      ${toolButton('analytics','⌁','Dashboard Pro','Collection analytics')}
      ${toolButton('rips','✦','Rip Sessions','Openings & pull analytics')}
      ${toolButton('sets','▦','Sets','Master-set explorer')}
      ${toolButton('products','◈','Product Command','Retail + sealed inventory')}
      ${toolButton('scanner','◉','Smart Scanner','Camera identification + value')}
      ${toolButton('wishlist','♡','Wishlist','Cards you want')}
      ${toolButton('stockreport','◎','Stock report','Log store inventory')}
      ${toolButton('budget','$','Budget','Spending & purchases')}
      ${toolButton('grading','◇','Grading','Submission tracker')}
      ${toolButton('showcase','★','Showcase Studio','Collection Passport')}
      ${toolButton('family','2G','2GEN Hub','Family + creator tools')}
      ${toolButton('sell','$','Sell Lab','Profit & listing tools')}
      ${toolButton('trades','⇄','Trade Lab','Fair-trade builder')}
      ${toolButton('alerts','!','Alerts','Price targets')}
      ${toolButton('account','☁','Account','Cloud sync & profile')}
      ${toolButton('settings','⚙','Settings','Backup & integrations')}
    </div>`;
}
function toolButton(id,icon,title,sub){
  const paid=PREMIUM_TOOL_IDS.has(id);
  return `<button class="tool-tab" onclick="setToolTab('${id}')"><div class="tool-card-head"><b>${icon} ${title}</b>${paid?`<span class="premium-tool-price">$4.99/mo</span>`:''}</div><span>${sub}</span></button>`;
}
function setToolTab(t){
  if(PREMIUM_TOOL_IDS.has(t)&&!hasPremium()){
    toolsTab='premium';renderTools();
    toast(`${TOOL_META[t]?.title||'This tool'} is included with Premium`);
    return;
  }
  toolsTab=t;renderTools();window.scrollTo({top:0,behavior:'instant'});
}

function renderToolBody(){
  if(toolsTab==='premium') return renderPremiumCenter();
  if(toolsTab==='inventory') return renderInventoryCommandTool();
  if(toolsTab==='vaultiq') return renderVaultIQTool();
  if(toolsTab==='showcase') return renderShowcaseStudio();
  if(toolsTab==='watchtower') return renderWatchtowerTool();
  if(toolsTab==='actions') return renderActionCenterTool();
  if(toolsTab==='family') return renderFamilyCreatorHub();
  if(toolsTab==='sell') return renderSellLabTool();
  if(toolsTab==='market') return renderMarketPulseTool();
  if(toolsTab==='analytics') return renderAnalyticsTool();
  if(toolsTab==='rips') return renderRipSessionsTool();
  if(toolsTab==='sets') return renderSetExplorerTool();
  if(toolsTab==='products') return renderProductsTool();
  if(toolsTab==='scanner') return renderScannerTool();
  if(toolsTab==='wishlist') return renderWishlistTool();
  if(toolsTab==='stockreport') return renderStockReportTool();
  if(toolsTab==='budget') return renderBudgetTool();
  if(toolsTab==='grading') return renderGradingTool();
  if(toolsTab==='trades') return renderTradesTool();
  if(toolsTab==='alerts') return renderAlertsTool();
  if(toolsTab==='account') return renderAccountTool();
  return renderSettingsTool();
}






function ensureVaultIQSchema(){
  if(!Array.isArray(state.acquisitionQueue)) state.acquisitionQueue=[];
  state.vaultIQSettings={reserveCash:25,maxDuplicateCopies:2,...(state.vaultIQSettings||{})};
}
function vaultIQBudgetLeft(){
  return Math.max(0,(Number(state.settings.monthlyBudget)||0)-monthSpend()-(Number(state.vaultIQSettings.reserveCash)||0));
}
function cardWishlistMatch(card){
  return (state.wishlist||[]).find(w=>w.card?.id===card.id);
}
function cardPriceAlertMatch(card){
  return (state.priceAlerts||[]).find(a=>a.card?.id===card.id);
}
function uniqueOwnedInSet(card){
  if(!card?.setId && !card?.set)return {owned:0,total:Number(card?.setPrintedTotal||card?.setTotal||0),pct:0};
  const same=(state.collection||[]).filter(i=>(card.setId&&i.card?.setId===card.setId)||(!card.setId&&i.card?.set===card.set));
  const owned=new Set(same.map(i=>i.card?.id||i.card?.number||i.card?.name)).size;
  const total=Number(card.setPrintedTotal||card.setTotal||0);
  return {owned,total,pct:total?owned/total*100:0};
}
function vaultIQCardScore(card,offerPrice=null){
  ensureVaultIQSchema();
  const market=Number(card?.market)||0;
  const price=offerPrice===null||offerPrice===undefined?market:Math.max(0,Number(offerPrice)||0);
  const owned=totalOwnedForCard(card?.id);
  const wish=cardWishlistMatch(card);
  const alert=cardPriceAlertMatch(card);
  const set=uniqueOwnedInSet(card);
  const budget=vaultIQBudgetLeft();
  let score=38;
  const reasons=[];

  if(wish){score+=22;reasons.push('On your wishlist +22')}
  if(owned===0){score+=12;reasons.push('New to your Vault +12')}
  else if(owned===1){score+=3;reasons.push('Only one copy owned +3')}
  else if(owned>=Number(state.vaultIQSettings.maxDuplicateCopies||2)){score-=14;reasons.push(`${owned} copies already owned −14`)}

  if(alert){
    const target=Number(alert.target)||0;
    if(target>0 && price>0 && price<=target){score+=18;reasons.push(`At/below your price target +18`)}
    else if(target>0 && price>target){score-=5;reasons.push(`Above your price target −5`)}
  }

  if(set.total && set.pct>=90 && set.pct<100){score+=13;reasons.push(`Helps a ${set.pct.toFixed(0)}% complete set +13`)}
  else if(set.total && set.pct>=70 && set.pct<100){score+=7;reasons.push(`Helps set progress +7`)}

  if(market>0 && price>0){
    const ratio=price/market;
    if(ratio<=.85){score+=18;reasons.push(`Offer is ≥15% below market reference +18`)}
    else if(ratio<=.95){score+=12;reasons.push(`Offer is below market reference +12`)}
    else if(ratio<=1.05){score+=5;reasons.push(`Offer is near market reference +5`)}
    else if(ratio>=1.20){score-=15;reasons.push(`Offer is ≥20% above market reference −15`)}
    else if(ratio>1.05){score-=6;reasons.push(`Offer is above market reference −6`)}
  }

  if(price>0 && budget>0){
    if(price<=budget*.35){score+=10;reasons.push('Fits comfortably in remaining hobby budget +10')}
    else if(price<=budget){score+=4;reasons.push('Fits remaining hobby budget +4')}
    else{score-=18;reasons.push('Exceeds remaining hobby budget −18')}
  }else if(price>0 && budget===0){
    score-=12;reasons.push('No spendable hobby budget left −12')
  }

  score=Math.max(0,Math.min(100,Math.round(score)));
  const label=score>=82?'Excellent collector fit':score>=68?'Strong collector fit':score>=52?'Consider':score>=38?'Watch':'Pass for now';
  return {score,label,reasons,market,price,owned,wish:!!wish,alert,set,budget};
}
function vaultIQProductScore(watch){
  ensureVaultIQSchema();
  const catalog=findCatalogMatches(watch.product||'')[0]||null;
  const stats=catalog?productStats(catalog):null;
  const radar=watchRadar(watch);
  const best=stats?.bestObserved;
  const target=Number(watch.maxPrice)||Number(catalog?.target)||0;
  const msrp=Number(catalog?.msrp)||0;
  const price=best!==null&&best!==undefined?Number(best):(target||msrp||0);
  const budget=vaultIQBudgetLeft();
  let score=35;
  const reasons=[];
  const pri=watch.priority||'High';
  if(pri==='High'){score+=18;reasons.push('High-priority watch +18')}
  else if(pri==='Medium'){score+=10;reasons.push('Medium-priority watch +10')}
  else{score+=4;reasons.push('Low-priority watch +4')}

  if(price>0&&target>0){
    if(price<=target){score+=20;reasons.push('Observed/reference price meets your max +20')}
    else{score-=8;reasons.push('Price is above your max −8')}
  }else if(price>0&&msrp>0&&price<=msrp){
    score+=10;reasons.push('At/below MSRP reference +10')
  }
  score+=Math.min(15,Math.round(radar.score*.15));
  reasons.push(`Restock Radar ${radar.score} contributes +${Math.min(15,Math.round(radar.score*.15))}`);

  const owned=stats?.ownedQty||0;
  if(owned===0){score+=8;reasons.push('No sealed copies owned +8')}
  else if(owned>=3){score-=8;reasons.push(`${owned} sealed copies already owned −8`)}

  if(price>0&&budget>0){
    if(price<=budget*.4){score+=9;reasons.push('Comfortable budget fit +9')}
    else if(price<=budget){score+=3;reasons.push('Fits budget +3')}
    else{score-=15;reasons.push('Exceeds remaining budget −15')}
  }
  score=Math.max(0,Math.min(100,Math.round(score)));
  const label=score>=82?'Excellent hunt fit':score>=68?'Strong hunt fit':score>=52?'Consider':score>=38?'Watch':'Pass for now';
  return {score,label,reasons,price,target,msrp,budget,radar,owned,catalog,stats};
}
function vaultIQCandidates(){
  const out=[];
  for(const w of state.wishlist||[]){
    const iq=vaultIQCardScore(w.card);
    out.push({uid:`wish-${w.uid}`,type:'card',name:w.card?.name||'Card',subtitle:`${w.card?.game||''} • ${w.card?.set||''}`,price:iq.price,iq,card:w.card,source:'Wishlist'});
  }
  for(const w of state.stockWatches||[]){
    const iq=vaultIQProductScore(w);
    out.push({uid:`watch-${w.uid}`,type:'product',name:w.product,subtitle:`${w.game||''} • ${w.priority||'High'} priority`,price:iq.price,iq,watch:w,source:'Stock Watch'});
  }
  return out.sort((a,b)=>b.iq.score-a.iq.score);
}
function vaultIQPlan(){
  const budget=vaultIQBudgetLeft();
  let remaining=budget;
  const picks=[];
  for(const c of vaultIQCandidates()){
    const price=Number(c.price)||0;
    if(c.iq.score<52||price<=0||price>remaining)continue;
    picks.push(c);remaining-=price;
    if(picks.length>=5)break;
  }
  return {budget,remaining,picks};
}
function openVaultIQCard(card){
  vaultIQFocusCard=card;
  toolsTab='vaultiq';
  switchTab('tools');
}
function queueVaultIQCard(card){
  ensureVaultIQSchema();
  if(state.acquisitionQueue.some(x=>x.type==='card'&&x.card?.id===card.id)){toast('Already in acquisition queue');return;}
  const iq=vaultIQCardScore(card);
  state.acquisitionQueue.unshift({uid:uid(),type:'card',name:card.name,card,price:iq.price,status:'Watching',createdAt:new Date().toISOString()});
  saveState();renderTools();toast('Added to acquisition queue');
}
function queueVaultIQWatch(watchId){
  ensureVaultIQSchema();
  const w=state.stockWatches.find(x=>x.uid===watchId);if(!w)return;
  if(state.acquisitionQueue.some(x=>x.type==='product'&&x.watchId===watchId)){toast('Already in acquisition queue');return;}
  const iq=vaultIQProductScore(w);
  state.acquisitionQueue.unshift({uid:uid(),type:'product',watchId,name:w.product,price:iq.price,status:'Watching',createdAt:new Date().toISOString()});
  saveState();renderTools();toast('Added to acquisition queue');
}
function updateAcquisitionStatus(id,status){
  const q=state.acquisitionQueue.find(x=>x.uid===id);if(!q)return;
  q.status=status;q.updatedAt=new Date().toISOString();saveState();renderTools();
}
function removeAcquisitionItem(id){
  state.acquisitionQueue=state.acquisitionQueue.filter(x=>x.uid!==id);saveState();renderTools();
}
function editVaultIQSettings(){
  const reserve=prompt('Keep how much of your monthly budget reserved/unspent?',String(state.vaultIQSettings.reserveCash||25));
  if(reserve!==null)state.vaultIQSettings.reserveCash=Math.max(0,Number(reserve)||0);
  const dupes=prompt('Start penalizing card acquisition after how many copies?',String(state.vaultIQSettings.maxDuplicateCopies||2));
  if(dupes!==null)state.vaultIQSettings.maxDuplicateCopies=Math.max(1,Number(dupes)||1);
  saveState();renderTools();
}
function vaultIQDealCheck(){
  if(!vaultIQFocusCard){toast('Open VaultIQ from a card search result first');return;}
  const price=prompt('What price are you being offered?',String(Number(vaultIQFocusCard.market)||0));
  if(price===null)return;
  vaultIQFocusCard={...vaultIQFocusCard,_dealPrice:Math.max(0,Number(price)||0)};
  renderTools();
}
function renderVaultIQScore(iq){
  return `<div class="iq-score ${iq.score>=68?'strong':iq.score>=52?'consider':'watch'}"><strong>${iq.score}</strong><span>COLLECTOR FIT</span><b>${esc(iq.label)}</b></div>`;
}
function renderVaultIQTool(){
  ensureVaultIQSchema();
  const candidates=vaultIQCandidates();
  const plan=vaultIQPlan();
  const focus=vaultIQFocusCard;
  const focusIQ=focus?vaultIQCardScore(focus,focus._dealPrice??null):null;
  const budget=vaultIQBudgetLeft();

  return `<div class="panel vaultiq-hero">
    <div class="section-head"><div><div class="eyebrow">2GEN VAULTIQ</div><h2>Personal collector decision engine</h2><p>Combines your collection, wishlist, targets, stock watches, budget, duplicate count and set progress to answer: “Is this a good fit for <em>my</em> collection?”</p></div><button class="btn" onclick="editVaultIQSettings()">⚙ IQ rules</button></div>
    <div class="stat-grid compact-stats">
      <div class="stat-card"><span>Spendable budget</span><strong>${money(budget)}</strong><small>${money(Number(state.vaultIQSettings.reserveCash)||0)} kept in reserve</small></div>
      <div class="stat-card"><span>Ranked targets</span><strong>${candidates.length}</strong><small>Wishlist + stock watches</small></div>
      <div class="stat-card"><span>Strong fits</span><strong>${candidates.filter(x=>x.iq.score>=68).length}</strong><small>Personalized, not investment advice</small></div>
      <div class="stat-card"><span>Acquisition queue</span><strong>${state.acquisitionQueue.length}</strong><small>Things you are actively watching</small></div>
    </div>
    <div class="notice warn" style="margin-top:10px"><span>!</span><span>VaultIQ is a <b>collector-fit score</b>, not a promise of profit or a financial recommendation. It explains every point it adds or subtracts.</span></div>
  </div>

  ${focus?`<div class="panel iq-focus-panel">
    <div class="section-head"><div><div class="eyebrow">DEAL CHECK</div><h2>${esc(focus.name)}</h2><p>${esc(focus.game)} • ${esc(focus.set)} • ${esc(focus.number||'')}</p></div>${renderVaultIQScore(focusIQ)}</div>
    <div class="iq-focus-grid">
      ${cardArt(focus)}
      <div class="grow">
        <div class="meta-grid">
          <div class="meta"><span>Market reference</span><strong>${money(Number(focus.market))}</strong></div>
          <div class="meta"><span>Offer / evaluated price</span><strong>${money(focusIQ.price)}</strong></div>
          <div class="meta"><span>Copies owned</span><strong>${focusIQ.owned}</strong></div>
          <div class="meta"><span>Budget after reserve</span><strong>${money(focusIQ.budget)}</strong></div>
        </div>
        <div class="iq-reasons">${focusIQ.reasons.map(r=>`<span>${esc(r)}</span>`).join('')}</div>
        <div class="action-row" style="margin-top:10px"><button class="btn primary" onclick="vaultIQDealCheck()">Check another price</button><button class="btn" onclick='queueVaultIQCard(${JSON.stringify(focus).replace(/'/g,"&#39;")})'>＋ Acquisition Queue</button><button class="btn" onclick='addWishlist(${JSON.stringify(focus).replace(/'/g,"&#39;")})'>♡ Wishlist</button></div>
      </div>
    </div>
  </div>`:''}

  <div class="analytics-grid">
    <div class="panel">
      <div class="section-head"><div><div class="eyebrow">NEXT HUNT PLAN</div><h2>Best-fit buys inside your budget</h2><p>Greedy plan using current reference prices and your remaining hobby budget.</p></div></div>
      ${plan.picks.length?plan.picks.map((c,idx)=>`<div class="iq-plan-row"><div class="iq-rank">${idx+1}</div><div class="grow"><strong>${esc(c.name)}</strong><span>${esc(c.source)} • ${esc(c.subtitle)}</span></div><div class="right"><b>${c.iq.score}</b><strong>${money(c.price)}</strong></div></div>`).join(''):`<div class="empty">No strong-fit candidates currently fit your spendable budget. Add wishlist cards or stock watches.</div>`}
      <div class="kpi-line" style="margin-top:10px"><span>Budget left after plan</span><strong>${money(plan.remaining)}</strong></div>
    </div>

    <div class="panel">
      <div class="section-head"><div><h2>Top collector targets</h2><p>Highest VaultIQ scores across cards you want and sealed products you watch.</p></div></div>
      ${candidates.length?candidates.slice(0,8).map(c=>`<div class="iq-candidate-row"><div class="iq-mini ${c.iq.score>=68?'strong':''}">${c.iq.score}</div><div class="grow"><strong>${esc(c.name)}</strong><span>${esc(c.source)} • ${esc(c.iq.label)} • ${c.price?money(c.price):'price unknown'}</span></div><div class="right">${c.type==='card'?`<button class="btn" onclick='openVaultIQCard(${JSON.stringify(c.card).replace(/'/g,"&#39;")})'>Analyze</button>`:`<button class="btn" onclick="queueVaultIQWatch('${c.watch.uid}')">Queue</button>`}</div></div>`).join(''):`<div class="empty">Your wishlist and stock watches will feed this ranking automatically.</div>`}
    </div>
  </div>

  <div class="panel">
    <div class="section-head"><div><h2>Acquisition Queue</h2><p>Your intentional buy list, separate from the broader wishlist.</p></div></div>
    ${state.acquisitionQueue.length?state.acquisitionQueue.map(q=>`<div class="acq-row"><div class="thumb square"><b>${q.type==='card'?'◆':'◈'}</b></div><div class="grow"><strong>${esc(q.name)}</strong><span>${esc(q.type)} • ${money(Number(q.price))} reference • ${esc(q.status)}</span></div><div class="right"><select onchange="updateAcquisitionStatus('${q.uid}',this.value)">${['Watching','Ready','Acquired','Skipped'].map(s=>`<option ${s===q.status?'selected':''}>${s}</option>`).join('')}</select><button class="remove" onclick="removeAcquisitionItem('${q.uid}')">Remove</button></div></div>`).join(''):`<div class="empty">Use IQ buttons in Universal Search or queue a stock watch.</div>`}
  </div>`;
}

function renderMarketPulseTool(){
  ensurePriceHistorySchema();
  const cards=uniqueCollectionCards();
  const movers=marketMovers();
  const selected=marketSelectedCardId
    ? cards.find(c=>c.id===marketSelectedCardId)
    : cards.find(c=>priceHistoryFor(c.id).length) || cards[0] || null;
  if(selected && !marketSelectedCardId) marketSelectedCardId=selected.id;

  const gainers=movers.slice(0,5);
  const losers=movers.slice().sort((a,b)=>a.pct-b.pct).slice(0,5);
  const targets=(state.priceAlerts||[]).map(a=>({alert:a,status:priceTargetStatus(a)}))
    .sort((a,b)=>(a.status.hit===b.status.hit?0:a.status.hit?-1:1));

  const lastRefresh=state.priceRefreshLog?.[0]||null;
  const trackedHistory=Object.values(state.cardPriceHistory||{}).filter(v=>Array.isArray(v)&&v.length).length;

  return `<div class="panel market-hero">
    <div class="section-head">
      <div><div class="eyebrow">2GEN MARKET PULSE</div><h2>Price intelligence</h2><p>Refresh current Pokémon market fields, keep local price snapshots and watch movement over time.</p></div>
      <button class="btn primary" onclick="refreshVaultPrices()" ${marketRefreshBusy?'disabled':''}>${marketRefreshBusy?'Refreshing…':'↻ Refresh Vault Prices'}</button>
    </div>
    <div class="stat-grid compact-stats">
      <div class="stat-card"><span>Live cards in Vault</span><strong>${cards.filter(liveProviderSupported).length}</strong><small>Eligible for provider refresh</small></div>
      <div class="stat-card"><span>Cards with history</span><strong>${trackedHistory}</strong><small>Local snapshot series</small></div>
      <div class="stat-card"><span>Price targets</span><strong>${state.priceAlerts.length}</strong><small>${targets.filter(x=>x.status.hit).length} currently hit</small></div>
      <div class="stat-card"><span>Last refresh</span><strong>${lastRefresh?humanAge(lastRefresh.finished):'—'}</strong><small>${lastRefresh?`${lastRefresh.updated} updated`:'Not run yet'}</small></div>
    </div>
    ${marketRefreshBusy?`<div class="notice"><span>↻</span><span id="marketRefreshStatus">Preparing price refresh…</span></div>`:''}
    <div class="notice warn" style="margin-top:10px"><span>!</span><span>“Market movement” below means change between <b>your saved VaultSignal price snapshots</b>. It is not a complete exchange-wide historical chart and is not investment advice.</span></div>
  </div>

  <div class="analytics-grid">
    <div class="panel">
      <div class="section-head"><div><h2>Snapshot gainers</h2><p>Largest percentage increases between your two latest saved market points.</p></div></div>
      ${gainers.length?gainers.map(m=>marketMoverRow(m)).join(''):`<div class="empty">Refresh prices on at least two different days/price points to calculate movement.</div>`}
    </div>
    <div class="panel">
      <div class="section-head"><div><h2>Snapshot decliners</h2><p>Largest percentage decreases between your two latest saved market points.</p></div></div>
      ${losers.length?losers.map(m=>marketMoverRow(m)).join(''):`<div class="empty">No snapshot movement yet.</div>`}
    </div>
  </div>

  <div class="panel">
    <div class="section-head"><div><h2>Card price history</h2><p>Choose a tracked card to inspect its local market snapshots.</p></div></div>
    ${cards.length?`
      <div class="form-grid">
        <label class="field full"><span>Tracked card</span><select onchange="selectMarketCard(this.value)">${cards.map(c=>`<option value="${esc(c.id)}" ${selected?.id===c.id?'selected':''}>${esc(c.name)} • ${esc(c.set)} • ${esc(c.number||'')}</option>`).join('')}</select></label>
      </div>
      ${selected?renderMarketCardHistory(selected):''}
    `:`<div class="empty">Add live Pokémon cards to your Vault first.</div>`}
  </div>

  <div class="analytics-grid">
    <div class="panel">
      <div class="section-head"><div><h2>Price targets</h2><p>Cards you want to watch below a target price.</p></div></div>
      ${targets.length?targets.slice(0,12).map(({alert,status})=>`<div class="compact-row">${cardArt(alert.card)}<div class="grow"><strong>${esc(alert.card.name)}</strong><span>Target ${money(Number(alert.target))} • Current ${money(Number(alert.card.market))}</span></div><div class="right"><span class="stock-pill ${status.hit?'in':'low'}">${status.hit?'TARGET HIT':'WATCHING'}</span>${Number.isFinite(status.diff)?`<small class="${status.hit?'good':'bad'}">${status.diff<=0?'Below by ':'Above by '}${money(Math.abs(status.diff))}</small>`:''}</div></div>`).join(''):`<div class="empty">Create price alerts from Card Search.</div>`}
    </div>
    <div class="panel">
      <div class="section-head"><div><h2>Refresh history</h2><p>Recent Vault refresh jobs.</p></div></div>
      ${state.priceRefreshLog?.length?state.priceRefreshLog.slice(0,8).map(r=>`<div class="kpi-line"><span>${dateShort(r.finished)} • ${r.requested} requested</span><strong>${r.updated} updated${r.failed?` • ${r.failed} failed`:''}</strong></div>`).join(''):`<div class="empty">No bulk price refreshes yet.</div>`}
    </div>
  </div>`;
}
function marketMoverRow(m){
  return `<div class="compact-row">${cardArt(m.card)}<div class="grow"><strong>${esc(m.card.name)}</strong><span>${esc(m.card.set)} • ${money(Number(m.previous))} → ${money(Number(m.card.market))}</span></div><div class="right"><strong class="${m.pct>=0?'good':'bad'}">${m.pct>=0?'+':''}${m.pct.toFixed(1)}%</strong><small>${m.amount>=0?'+':''}${money(m.amount)}</small></div></div>`;
}
function selectMarketCard(id){
  marketSelectedCardId=id;
  renderTools();
}
function renderMarketCardHistory(card){
  const h=priceHistoryFor(card.id).filter(x=>Number.isFinite(Number(x.market)));
  const d=marketDeltaFor(card);
  const first=h[0], last=h[h.length-1];
  const allChange=first&&last&&Number(first.market)!==0 ? (Number(last.market)-Number(first.market))/Number(first.market)*100 : null;
  return `<div class="market-card-history">
    <div class="market-card-head">
      ${cardArt(card)}
      <div class="grow"><div class="eyebrow">${esc(card.set)} • ${esc(card.number||'')}</div><h3>${esc(card.name)}</h3><p>${esc(card.rarity||'')}</p></div>
      <div class="right"><strong>${money(Number(card.market))}</strong><small>${h.length} saved point${h.length===1?'':'s'}</small></div>
    </div>
    <div class="chart-card market-chart">${marketHistorySvg(card.id,620,160)}</div>
    <div class="meta-grid">
      <div class="meta"><span>Latest market</span><strong>${money(Number(card.market))}</strong></div>
      <div class="meta"><span>Previous snapshot</span><strong>${d.previous!==null?money(Number(d.previous)):'—'}</strong></div>
      <div class="meta"><span>Latest change</span><strong class="${Number(d.pct)>=0?'good':'bad'}">${Number.isFinite(d.pct)?(d.pct>=0?'+':'')+d.pct.toFixed(1)+'%':'—'}</strong></div>
      <div class="meta"><span>Tracked-period change</span><strong class="${Number(allChange)>=0?'good':'bad'}">${Number.isFinite(allChange)?(allChange>=0?'+':'')+allChange.toFixed(1)+'%':'—'}</strong></div>
    </div>
    ${h.length?`<div class="price-point-list">${h.slice(-10).reverse().map(p=>`<div class="kpi-line"><span>${esc(p.day)} • ${esc(p.source||'Live data')}</span><strong>${money(Number(p.market))}${Number.isFinite(Number(p.low))?` • low ${money(Number(p.low))}`:''}</strong></div>`).join('')}</div>`:''}
  </div>`;
}

function renderAnalyticsTool(){
  ensureDailySnapshot();
  const t=totals();
  const trend=portfolioTrend();
  const spends=monthlySpendSeries(6);
  const maxSpend=Math.max(1,...spends.map(x=>x.amount));
  const alloc=allocationData();
  const games=gameAllocation();
  const positions=positionRows();
  const best=positions.filter(x=>x.cost>0).slice(0,5);
  const worst=positions.filter(x=>x.cost>0).slice().sort((a,b)=>a.gain-b.gain).slice(0,5);
  const valuable=valuableCards(5);
  const sets=collectionSetAnalytics().slice(0,6);
  const rips=ripLeaderboard();
  const health=dataHealthScore();
  const salesStats=soldAnalytics();
  const productCommandStats=productCommandSummary();
  const first=trend[0];
  const growth=first&&Number(first.market)?(t.market-Number(first.market))/Number(first.market)*100:0;
  const assetTotal=Math.max(1,t.market);
  const singlesPct=t.cardMarket/assetTotal*100;

  const trendHtml = trend.length
    ? svgSparkline(trend.map(x=>Number(x.market)||0),500,145)
    : '<div class="empty">Your first snapshot is being created today.</div>';
  const allocHtml = alloc.map(a=>'<div class="kpi-line"><span>'+esc(a.name)+'</span><strong>'+money(a.value)+' • '+a.pct.toFixed(1)+'%</strong></div>').join('');
  const gamesHtml = games.length
    ? '<div class="eyebrow" style="margin-top:12px">BY TCG</div>'+games.slice(0,6).map(g=>'<div class="kpi-line"><span>'+esc(g.name)+'</span><strong>'+money(g.value)+' • '+(g.value/assetTotal*100).toFixed(1)+'%</strong></div>').join('')
    : '';
  const spendHtml = spends.map(m=>'<div class="bar-col"><div class="bar-value">'+(m.amount?money(m.amount):'—')+'</div><div class="bar-track"><i style="height:'+Math.max(4,m.amount/maxSpend*100)+'%"></i></div><span>'+esc(m.label)+'</span></div>').join('');
  const bestHtml = best.length ? best.map(analyticsPositionRow).join('') : '<div class="empty">Add card cost basis to calculate positions.</div>';
  const worstHtml = worst.length ? worst.map(analyticsPositionRow).join('') : '<div class="empty">No cost-basis positions yet.</div>';
  const valuableHtml = valuable.length ? valuable.map(x=>'<div class="compact-row">'+cardArt(x.item.card)+'<div class="grow"><strong>'+esc(x.item.card.name)+'</strong><span>'+esc(x.item.card.set)+' • Qty '+x.item.qty+'</span></div><div class="right"><strong>'+money(x.value)+'</strong></div></div>').join('') : '<div class="empty">No cards tracked yet.</div>';
  const setsHtml = sets.length ? sets.map(s=>{
    const label=s.total ? s.owned+'/'+s.total+' • '+s.pct.toFixed(1)+'%' : s.owned+' owned';
    const progress=s.total ? '<div class="progress"><div style="width:'+s.pct+'%"></div></div>' : '';
    return '<div class="set-analytics-row"><div class="kpi-line"><span>'+esc(s.name)+'</span><strong>'+label+'</strong></div>'+progress+'</div>';
  }).join('') : '<div class="empty">Set data will appear as you build the collection.</div>';
  const ripsHtml = rips.length ? rips.slice(0,8).map(entry=>{
    const session=entry.session, stats=entry.stats;
    const roi=stats.spent ? (stats.roi>=0?'+':'')+stats.roi.toFixed(1)+'% ROI' : 'No cost';
    return '<div class="rip-analytics-row"><div class="grow"><strong>'+esc(session.name)+'</strong><span>'+esc(session.date)+' • '+(session.packs||0)+' packs • '+stats.cardsPulled+' logged cards</span></div><div class="right"><strong>'+money(stats.totalValue)+'</strong><small class="'+(stats.roi>=0?'good':'bad')+'">'+roi+'</small></div></div>';
  }).join('') : '<div class="empty">Log a Rip Session to compare opening performance.</div>';

  return `<div class="panel analytics-hero">
    <div class="section-head"><div><div class="eyebrow">2GEN DASHBOARD PRO</div><h2>Collector analytics</h2><p>Portfolio, spending, collection organization, set progress and rip performance in one view.</p></div><button class="btn" onclick="saveSnapshotNow()">＋ Snapshot</button></div>
    <div class="stat-grid">
      <div class="stat-card"><span>Vault value</span><strong>${money(t.market)}</strong><small class="${t.gain>=0?'good':'bad'}">${t.gain>=0?'+':''}${money(t.gain)} vs cost</small></div>
      <div class="stat-card"><span>Tracked cost</span><strong>${money(t.cost)}</strong><small>Singles + sealed</small></div>
      <div class="stat-card"><span>Snapshot growth</span><strong class="${growth>=0?'good':'bad'}">${trend.length>1?(growth>=0?'+':'')+growth.toFixed(1)+'%':'—'}</strong><small>${trend.length} daily snapshots</small></div>
      <div class="stat-card"><span>Data health</span><strong>${health.score}/100</strong><small>${health.label}</small></div>
    </div>
  </div>

  <div class="analytics-grid">
    <div class="panel">
      <div class="section-head"><div><h2>Portfolio growth</h2><p>Daily local snapshots, up to the last 30 days.</p></div></div>
      <div class="chart-card">${trendHtml}</div>
      <div class="split"><span>${trend.length?trend[0].day+' • '+money(Number(trend[0].market)||0):'No history yet'}</span><span>${money(t.market)} now</span></div>
    </div>
    <div class="panel">
      <div class="section-head"><div><h2>Asset allocation</h2><p>Current tracked market value.</p></div></div>
      <div class="allocation-wrap"><div class="allocation-ring" style="--singles:${singlesPct.toFixed(1)}deg"></div><div class="grow">${allocHtml}</div></div>
      ${gamesHtml}
    </div>
  </div>

  <div class="analytics-grid">
    <div class="panel"><div class="section-head"><div><h2>Spending trend</h2><p>Purchase log totals for the last six calendar months.</p></div></div><div class="bar-chart">${spendHtml}</div></div>
    <div class="panel"><div class="section-head"><div><h2>Vault data health</h2><p>A completeness/organization score, not an investment score.</p></div></div><div class="health-large"><div class="health-number">${health.score}</div><div><strong>${health.label}</strong><span>Improve it by maintaining cost basis, storage locations, sealed values, purchase history and fresh backups.</span></div></div><div class="progress"><div style="width:${health.score}%"></div></div><div class="action-row" style="margin-top:10px"><button class="btn" onclick="exportBackup()">Create backup</button><button class="btn" onclick="openVault('binders')">Manage binders</button></div></div>
  </div>

  <div class="analytics-grid">
    <div class="panel"><div class="section-head"><div><h2>Strongest positions vs cost</h2><p>Unrealized difference between current card market field and your recorded cost basis.</p></div></div>${bestHtml}</div>
    <div class="panel"><div class="section-head"><div><h2>Weakest positions vs cost</h2><p>This is not day-to-day market movement; it compares current market field with what you paid.</p></div></div>${worstHtml}</div>
  </div>

  <div class="analytics-grid">
    <div class="panel"><div class="section-head"><div><h2>Most valuable cards</h2><p>Largest current card positions by quantity × market.</p></div></div>${valuableHtml}</div>
    <div class="panel"><div class="section-head"><div><h2>Set completion leaders</h2><p>Your most complete tracked sets.</p></div><button class="link-btn" onclick="openTool('sets')">Set Explorer →</button></div>${setsHtml}</div>
  </div>

  <div class="panel">
    <div class="section-head"><div><h2>Product inventory</h2><p>Sealed inventory and retail-product tracking from Product Command.</p></div><button class="link-btn" onclick="openTool('products')">Product Command →</button></div>
    <div class="meta-grid">
      <div class="meta"><span>Tracked products</span><strong>${productCommandStats.products}</strong></div>
      <div class="meta"><span>Owned sealed units</span><strong>${productCommandStats.ownedQty}</strong></div>
      <div class="meta"><span>Sealed cost basis</span><strong>${money(productCommandStats.ownedCost)}</strong></div>
      <div class="meta"><span>Tracked sealed value</span><strong>${money(productCommandStats.ownedValue)}</strong></div>
    </div>
  </div>

  <div class="panel"><div class="section-head"><div><h2>Rip performance</h2><p>Opening-session value compared with recorded opening cost.</p></div><button class="link-btn" onclick="openTool('rips')">Rip Lab →</button></div>${ripsHtml}</div>`;
}
function analyticsPositionRow(x){
  return `<div class="compact-row">${cardArt(x.item.card)}<div class="grow"><strong>${esc(x.item.card.name)}</strong><span>${esc(x.item.card.set)} • Qty ${x.item.qty} • cost ${money(x.cost)}</span></div><div class="right"><strong class="${x.gain>=0?'good':'bad'}">${x.gain>=0?'+':''}${money(x.gain)}</strong><small>${x.cost?(x.pct>=0?'+':'')+x.pct.toFixed(1)+'%':'—'}</small></div></div>`;
}

function renderRipSessionsTool(){
  const totals=allRipStats();
  const active=activeRipSessionId?ripSessionById(activeRipSessionId):null;
  return `<div class="panel rip-hero-panel">
    <div class="section-head"><div><div class="eyebrow">2GEN RIP LAB</div><h2>Opening sessions</h2><p>Track what you open, what it cost, what you pulled, and whether the rip added value or set progress.</p></div><button class="btn primary" onclick="createRipSession()">＋ New rip</button></div>
    <div class="stat-grid compact-stats">
      <div class="stat-card"><span>Sessions</span><strong>${totals.sessions}</strong><small>Logged openings</small></div>
      <div class="stat-card"><span>Total spent</span><strong>${money(totals.spent)}</strong><small>Opening cost</small></div>
      <div class="stat-card"><span>Pull value</span><strong>${money(totals.value)}</strong><small>Current market fields</small></div>
      <div class="stat-card"><span>Overall ROI</span><strong class="${totals.roi>=0?'good':'bad'}">${totals.sessions?totals.roi.toFixed(1)+'%':'—'}</strong><small>${totals.hits} hits • ${totals.cards} cards</small></div>
    </div>
    <div class="rip-session-list">${state.ripSessions?.length?state.ripSessions.map(renderRipSessionRow).join(''):`<div class="empty">No opening sessions yet. Start one when you rip packs, tins, ETBs or boxes.</div>`}</div>
  </div>
  ${active?`<div class="panel">${renderActiveRipSession(active)}</div>`:''}`;
}
function renderRipSessionRow(s){
  const x=ripSessionStats(s);
  return `<button class="rip-session-row ${activeRipSessionId===s.uid?'active':''}" onclick="openRipSession('${s.uid}')">
    <div class="rip-icon">✦</div>
    <div class="grow"><strong>${esc(s.name)}</strong><span>${esc(s.game)} • ${esc(s.date)} • ${s.packs||0} packs • ${x.cardsPulled} cards</span></div>
    <div class="right"><strong>${money(x.totalValue)}</strong><small class="${x.roi>=0?'good':'bad'}">${x.spent?x.roi.toFixed(1)+'% ROI':'No cost'}</small></div>
  </button>`;
}
function createRipSession(){
  const name=(prompt('Session name','Pack Opening')||'').trim();if(!name)return;
  const game=(prompt('TCG / game','Pokemon')||'Pokemon').trim();
  const product=(prompt('Product opened (optional)','')||'').trim();
  const packs=Math.max(0,Number(prompt('How many packs are you opening?','1'))||0);
  const cost=Math.max(0,Number(prompt('Total cost of this opening','0'))||0);
  const threshold=Math.max(0,Number(prompt('Count a card as a HIT at what market value?','5'))||5);
  const session={uid:uid(),name,game,product,packs,cost,hitThreshold:threshold,date:todayInput(),notes:'',pulls:[],createdAt:new Date().toISOString()};
  state.ripSessions.unshift(session);
  activeRipSessionId=session.uid;
  saveState();renderTools();toast('Rip session started');
}
function openRipSession(id){activeRipSessionId=id;renderTools()}
function renderActiveRipSession(s){
  const x=ripSessionStats(s);
  return `<div class="rip-detail">
    <div class="section-head"><div><div class="eyebrow">${esc(s.game)} RIP SESSION</div><h2>${esc(s.name)}</h2><p>${esc(s.date)}${s.product?' • '+esc(s.product):''} • ${s.packs||0} packs • ${money(Number(s.cost)||0)} cost</p></div><div class="radar-score ${x.roi>=0?'warm':'cool'}"><b>${x.spent?x.roi.toFixed(0):'—'}</b><span>ROI %</span></div></div>

    <div class="meta-grid">
      <div class="meta"><span>Pull value</span><strong>${money(x.totalValue)}</strong></div>
      <div class="meta"><span>Hits</span><strong>${x.hitCount}</strong></div>
      <div class="meta"><span>Cards logged</span><strong>${x.cardsPulled}</strong></div>
      <div class="meta"><span>Unique sets</span><strong>${x.uniqueSets}</strong></div>
    </div>

    <div class="product-action-grid">
      <button class="quick-card" onclick="openRipQuickScanner('${s.uid}')"><span class="big-icon">◉</span><b>Scan / identify pull</b><span>Capture a card image, then identify it by live search. Nothing is auto-guessed.</span></button>
      <button class="quick-card" onclick="promptRipCardSearch('${s.uid}')"><span class="big-icon">⌕</span><b>Search card</b><span>Search live card data and add the pull to this session.</span></button>
      <button class="quick-card" onclick="editRipSession('${s.uid}')"><span class="big-icon">✎</span><b>Edit session</b><span>Cost, packs, hit threshold and notes.</span></button>
      <button class="quick-card" onclick="finishRipSession('${s.uid}')"><span class="big-icon">✓</span><b>Finish / add pulls</b><span>Add logged pulls to your Vault in one step.</span></button>
    </div>

    ${ripScannerPreview?`<div class="subpanel"><div class="section-head"><div><h2>Captured card</h2><p>Photo stays on this device. Use Search to identify the card.</p></div><button class="btn" onclick="clearRipPreview()">Clear</button></div><div class="rip-preview"><img src="${ripScannerPreview}" alt="Captured card"></div></div>`:''}

    ${ripCardSearchResults.length?`<div class="subpanel"><div class="section-head"><div><h2>Card matches</h2><p>Choose the correct card manually.</p></div><button class="link-btn" onclick="clearRipSearch()">Clear</button></div><div class="result-grid">${ripCardSearchResults.map(c=>ripSearchCardMarkup(c,s.uid)).join('')}</div></div>`:''}

    <div class="subpanel">
      <div class="section-head"><div><h2>Pulls</h2><p>Market value and set progress update as you log cards.</p></div></div>
      ${s.pulls.length?s.pulls.slice().sort((a,b)=>(Number(b.card?.market)||0)-(Number(a.card?.market)||0)).map(p=>renderRipPull(p,s)).join(''):`<div class="empty">No pulls logged yet.</div>`}
    </div>

    <div class="action-row">
      <button class="btn" onclick="exportRipSession('${s.uid}')">Export session</button>
      <button class="btn red" onclick="deleteRipSession('${s.uid}')">Delete session</button>
    </div>
  </div>`;
}
function ripSearchCardMarkup(c,sessionId){
  return `<article class="card-result">${cardArt(c)}<div><div class="eyebrow">${esc(c.game)} • ${esc(c.set)}</div><h3>${esc(c.name)}</h3><div class="tiny">${esc(c.number||'—')} ${c.rarity?'• '+esc(c.rarity):''}</div><div class="price-row"><strong>${money(Number(c.market))}</strong>${typeof c.low==='number'?`<span>Low ${money(c.low)}</span>`:''}</div><div class="action-row"><button class="btn primary" onclick='addPullToSession("${sessionId}", ${JSON.stringify(c).replace(/'/g,"&#39;")})'>＋ Add pull</button><button class="btn" onclick='openCardDetail(${JSON.stringify(c).replace(/'/g,"&#39;")});switchTab("discover")'>Details</button></div></div></article>`;
}
function renderRipPull(p,s){
  const card=p.card;
  const value=(Number(card?.market)||0)*(Number(p.qty)||0);
  const hit=value >= (Number(s.hitThreshold)||5);
  const before=cardOwnedSetProgress(card);
  return `<div class="rip-pull ${hit?'hit':''}">
    ${cardArt(card)}
    <div class="grow"><strong>${esc(card.name)}</strong><span>${esc(card.set)} • ${esc(card.number||'')} • Qty ${p.qty}${hit?' • HIT':''}</span><span>${before.total?`Set now ${before.owned}/${before.total} • ${before.pct.toFixed(1)}%`:''}</span></div>
    <div class="right"><strong>${money(value)}</strong><div><button class="link-btn" onclick="changePullQty('${s.uid}','${p.uid}')">Qty</button><button class="remove" onclick="removePull('${s.uid}','${p.uid}')">Remove</button></div></div>
  </div>`;
}
function openRipQuickScanner(sessionId){
  activeRipSessionId=sessionId;
  $('hiddenCamera').click();
}
async function promptRipCardSearch(sessionId){
  activeRipSessionId=sessionId;
  const s=ripSessionById(sessionId);if(!s)return;
  const q=(prompt(`${s.game} card name / number to search`,'')||'').trim();if(!q)return;
  if(!providerForGame(s.game)){
    toast(`${s.game} live search is not connected yet. Use Smart Scanner/manual tracking.`);
    return;
  }
  toast(`Searching live ${s.game} data…`);
  try{
    ripCardSearchResults=await universalSearchCards(s.game,q,20);
    ripCardSearchResults.forEach(c=>captureCardPrice(c,'Rip Session search'));
    saveState();renderTools();toast(`${ripCardSearchResults.length} matches`);
  }catch(e){ripCardSearchResults=[];renderTools();toast(e.message||'Search failed')}
}
function addPullToSession(sessionId,card){
  const s=ripSessionById(sessionId);if(!s)return;
  const ex=s.pulls.find(p=>p.card?.id===card.id);
  if(ex)ex.qty+=1;
  else s.pulls.unshift({uid:uid(),card,qty:1,addedAt:new Date().toISOString()});
  saveState();renderTools();toast('Pull logged');
}
function changePullQty(sessionId,pullId){
  const s=ripSessionById(sessionId);if(!s)return;
  const p=s.pulls.find(x=>x.uid===pullId);if(!p)return;
  const q=prompt('Quantity',String(p.qty));if(q===null)return;
  p.qty=Math.max(1,Number(q)||1);saveState();renderTools();
}
function removePull(sessionId,pullId){
  const s=ripSessionById(sessionId);if(!s)return;
  s.pulls=s.pulls.filter(x=>x.uid!==pullId);saveState();renderTools();
}
function editRipSession(id){
  const s=ripSessionById(id);if(!s)return;
  const packs=prompt('Packs opened',String(s.packs||0));if(packs!==null)s.packs=Math.max(0,Number(packs)||0);
  const cost=prompt('Total opening cost',String(s.cost||0));if(cost!==null)s.cost=Math.max(0,Number(cost)||0);
  const threshold=prompt('Hit threshold value',String(s.hitThreshold||5));if(threshold!==null)s.hitThreshold=Math.max(0,Number(threshold)||0);
  const notes=prompt('Session notes',s.notes||'');if(notes!==null)s.notes=notes;
  saveState();renderTools();
}
function finishRipSession(id){
  const s=ripSessionById(id);if(!s)return;
  if(!s.pulls.length){toast('Log pulls first');return;}
  if(!confirm('Add every logged pull to your Vault?'))return;
  for(const p of s.pulls){
    for(let n=0;n<(Number(p.qty)||0);n++) addCard(p.card);
  }
  s.finishedAt=new Date().toISOString();
  saveState();toolsTab='rips';renderTools();toast('Pulls added to Vault');
}
function deleteRipSession(id){
  if(!confirm('Delete this rip session?'))return;
  state.ripSessions=state.ripSessions.filter(x=>x.uid!==id);
  if(activeRipSessionId===id)activeRipSessionId=null;
  saveState();renderTools();
}
function exportRipSession(id){
  const s=ripSessionById(id);if(!s)return;
  const x=ripSessionStats(s);
  const payload={...s,analytics:x};
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  a.download=`2gen-rip-${normalizeName(s.name).replace(/\s+/g,'-')||'session'}.json`;
  a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function clearRipSearch(){ripCardSearchResults=[];renderTools()}
function clearRipPreview(){ripScannerPreview='';renderTools()}

function renderSetExplorerTool(){
  const ownedSets=new Map();
  for(const i of state.collection||[]){
    const key=i.card?.setId||i.card?.set||'Unknown';
    if(!ownedSets.has(key))ownedSets.set(key,{name:i.card?.set||'Unknown',id:i.card?.setId||'',owned:new Set(),qty:0,total:i.card?.setTotal||i.card?.setPrintedTotal||0});
    const g=ownedSets.get(key);g.owned.add(i.card?.id||`${i.card?.number}`);g.qty+=Number(i.qty)||0;
  }
  return `<div class="panel set-explorer-panel">
    <div class="section-head"><div><div class="eyebrow">MASTER SET LAB</div><h2>Set Explorer</h2><p>Search Pokémon sets, open a live checklist, see what you own and add missing cards directly to the vault.</p></div></div>
    <form class="searchbar" onsubmit="searchPokemonSets(event)"><span>▦</span><input id="setSearchQ" placeholder="Search set name, e.g. Journey Together"><button class="btn primary" ${setExplorerBusy?'disabled':''}>${setExplorerBusy?'Searching…':'Search sets'}</button></form>
    <div class="set-owned-summary">
      ${ownedSets.size?[...ownedSets.values()].slice(0,8).map(s=>`<button class="set-chip" onclick='openSetByInfo(${JSON.stringify({id:s.id,name:s.name,total:s.total}).replace(/'/g,"&#39;")})'><b>${esc(s.name)}</b><span>${s.owned.size} unique owned${s.total?' / '+s.total:''}</span></button>`).join(''):`<span class="tiny">Your owned sets will appear here as your collection grows.</span>`}
    </div>
    <div class="set-search-results">${setExplorerResults.length?setExplorerResults.map(setResultMarkup).join(''):`<div class="empty">Search for a Pokémon set to load its checklist.</div>`}</div>
  </div>
  ${activeSet?`<div class="panel">${renderActiveSet()}</div>`:''}`;
}
async function searchPokemonSets(e){
  e.preventDefault();
  const q=$('setSearchQ')?.value.trim()||'';if(!q){toast('Enter a set name');return;}
  setExplorerBusy=true;renderTools();
  try{
    const safe=q.replace(/"/g,'');
    const r=await fetch(`https://api.pokemontcg.io/v2/sets?q=name:%22${encodeURIComponent(safe)}%22&orderBy=-releaseDate&pageSize=20`);
    if(!r.ok)throw new Error(`Set API returned ${r.status}`);
    const d=await r.json();
    setExplorerResults=(d.data||[]).map(s=>({id:s.id,name:s.name,series:s.series||'',printedTotal:s.printedTotal||0,total:s.total||0,releaseDate:s.releaseDate||'',images:s.images||{}}));
    toast(`${setExplorerResults.length} sets found`);
  }catch(e){setExplorerResults=[];toast(e.message||'Set search failed')}
  finally{setExplorerBusy=false;renderTools()}
}
function setResultMarkup(s){
  const owned=new Set(state.collection.filter(i=>(i.card?.setId&&i.card.setId===s.id)||(!i.card?.setId&&i.card?.set===s.name)).map(i=>i.card?.id||i.card?.number));
  return `<button class="set-result" onclick='openSetByInfo(${JSON.stringify(s).replace(/'/g,"&#39;")})'>
    <div class="set-symbol">${s.images?.symbol?`<img src="${esc(s.images.symbol)}" alt="">`:'▦'}</div>
    <div class="grow"><strong>${esc(s.name)}</strong><span>${esc(s.series)} • ${esc(s.releaseDate||'')} • ${s.printedTotal||s.total||0} cards</span></div>
    <div class="right"><strong>${owned.size}</strong><small>owned</small></div>
  </button>`;
}
async function openSetByInfo(s){
  if(!s?.id){
    activeSet={id:'',name:s?.name||'Set',series:'',printedTotal:s?.total||0,total:s?.total||0,releaseDate:''};
    activeSetCards=state.collection.filter(i=>i.card?.set===activeSet.name).map(i=>i.card);
    renderTools();return;
  }
  activeSet=s;activeSetCards=[];setExplorerBusy=true;renderTools();
  try{
    const r=await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${encodeURIComponent(s.id)}&pageSize=250&orderBy=number`);
    if(!r.ok)throw new Error(`Set cards API returned ${r.status}`);
    const d=await r.json();
    activeSetCards=(d.data||[]).map(c=>{
      const ps=Object.values(c.tcgplayer?.prices||{});
      const market=ps.find(p=>typeof p.market==='number')?.market;
      const lows=ps.map(p=>p.low).filter(v=>typeof v==='number');
      return {id:c.id,provider:'pokemontcg',game:'Pokemon',name:c.name,set:c.set?.name||s.name,setId:c.set?.id||s.id,setSeries:c.set?.series||s.series||'',setPrintedTotal:c.set?.printedTotal||s.printedTotal||0,setTotal:c.set?.total||s.total||0,releaseDate:c.set?.releaseDate||s.releaseDate||'',number:c.number||'',rarity:c.rarity||'',artist:c.artist||'',image:c.images?.small||c.images?.large||'',market,low:lows.length?Math.min(...lows):undefined,url:c.tcgplayer?.url||''};
    });
    activeSetCards.forEach(c=>captureCardPrice(c,'Set Explorer'));
    saveState();
  }catch(e){toast(e.message||'Could not load set checklist')}
  finally{setExplorerBusy=false;renderTools()}
}
function openSetByCard(card){
  const s={id:card.setId||'',name:card.set||'Set',series:card.setSeries||'',printedTotal:card.setPrintedTotal||0,total:card.setTotal||0,releaseDate:card.releaseDate||''};
  toolsTab='sets';switchTab('tools');
  setTimeout(()=>openSetByInfo(s),0);
}
function renderActiveSet(){
  const uniqueOwned=new Set(state.collection.filter(i=>(activeSet.id&&i.card?.setId===activeSet.id)||(!activeSet.id&&i.card?.set===activeSet.name)).map(i=>i.card?.id||i.card?.number));
  const total=activeSetCards.length||activeSet.printedTotal||activeSet.total||0;
  const pct=total?Math.min(100,uniqueOwned.size/total*100):0;
  const missing=activeSetCards.filter(c=>!uniqueOwned.has(c.id)).length;
  return `<div class="active-set">
    <div class="set-hero"><div><div class="eyebrow">${esc(activeSet.series||'POKÉMON SET')}</div><h2>${esc(activeSet.name)}</h2><p>${esc(activeSet.releaseDate||'')} • ${total} checklist cards</p></div><div class="set-percent"><b>${pct.toFixed(1)}%</b><span>complete</span></div></div>
    <div class="progress"><div style="width:${pct}%"></div></div>
    <div class="meta-grid"><div class="meta"><span>Unique owned</span><strong>${uniqueOwned.size}</strong></div><div class="meta"><span>Missing</span><strong>${missing||Math.max(0,total-uniqueOwned.size)}</strong></div><div class="meta"><span>Total checklist</span><strong>${total}</strong></div></div>
    <div class="set-checklist">
      ${activeSetCards.length?activeSetCards.map(c=>{
        const owned=uniqueOwned.has(c.id);
        return `<div class="check-card ${owned?'owned':''}">${cardArt(c)}<div class="grow"><strong>${esc(c.number||'')} • ${esc(c.name)}</strong><span>${esc(c.rarity||'')} • ${money(Number(c.market))}</span></div><div class="right">${owned?`<span class="owned-mark">✓ OWNED</span>`:`<button class="btn primary" onclick='addCard(${JSON.stringify(c).replace(/'/g,"&#39;")});renderTools()'>＋ Add</button>`}<button class="link-btn" onclick='openCardFromSet(${JSON.stringify(c).replace(/'/g,"&#39;")})'>Details</button></div></div>`;
      }).join(''):`<div class="empty">No live checklist loaded for this set.</div>`}
    </div>
  </div>`;
}
function openCardFromSet(card){activeCardDetail=card;switchTab('discover')}

let activeProductId = null;

function renderProductsTool(){
  ensureProductInventorySchema();
  const query=window._productSearchQuery||'';
  const gameFilter=state.productCommandSettings.game||'All';
  const needFilter=state.productCommandSettings.need||'All';
  const sort=state.productCommandSettings.sort||'Priority';
  let results=findCatalogMatches(query);

  if(gameFilter!=='All')results=results.filter(p=>p.game===gameFilter);
  if(needFilter==='Owned')results=results.filter(p=>productStats(p).ownedQty>0);
  if(needFilter==='Need More')results=results.filter(p=>productStats(p).gap>0);
  if(needFilter==='Watched')results=results.filter(p=>!!productStats(p).watch);
  if(needFilter==='Recent Stock')results=results.filter(p=>productObservationRows(p).some(o=>reportAgeMinutes(o.ts)<=1440&&!/out/i.test(String(o.status||''))));

  results=results.slice().sort((a,b)=>{
    const A=productStats(a),B=productStats(b);
    if(sort==='Name')return a.name.localeCompare(b.name);
    if(sort==='Value')return B.valueTotal-A.valueTotal;
    if(sort==='Need')return B.gap-A.gap;
    if(sort==='Stock')return (B.inventoryStatus.count-A.inventoryStatus.count)||(new Date(B.newest||0)-new Date(A.newest||0));
    const aScore=A.watch?vaultIQProductScore(A.watch).score:0;
    const bScore=B.watch?vaultIQProductScore(B.watch).score:0;
    return bScore-aScore || B.gap-A.gap || a.name.localeCompare(b.name);
  });

  const active=activeProductId?catalogProductById(activeProductId):null;
  const sum=productCommandSummary();
  const watched=state.productCatalog.filter(p=>productStats(p).watch).slice(0,12);

  return `<div class="panel product-command-hero">
    <div class="section-head"><div><div class="eyebrow">VAULTSIGNAL • PRODUCT COMMAND</div><h2>Retail + sealed inventory intelligence</h2><p>Track exactly what products exist, what you own, what stores have been seen with stock, what you still need, what you paid, and what to hunt next.</p></div><button class="btn primary" onclick="createCustomProduct()">＋ Product</button></div>
    <div class="stat-grid compact-stats">
      <div class="stat-card"><span>Products tracked</span><strong>${sum.products}</strong><small>${sum.watched} active watches</small></div>
      <div class="stat-card"><span>Owned sealed units</span><strong>${sum.ownedQty}</strong><small>${money(sum.ownedCost)} cost basis</small></div>
      <div class="stat-card"><span>Tracked sealed value</span><strong>${money(sum.ownedValue)}</strong><small class="${sum.gain>=0?'good':'bad'}">${sum.gain>=0?'+':''}${money(sum.gain)} vs cost</small></div>
      <div class="stat-card"><span>Products still needed</span><strong>${sum.need}</strong><small>${sum.recent} sightings in last 24h</small></div>
    </div>
  </div>

  <div class="panel product-command-filter">
    <div class="searchbar"><span>⌕</span><input id="productSearchQ" value="${esc(query)}" placeholder="Product, set, UPC, SKU, retailer item ID..." oninput="setProductSearch(this.value)"></div>
    <div class="product-filter-grid">
      <label class="field"><span>TCG</span><select onchange="setProductGameFilter(this.value)"><option>All</option>${games.map(g=>`<option ${gameFilter===g?'selected':''}>${esc(g)}</option>`).join('')}</select></label>
      <label class="field"><span>Inventory filter</span><select onchange="setProductNeedFilter(this.value)">${['All','Owned','Need More','Watched','Recent Stock'].map(v=>`<option ${needFilter===v?'selected':''}>${v}</option>`).join('')}</select></label>
      <label class="field"><span>Sort</span><select onchange="setProductSort(this.value)">${['Priority','Need','Stock','Value','Name'].map(v=>`<option ${sort===v?'selected':''}>${v}</option>`).join('')}</select></label>
    </div>
  </div>

  ${watched.length?`<div class="panel">
    <div class="section-head"><div><div class="eyebrow">RETAIL INVENTORY BOARD</div><h2>Watched products at a glance</h2><p>Latest known store observations only — never fabricated stock.</p></div></div>
    <div class="inventory-board">${watched.map(productInventoryBoardCard).join('')}</div>
  </div>`:''}

  <div class="product-command-grid">
    <div class="panel">
      <div class="section-head"><div><h2>Product database</h2><p>${results.length} matching product${results.length===1?'':'s'}.</p></div></div>
      <div class="product-list command-product-list">${results.length?results.slice(0,60).map(productListCard).join(''):`<div class="empty">No matching products. Search UPC/SKU or create a product.</div>`}</div>
    </div>
    <div class="panel product-detail-shell">${active?renderProductDetail(active):`<div class="empty">Choose a product to open its complete inventory command page.</div>`}</div>
  </div>`;
}
function productInventoryBoardCard(p){
  const s=productStats(p),status=s.inventoryStatus;
  const latest=s.latestStores[0];
  const iq=s.watch?vaultIQProductScore(s.watch):null;
  return `<button class="inventory-board-card" onclick="openProductPage('${p.uid}')">
    <div class="inventory-board-head"><span class="stock-pill ${status.tone}">${status.label}</span>${iq?`<b class="iq-board">${iq.score} IQ</b>`:''}</div>
    <strong>${esc(p.name)}</strong>
    <span>${esc(p.game)} • ${esc(p.type)} • ${s.ownedQty}/${s.desiredQty||'—'} owned/goal</span>
    <div class="inventory-board-foot"><span>${latest?`${esc(latest.store)} • ${humanAge(latest.ts)}`:'No store data'}</span><b>${latest?.price?money(latest.price):p.target?money(p.target):'—'}</b></div>
  </button>`;
}
function setProductSearch(v){ window._productSearchQuery=v; renderTools(); }
function productListCard(p){
  const s=productStats(p);
  const status=s.inventoryStatus;
  const identity=[p.upc?`UPC ${p.upc}`:'',p.sku?`SKU ${p.sku}`:''].filter(Boolean).join(' • ');
  return `<button class="product-row command-row ${activeProductId===p.uid?'active':''}" onclick="openProductPage('${p.uid}')">
    <div class="product-icon">${p.image?`<img src="${esc(p.image)}" alt="">`:'◈'}</div>
    <div class="grow">
      <strong>${esc(p.name)}</strong>
      <span>${esc(p.game)} • ${esc(p.set||'No set')} • ${esc(p.type||'Sealed')}</span>
      ${identity?`<small>${esc(identity)}</small>`:''}
      <div class="product-row-pills"><span class="stock-pill ${status.tone}">${status.label}</span>${s.gap>0?`<span class="need-pill">NEED ${s.gap}</span>`:''}${s.watch?`<span class="watch-pill">${esc(s.watch.priority||'High')} WATCH</span>`:''}</div>
    </div>
    <div class="right"><strong>${s.bestObserved!==null?money(s.bestObserved):p.msrp?money(Number(p.msrp)):'—'}</strong><small>${s.ownedQty} owned${s.desiredQty?` / ${s.desiredQty} goal`:''}</small></div>
  </button>`;
}
function openProductPage(id){ activeProductId=id; renderTools(); }
function createCustomProduct(){
  const name=(prompt('Product name')||'').trim();if(!name)return;
  const game=prompt('TCG / game','Pokemon')||'Pokemon';
  const set=prompt('Set / release name','')||'';
  const type=prompt('Product type (ETB, Booster Box, Tin, Bundle, Collection...)','ETB')||'Sealed';
  const msrp=Number(prompt('MSRP / reference retail price (optional)','49.99')||0);
  const target=Number(prompt('Your target buy price (optional)',msrp?String(msrp):'')||0);
  const upc=(prompt('UPC / barcode (optional)','')||'').trim();
  const sku=(prompt('Primary SKU / item number (optional)','')||'').trim();
  const desiredQty=Math.max(0,Number(prompt('How many sealed copies do you want to own?','1'))||0);
  const releaseDate=(prompt('Release date YYYY-MM-DD (optional)','')||'').trim();
  const p=addCatalogProduct({game,name,set,type,msrp,target,upc,sku,desiredQty,releaseDate});
  activeProductId=p.uid;renderTools();toast('Product added to Product Command');
}
function renderProductDetail(p){
  const s=productStats(p);
  const costDiff=s.bestObserved!==null&&p.msrp?s.bestObserved-Number(p.msrp):null;
  const goal=s.desiredQty||0;
  const goalPct=goal?Math.min(100,s.ownedQty/goal*100):0;
  const retailerRows=s.latestStores;
  const pattern=s.pattern;
  const movement=productMovementTimeline(p);
  const identityRows=[
    ['UPC / Barcode',p.upc||'Not set'],
    ['Primary SKU',p.sku||'Not set'],
    ['Release',p.releaseDate||'Not set'],
    ['Packs inside',p.packCount||'Not set']
  ];
  const retailerIds=Object.entries(p.retailerSkus||{});
  const iq=s.watch?vaultIQProductScore(s.watch):null;
  const maxDay=Math.max(1,...pattern.days.map(x=>x.count));

  return `<div class="product-detail product-command-detail">
    <div class="product-hero">
      <div class="product-hero-icon">${p.image?`<img src="${esc(p.image)}" alt="">`:'◈'}</div>
      <div class="grow"><div class="eyebrow">${esc(p.game)} • ${esc(p.type||'Sealed')}</div><h2>${esc(p.name)}</h2><p>${esc(p.set||'No set specified')}</p><div class="product-row-pills"><span class="stock-pill ${s.inventoryStatus.tone}">${s.inventoryStatus.label}</span>${s.watch?`<span class="watch-pill">${esc(s.watch.priority)} WATCH</span>`:''}${iq?`<span class="iq-pill">${iq.score} VAULTIQ</span>`:''}</div></div>
      <div class="right"><button class="btn" onclick="editCatalogProduct('${p.uid}')">Edit basics</button><button class="btn" onclick="editProductIdentifiers('${p.uid}')">UPC / SKU</button></div>
    </div>

    <div class="stat-grid compact-stats">
      <div class="stat-card"><span>MSRP</span><strong>${p.msrp?money(Number(p.msrp)):'—'}</strong><small>Reference retail</small></div>
      <div class="stat-card"><span>Your max / target</span><strong>${p.target?money(Number(p.target)):'—'}</strong><small>Buy discipline</small></div>
      <div class="stat-card"><span>Best observed</span><strong>${s.bestObserved!==null?money(s.bestObserved):'—'}</strong><small class="${costDiff!==null&&costDiff<=0?'good':''}">${costDiff!==null?(costDiff<=0?`${money(Math.abs(costDiff))} below MSRP`:`${money(costDiff)} above MSRP`):'No sightings yet'}</small></div>
      <div class="stat-card"><span>Owned / desired</span><strong>${s.ownedQty}${goal?` / ${goal}`:''}</strong><small>${s.gap?`${s.gap} still needed`:'Goal satisfied / no goal'}</small></div>
    </div>

    ${goal?`<div class="product-goal"><div class="kpi-line"><span>Sealed inventory goal</span><strong>${s.ownedQty}/${goal} • ${goalPct.toFixed(0)}%</strong></div><div class="progress"><div style="width:${goalPct}%"></div></div></div>`:''}

    <div class="product-action-grid command-actions">
      <button class="quick-card" onclick="watchProduct('${p.uid}')"><span class="big-icon">◎</span><b>${s.watch?'Stock watch':'Watch inventory'}</b><span>${s.watch?`${esc(s.watch.priority||'High')} • ${s.watch.radius} mi • max ${s.watch.maxPrice?money(s.watch.maxPrice):'open'}`:'Create a Restock Radar watch.'}</span></button>
      <button class="quick-card live-command-card" onclick="runProductInventorySearch('${p.uid}')"><span class="big-icon">◉</span><b>SEARCH LIVE INVENTORY</b><span>Send this product's name, UPC/SKU and your ZIP/radius to connected retailer sources.</span></button>
      <button class="quick-card" onclick="huntProductNow('${p.uid}')"><span class="big-icon">⌖</span><b>Hunt now</b><span>Load this exact product into Stock Finder and nearby-store workflow.</span></button>
      <button class="quick-card" onclick="openProductStockReport('${p.uid}')"><span class="big-icon">◎</span><b>Log sighting</b><span>Record retailer, quantity and price with product identity attached.</span></button>
      <button class="quick-card" onclick="buyCatalogProduct('${p.uid}')"><span class="big-icon">$</span><b>Log purchase</b><span>Add purchase cost and optionally sealed inventory.</span></button>
      <button class="quick-card" onclick="addOwnedSealedFromProduct('${p.uid}')"><span class="big-icon">▣</span><b>Add inventory lot</b><span>Track retailer, date, cost, value and storage location.</span></button>
      <button class="quick-card" onclick="logOpeningFromProduct('${p.uid}')"><span class="big-icon">✦</span><b>Open product</b><span>Reduce sealed inventory and launch a Rip Session.</span></button>
      <button class="quick-card" onclick="openProductVaultIQ('${p.uid}')"><span class="big-icon">IQ</span><b>VaultIQ product fit</b><span>Analyze budget, quantity owned, target price and Restock Radar.</span></button>
    </div>

    <div class="product-command-sections">
      <div class="subpanel">
        <div class="section-head"><div><div class="eyebrow">PRODUCT IDENTITY</div><h2>UPC / SKU / release data</h2><p>Searchable identity data makes retailer/product matching much more reliable.</p></div></div>
        <div class="meta-grid">${identityRows.map(([k,v])=>`<div class="meta"><span>${esc(k)}</span><strong>${esc(String(v))}</strong></div>`).join('')}</div>
        ${retailerIds.length?`<div class="retailer-id-list">${retailerIds.map(([r,id])=>`<span><b>${esc(r)}</b> ${esc(id)}</span>`).join('')}</div>`:`<div class="empty mini-empty">No retailer-specific item IDs saved yet.</div>`}
      </div>

      <div class="subpanel">
        <div class="section-head"><div><div class="eyebrow">RETAIL INVENTORY</div><h2>Latest store observations</h2><p>Status, quantity, price, freshness and a transparent 2GEN report-confidence score.</p></div></div>
        ${retailerRows.length?`<div class="retailer-inventory-table">${retailerRows.slice(0,16).map(o=>`<div class="retailer-inventory-row">
          <div><strong>${esc(o.store)}</strong><span>${esc(o.source)} • ${humanAge(o.ts)}</span></div>
          <span class="stock-pill ${/out/i.test(String(o.status))?'out':/low/i.test(String(o.status))?'low':'in'}">${esc(o.status||'Unknown')}</span>
          <div class="center"><strong>${o.qty||'—'}</strong><span>qty</span></div>
          <div class="right"><strong>${o.price?money(o.price):'—'}</strong><span class="confidence-badge ${o.confidence>=85?'high':o.confidence>=60?'mid':'low'}">${o.confidence}% confidence</span></div>
        </div>`).join('')}</div>`:`<div class="empty">No legitimate reports/connectors have produced store inventory observations for this product yet.</div>`}
      </div>

      <div class="subpanel">
        <div class="section-head"><div><div class="eyebrow">PRICE INTELLIGENCE</div><h2>Observed retail pricing</h2><p>Derived only from actual stored sightings/results.</p></div></div>
        <div class="meta-grid">
          <div class="meta"><span>Best observed</span><strong>${s.bestObserved!==null?money(s.bestObserved):'—'}</strong></div>
          <div class="meta"><span>Average observed</span><strong>${s.observedAvg!==null?money(s.observedAvg):'—'}</strong></div>
          <div class="meta"><span>Median observed</span><strong>${s.observedMedian!==null?money(s.observedMedian):'—'}</strong></div>
          <div class="meta"><span>Price observations</span><strong>${s.inStock.filter(x=>x.price>0).length}</strong></div>
        </div>
      </div>

      <div class="subpanel">
        <div class="section-head"><div><div class="eyebrow">OBSERVED RESTOCK PATTERN</div><h2>When sightings have happened</h2><p>This summarizes your/community/connector observations. It does not claim a retailer will restock on this schedule.</p></div></div>
        <div class="pattern-summary"><span><b>${pattern.peakDay}</b> most-observed day</span><span><b>${pattern.peakPart}</b> most-observed daypart</span><span><b>${pattern.count}</b> in-stock observations</span></div>
        <div class="weekday-bars">${pattern.days.map(d=>`<div><i style="height:${Math.max(4,d.count/maxDay*100)}%"></i><span>${d.name}</span><b>${d.count}</b></div>`).join('')}</div>
      </div>

      <div class="subpanel">
        <div class="section-head"><div><div class="eyebrow">OWNED INVENTORY</div><h2>Sealed inventory lots</h2><p>Each lot can preserve its own cost, value, retailer, date and storage location.</p></div></div>
        <div class="meta-grid">
          <div class="meta"><span>Quantity</span><strong>${s.ownedQty}</strong></div>
          <div class="meta"><span>Total cost</span><strong>${money(s.costTotal)}</strong></div>
          <div class="meta"><span>Tracked value</span><strong>${money(s.valueTotal)}</strong></div>
          <div class="meta"><span>Difference</span><strong class="${s.gain>=0?'good':'bad'}">${s.gain>=0?'+':''}${money(s.gain)}</strong></div>
        </div>
        ${s.owned.length?s.owned.map(l=>`<div class="inventory-lot-row"><div class="thumb square"><b>▣</b></div><div class="grow"><strong>Qty ${l.qty} • ${money(Number(l.cost))} cost ea.</strong><span>${esc(l.retailer||'Retailer not set')} • ${esc(l.purchaseDate||String(l.addedAt||'').slice(0,10)||'Date not set')} • ${esc(l.location||'No location')}</span></div><div class="right"><strong>${money((Number(l.current)||0)*(Number(l.qty)||0))}</strong><button class="link-btn" onclick="editSealedLotFromProduct('${l.uid}')">Edit lot</button></div></div>`).join(''):`<div class="empty">No owned sealed lots for this product yet.</div>`}
      </div>

      <div class="subpanel">
        <div class="section-head"><div><div class="eyebrow">STOCK HISTORY</div><h2>Observation timeline</h2><p>See exactly where the inventory picture came from.</p></div></div>
        ${s.reports.length?s.reports.slice(0,20).map(r=>`<div class="inventory-history-row"><div><strong>${esc(r.store)}</strong><span>${esc(r.source)} • ${humanAge(r.ts)}${r.qty?` • Qty ${r.qty}`:''}</span></div><span class="stock-pill ${/out/i.test(String(r.status))?'out':/low/i.test(String(r.status))?'low':'in'}">${esc(r.status||'Unknown')}</span><strong>${r.price?money(r.price):'—'}</strong></div>`).join(''):`<div class="empty">No stock history recorded yet.</div>`}
      </div>

      <div class="subpanel">
        <div class="section-head"><div><div class="eyebrow">PRODUCT MOVEMENT</div><h2>Purchase / open / sell timeline</h2><p>Follow how sealed inventory moved through your collection.</p></div></div>
        ${movement.length?movement.map(m=>`<div class="movement-row"><div class="movement-icon">${m.type==='Opened'?'✦':m.type==='Sold'?'$':m.type==='Purchase'?'＋':'▣'}</div><div class="grow"><strong>${esc(m.title)}</strong><span>${esc(m.type)} • ${dateShort(m.ts)} • ${esc(m.detail)}</span></div></div>`).join(''):`<div class="empty">No movement history yet.</div>`}
      </div>

      <div class="subpanel">
        <div class="section-head"><div><h2>Opening history</h2><p>Track when sealed product leaves inventory because it was opened.</p></div></div>
        ${state.openingLog.filter(o=>productMatchesRecord(p,{product:o.product,game:o.game})).length
          ? state.openingLog.filter(o=>productMatchesRecord(p,{product:o.product,game:o.game})).slice(0,12).map(o=>`<div class="compact-row"><div class="thumb square"><b>✦</b></div><div class="grow"><strong>${esc(o.product)}</strong><span>${esc(o.date)} • Qty ${o.qty}${o.notes?' • '+esc(o.notes):''}</span></div></div>`).join('')
          : `<div class="empty">No openings logged for this product yet.</div>`}
      </div>
    </div>

    ${p.notes?`<div class="notice"><span>ℹ</span><span>${esc(p.notes)}</span></div>`:''}
  </div>`;
}
function editCatalogProduct(id){
  const p=catalogProductById(id);if(!p)return;
  const name=prompt('Product name',p.name||'');if(name!==null&&name.trim())p.name=name.trim();
  const game=prompt('TCG / game',p.game||'Pokemon');if(game!==null&&game.trim())p.game=game.trim();
  const set=prompt('Set / release',p.set||'');if(set!==null)p.set=set.trim();
  const type=prompt('Product type',p.type||'Sealed');if(type!==null)p.type=type.trim()||'Sealed';
  const msrp=prompt('MSRP / reference retail',p.msrp??'');if(msrp!==null)p.msrp=msrp===''?0:Math.max(0,Number(msrp)||0);
  const target=prompt('Target / max buy price',p.target??'');if(target!==null)p.target=target===''?0:Math.max(0,Number(target)||0);
  const desired=prompt('Desired sealed quantity',String(p.desiredQty||0));if(desired!==null)p.desiredQty=Math.max(0,Number(desired)||0);
  const notes=prompt('Notes',p.notes||'');if(notes!==null)p.notes=notes;
  saveState();renderTools();toast('Product updated');
}
function watchProduct(id){
  const p=catalogProductById(id);if(!p)return;
  const existing=state.stockWatches.find(w=>watchMatchesText(w,p.name)&&w.game===p.game);
  if(existing){
    selectedWatchId=existing.uid;
    stockQuery=existing.product;stockGame=existing.game;
    selectedRetailers=new Set(existing.retailers||[]);
    switchTab('stock');return;
  }
  const priority=prompt('Watch priority? High, Medium, or Low','High')||'High';
  const desired=Number(prompt('How many do you want to find?','1')||1);
  const max=Number(prompt('Maximum price',p.target?String(p.target):p.msrp?String(p.msrp):'')||0);
  const w={uid:uid(),product:p.name,game:p.game,retailers:[...selectedRetailers],radius:Number(state.settings.radius)||25,maxPrice:max||null,priority:/^low$/i.test(priority)?'Low':/^med/i.test(priority)?'Medium':'High',desiredQty:Math.max(1,desired||1),enabled:true,createdAt:new Date().toISOString()};
  state.stockWatches.unshift(w);selectedWatchId=w.uid;saveState();toast('Product watch created');renderTools();
}
function buyCatalogProduct(id){
  const p=catalogProductById(id);if(!p)return;
  const qty=Math.max(1,Number(prompt(`How many ${p.name} did you buy?`,'1'))||1);
  const each=Math.max(0,Number(prompt('Price paid EACH',p.target?String(p.target):p.msrp?String(p.msrp):'0'))||0);
  const retailer=(prompt('Retailer / store','')||'').trim();
  const date=(prompt('Purchase date YYYY-MM-DD',todayInput())||todayInput()).trim();
  state.purchases.unshift({uid:uid(),merchant:retailer||'Retail purchase',item:p.name,category:'Product inventory purchase',amount:each*qty,qty,date,notes:`Product Command${p.upc?` • UPC ${p.upc}`:''}`});
  if(confirm('Add these units to your Sealed Vault inventory too?')){
    const current=Math.max(0,Number(prompt('Current tracked value EACH',String(each)))||each);
    const location=(prompt('Storage location','Shelf / bin')||'').trim();
    state.sealed.unshift({uid:uid(),name:p.name,game:p.game,qty,cost:each,current,location,productId:p.uid,retailer,purchaseDate:date,upc:p.upc||'',sku:p.sku||'',ownerProfileId:activeCollectorProfileId,addedAt:new Date().toISOString()});
    recordProductInventoryEvent(p.uid,'Acquired',`Purchased ${qty} unit${qty===1?'':'s'}`,`${retailer||'Retailer'} • ${money(each)} each`);
  }
  saveState();renderTools();toast('Product purchase logged');
}
function addOwnedSealedFromProduct(id){
  const p=catalogProductById(id);if(!p)return;
  const qty=Math.max(1,Number(prompt(`How many ${p.name} are in this inventory lot?`,'1'))||1);
  const cost=Math.max(0,Number(prompt('Cost paid EACH',p.target?String(p.target):p.msrp?String(p.msrp):'0'))||0);
  const current=Math.max(0,Number(prompt('Current tracked value EACH',p.msrp?String(p.msrp):String(cost)))||0);
  const retailer=(prompt('Purchased from / source','')||'').trim();
  const purchaseDate=(prompt('Purchase date YYYY-MM-DD',todayInput())||todayInput()).trim();
  const location=(prompt('Storage location','Shelf / bin')||'').trim();
  state.sealed.unshift({uid:uid(),name:p.name,game:p.game,qty,cost,current,location,productId:p.uid,retailer,purchaseDate,upc:p.upc||'',sku:p.sku||'',ownerProfileId:activeCollectorProfileId,addedAt:new Date().toISOString()});
  recordProductInventoryEvent(p.uid,'Acquired',`Added ${qty} sealed unit${qty===1?'':'s'}`,`${retailer||'Source not set'} • ${money(cost)} cost each`);
  saveState();renderTools();toast('Inventory lot added');
}
function logOpeningFromProduct(id){
  const p=catalogProductById(id);if(!p)return;
  const candidates=state.sealed.filter(s=>watchMatchesText({product:p.name},s.name)&&s.qty>0);
  if(!candidates.length){toast('No sealed copies in your vault yet');return;}
  const qty=Math.max(1,Number(prompt('How many are you opening?','1'))||1);
  let left=qty, spent=0;
  for(const s of candidates){
    if(left<=0)break;
    const take=Math.min(left,s.qty);s.qty-=take;left-=take;spent += take*(Number(s.cost)||0);
  }
  state.sealed=state.sealed.filter(s=>s.qty>0);
  const actual=qty-left;
  const openingNotes=prompt('Opening notes (optional)','')||'';
  state.openingLog.unshift({uid:uid(),product:p.name,game:p.game,qty:actual,date:todayInput(),notes:openingNotes});
  if(actual>0)recordProductInventoryEvent(p.uid,'Opened',`Opened ${actual} unit${actual===1?'':'s'}`,openingNotes||`${money(spent)} cost basis removed`);
  if(actual>0 && confirm('Start a Rip Session for this opening?')){
    const packs=Math.max(0,Number(prompt('How many packs are inside / being opened?','1'))||0);
    const session={uid:uid(),name:`${p.name} Opening`,game:p.game,product:p.name,packs,cost:spent,hitThreshold:5,date:todayInput(),notes:'Created from Smart Product page',pulls:[],createdAt:new Date().toISOString()};
    state.ripSessions.unshift(session);activeRipSessionId=session.uid;toolsTab='rips';
  }
  saveState();renderTools();toast('Opening logged');
}



async function loadTesseract(){
  if(window.Tesseract?.recognize)return window.Tesseract;
  const urls=['https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js','https://unpkg.com/tesseract.js@5/dist/tesseract.min.js'];
  let lastError=null;
  for(const url of urls){
    try{
      await new Promise((resolve,reject)=>{
        const s=document.createElement('script');s.src=url;s.async=true;s.crossOrigin='anonymous';
        s.onload=resolve;s.onerror=()=>reject(new Error('OCR library failed to load'));document.head.appendChild(s);
      });
      if(window.Tesseract?.recognize)return window.Tesseract;
    }catch(e){lastError=e}
  }
  throw lastError||new Error('The on-device text reader could not load. Check your internet connection.');
}
function normalizeOcrText(text=''){
  return String(text)
    .replace(/[|]/g,'I')
    .replace(/\s+/g,' ')
    .replace(/[^\x20-\x7E]/g,' ')
    .trim();
}
function extractLikelyCardNumber(text=''){
  const compact=String(text).replace(/\s+/g,' ');
  const patterns=[
    /\b([A-Z]{0,4}\d{1,4})\s*\/\s*(\d{1,4})\b/i,
    /\b(\d{1,4})\s*\/\s*(\d{1,4})\b/,
    /\b([A-Z]{1,4}\d{1,4})\b/i
  ];
  for(const p of patterns){
    const m=compact.match(p);
    if(m) return String(m[1]).replace(/\s/g,'');
  }
  return '';
}
function likelyNameTokens(text=''){
  const stop=new Set([
    'basic','stage','hp','ability','weakness','resistance','retreat','rule',
    'pokemon','trainer','energy','damage','card','illustration','rare','ex',
    'vmax','vstar','gx','attack','during','your','opponents','opponent',
    'this','that','from','with','into','each','turn','does','times','more'
  ]);
  return normalizeOcrText(text)
    .split(/\s+/)
    .map(x=>x.replace(/[^A-Za-z0-9'.-]/g,''))
    .filter(x=>x.length>=3 && x.length<=22 && !stop.has(x.toLowerCase()) && !/^\d+$/.test(x))
    .slice(0,24);
}
function scannerEditDistance(a='',b=''){
  a=String(a).toLowerCase();b=String(b).toLowerCase();
  const row=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
    let prev=row[0];row[0]=i;
    for(let j=1;j<=b.length;j++){
      const tmp=row[j];
      row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));
      prev=tmp;
    }
  }
  return row[b.length];
}
function scannerWordSimilarity(a='',b=''){
  const longest=Math.max(String(a).length,String(b).length);
  if(!longest)return 0;
  return 1-scannerEditDistance(a,b)/longest;
}
function extractLikelyHp(text=''){
  const t=String(text);
  const hp=t.match(/\bHP\s*([3-9]\d|[12]\d\d|300)\b/i);
  if(hp)return hp[1];
  const top=t.slice(0,Math.min(180,t.length));
  const vals=[...top.matchAll(/\b([3-9]\d|[12]\d\d|300)\b/g)].map(m=>m[1]);
  return vals[0]||'';
}
function candidateScore(card,ocrText,numberHint){
  const hay=normalizeOcrText(ocrText).toLowerCase();
  const words=likelyNameTokens(ocrText).map(x=>x.toLowerCase());
  const name=String(card.name||'').toLowerCase();
  let score=0;

  if(hay.includes(name))score+=42;
  for(const part of name.split(/\s+/).filter(Boolean)){
    if(part.length<=2)continue;
    if(hay.includes(part))score+=18;
    else{
      const best=Math.max(0,...words.map(w=>scannerWordSimilarity(part,w)));
      if(best>=.82)score+=14;
      else if(best>=.70)score+=8;
    }
  }

  if(numberHint && String(card.number||'').toLowerCase()===String(numberHint).toLowerCase())score+=48;

  const hp=extractLikelyHp(ocrText);
  if(hp && String(card.hp||'')===String(hp))score+=12;

  for(const attack of card.attacks||[]){
    const attackName=String(attack.name||'').toLowerCase();
    if(attackName && hay.includes(attackName))score+=20;
    else{
      const parts=attackName.split(/\s+/).filter(x=>x.length>2);
      const hits=parts.filter(x=>hay.includes(x)).length;
      if(parts.length && hits===parts.length)score+=14;
      else if(hits)score+=5*hits;
    }
  }

  if(card.set && hay.includes(String(card.set).toLowerCase()))score+=8;
  if(card.rarity && hay.includes(String(card.rarity).toLowerCase()))score+=5;
  return Math.min(100,score);
}

function openScannerCamera(mode='camera'){
  if(mode==='gallery'){
    openScannerFilePicker();
    return;
  }
  openLiveScannerCamera();
}
function openScannerFilePicker(){
  const input=$('hiddenCamera');
  if(!input){toast('Photo picker is unavailable. Reload the app.');return;}
  input.value='';
  input.accept='image/*';
  input.removeAttribute('capture');
  try{
    if(typeof input.showPicker==='function')input.showPicker();
    else input.click();
  }catch{
    try{input.click()}catch{toast('Could not open the photo picker.')}
  }
}
function scannerCameraPermissionHelp(){
  alert(
    'Camera access is blocked.\n\n' +
    'On Android:\n' +
    '1. Open phone Settings.\n' +
    '2. Apps → VaultSignal (or Chrome if you run it in Chrome).\n' +
    '3. Permissions → Camera → Allow.\n' +
    '4. Return to VaultSignal and tap TAKE CARD PHOTO again.\n\n' +
    'You can also use the Gallery button as a fallback.'
  );
}
function closeLiveScannerCamera(){
  if(scannerLiveStream){
    try{scannerLiveStream.getTracks().forEach(t=>t.stop())}catch{}
  }
  scannerLiveStream=null;
  scannerLiveCameraOpen=false;
  scannerCameraZoom=1;
  scannerCameraTorch=false;
  scannerCameraCapabilities={zoom:false,torch:false};
  document.getElementById('scannerCameraModal')?.remove();
}
async function openLiveScannerCamera(){
  if(scannerLiveCameraOpen)return;
  if(!window.isSecureContext || !navigator.mediaDevices?.getUserMedia){
    toast('Direct camera is unavailable here. Opening photo picker instead.');
    openScannerFilePicker();
    return;
  }

  scannerLiveCameraOpen=true;
  const modal=document.createElement('div');
  modal.id='scannerCameraModal';
  modal.className='scanner-camera-modal';
  modal.innerHTML=`
    <div class="scanner-camera-shell">
      <div class="scanner-camera-topbar">
        <div><b>2GEN Card Camera</b><span>Fill the card outline — this exact area will be scanned</span></div>
        <button type="button" class="scanner-camera-close" onclick="closeLiveScannerCamera()">×</button>
      </div>
      <div class="scanner-live-stage">
        <video id="scannerLiveVideo" autoplay muted playsinline></video>
        <div class="scanner-card-guide"><i></i><b>PLACE ENTIRE CARD HERE</b></div>
        <div id="scannerCameraMessage" class="scanner-camera-message">Waiting for camera permission…</div>
      </div>
      <div class="scanner-camera-tips">Center the ENTIRE card inside the green frame • fill most of the frame • reduce glare • keep the name + collector number readable</div>
      <div class="scanner-camera-toolrow">
        <button type="button" id="scannerZoomBtn" class="btn" onclick="scannerCycleZoom()" disabled>Zoom N/A</button>
        <span>Card frame is locked to the exact center</span>
        <button type="button" id="scannerTorchBtn" class="btn" onclick="scannerToggleTorch()" disabled>Light N/A</button>
      </div>
      <div class="scanner-camera-controls">
        <button type="button" class="btn" onclick="closeLiveScannerCamera();openScannerFilePicker()">Gallery</button>
        <button type="button" id="scannerCaptureBtn" class="scanner-shutter" onclick="captureLiveScannerFrame()" disabled aria-label="Take photo"></button>
        <button type="button" class="btn" onclick="retryLiveScannerCamera()">Retry camera</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  await startLiveScannerStream();
}
async function startLiveScannerStream(){
  const video=document.getElementById('scannerLiveVideo');
  const message=document.getElementById('scannerCameraMessage');
  const capture=document.getElementById('scannerCaptureBtn');
  if(!video)return;

  if(scannerLiveStream){
    try{scannerLiveStream.getTracks().forEach(t=>t.stop())}catch{}
    scannerLiveStream=null;
  }
  if(message){
    message.style.opacity='1';
    message.classList.remove('ready','error');
    message.textContent='Waiting for camera permission…';
  }
  if(capture)capture.disabled=true;

  try{
    let stream;
    try{
      stream=await navigator.mediaDevices.getUserMedia({
        audio:false,
        video:{
          facingMode:{ideal:'environment'},
          width:{ideal:1920},
          height:{ideal:1080}
        }
      });
    }catch(firstError){
      stream=await navigator.mediaDevices.getUserMedia({audio:false,video:true});
    }

    if(!scannerLiveCameraOpen){
      try{stream.getTracks().forEach(t=>t.stop())}catch{}
      return;
    }

    scannerLiveStream=stream;
    video.srcObject=stream;

    await new Promise((resolve,reject)=>{
      if(video.readyState>=1 && video.videoWidth) return resolve();
      const timer=setTimeout(()=>resolve(),3000);
      video.addEventListener('loadedmetadata',()=>{clearTimeout(timer);resolve();},{once:true});
      video.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('Camera video could not start'));},{once:true});
    });

    try{await video.play()}catch{}

    const track=stream.getVideoTracks?.()[0];
    const caps=track?.getCapabilities?.()||{};
    scannerCameraCapabilities={
      zoom:!!caps.zoom,
      torch:!!caps.torch
    };
    scannerCameraZoom=Number(track?.getSettings?.()?.zoom)||1;
    scannerCameraTorch=false;
    updateScannerCameraControlUI();

    if(message){
      message.textContent='Camera ready — tap the white shutter button';
      message.classList.add('ready');
      message.style.opacity='1';
    }
    if(capture)capture.disabled=false;
  }catch(e){
    if(message){
      message.style.opacity='1';
      message.classList.add('error');
      if(e?.name==='NotAllowedError'){
        message.textContent='Camera permission is blocked. Allow Camera permission, then tap Retry camera.';
      }else if(e?.name==='NotFoundError'){
        message.textContent='No camera was detected. Use Gallery instead.';
      }else{
        message.textContent='Camera did not start. Tap Retry camera or use Gallery.';
      }
    }
    toast(e?.name==='NotAllowedError'?'Camera permission is blocked':'Camera did not start');
  }
}
async function retryLiveScannerCamera(){
  if(!scannerLiveCameraOpen){
    await openLiveScannerCamera();
    return;
  }
  await startLiveScannerStream();
}


function updateScannerCameraControlUI(){
  const zoomBtn=document.getElementById('scannerZoomBtn');
  const torchBtn=document.getElementById('scannerTorchBtn');
  if(zoomBtn){
    zoomBtn.disabled=!scannerCameraCapabilities.zoom;
    zoomBtn.textContent=scannerCameraCapabilities.zoom?`${scannerCameraZoom.toFixed(scannerCameraZoom%1?1:0)}× Zoom`:'Zoom N/A';
  }
  if(torchBtn){
    torchBtn.disabled=!scannerCameraCapabilities.torch;
    torchBtn.textContent=scannerCameraCapabilities.torch?(scannerCameraTorch?'⚡ Light on':'⚡ Light'):'Light N/A';
  }
}
async function scannerCycleZoom(){
  const track=scannerLiveStream?.getVideoTracks?.()[0];
  if(!track)return;
  const caps=track.getCapabilities?.()||{};
  const z=caps.zoom;
  if(!z){scannerCameraCapabilities.zoom=false;updateScannerCameraControlUI();return;}
  scannerCameraCapabilities.zoom=true;
  const min=Number(z.min)||1,max=Number(z.max)||1,step=Number(z.step)||0.1;
  const levels=[1,1.5,2,2.5,3].map(v=>Math.max(min,Math.min(max,v))).filter((v,i,a)=>i===0||Math.abs(v-a[i-1])>.05);
  let idx=levels.findIndex(v=>Math.abs(v-scannerCameraZoom)<.08);
  idx=(idx+1)%levels.length;
  scannerCameraZoom=levels[idx];
  try{await track.applyConstraints({advanced:[{zoom:scannerCameraZoom}]});}catch{}
  updateScannerCameraControlUI();
}
async function scannerToggleTorch(){
  const track=scannerLiveStream?.getVideoTracks?.()[0];
  if(!track)return;
  const caps=track.getCapabilities?.()||{};
  if(!caps.torch){scannerCameraCapabilities.torch=false;updateScannerCameraControlUI();return;}
  scannerCameraCapabilities.torch=true;
  scannerCameraTorch=!scannerCameraTorch;
  try{await track.applyConstraints({advanced:[{torch:scannerCameraTorch}]});}
  catch{scannerCameraTorch=false;}
  updateScannerCameraControlUI();
}

async function captureLiveScannerFrame(){
  const video=document.getElementById('scannerLiveVideo');
  const guide=document.querySelector('#scannerCameraModal .scanner-card-guide');
  if(!video || !video.videoWidth || !video.videoHeight){
    toast('Camera is not ready yet');
    return;
  }

  const btn=document.getElementById('scannerCaptureBtn');
  if(btn)btn.disabled=true;

  try{
    // Map the visible card guide through object-fit:cover back into source-video pixels.
    const vr=video.getBoundingClientRect();
    const gr=guide?.getBoundingClientRect();
    const sourceW=video.videoWidth,sourceH=video.videoHeight;
    const coverScale=Math.max(vr.width/sourceW,vr.height/sourceH);
    const renderedW=sourceW*coverScale,renderedH=sourceH*coverScale;
    const cropLeft=(renderedW-vr.width)/2;
    const cropTop=(renderedH-vr.height)/2;

    let sx=0,sy=0,sw=sourceW,sh=sourceH;
    if(gr && vr.width>0 && vr.height>0){
      sx=Math.max(0,((gr.left-vr.left)+cropLeft)/coverScale);
      sy=Math.max(0,((gr.top-vr.top)+cropTop)/coverScale);
      sw=Math.min(sourceW-sx,gr.width/coverScale);
      sh=Math.min(sourceH-sy,gr.height/coverScale);
    }

    // Small padding so card borders / collector number are not clipped.
    const px=sw*.035,py=sh*.025;
    sx=Math.max(0,sx-px);sy=Math.max(0,sy-py);
    sw=Math.min(sourceW-sx,sw+px*2);sh=Math.min(sourceH-sy,sh+py*2);

    const maxSide=1900;
    const scale=Math.min(1,maxSide/Math.max(sw,sh));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(sw*scale));
    canvas.height=Math.max(1,Math.round(sh*scale));
    const ctx=canvas.getContext('2d',{alpha:false});
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(video,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
    cameraPreview=canvas.toDataURL('image/jpeg',.94);

    closeLiveScannerCamera();
    scannerBestMatch=null;scannerPriceChartingResult=null;scannerPriceChartingStatus='unknown';scannerOcrText='';scannerOcrConfidence=null;
    scannerAutoCandidates=[];scannerSearchResults=[];
    renderTools();

    await new Promise(r=>setTimeout(r,100));
    await autoIdentifyFromPhoto(true);
  }catch(e){
    toast(e.message||'Could not capture the card photo');
    if(btn)btn.disabled=false;
  }
}

async function resizeScannerImage(file,maxSide=1800){
  if(!file)throw new Error('No image selected.');
  if(!String(file.type||'').startsWith('image/'))throw new Error('Choose an image file.');
  if(file.size>25*1024*1024)throw new Error('That photo is too large. Try a normal camera photo.');
  const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(new Error('Could not read the photo.'));r.readAsDataURL(file);});
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Could not decode the photo.'));i.src=dataUrl;});
  const scale=Math.min(1,maxSide/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));
  const w=Math.max(1,Math.round((img.naturalWidth||img.width)*scale)),h=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
  return canvas.toDataURL('image/jpeg',.9);
}
async function scannerOcrImage(dataUrl){
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Could not prepare the photo for OCR.'));i.src=dataUrl;});
  const canvas=document.createElement('canvas');canvas.width=img.naturalWidth||img.width;canvas.height=img.naturalHeight||img.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
  const imageData=ctx.getImageData(0,0,canvas.width,canvas.height),d=imageData.data;
  for(let i=0;i<d.length;i+=4){const gray=Math.round(d[i]*.299+d[i+1]*.587+d[i+2]*.114),c=Math.max(0,Math.min(255,Math.round((gray-128)*1.35+128)));d[i]=d[i+1]=d[i+2]=c;}
  ctx.putImageData(imageData,0,0);return canvas.toDataURL('image/jpeg',.92);
}
async function handleScannerPhotoFile(file){
  if(scannerPhotoBusy)return;
  scannerPhotoBusy=true;scannerBestMatch=null;scannerPriceChartingResult=null;scannerPriceChartingStatus='unknown';scannerOcrText='';scannerOcrConfidence=null;scannerAutoCandidates=[];scannerSearchResults=[];
  try{
    toast('Preparing card photo…');cameraPreview=await resizeScannerImage(file);renderTools();await new Promise(r=>setTimeout(r,80));
    if(scannerAutoRunAfterCapture)await autoIdentifyFromPhoto(true);else toast('Photo ready — tap Identify & live value');
  }catch(e){toast(e.message||'Could not use that photo')}
  finally{scannerPhotoBusy=false;const input=$('hiddenCamera');if(input)input.value='';}
}

function scannerPriceQuery(card,ocrText=''){
  const parts=[];
  if(card?.name)parts.push(card.name);
  if(card?.number)parts.push(`#${card.number}`);
  if(!card?.name){
    parts.push(...scannerTitleTokens(ocrText).slice(0,4));
    const no=extractLikelyCardNumber(ocrText);
    if(no)parts.push(`#${no}`);
  }
  if(scannerGame)parts.push(scannerGame);
  return parts.join(' ').trim();
}
async function fetchPriceChartingPrimary(query){
  scannerPriceChartingStatus='checking';
  if(!query || !inventoryBackendConnected()){
    scannerPriceChartingStatus='unavailable';
    return null;
  }
  try{
    const u=new URL(`${inventoryBackendBase()}/card-price`);
    u.searchParams.set('q',query);
    u.searchParams.set('game',scannerGame||'');
    const r=await fetch(u.toString(),{headers:{Accept:'application/json'}});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.error||`Pricing lookup returned ${r.status}`);
    if(d.configured===false){
      scannerPriceChartingStatus='not_configured';
      return null;
    }
    if(!d.result){
      scannerPriceChartingStatus='no_match';
      return null;
    }
    scannerPriceChartingStatus='connected';
    return d.result;
  }catch(e){
    scannerPriceChartingStatus='error';
    console.warn('PriceCharting lookup failed',e);
    return null;
  }
}
function priceChartingCardObject(pc,score=62){
  return {
    id:`pricecharting:${pc.id||uid()}`,
    game:scannerGame,
    name:pc.productName||'PriceCharting match',
    set:pc.category||'Trading Card',
    number:'',
    rarity:'',
    market:Number(pc.ungraded)||0,
    low:Number(pc.ungraded)||0,
    providerMarket:undefined,
    url:pc.searchUrl||'https://www.pricecharting.com/',
    autoScore:score,
    priceCharting:pc,
    pricingPrimary:'PriceCharting'
  };
}
async function enrichCardWithPriceCharting(card,ocrText=''){
  const pc=await fetchPriceChartingPrimary(scannerPriceQuery(card,ocrText));
  scannerPriceChartingResult=pc;
  if(!pc)return card;
  const primary=Number(pc.ungraded);
  return {
    ...card,
    providerMarket:Number(card?.market)||undefined,
    providerLow:Number(card?.low)||undefined,
    priceCharting:pc,
    market:Number.isFinite(primary)&&primary>0?primary:card?.market,
    low:Number.isFinite(primary)&&primary>0?primary:card?.low,
    pricingPrimary:'PriceCharting'
  };
}
function scannerPriceChartingMarkup(){
  const pc=scannerPriceChartingResult;
  if(pc){
    return `<div class="pc-price-card">
      <div class="pc-price-head">
        <div><div class="eyebrow">PRIMARY PRICE GUIDE • PRICECHARTING</div><strong>${esc(pc.productName||'Matched card')}</strong><span>${esc(pc.category||'Trading Card')}</span></div>
        <a class="btn" href="${esc(pc.searchUrl||'https://www.pricecharting.com/')}" target="_blank" rel="noreferrer">Open PriceCharting ↗</a>
      </div>
      <div class="pc-price-grid">
        <div class="primary"><span>Ungraded</span><strong>${pc.ungraded?money(pc.ungraded):'—'}</strong></div>
        <div><span>Grade 9</span><strong>${pc.grade9?money(pc.grade9):'—'}</strong></div>
        <div><span>PSA 10</span><strong>${pc.psa10?money(pc.psa10):'—'}</strong></div>
        <div><span>BGS 10</span><strong>${pc.bgs10?money(pc.bgs10):'—'}</strong></div>
      </div>
      <div class="pc-price-foot">Current PriceCharting guide values • checked ${humanAge(pc.checkedAt)} • not a guaranteed sale price</div>
    </div>`;
  }
  if(scannerPriceChartingStatus==='not_configured'){
    return `<div class="pc-price-card muted"><div><div class="eyebrow">PRIMARY PRICE GUIDE • PRICECHARTING</div><strong>Connector ready — API token not configured</strong><span>Add PRICECHARTING_API_TOKEN as a Cloudflare Worker secret. Never put it in GitHub Pages.</span></div><a class="btn" href="https://www.pricecharting.com/" target="_blank" rel="noreferrer">PriceCharting ↗</a></div>`;
  }
  if(scannerPriceChartingStatus==='error'){
    return `<div class="pc-price-card muted"><div><strong>PriceCharting could not be reached.</strong><span>The selected game's existing provider remains available as a fallback.</span></div></div>`;
  }
  return '';
}

async function refreshScannerCandidate(card){
  try{if(!liveProviderSupported(card))return card;const live=await refreshUniversalCard(card);return {...live,autoScore:card.autoScore};}catch{return card}
}
function scannerBestMatchMarkup(){
  const card=scannerBestMatch;
  if(!card)return scannerPriceChartingMarkup();

  const value=Number(card.market),score=Number(card.autoScore)||0;
  const pc=card.priceCharting||scannerPriceChartingResult;
  const providerValue=Number(card.providerMarket);
  const provider=providerForGame(scannerGame);

  return `<div class="scanner-best-value">
    <div class="scanner-best-label">BEST CURRENT MATCH • ${score}% ${autoConfidenceLabel(card)}</div>
    <div class="scanner-best-main">
      ${cardArt(card)}
      <div class="grow"><strong>${esc(card.name)}</strong><span>${esc(card.set)} ${card.number?`• ${esc(card.number)}`:''}</span><small>Confirm exact printing, finish and condition before adding it.</small></div>
      <div class="scanner-live-price"><span>${pc?'PRICECHARTING UNGRADED':'GAME PROVIDER MARKET REF.'}</span><strong>${Number.isFinite(value)&&value>0?money(value):'—'}</strong><small>${pc?'Primary pricing guide':esc(provider?.label||'Fallback provider')}</small></div>
    </div>
    ${scannerPriceChartingMarkup()}
    ${Number.isFinite(providerValue)&&providerValue>0?`<div class="secondary-price-row"><span>${esc(provider?.label||'Game provider')} secondary reference</span><strong>${money(providerValue)}</strong></div>`:''}
    <div class="action-row">
      <button class="btn primary" onclick='selectAutoMatch(${JSON.stringify(card).replace(/'/g,"&#39;")})'>Confirm match</button>
      <button class="btn" onclick='queueCard(${JSON.stringify(card).replace(/'/g,"&#39;")})'>＋ Queue</button>
      <button class="btn" onclick="scanAnotherCard()">📷 Scan another</button>
      ${(pc?.searchUrl||card.url)?`<a class="btn" href="${esc(pc?.searchUrl||card.url)}" target="_blank" rel="noreferrer">Pricing source ↗</a>`:''}
    </div>
  </div>`;
}

async function scannerLoadImage(dataUrl){
  return await new Promise((resolve,reject)=>{
    const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Could not prepare card image.'));i.src=dataUrl;
  });
}
async function scannerFocusedOcrImage(dataUrl){
  const img=await scannerLoadImage(dataUrl);
  const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;

  // Stack the title, attack/text area and collector-number/footer at higher scale.
  // These are the most useful areas for identifying a trading card.
  const regions=[
    {x:.02,y:.00,w:.96,h:.23,scale:2.25},
    {x:.03,y:.37,w:.94,h:.39,scale:1.55},
    {x:.02,y:.72,w:.96,h:.28,scale:2.0}
  ];
  const widths=regions.map(r=>Math.round(w*r.w*r.scale));
  const heights=regions.map(r=>Math.round(h*r.h*r.scale));
  const canvas=document.createElement('canvas');
  canvas.width=Math.min(2200,Math.max(...widths));
  canvas.height=Math.min(3000,heights.reduce((a,b)=>a+b,0)+80);
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);

  let y=0;
  regions.forEach((r,idx)=>{
    const sx=Math.round(w*r.x),sy=Math.round(h*r.y),sw=Math.round(w*r.w),sh=Math.round(h*r.h);
    const dw=Math.min(canvas.width,Math.round(sw*r.scale)),dh=Math.round(sh*r.scale);
    ctx.drawImage(img,sx,sy,sw,sh,0,y,dw,dh);
    y+=dh;
    ctx.fillStyle='#fff';ctx.fillRect(0,y,canvas.width,24);y+=24;
  });

  const imageData=ctx.getImageData(0,0,canvas.width,Math.min(y,canvas.height));
  const d=imageData.data;
  for(let i=0;i<d.length;i+=4){
    const gray=Math.round(d[i]*.299+d[i+1]*.587+d[i+2]*.114);
    const c=Math.max(0,Math.min(255,Math.round((gray-128)*1.55+128)));
    d[i]=d[i+1]=d[i+2]=c;
  }
  ctx.putImageData(imageData,0,0);
  return canvas.toDataURL('image/jpeg',.94);
}
function scannerTitleTokens(text=''){
  const stop=new Set(['basic','stage','trainer','energy','pokemon','ability','weakness','resistance','retreat','illus','illustration','common','uncommon','rare','holo','card']);
  return likelyNameTokens(text)
    .filter(t=>!stop.has(t.toLowerCase()))
    .filter(t=>!/^(metal|colorless|fire|grass|water|psychic|darkness|lightning|fighting|dragon|fairy)$/i.test(t))
    .slice(0,12);
}
async function pokemonScannerRawSearch(lucene,limit=40){
  const url=`https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(lucene)}&pageSize=${Math.min(50,limit)}&orderBy=-set.releaseDate`;
  const r=await fetch(url);
  if(!r.ok)throw new Error(`Pokémon live lookup returned ${r.status}`);
  const d=await r.json();
  return (d.data||[]).map(livePokemonCardFromApi);
}
function scannerAttackClues(text=''){
  const normalized=normalizeOcrText(text);
  const candidates=[];
  const commonPairs=[
    'Metal Claw','Iron Head','Tackle','Scratch','Bite','Ember','Water Gun','Thunder Shock',
    'Quick Attack','Vine Whip','Razor Leaf','Psychic','Confusion','Headbutt','Take Down'
  ];
  for(const p of commonPairs)if(normalized.toLowerCase().includes(p.toLowerCase()))candidates.push(p);
  const words=scannerTitleTokens(normalized);
  for(let i=0;i<words.length-1;i++){
    const pair=`${words[i]} ${words[i+1]}`;
    if(pair.length>=7)candidates.push(pair);
  }
  for(const w of words)if(w.length>=4)candidates.push(w);
  return [...new Set(candidates)].slice(0,10);
}
async function pokemonScannerCandidatesFromOcr(text='',numberHint=''){
  const tokens=scannerTitleTokens(text);
  const map=new Map();
  let successfulCalls=0,lastError=null;

  const add=cards=>{
    for(const card of cards||[]){
      const score=candidateScore(card,text,numberHint);
      const prior=map.get(card.id);
      if(!prior||score>prior.autoScore)map.set(card.id,{...card,autoScore:score});
    }
  };
  const run=async q=>{
    try{add(await pokemonScannerRawSearch(q,45));successfulCalls++;}
    catch(e){lastError=e;}
  };

  // Collector number is often the best exact-printing clue.
  if(numberHint)await run(`number:${numberHint}`);

  // Try OCR words as names, plus tolerant prefix wildcards for OCR mistakes
  // such as "Ferroseea" vs "Ferroseed".
  for(const token of tokens.slice(0,6)){
    if(token.length>=4)await run(`name:${token.replace(/[^A-Za-z0-9'-]/g,'')}`);
    if(token.length>=5){
      const prefix=token.replace(/[^A-Za-z]/g,'').slice(0,Math.min(5,token.length));
      if(prefix.length>=4)await run(`name:${prefix}*`);
    }
    if(map.size>=12)break;
  }

  // If the card name was missed by OCR, attacks can still identify it.
  if(map.size<6){
    for(const clue of scannerAttackClues(text).slice(0,5)){
      const safe=clue.replace(/"/g,'');
      await run(clue.includes(' ')?`attacks.name:"${safe}"`:`attacks.name:${safe}`);
      if(map.size>=12)break;
    }
  }

  // HP + a readable attack is a useful fallback for modern Pokémon layouts.
  const hp=extractLikelyHp(text);
  if(map.size<4 && hp){
    for(const clue of scannerAttackClues(text).slice(0,3)){
      const safe=clue.replace(/"/g,'');
      await run(`hp:${hp} attacks.name:${safe.includes(' ')?`"${safe}"`:safe}`);
      if(map.size>=8)break;
    }
  }

  if(!successfulCalls && lastError)throw lastError;
  return [...map.values()].sort((a,b)=>b.autoScore-a.autoScore);
}

async function autoIdentifyFromPhoto(autoRun=false){
  if(!canUseScannerLookup()){
    toolsTab='premium';renderTools();
    toast('Free scanner limit reached — Premium unlocks unlimited scans');
    return;
  }

  if(!cameraPreview){toast('Take or choose a card photo first');return;}
  if(scannerOcrBusy)return;

  scannerOcrBusy=true;
  scannerOcrText='';scannerOcrConfidence=null;scannerAutoCandidates=[];scannerBestMatch=null;
  renderTools();

  try{
    toast(autoRun?'Reading the card and checking live value…':'Reading card…');
    const T=await loadTesseract();
    const focused=await scannerFocusedOcrImage(cameraPreview);

    const result=await T.recognize(focused,'eng',{logger:m=>{
      if(m?.status==='recognizing text'&&typeof m.progress==='number'){
        const el=$('ocrProgressText');
        if(el)el.textContent=`Reading card… ${Math.round(m.progress*100)}%`;
      }
    }});

    const raw=result?.data?.text||'';
    scannerOcrText=normalizeOcrText(raw);
    const conf=Number(result?.data?.confidence);
    scannerOcrConfidence=Number.isFinite(conf)?conf:null;

    if(!scannerOcrText)throw new Error('No readable card text was found. Fill the card guide and reduce glare.');

    const numberHint=extractLikelyCardNumber(scannerOcrText);
    let ranked=[];

    if(scannerGame==='One Piece'){
      scannerPriceChartingResult=await fetchPriceChartingPrimary(scannerPriceQuery(null,scannerOcrText));
      ranked=scannerPriceChartingResult?[priceChartingCardObject(scannerPriceChartingResult,68)]:[];
    }else if(scannerGame==='Pokemon'){
      ranked=await pokemonScannerCandidatesFromOcr(scannerOcrText,numberHint);
    }else{
      const tokens=scannerTitleTokens(scannerOcrText);
      const candidateMap=new Map();
      const queries=[];if(numberHint)queries.push(numberHint);queries.push(...tokens.slice(0,7));
      for(const q of queries){
        try{
          const cards=await universalSearchCards(scannerGame,q,30);
          for(const card of cards){
            const score=candidateScore(card,scannerOcrText,numberHint);
            const prior=candidateMap.get(card.id);
            if(!prior||score>prior.autoScore)candidateMap.set(card.id,{...card,autoScore:score});
          }
        }catch{}
      }
      ranked=[...candidateMap.values()].sort((a,b)=>b.autoScore-a.autoScore);
    }

    ranked=ranked.slice(0,12);
    if(!ranked.length){
      scannerPriceChartingResult=await fetchPriceChartingPrimary(scannerPriceQuery(null,scannerOcrText));
      if(scannerPriceChartingResult)ranked=[priceChartingCardObject(scannerPriceChartingResult,55)];
    }
    if(!ranked.length)throw new Error(`I read the photo but could not match a ${scannerGame} printing. Fill more of the card guide and try again.`);

    const refreshed=[];
    for(const c of ranked.slice(0,5))refreshed.push(await refreshScannerCandidate(c));
    ranked=[...refreshed,...ranked.slice(5)]
      .map(c=>({...c,autoScore:c.autoScore??candidateScore(c,scannerOcrText,numberHint)}))
      .sort((a,b)=>b.autoScore-a.autoScore);

    scannerAutoCandidates=ranked;
    scannerSearchResults=ranked;
    scannerBestMatch=ranked[0]||null;

    if(scannerBestMatch && !scannerBestMatch.priceCharting){
      scannerBestMatch=await enrichCardWithPriceCharting(scannerBestMatch,scannerOcrText);
      scannerAutoCandidates=[scannerBestMatch,...ranked.slice(1)];
      scannerSearchResults=scannerAutoCandidates;
    }else if(scannerBestMatch?.priceCharting){
      scannerPriceChartingResult=scannerBestMatch.priceCharting;
    }

    scannerSearchResults.forEach(c=>captureCardPrice(c,'Scanner live-value lookup'));
    scannerLastMarketLookupAt=new Date().toISOString();
    if(scannerBestMatch){
      if(!hasPremium())consumeScannerLookup();
      recordScannerRecent(scannerBestMatch);
    }
    saveState();

    if(scannerBestMatch){
      const v=Number(scannerBestMatch.market);
      toast(Number.isFinite(v)
        ?`Found ${scannerBestMatch.name} • ${money(v)} market reference`
        :`Found ${scannerBestMatch.name} • exact provider value unavailable`);
    }
  }catch(e){
    scannerAutoCandidates=[];scannerSearchResults=[];scannerBestMatch=null;
    toast(e.message||'Card scan failed');
  }finally{
    scannerOcrBusy=false;
    renderTools();
  }
}
function autoConfidenceLabel(card){
  const s=Number(card.autoScore)||0;
  if(s>=80)return 'HIGH MATCH';
  if(s>=55)return 'POSSIBLE';
  return 'LOW MATCH';
}
function autoConfidenceClass(card){
  const s=Number(card.autoScore)||0;
  if(s>=80)return 'high';
  if(s>=55)return 'mid';
  return 'low';
}
function selectAutoMatch(card){
  scannerSearchResults=[card];
  scannerLastQuery=card.name||'';
  scannerLastMarketLookupAt=new Date().toISOString();
  renderTools();
  toast('Match selected — review before adding');
}


function recordScannerRecent(card){
  ensureScannerSchema();
  if(!card)return;
  const pc=card.priceCharting||scannerPriceChartingResult;
  const provider=providerForGame(scannerGame);
  const entry={
    uid:uid(),
    card:{
      id:card.id||'',
      game:card.game||scannerGame,
      name:card.name||'Unknown card',
      set:card.set||'',
      number:card.number||'',
      image:card.image||''
    },
    value:Number(card.market)||0,
    priceCharting:pc?{
      ungraded:Number(pc.ungraded)||0,
      grade9:Number(pc.grade9)||0,
      psa10:Number(pc.psa10)||0,
      bgs10:Number(pc.bgs10)||0
    }:null,
    providerValue:Number(card.providerMarket)||(!pc?Number(card.market)||0:0),
    primarySource:pc?'PriceCharting':(provider?.label||'Game provider'),
    confidence:Number(card.autoScore)||0,
    checkedAt:new Date().toISOString()
  };
  const dedupeKey=`${entry.card.game}|${entry.card.id}|${entry.card.number}`;
  state.scannerRecentScans=(state.scannerRecentScans||[]).filter(x=>`${x.card?.game}|${x.card?.id}|${x.card?.number}`!==dedupeKey);
  state.scannerRecentScans.unshift(entry);
  state.scannerRecentScans=state.scannerRecentScans.slice(0,20);
  saveState();
}
function clearScannerRecent(){
  state.scannerRecentScans=[];
  saveState();renderTools();
}
function scannerRecentMarkup(){
  ensureScannerSchema();
  if(!state.scannerRecentScans.length)return `<div class="empty">Your last 20 successful scanner matches will appear here.</div>`;
  return `<div class="scanner-recent-grid">${state.scannerRecentScans.slice(0,8).map(x=>`
    <div class="scanner-recent-card">
      ${x.card?.image?`<img src="${esc(x.card.image)}" alt="">`:`<div class="scanner-recent-placeholder">◈</div>`}
      <div class="grow"><strong>${esc(x.card?.name||'Card')}</strong><span>${esc(x.card?.set||'')} ${x.card?.number?`• ${esc(x.card.number)}`:''}</span><small>${esc(x.primarySource||'Pricing source')} • ${humanAge(x.checkedAt)}</small></div>
      <div class="scanner-recent-value"><strong>${x.value?money(x.value):'—'}</strong><span>${x.confidence||0}% match</span></div>
    </div>`).join('')}</div>`;
}
function scanAnotherCard(){
  clearScannerPhoto();
  setTimeout(()=>openScannerCamera('camera'),80);
}

function scannerOwnedQty(card){
  return totalOwnedForCard(card.id);
}
function suggestBinderForCard(card){
  ensureCollectionSchema();
  const candidates=new Map();
  for(const b of state.binders||[]) candidates.set(b.name,{binder:b,score:0});
  for(const i of state.collection||[]){
    const entry=candidates.get(i.location);
    if(!entry) continue;
    if(i.card?.set===card.set) entry.score += 8*(Number(i.qty)||1);
    if(i.card?.game===card.game) entry.score += 2*(Number(i.qty)||1);
  }
  const preferred=state.scannerSettings?.preferredBinder;
  if(candidates.has(preferred)) candidates.get(preferred).score += 3;
  return [...candidates.values()].sort((a,b)=>b.score-a.score)[0]?.binder?.name || binderNames()[0] || 'Main Binder';
}
function scannerSetSignal(card){
  const owned=scannerOwnedQty(card);
  if(owned>0) return {type:'duplicate',label:`DUPLICATE • ${owned} owned`};
  const total=Number(card.setPrintedTotal||card.setTotal||0);
  if(!total) return {type:'new',label:'NEW TO VAULT'};
  const sameSet=state.collection.filter(i=>(card.setId&&i.card?.setId===card.setId)||(!card.setId&&i.card?.set===card.set));
  const unique=new Set(sameSet.map(i=>i.card?.id||i.card?.number));
  return {type:'missing',label:`MISSING FROM SET • ${unique.size}/${total}`};
}
function gradingCandidate(card){
  const threshold=Number(state.scannerSettings?.gradingValueThreshold)||25;
  const value=Number(card.market)||0;
  const rarity=String(card.rarity||'').toLowerCase();
  const rarityFlag=/(illustration|secret|hyper|special|ultra|alternate|rare|promo)/.test(rarity);
  const candidate=value>=threshold || (value>=threshold*.6 && rarityFlag);
  return {
    candidate,
    reason:candidate ? `${money(value)} market${rarityFlag?' • notable rarity':''}` : `Below ${money(threshold)} review threshold`
  };
}
function queueCard(card){
  ensureScannerSchema();
  const ex=state.scanQueue.find(x=>x.card?.id===card.id);
  if(ex) ex.qty=(Number(ex.qty)||0)+1;
  else{
    const binder=suggestBinderForCard(card);
    const signal=scannerSetSignal(card);
    const grade=gradingCandidate(card);
    state.scanQueue.push({
      uid:uid(),card,qty:1,cost:Number(card.market)||0,binder,
      condition:'Near Mint',format:'Raw',
      signal:signal.type,gradingCandidate:grade.candidate,createdAt:new Date().toISOString()
    });
  }
  saveState();renderTools();toast('Card added to scan queue');
}
function removeQueuedCard(id){
  state.scanQueue=state.scanQueue.filter(x=>x.uid!==id);saveState();renderTools();
}
function updateQueuedCard(id,key,val){
  const q=state.scanQueue.find(x=>x.uid===id);if(!q)return;
  if(['binder','condition','format'].includes(key)) q[key]=val;
  else q[key]=Math.max(key==='qty'?1:0,Number(val)||0);
  saveState();renderTools();
}
function clearScanQueue(){
  if(!state.scanQueue.length)return;
  if(!confirm('Clear the entire scan queue?'))return;
  state.scanQueue=[];saveState();renderTools();
}
function reviewScannerSettings(){
  ensureScannerSchema();
  const threshold=prompt('Flag grading candidates at what market value?',String(state.scannerSettings.gradingValueThreshold||25));
  if(threshold!==null) state.scannerSettings.gradingValueThreshold=Math.max(0,Number(threshold)||0);
  const binder=prompt('Preferred default binder',state.scannerSettings.preferredBinder||'Main Binder');
  if(binder!==null && binderNames().includes(binder.trim())) state.scannerSettings.preferredBinder=binder.trim();
  saveState();renderTools();toast('Scanner settings saved');
}
function setScannerGame(game){scannerGame=game;scannerSearchResults=[];scannerAutoCandidates=[];scannerBestMatch=null;scannerPriceChartingResult=null;scannerPriceChartingStatus='unknown';scannerLastQuery='';renderTools();}
async function scannerSearch(event){
  if(!canUseScannerLookup()){
    event?.preventDefault?.();
    toolsTab='premium';renderTools();
    toast('Free scanner limit reached — Premium unlocks unlimited scans');
    return;
  }

  if(event)event.preventDefault();
  const q=($('scannerSearchQ')?.value||scannerLastQuery||'').trim();
  if(!q){toast('Enter a card name, set, or card number');return;}
  scannerLastQuery=q;scannerBusy=true;renderTools();
  try{
    scannerSearchResults=await universalSearchCards(scannerGame,q,30);
    scannerLastMarketLookupAt=new Date().toISOString();
    scannerSearchResults.forEach(c=>captureCardPrice(c,'Smart Scanner'));
    saveState();toast(`${scannerSearchResults.length} ${scannerGame} possible matches`);
  }catch(e){
    scannerSearchResults=[];toast(e.message||'Scanner search failed');
  }finally{
    scannerBusy=false;renderTools();
  }
}
function scannerResultMarkup(card){
  const signal=scannerSetSignal(card);
  const grade=gradingCandidate(card);
  const hasAuto=typeof card.autoScore==='number';
  return `<article class="scanner-match ${hasAuto?'auto-match':''}">
    ${cardArt(card)}
    <div class="grow">
      <div class="eyebrow">${esc(card.set)} • ${esc(card.number||'—')}</div>
      <strong>${esc(card.name)}</strong>
      <span>${esc(card.rarity||'')} • <b class="market-value">${money(Number(card.market))}</b>${typeof card.low==='number'?` • low ${money(card.low)}`:''}</span>
      <div class="scanner-flags">
        ${hasAuto?`<span class="auto-confidence ${autoConfidenceClass(card)}">${card.autoScore}% ${autoConfidenceLabel(card)}</span>`:''}
        <span class="${signal.type}">${esc(signal.label)}</span>
        ${grade.candidate?`<span class="grade-flag">◇ REVIEW FOR GRADING</span>`:''}
      </div>
      <small class="market-note">Market fields come from the live card data source when available; actual sale value varies by condition, variant and marketplace.</small>
    </div>
    <div class="right">
      ${hasAuto?`<button class="btn" onclick='selectAutoMatch(${JSON.stringify(card).replace(/'/g,"&#39;")})'>Select match</button>`:''}
      <button class="btn primary" onclick='queueCard(${JSON.stringify(card).replace(/'/g,"&#39;")})'>＋ Queue</button>
      <button class="link-btn" onclick='openCardDetail(${JSON.stringify(card).replace(/'/g,"&#39;")});switchTab("discover")'>Details</button>
    </div>
  </article>`;
}
function renderScanQueue(){
  ensureScannerSchema();
  if(!state.scanQueue.length) return `<div class="empty">Your batch queue is empty. Search and queue cards as you work through a stack.</div>`;
  return state.scanQueue.map(q=>{
    const signal=scannerSetSignal(q.card);
    const grade=gradingCandidate(q.card);
    return `<div class="scan-queue-row">
      ${cardArt(q.card)}
      <div class="grow">
        <strong>${esc(q.card.name)}</strong>
        <span>${esc(q.card.set)} • ${esc(q.card.number||'')} • ${money(Number(q.card.market))}</span>
        <div class="scanner-flags"><span class="${signal.type}">${esc(signal.label)}</span>${grade.candidate?`<span class="grade-flag">◇ GRADING REVIEW</span>`:''}</div>
        <div class="scan-edit-grid">
          <label class="field"><span>Qty</span><input type="number" min="1" value="${q.qty}" onchange="updateQueuedCard('${q.uid}','qty',this.value)"></label>
          <label class="field"><span>Cost ea.</span><input type="number" min="0" step=".01" value="${q.cost}" onchange="updateQueuedCard('${q.uid}','cost',this.value)"></label>
          <label class="field"><span>Binder</span><select onchange="updateQueuedCard('${q.uid}','binder',this.value)">${binderNames().map(b=>`<option ${b===q.binder?'selected':''}>${esc(b)}</option>`).join('')}</select></label>
        </div>
      </div>
      <div class="right"><strong>${q.qty}×</strong><button class="remove" onclick="removeQueuedCard('${q.uid}')">Remove</button></div>
    </div>`;
  }).join('');
}
function commitScanQueue(){
  ensureScannerSchema();
  if(!state.scanQueue.length){toast('Queue some cards first');return;}
  const addToRip=activeRipSessionId && ripSessionById(activeRipSessionId) && confirm('Also add these scanned cards to the active Rip Session?');
  let added=0, merged=0;
  for(const q of state.scanQueue){
    const existing=state.collection.find(i=>
      i.card?.id===q.card.id &&
      (i.format||'Raw')==='Raw' &&
      i.location===q.binder &&
      i.condition===q.condition
    );
    if(existing){
      existing.qty=(Number(existing.qty)||0)+(Number(q.qty)||0);
      if(!existing.cost && q.cost) existing.cost=q.cost;
      merged += Number(q.qty)||0;
    }else{
      state.collection.unshift({
        uid:uid(),card:q.card,qty:Number(q.qty)||1,condition:q.condition||'Near Mint',
        cost:Number(q.cost)||0,location:q.binder||'Main Binder',format:'Raw',
        grader:'',grade:'',cert:'',language:'English',variant:'Standard',ownerProfileId:activeCollectorProfileId
      });
      added += Number(q.qty)||1;
    }
    if(addToRip){
      const session=ripSessionById(activeRipSessionId);
      const pull=session.pulls.find(p=>p.card?.id===q.card.id);
      if(pull) pull.qty=(Number(pull.qty)||0)+(Number(q.qty)||0);
      else session.pulls.unshift({uid:uid(),card:q.card,qty:Number(q.qty)||1,addedAt:new Date().toISOString()});
    }
  }
  state.scanQueue=[];
  saveState();renderTools();
  toast(`Vault updated • ${added} new • ${merged} merged`);
}
function clearScannerPhoto(){cameraPreview='';scannerOcrText='';scannerOcrConfidence=null;scannerAutoCandidates=[];scannerSearchResults=[];scannerBestMatch=null;scannerPriceChartingResult=null;scannerPriceChartingStatus='unknown';const input=$('hiddenCamera');if(input)input.value='';renderTools();}

function renderScannerTool(){
  ensureScannerSchema();
  const activeRip=activeRipSessionId?ripSessionById(activeRipSessionId):null,secure=location.protocol==='https:'||location.hostname==='localhost',provider=providerForGame(scannerGame);
  return `<div class="panel scanner-pro-panel scanner-v71">
    <div class="section-head"><div><div class="eyebrow">VAULTSIGNAL LIVE VALUE SCANNER</div><h2>Take a photo → identify → live market reference</h2><p>Tap TAKE CARD PHOTO to open a live rear-camera view inside VaultSignal. Capture one card, then identification and live-provider value lookup start automatically.</p></div><button class="btn" onclick="reviewScannerSettings()">⚙ Rules</button></div>
    <div class="scanner-status-strip"><span class="${secure?'good':'bad'}">${secure?'✓ Direct camera supported':'! Direct camera needs HTTPS'}</span><span>Game: <b>${esc(scannerGame)}</b></span><span>Recognition: <b>${esc(provider?.label||'PriceCharting')}</b></span><span>Pricing: <b>PriceCharting primary</b></span><span>${scannerLastMarketLookupAt?`Lookup ${humanAge(scannerLastMarketLookupAt)}`:'No lookup yet'}</span></div>
    <div class="scanner-game-tabs scanner-game-tabs-top">${SCANNER_GAME_OPTIONS.map(g=>`<button class="${scannerGame===g?'active':''}" onclick='setScannerGame(${JSON.stringify(g)})'>${esc(g)}</button>`).join('')}</div>
    ${activeRip?`<div class="notice good"><span>✦</span><span>Active Rip Session: <b>${esc(activeRip.name)}</b>.</span></div>`:''}
    <div class="scanner-workspace scanner-camera-workspace"><div>
      <div class="scanbox scanner-camera-box">${cameraPreview?`<img src="${cameraPreview}" alt="Card preview">`:`<span class="camera-glyph">◉</span><b>Fill the card outline when taking the photo</b><span>Use even light • avoid glare • keep card name and collector number readable</span>`}</div>
      <div class="scanner-camera-actions"><button class="btn primary camera-main-btn" onclick="openScannerCamera('camera')" ${scannerPhotoBusy||scannerOcrBusy?'disabled':''}>📷 TAKE CARD PHOTO</button><button class="btn" onclick="openScannerCamera('gallery')" ${scannerPhotoBusy||scannerOcrBusy?'disabled':''}>▧ Gallery</button>${cameraPreview?`<button class="btn auto-btn" onclick="autoIdentifyFromPhoto(false)" ${scannerOcrBusy?'disabled':''}>${scannerOcrBusy?'Reading…':'✦ Identify & live value'}</button><button class="btn" onclick="clearScannerPhoto()">Clear</button>`:''}</div>
      <div class="scanner-auto-note"><span>✓</span><span>A photo automatically starts identification. You still confirm the exact printing before adding it.</span></div>${scannerOcrBusy?`<div class="ocr-progress"><i></i><span id="ocrProgressText">Reading card…</span></div>`:''}
    </div><div>
      <form class="searchbar" onsubmit="scannerSearch(event)"><span>⌕</span><input id="scannerSearchQ" value="${esc(scannerLastQuery)}" placeholder="Manual fallback: card name or number"><button class="btn primary" ${scannerBusy?'disabled':''}>${scannerBusy?'Searching…':'Manual Identify'}</button></form>
      <div class="scanner-accuracy-box"><b>What the value means</b><span>The camera identifies a likely printing; it does not value physical condition by itself.</span><span>VaultSignal uses PriceCharting as the primary guide when its secure API connector is configured, then keeps ${esc(provider?.label||'the game-specific provider')} as a secondary reference.</span><span>Condition, exact variant, foil, language and grading can change actual sale value.</span></div>
      ${scannerOcrText?`<div class="ocr-readout"><div class="kpi-line"><span>OCR confidence</span><strong>${scannerOcrConfidence!==null?scannerOcrConfidence.toFixed(0)+'%':'—'}</strong></div><p>${esc(scannerOcrText.slice(0,300))}${scannerOcrText.length>300?'…':''}</p></div>`:''}
    </div></div>
    ${scannerBestMatchMarkup()}
    ${scannerSearchResults.length?`<div class="subpanel" style="margin-top:11px"><div class="section-head"><div><h2>${scannerAutoCandidates.length?'Other possible printings':'Possible matches'}</h2><p>Check set, collector number and variant before using the value.</p></div><button class="link-btn" onclick="scannerSearchResults=[];scannerAutoCandidates=[];scannerBestMatch=null;renderTools()">Clear</button></div>${scannerLastMarketLookupAt?`<div class="market-refresh-note">Live lookup retrieved ${humanAge(scannerLastMarketLookupAt)}.</div>`:''}<div class="scanner-match-list">${scannerSearchResults.map(scannerResultMarkup).join('')}</div></div>`:''}
  </div>
  <div class="panel scanner-source-command">
    <div class="section-head"><div><div class="eyebrow">PRICING COMMAND CENTER</div><h2>Primary + fallback pricing</h2><p>PriceCharting is used first when its secure connector is configured. Game-specific sources remain visible as secondary/fallback references.</p></div><span class="badge primary">${scannerPriceChartingStatus==='connected'?'PRICECHARTING LIVE':scannerPriceChartingStatus==='not_configured'?'PRICECHARTING READY':'MULTI-SOURCE'}</span></div>
    <div class="scanner-source-grid">
      <div><b>Primary guide</b><span>PriceCharting • ungraded / graded guide fields when connected</span></div>
      <div><b>Pokémon</b><span>Pokémon TCG API / available TCGplayer reference fields</span></div>
      <div><b>Lorcana</b><span>Lorcast fallback/reference</span></div>
      <div><b>Magic</b><span>Scryfall fallback/reference</span></div>
      <div><b>Yu-Gi-Oh!</b><span>YGOPRODeck fallback/reference</span></div>
      <div><b>One Piece</b><span>PriceCharting connector path</span></div>
    </div>
  </div>

  <div class="panel">
    <div class="section-head"><div><div class="eyebrow">SCAN HISTORY</div><h2>Recent successful matches</h2><p>Quickly compare the cards you just scanned and their saved reference value at scan time.</p></div>${state.scannerRecentScans?.length?`<button class="link-btn" onclick="clearScannerRecent()">Clear</button>`:''}</div>
    ${scannerRecentMarkup()}
  </div>

  <div class="panel"><div class="section-head"><div><h2>Batch review</h2><p>Review quantity, cost and binder before adding cards.</p></div><div class="action-row"><button class="btn red" onclick="clearScanQueue()">Clear</button><button class="btn primary" onclick="commitScanQueue()">✓ Add queue to Vault</button></div></div>${renderScanQueue()}</div>
  <div class="panel"><div class="section-head"><div><h2>Scanner coverage</h2><p>Live providers connected to photo/manual identification.</p></div></div><div class="automation-grid">${Object.entries(LIVE_CARD_PROVIDERS).map(([g,p])=>`<div><b>✓ ${esc(g)}</b><span>${esc(p.label)} • ${esc(p.price)}</span></div>`).join('')}<div><b>Privacy</b><span>The photo is resized and OCR-processed in your browser; extracted text is used for lookup.</span></div><div><b>Condition limits</b><span>The scanner does not determine authenticity, surface, centering, edges or professional grade.</span></div></div></div>`;
}
$('hiddenCamera').addEventListener('change',async e=>{
  const f=e.target.files?.[0];if(!f)return;
  if(toolsTab==='rips'){
    const r=new FileReader();r.onload=()=>{ripScannerPreview=String(r.result||'');e.target.value='';renderTools();setTimeout(()=>{if(activeRipSessionId)promptRipCardSearch(activeRipSessionId)},50);};r.readAsDataURL(f);return;
  }
  await handleScannerPhotoFile(f);
});
function renderWishlistTool(){
  return `<div class="panel"><div class="section-head"><div><h2>Wishlist</h2><p>Keep your chase cards organized.</p></div></div>${state.wishlist.length?state.wishlist.map(w=>`<div class="compact-row">${cardArt(w.card)}<div class="grow"><strong>${esc(w.card.name)}</strong><span>${esc(w.card.set)} • Market ${money(Number(w.card.market))}</span></div><div class="right"><button class="remove" onclick="removeWishlist('${w.uid}')">Remove</button></div></div>`).join(''):`<div class="empty">Tap “Watch” on a card in Search.</div>`}</div>`;
}
function removeWishlist(id){state.wishlist=state.wishlist.filter(x=>x.uid!==id);saveState();renderTools()}
function renderStockReportTool(){
  const pre=window._stockReportPrefill||{};
  return `<div class="panel"><div class="section-head"><div><div class="eyebrow">PRODUCT INVENTORY SIGHTING</div><h2>Add stock report</h2><p>Record exactly what product you saw, where, how many and at what price.</p></div></div>
    <div class="form-grid">
      <label class="field"><span>Store / location</span><input id="reportStore" placeholder="Target - Asheville"></label>
      <label class="field"><span>Status</span><select id="reportStatus"><option>In stock</option><option>Low stock</option><option>Out of stock</option></select></label>
      <label class="field full"><span>Product</span><input id="reportProduct" value="${esc(pre.product||'')}" placeholder="Prismatic Evolutions ETB"></label>
      <label class="field"><span>Quantity seen</span><input id="reportQty" type="number" min="0" placeholder="4"></label>
      <label class="field"><span>Price EACH</span><input id="reportPrice" type="number" min="0" step=".01" placeholder="49.99"></label>
      <label class="field"><span>UPC / barcode</span><input id="reportUpc" value="${esc(pre.upc||'')}" placeholder="Optional"></label>
      <label class="field"><span>SKU / item ID</span><input id="reportSku" value="${esc(pre.sku||'')}" placeholder="Optional"></label>
      <label class="field full"><span>Notes</span><textarea id="reportNotes" placeholder="Aisle, purchase limit, display location, restock notes..."></textarea></label>
    </div>
    <input id="reportProductId" type="hidden" value="${esc(pre.productId||'')}">
    <label class="field" style="margin-top:10px"><span>Community</span><select id="reportPublish"><option value="local">Save on this phone only</option><option value="cloud">Publish to 2GEN Community Network</option></select></label>
    <button class="btn primary" style="margin-top:10px" onclick="addStockReport()">Save inventory sighting</button>
  </div>`;
}
async function addStockReport(){
  const store=$('reportStore')?.value.trim(), product=$('reportProduct')?.value.trim(); if(!store||!product){toast('Store and product are required');return;}
  let productId=$('reportProductId')?.value||'';
  let catalog=productId?catalogProductById(productId):null;
  if(!catalog){
    const matches=findCatalogMatches(product);
    catalog=matches.find(p=>p.game===(stockGame||'Pokemon'))||matches[0]||null;
  }
  const upc=$('reportUpc')?.value.trim()||catalog?.upc||'';
  const sku=$('reportSku')?.value.trim()||catalog?.sku||'';
  if(catalog){
    if(upc&&!catalog.upc)catalog.upc=upc;
    if(sku&&!catalog.sku)catalog.sku=sku;
    productId=catalog.uid;
  }
  const report={uid:uid(),productId,store,product,game:catalog?.game||stockGame||'Pokemon',status:$('reportStatus')?.value||'In stock',qty:Number($('reportQty')?.value)||0,price:Number($('reportPrice')?.value)||0,upc,sku,source:'manual_sighting',notes:$('reportNotes')?.value.trim()||'',ts:new Date().toISOString(),confirmations:0,soldOutConfirmations:0};
  state.stockReports.unshift(report);
  if(catalog)recordProductInventoryEvent(catalog.uid,'Sighting',`${report.status} at ${store}`,`${report.qty?`Qty ${report.qty} • `:''}${report.price?money(report.price):'Price not entered'}`);
  window._stockReportPrefill=null;
  saveState();

  if(($('reportPublish')?.value||'local')==='cloud'){
    if(!signedIn()){
      toast('Saved locally. Sign in before publishing to the community.');
    }else{
      try{
        await twogenCloudPublishStockReport({
          ...report,
          zip:state.settings.zip||null,
          lat:typeof state.settings.lat==='number'?state.settings.lat:null,
          lon:typeof state.settings.lon==='number'?state.settings.lon:null
        });
        toast('Published to 2GEN Community Network');
        await refreshCommunityReports(false);
      }catch(e){
        toast('Saved locally; cloud publish failed: '+(e.message||'unknown error'));
      }
    }
  }else{
    toast('Stock report saved locally');
  }
  switchTab('stock');
}
function renderBudgetTool(){
  const spent=monthSpend(), budget=Number(state.settings.monthlyBudget)||0, pct=budget?Math.min(100,spent/budget*100):0;
  return `<div class="panel"><div class="section-head"><div><h2>Collector budget</h2><p>Know how much hobby money is going out each month.</p></div></div>
    <div class="kpi-line"><span>Monthly budget</span><strong>${money(budget)}</strong></div><div class="kpi-line"><span>Spent this month</span><strong>${money(spent)}</strong></div><div class="progress"><div style="width:${pct}%"></div></div>
    <div class="form-grid" style="margin-top:12px"><label class="field"><span>Monthly budget</span><input id="monthlyBudget" type="number" min="0" step="1" value="${budget}"></label><label class="field"><span>Date</span><input id="purchaseDate" type="date" value="${todayInput()}"></label><label class="field"><span>Merchant</span><input id="purchaseMerchant" placeholder="Target"></label><label class="field"><span>Amount</span><input id="purchaseAmount" type="number" min="0" step=".01" placeholder="49.99"></label><label class="field full"><span>What did you buy?</span><input id="purchaseItem" placeholder="ETB, packs, singles..."></label></div>
    <div class="action-row" style="margin-top:10px"><button class="btn" onclick="saveBudget()">Save budget</button><button class="btn primary" onclick="addPurchase()">＋ Add purchase</button></div>
  </div>
  <div class="panel"><h2>Purchase log</h2>${state.purchases.length?state.purchases.slice(0,20).map(p=>`<div class="compact-row"><div class="thumb square"><b>$</b></div><div class="grow"><strong>${esc(p.item)}</strong><span>${esc(p.merchant)} • ${esc(p.date)}</span></div><div class="right"><strong>${money(Number(p.amount))}</strong><button class="remove" onclick="removePurchase('${p.uid}')">Delete</button></div></div>`).join(''):`<div class="empty">No purchases logged yet.</div>`}</div>`;
}
function saveBudget(){state.settings.monthlyBudget=Math.max(0,Number($('monthlyBudget')?.value)||0);saveState();renderTools();toast('Budget saved')}
function addPurchase(){
  const item=$('purchaseItem')?.value.trim(), merchant=$('purchaseMerchant')?.value.trim(), amount=Number($('purchaseAmount')?.value);
  if(!item||!merchant||!Number.isFinite(amount)){toast('Enter merchant, item and amount');return;}
  state.purchases.unshift({uid:uid(),merchant,item,category:'Purchase',amount,qty:1,date:$('purchaseDate')?.value||todayInput(),notes:''});saveState();renderTools();toast('Purchase logged')
}
function removePurchase(id){state.purchases=state.purchases.filter(x=>x.uid!==id);saveState();renderTools()}
function renderGradingTool(){
  return `<div class="panel"><div class="section-head"><div><h2>Grading tracker</h2><p>Keep submissions from getting lost in emails and screenshots.</p></div></div><div class="form-grid"><label class="field"><span>Card</span><input id="gradeCard" placeholder="Card name"></label><label class="field"><span>Company</span><select id="gradeCompany"><option>PSA</option><option>CGC</option><option>BGS</option><option>TAG</option><option>Other</option></select></label><label class="field"><span>Status</span><select id="gradeStatus"><option>Preparing</option><option>Submitted</option><option>Received</option><option>Grading</option><option>Shipped back</option><option>Complete</option></select></label><label class="field"><span>Fee</span><input id="gradeFee" type="number" min="0" step=".01" placeholder="24.99"></label></div><button class="btn primary" style="margin-top:10px" onclick="addGrading()">＋ Add submission</button></div>
  <div class="panel">${state.grading.length?state.grading.map(g=>`<div class="compact-row"><div class="thumb square"><b>◇</b></div><div class="grow"><strong>${esc(g.card)}</strong><span>${esc(g.company)} • ${esc(g.status)} • ${esc(g.date)}</span></div><div class="right"><strong>${money(Number(g.fee))}</strong><button class="link-btn" onclick="advanceGrading('${g.uid}')">Update</button><button class="remove" onclick="removeGrading('${g.uid}')">Delete</button></div></div>`).join(''):`<div class="empty">No grading submissions tracked yet.</div>`}</div>`;
}
function addGrading(){
  const card=$('gradeCard')?.value.trim();if(!card){toast('Enter the card name');return;}
  state.grading.unshift({uid:uid(),card,company:$('gradeCompany')?.value||'PSA',status:$('gradeStatus')?.value||'Preparing',fee:Number($('gradeFee')?.value)||0,date:todayInput(),createdAt:new Date().toISOString()});saveState();renderTools()
}
function advanceGrading(id){
  const g=state.grading.find(x=>x.uid===id);if(!g)return;const statuses=['Preparing','Submitted','Received','Grading','Shipped back','Complete'];const v=prompt('Status:',g.status);if(v===null)return;g.status=v;saveState();renderTools()
}
function removeGrading(id){state.grading=state.grading.filter(x=>x.uid!==id);saveState();renderTools()}

function tradeDraftValue(items){
  return (items||[]).reduce((n,i)=>n+(Number(i.valueEach)||0)*(Number(i.qty)||0),0);
}
function tradeItemLabel(i){
  return i.label || i.card?.name || 'Trade item';
}
function tradeAnalysis(){
  const out=tradeDraftValue(tradeGiveDraft);
  const incoming=tradeDraftValue(tradeReceiveDraft);
  const delta=incoming-out;
  const base=Math.max(out,incoming,1);
  const differencePct=Math.abs(delta)/base*100;
  const fairness=Math.max(0,100-differencePct);
  const label=differencePct<=5?'Balanced':differencePct<=12?'Close':differencePct<=22?'Review':'Wide gap';
  const need=Math.abs(delta);
  const weaker=delta>0?'You are receiving more':delta<0?'You are giving more':'Even';
  return {out,incoming,delta,differencePct,fairness,label,need,weaker};
}
function tradeItemMarketFreshness(i){
  if(!i.card?.id) return '';
  const h=priceHistoryFor(i.card.id);
  const last=h[h.length-1];
  return last?.ts ? ` • price ${humanAge(last.ts)}` : '';
}
function ownedTradeOptions(){
  const rows=[];
  for(const i of state.collection||[]){
    rows.push({
      type:'collection',
      sourceId:i.uid,
      label:`${i.card?.name} • ${i.card?.set||''} • ${i.format||'Raw'} • owned ${i.qty}`,
      valueEach:Number(i.card?.market)||0
    });
  }
  for(const i of state.sealed||[]){
    rows.push({
      type:'sealed',
      sourceId:i.uid,
      label:`${i.name} • Sealed • owned ${i.qty}`,
      valueEach:Number(i.current)||0
    });
  }
  return rows;
}
function addOwnedTradeItem(){
  const select=$('tradeOwnedSelect');
  if(!select?.value){toast('Choose something from your Vault');return;}
  const [type,id]=select.value.split('|');
  const qty=Math.max(1,Number($('tradeOwnedQty')?.value)||1);

  if(type==='collection'){
    const src=state.collection.find(x=>x.uid===id);if(!src)return;
    const allowed=Math.min(qty,Number(src.qty)||1);
    tradeGiveDraft.push({
      uid:uid(),source:'collection',sourceId:src.uid,card:src.card,
      label:src.card?.name||'Card',qty:allowed,valueEach:Number(src.card?.market)||0,
      format:src.format||'Raw',condition:src.condition||'Near Mint'
    });
  }else if(type==='sealed'){
    const src=state.sealed.find(x=>x.uid===id);if(!src)return;
    const allowed=Math.min(qty,Number(src.qty)||1);
    tradeGiveDraft.push({
      uid:uid(),source:'sealed',sourceId:src.uid,
      label:src.name,game:src.game,qty:allowed,valueEach:Number(src.current)||0
    });
  }
  renderTools();toast('Added to your side');
}
function addWishlistTradeItem(id){
  const w=state.wishlist.find(x=>x.uid===id);if(!w)return;
  tradeReceiveDraft.push({
    uid:uid(),source:'wishlist',sourceId:w.uid,card:w.card,
    label:w.card?.name||'Card',qty:1,valueEach:Number(w.card?.market)||0
  });
  renderTools();toast('Wishlist card added');
}
function addDuplicateTradeItem(collectionUid){
  const src=state.collection.find(x=>x.uid===collectionUid);if(!src)return;
  const already=tradeGiveDraft.filter(x=>x.source==='collection'&&x.sourceId===src.uid).reduce((n,x)=>n+(Number(x.qty)||0),0);
  const extras=Math.max(0,(Number(src.qty)||0)-1-already);
  if(extras<=0){toast('No extra copy left to add');return;}
  tradeGiveDraft.push({
    uid:uid(),source:'collection',sourceId:src.uid,card:src.card,
    label:src.card?.name||'Card',qty:1,valueEach:Number(src.card?.market)||0,
    format:src.format||'Raw',condition:src.condition||'Near Mint'
  });
  renderTools();toast('Duplicate added to trade');
}
function addManualTradeItem(side){
  const label=(prompt(side==='give'?'What are you giving?':'What are you receiving?','')||'').trim();
  if(!label)return;
  const qty=Math.max(1,Number(prompt('Quantity','1'))||1);
  const valueEach=Math.max(0,Number(prompt('Reference value EACH','0'))||0);
  const item={uid:uid(),source:'manual',label,qty,valueEach};
  (side==='give'?tradeGiveDraft:tradeReceiveDraft).push(item);
  renderTools();
}
function addCashAdjustment(side){
  const amount=Math.max(0,Number(prompt(side==='give'?'Cash you are adding':'Cash they are adding','0'))||0);
  if(!amount)return;
  const item={uid:uid(),source:'cash',label:'Cash adjustment',qty:1,valueEach:amount};
  (side==='give'?tradeGiveDraft:tradeReceiveDraft).push(item);
  renderTools();
}
function removeTradeDraftItem(side,id){
  if(side==='give') tradeGiveDraft=tradeGiveDraft.filter(x=>x.uid!==id);
  else tradeReceiveDraft=tradeReceiveDraft.filter(x=>x.uid!==id);
  renderTools();
}
function changeTradeDraftQty(side,id){
  const arr=side==='give'?tradeGiveDraft:tradeReceiveDraft;
  const item=arr.find(x=>x.uid===id);if(!item)return;
  const q=prompt('Quantity',String(item.qty||1));if(q===null)return;
  item.qty=Math.max(1,Number(q)||1);
  renderTools();
}
function changeTradeDraftValue(side,id){
  const arr=side==='give'?tradeGiveDraft:tradeReceiveDraft;
  const item=arr.find(x=>x.uid===id);if(!item)return;
  const v=prompt('Reference value EACH',String(item.valueEach||0));if(v===null)return;
  item.valueEach=Math.max(0,Number(v)||0);
  renderTools();
}
function clearTradeBuilder(){
  if((tradeGiveDraft.length||tradeReceiveDraft.length) && !confirm('Clear the current trade builder?')) return;
  tradeGiveDraft=[];tradeReceiveDraft=[];tradeSearchResults=[];renderTools();
}
function setTradeSearchGame(game){tradeSearchGame=game;tradeSearchResults=[];renderTools()}
async function tradeCardSearch(e){
  e.preventDefault();
  const q=$('tradeSearchQ')?.value.trim()||'';
  if(!q){toast('Enter a card name');return;}
  tradeSearchBusy=true;renderTools();
  try{
    tradeSearchResults=await universalSearchCards(tradeSearchGame,q,20);
    tradeSearchResults.forEach(c=>captureCardPrice(c,'Trade Lab search'));
    saveState();toast(`${tradeSearchResults.length} ${tradeSearchGame} trade matches`);
  }catch(e){
    tradeSearchResults=[];toast(e.message||'Trade search failed');
  }finally{
    tradeSearchBusy=false;renderTools();
  }
}
function addTradeSearchResult(card){
  tradeReceiveDraft.push({
    uid:uid(),source:'live',card,label:card.name,qty:1,valueEach:Number(card.market)||0
  });
  renderTools();toast('Added to receive side');
}
function renderTradeDraftItem(item,side){
  return `<div class="trade-draft-item">
    ${item.card?cardArt(item.card):`<div class="trade-cash-icon">${item.source==='cash'?'$':'⇄'}</div>`}
    <div class="grow">
      <strong>${esc(tradeItemLabel(item))}</strong>
      <span>${item.card?`${esc(item.card.set||'')} • ${esc(item.card.number||'')}`:esc(item.source==='cash'?'Cash adjustment':'Manual item')}${tradeItemMarketFreshness(item)}</span>
      <div class="trade-item-meta"><span>Qty ${item.qty}</span><span>${money(Number(item.valueEach))} ea.</span><span>${money((Number(item.valueEach)||0)*(Number(item.qty)||0))} total</span></div>
    </div>
    <div class="right">
      <button class="link-btn" onclick="changeTradeDraftQty('${side}','${item.uid}')">Qty</button>
      <button class="link-btn" onclick="changeTradeDraftValue('${side}','${item.uid}')">Value</button>
      <button class="remove" onclick="removeTradeDraftItem('${side}','${item.uid}')">Remove</button>
    </div>
  </div>`;
}
function tradeSummaryText(){
  const a=tradeAnalysis();
  const give=tradeGiveDraft.map(i=>`${i.qty}x ${tradeItemLabel(i)} (${money((Number(i.valueEach)||0)*(Number(i.qty)||0))})`).join(', ')||'Nothing';
  const receive=tradeReceiveDraft.map(i=>`${i.qty}x ${tradeItemLabel(i)} (${money((Number(i.valueEach)||0)*(Number(i.qty)||0))})`).join(', ')||'Nothing';
  return `VaultSignal Trade Check\nYou give: ${give}\nValue out: ${money(a.out)}\nYou receive: ${receive}\nValue in: ${money(a.incoming)}\nDifference: ${a.delta>=0?'+':''}${money(a.delta)}\nReference balance: ${a.label} (${a.fairness.toFixed(1)}%)\n\nValues are market references and may vary by condition, exact printing, grade and marketplace.`;
}
async function copyTradeSummary(){
  const text=tradeSummaryText();
  try{
    await navigator.clipboard.writeText(text);
    toast('Trade summary copied');
  }catch{
    prompt('Copy this trade summary:',text);
  }
}
function applyTradeToVault(){
  // Remove outgoing linked inventory.
  for(const item of tradeGiveDraft){
    if(item.source==='collection'){
      const src=state.collection.find(x=>x.uid===item.sourceId);
      if(src){
        src.qty=Math.max(0,(Number(src.qty)||0)-(Number(item.qty)||0));
      }
    }else if(item.source==='sealed'){
      const src=state.sealed.find(x=>x.uid===item.sourceId);
      if(src){
        src.qty=Math.max(0,(Number(src.qty)||0)-(Number(item.qty)||0));
      }
    }
  }
  state.collection=state.collection.filter(x=>(Number(x.qty)||0)>0);
  state.sealed=state.sealed.filter(x=>(Number(x.qty)||0)>0);

  // Add incoming cards when we have a real card object.
  for(const item of tradeReceiveDraft){
    if(!item.card) continue;
    const binder=state.scannerSettings?.preferredBinder||binderNames()[0]||'Main Binder';
    const existing=state.collection.find(x=>x.card?.id===item.card.id&&(x.format||'Raw')==='Raw'&&x.location===binder&&x.condition==='Near Mint');
    if(existing){
      existing.qty=(Number(existing.qty)||0)+(Number(item.qty)||0);
    }else{
      state.collection.unshift({
        uid:uid(),card:item.card,qty:Number(item.qty)||1,condition:'Near Mint',
        cost:Number(item.valueEach)||0,location:binder,format:'Raw',
        grader:'',grade:'',cert:'',language:'English',variant:'Standard',ownerProfileId:activeCollectorProfileId
      });
    }
    state.wishlist=state.wishlist.filter(w=>w.card?.id!==item.card.id);
  }
}
function saveTradeProposal(status='Proposed'){
  if(!tradeGiveDraft.length && !tradeReceiveDraft.length){toast('Build a trade first');return;}
  const partner=$('tradePartnerPro')?.value.trim()||'';
  const date=$('tradeDatePro')?.value||todayInput();
  const notes=$('tradeNotesPro')?.value.trim()||'';
  const a=tradeAnalysis();

  if(status==='Completed'){
    if(!confirm('Complete this trade and update your Vault inventory?'))return;
    applyTradeToVault();
  }

  state.trades.unshift({
    uid:uid(),partner,date,status,notes,
    giveItems:structuredClone(tradeGiveDraft),
    receiveItems:structuredClone(tradeReceiveDraft),
    give:tradeGiveDraft.map(i=>`${i.qty}x ${tradeItemLabel(i)}`).join(', '),
    receive:tradeReceiveDraft.map(i=>`${i.qty}x ${tradeItemLabel(i)}`).join(', '),
    valueOut:a.out,valueIn:a.incoming,
    fairness:a.fairness,createdAt:new Date().toISOString()
  });

  tradeGiveDraft=[];tradeReceiveDraft=[];tradeSearchResults=[];
  saveState();renderTools();toast(status==='Completed'?'Trade completed and Vault updated':'Trade proposal saved');
}
function renderTradeHistoryRow(t){
  const status=t.status||'Completed';
  const fairness=Number.isFinite(Number(t.fairness))?Number(t.fairness):null;
  return `<div class="trade-history-row">
    <div class="trade-cash-icon">⇄</div>
    <div class="grow">
      <strong>${esc(t.partner||'Trade')} <span class="trade-status ${status.toLowerCase()}">${esc(status)}</span></strong>
      <span>Gave: ${esc(t.give||'—')} • Got: ${esc(t.receive||'—')} • ${esc(t.date||'')}</span>
      ${t.notes?`<span>${esc(t.notes)}</span>`:''}
    </div>
    <div class="right">
      <strong class="${Number(t.valueIn)>=Number(t.valueOut)?'good':'bad'}">${Number(t.valueIn)>=Number(t.valueOut)?'+':''}${money((Number(t.valueIn)||0)-(Number(t.valueOut)||0))}</strong>
      ${fairness!==null?`<small>${fairness.toFixed(1)}% balance</small>`:''}
      <button class="remove" onclick="removeTrade('${t.uid}')">Delete</button>
    </div>
  </div>`;
}


const SELL_MARKETPLACES = {
  'Local / Cash': {feePct:0, fixed:0, shipping:0, note:'No platform fee assumed.'},
  'eBay': {feePct:13.25, fixed:.30, shipping:5.00, note:'Estimate only. Actual category, promoted-listing and shipping fees vary.'},
  'TCGplayer': {feePct:12.75, fixed:.30, shipping:1.25, note:'Estimate only. Actual seller level, payment and shipping costs vary.'},
  'Whatnot': {feePct:11, fixed:.30, shipping:0, note:'Estimate only. Actual platform/payment fees may differ.'},
  'Card Show': {feePct:3, fixed:0, shipping:0, note:'Estimate for table/payment overhead; edit values before saving.'},
  'Other': {feePct:10, fixed:.30, shipping:0, note:'Generic estimate; edit manually.'}
};
function ensureSalesSchema(){
  if(!Array.isArray(state.sales)) state.sales=[];
  if(!Array.isArray(state.saleQueue)) state.saleQueue=[];
}
function saleInventoryOptions(){
  const rows=[];
  for(const i of state.collection||[]){
    rows.push({
      type:'collection',id:i.uid,
      label:`${i.card?.name} • ${i.card?.set||''} • ${i.format||'Raw'} • owned ${i.qty}`,
      market:Number(i.card?.market)||0,cost:Number(i.cost)||0,qty:Number(i.qty)||0
    });
  }
  for(const i of state.sealed||[]){
    rows.push({
      type:'sealed',id:i.uid,
      label:`${i.name} • Sealed • owned ${i.qty}`,
      market:Number(i.current)||0,cost:Number(i.cost)||0,qty:Number(i.qty)||0
    });
  }
  return rows;
}
function currentSellSource(){
  if(!sellDraftSource) return null;
  const [type,id]=sellDraftSource.split('|');
  if(type==='collection'){
    const i=state.collection.find(x=>x.uid===id);
    if(!i)return null;
    return {
      type,id,name:i.card?.name||'Card',subtitle:`${i.card?.set||''} • ${i.format||'Raw'} • ${i.condition||''}`,
      market:Number(i.card?.market)||0,cost:Number(i.cost)||0,owned:Number(i.qty)||0,
      card:i.card,format:i.format||'Raw',condition:i.condition||'Near Mint'
    };
  }
  if(type==='sealed'){
    const i=state.sealed.find(x=>x.uid===id);
    if(!i)return null;
    return {
      type,id,name:i.name,subtitle:`${i.game||''} • Sealed`,
      market:Number(i.current)||0,cost:Number(i.cost)||0,owned:Number(i.qty)||0,
      game:i.game
    };
  }
  return null;
}
function marketplaceDefaults(name){
  return SELL_MARKETPLACES[name] || SELL_MARKETPLACES.Other;
}
function saleMath({price,qty=1,costEach=0,feePct=0,fixed=0,shipping=0,supplies=0}){
  price=Number(price)||0;qty=Math.max(1,Number(qty)||1);
  costEach=Number(costEach)||0;feePct=Number(feePct)||0;
  fixed=Number(fixed)||0;shipping=Number(shipping)||0;supplies=Number(supplies)||0;
  const gross=price*qty;
  const fees=gross*(feePct/100)+fixed;
  const totalCosts=costEach*qty+fees+shipping+supplies;
  const net=gross-fees-shipping-supplies;
  const profit=net-costEach*qty;
  const roi=(costEach*qty)>0?profit/(costEach*qty)*100:0;
  const breakEvenPer=(qty>0)?((costEach*qty+fixed+shipping+supplies)/(qty*(1-feePct/100||1))):0;
  return {gross,fees,totalCosts,net,profit,roi,breakEvenPer};
}
function sellFormMath(){
  const src=currentSellSource();
  if(!src)return saleMath({});
  return saleMath({
    price:Number($('sellPrice')?.value)||src.market,
    qty:Number($('sellQty')?.value)||1,
    costEach:Number($('sellCost')?.value)||src.cost,
    feePct:Number($('sellFeePct')?.value)||0,
    fixed:Number($('sellFixedFee')?.value)||0,
    shipping:Number($('sellShipping')?.value)||0,
    supplies:Number($('sellSupplies')?.value)||0
  });
}
function selectSellSource(v){
  sellDraftSource=v||null;
  renderTools();
}
function setSellMarketplace(name){
  sellMarketplace=name;
  renderTools();
}
function updateSellPreview(){
  const m=sellFormMath();
  const ids=['sellGrossPreview','sellFeesPreview','sellNetPreview','sellProfitPreview','sellBreakEvenPreview','sellRoiPreview'];
  const vals=[money(m.gross),money(m.fees),money(m.net),money(m.profit),money(m.breakEvenPer),`${m.roi.toFixed(1)}%`];
  ids.forEach((id,idx)=>{const el=$(id);if(el)el.textContent=vals[idx]});
  const p=$('sellProfitPreview'); if(p) p.className=m.profit>=0?'good':'bad';
  const r=$('sellRoiPreview'); if(r) r.className=m.roi>=0?'good':'bad';
}
function addSaleToQueue(){
  ensureSalesSchema();
  const src=currentSellSource();
  if(!src){toast('Choose an item first');return;}
  const qty=Math.min(src.owned,Math.max(1,Number($('sellQty')?.value)||1));
  const price=Math.max(0,Number($('sellPrice')?.value)||0);
  const feePct=Math.max(0,Number($('sellFeePct')?.value)||0);
  const fixed=Math.max(0,Number($('sellFixedFee')?.value)||0);
  const shipping=Math.max(0,Number($('sellShipping')?.value)||0);
  const supplies=Math.max(0,Number($('sellSupplies')?.value)||0);
  const costEach=Math.max(0,Number($('sellCost')?.value)||src.cost);
  const m=saleMath({price,qty,costEach,feePct,fixed,shipping,supplies});
  const row={
    uid:uid(),source:src.type,sourceId:src.id,
    name:src.name,subtitle:src.subtitle,card:src.card||null,game:src.game||src.card?.game||'',
    qty,priceEach:price,costEach,marketEach:src.market,
    marketplace:sellMarketplace,feePct,fixed,shipping,supplies,
    gross:m.gross,fees:m.fees,net:m.net,profit:m.profit,roi:m.roi,
    status:'Queued',createdAt:new Date().toISOString()
  };
  state.saleQueue.unshift(row);
  saveState();renderTools();toast('Added to sale queue');
}
function removeSaleQueueItem(id){
  state.saleQueue=state.saleQueue.filter(x=>x.uid!==id);saveState();renderTools();
}
function editSaleQueuePrice(id){
  const s=state.saleQueue.find(x=>x.uid===id);if(!s)return;
  const p=prompt('Sale price EACH',String(s.priceEach||0));if(p===null)return;
  s.priceEach=Math.max(0,Number(p)||0);
  const m=saleMath(s);
  Object.assign(s,{gross:m.gross,fees:m.fees,net:m.net,profit:m.profit,roi:m.roi});
  saveState();renderTools();
}
function completeSale(id){
  ensureSalesSchema();
  const q=state.saleQueue.find(x=>x.uid===id);if(!q)return;
  if(!confirm(`Mark ${q.qty}x ${q.name} sold and reduce your Vault inventory?`))return;

  if(q.source==='collection'){
    const src=state.collection.find(x=>x.uid===q.sourceId);
    if(src) src.qty=Math.max(0,(Number(src.qty)||0)-(Number(q.qty)||0));
  }else if(q.source==='sealed'){
    const src=state.sealed.find(x=>x.uid===q.sourceId);
    if(src) src.qty=Math.max(0,(Number(src.qty)||0)-(Number(q.qty)||0));
  }
  state.collection=state.collection.filter(x=>(Number(x.qty)||0)>0);
  state.sealed=state.sealed.filter(x=>(Number(x.qty)||0)>0);

  const sold={...q,status:'Sold',soldAt:new Date().toISOString(),date:todayInput()};
  state.sales.unshift(sold);
  state.saleQueue=state.saleQueue.filter(x=>x.uid!==id);
  state.purchases.unshift({
    uid:uid(),merchant:q.marketplace,item:`Sale: ${q.name}`,category:'Sale income',
    amount:-Math.max(0,Number(q.net)||0),qty:q.qty,date:todayInput(),
    notes:`Net sale proceeds. Gross ${money(q.gross)} • fees ${money(q.fees)}`
  });
  saveState();ensureDailySnapshot();renderTools();toast('Sale completed and Vault updated');
}
function saleListingText(item){
  const condition=item.condition||'';
  const set=item.card?.set||'';
  const number=item.card?.number||'';
  const rarity=item.card?.rarity||'';
  const title=[item.name,set,number,condition].filter(Boolean).join(' • ');
  const body=[
    `${item.name}${set?` from ${set}`:''}${number?` #${number}`:''}.`,
    rarity?`Rarity: ${rarity}.`:'',
    condition?`Condition: ${condition}.`:'',
    `Quantity: ${item.qty}.`,
    `Asking: ${money(Number(item.priceEach))} each.`,
    `Please review photos/details before purchase.`
  ].filter(Boolean).join(' ');
  return {title,body};
}
async function copySaleListing(id){
  const item=state.saleQueue.find(x=>x.uid===id)||state.sales.find(x=>x.uid===id);if(!item)return;
  const t=saleListingText(item);
  const text=`${t.title}\n\n${t.body}`;
  try{await navigator.clipboard.writeText(text);toast('Listing copy copied')}
  catch{prompt('Copy listing text:',text)}
}
function soldAnalytics(){
  const rows=state.sales||[];
  const gross=rows.reduce((n,x)=>n+(Number(x.gross)||0),0);
  const net=rows.reduce((n,x)=>n+(Number(x.net)||0),0);
  const profit=rows.reduce((n,x)=>n+(Number(x.profit)||0),0);
  const fees=rows.reduce((n,x)=>n+(Number(x.fees)||0),0);
  const units=rows.reduce((n,x)=>n+(Number(x.qty)||0),0);
  return {gross,net,profit,fees,units,count:rows.length};
}
function duplicateSaleSuggestions(){
  return state.collection
    .filter(i=>(Number(i.qty)||0)>1)
    .map(i=>({item:i,extras:(Number(i.qty)||0)-1,value:(Number(i.card?.market)||0)}))
    .sort((a,b)=>b.value-a.value)
    .slice(0,10);
}
function queueDuplicateForSale(id){
  const i=state.collection.find(x=>x.uid===id);if(!i)return;
  sellDraftSource=`collection|${id}`;
  renderTools();
  toast('Duplicate loaded into Sell Lab');
}
function removeSaleHistory(id){
  state.sales=state.sales.filter(x=>x.uid!==id);saveState();renderTools();
}



function ensureFamilySchema(){
  if(!Array.isArray(state.collectorProfiles) || !state.collectorProfiles.length){
    state.collectorProfiles=[{uid:'collector-household',name:'Household',role:'Shared',accent:'blue'}];
  }
  if(!Array.isArray(state.giveawayLocker)) state.giveawayLocker=[];
  if(!Array.isArray(state.contentQueue)) state.contentQueue=[];
  const fallback=state.collectorProfiles[0].uid;
  for(const i of state.collection||[]) if(!i.ownerProfileId) i.ownerProfileId=fallback;
  for(const i of state.sealed||[]) if(!i.ownerProfileId) i.ownerProfileId=fallback;
  for(const w of state.wishlist||[]) if(!w.ownerProfileId) w.ownerProfileId=fallback;
  if(!state.collectorProfiles.some(p=>p.uid===activeCollectorProfileId)) activeCollectorProfileId=fallback;
}
function collectorById(id){
  ensureFamilySchema();
  return state.collectorProfiles.find(p=>p.uid===id)||state.collectorProfiles[0];
}
function collectorStats(profileId){
  const cards=(state.collection||[]).filter(i=>i.ownerProfileId===profileId);
  const sealed=(state.sealed||[]).filter(i=>i.ownerProfileId===profileId);
  const cardQty=cards.reduce((n,i)=>n+(Number(i.qty)||0),0);
  const cardValue=cards.reduce((n,i)=>n+(Number(i.card?.market)||0)*(Number(i.qty)||0),0);
  const sealedQty=sealed.reduce((n,i)=>n+(Number(i.qty)||0),0);
  const sealedValue=sealed.reduce((n,i)=>n+(Number(i.current)||0)*(Number(i.qty)||0),0);
  return {cards:cardQty,sealed:sealedQty,value:cardValue+sealedValue,cardValue,sealedValue};
}
function addCollectorProfile(){
  const name=(prompt('Collector name','')||'').trim();if(!name)return;
  const role=(prompt('Role / label','Collector')||'Collector').trim();
  const profile={uid:uid(),name,role,accent:'blue',createdAt:new Date().toISOString()};
  state.collectorProfiles.push(profile);
  activeCollectorProfileId=profile.uid;
  saveState();renderTools();toast('Collector profile added');
}
function editCollectorProfile(id){
  const p=collectorById(id);if(!p)return;
  const name=prompt('Collector name',p.name);if(name!==null && name.trim())p.name=name.trim();
  const role=prompt('Role / label',p.role||'Collector');if(role!==null)p.role=role.trim()||'Collector';
  saveState();renderTools();
}
function deleteCollectorProfile(id){
  ensureFamilySchema();
  if(state.collectorProfiles.length<=1){toast('Keep at least one collector profile');return;}
  const p=collectorById(id);
  const fallback=state.collectorProfiles.find(x=>x.uid!==id);
  if(!confirm(`Delete ${p.name}? Their items will move to ${fallback.name}.`))return;
  for(const i of state.collection||[]) if(i.ownerProfileId===id)i.ownerProfileId=fallback.uid;
  for(const i of state.sealed||[]) if(i.ownerProfileId===id)i.ownerProfileId=fallback.uid;
  for(const w of state.wishlist||[]) if(w.ownerProfileId===id)w.ownerProfileId=fallback.uid;
  state.collectorProfiles=state.collectorProfiles.filter(x=>x.uid!==id);
  if(activeCollectorProfileId===id) activeCollectorProfileId=fallback.uid;
  saveState();renderTools();
}
function setActiveCollector(id){
  activeCollectorProfileId=id;
  renderTools();
}
function moveCollectionOwner(itemId){
  const item=state.collection.find(x=>x.uid===itemId);if(!item)return;
  const opts=state.collectorProfiles.map(p=>p.name).join(', ');
  const name=(prompt(`Move to which collector?\n${opts}`,collectorById(item.ownerProfileId).name)||'').trim();
  const p=state.collectorProfiles.find(x=>x.name.toLowerCase()===name.toLowerCase());
  if(!p){toast('Collector not found');return;}
  item.ownerProfileId=p.uid;saveState();renderTools();toast('Card moved');
}
function moveSealedOwner(itemId){
  const item=state.sealed.find(x=>x.uid===itemId);if(!item)return;
  const opts=state.collectorProfiles.map(p=>p.name).join(', ');
  const name=(prompt(`Move to which collector?\n${opts}`,collectorById(item.ownerProfileId).name)||'').trim();
  const p=state.collectorProfiles.find(x=>x.name.toLowerCase()===name.toLowerCase());
  if(!p){toast('Collector not found');return;}
  item.ownerProfileId=p.uid;saveState();renderTools();toast('Sealed item moved');
}
function transferDuplicateToCollector(itemId,targetId){
  const item=state.collection.find(x=>x.uid===itemId);if(!item || Number(item.qty)<2)return;
  const target=collectorById(targetId);
  item.qty-=1;
  const existing=state.collection.find(x=>
    x.card?.id===item.card?.id &&
    x.ownerProfileId===targetId &&
    (x.format||'Raw')===(item.format||'Raw') &&
    x.condition===item.condition &&
    x.location===item.location
  );
  if(existing) existing.qty+=1;
  else state.collection.unshift({...item,uid:uid(),qty:1,ownerProfileId:targetId});
  saveState();renderTools();toast(`Moved one copy to ${target.name}`);
}
function addGiveawayFromCollection(itemId){
  const i=state.collection.find(x=>x.uid===itemId);if(!i)return;
  const qty=Math.min(Number(i.qty)||1,Math.max(1,Number(prompt('How many copies for the giveaway?','1'))||1));
  state.giveawayLocker.unshift({
    uid:uid(),source:'collection',sourceId:i.uid,name:i.card?.name||'Card',
    card:i.card,qty,valueEach:Number(i.card?.market)||0,status:'Reserved',
    createdAt:new Date().toISOString(),notes:''
  });
  saveState();renderTools();toast('Added to Giveaway Locker');
}
function addGiveawayFromSealed(itemId){
  const i=state.sealed.find(x=>x.uid===itemId);if(!i)return;
  const qty=Math.min(Number(i.qty)||1,Math.max(1,Number(prompt('How many for the giveaway?','1'))||1));
  state.giveawayLocker.unshift({
    uid:uid(),source:'sealed',sourceId:i.uid,name:i.name,game:i.game,
    qty,valueEach:Number(i.current)||0,status:'Reserved',
    createdAt:new Date().toISOString(),notes:''
  });
  saveState();renderTools();toast('Added to Giveaway Locker');
}
function updateGiveawayStatus(id,status){
  const g=state.giveawayLocker.find(x=>x.uid===id);if(!g)return;
  if(status==='Sent'){
    if(!confirm('Mark giveaway sent and remove the reserved quantity from Vault inventory?'))return;
    if(g.source==='collection'){
      const src=state.collection.find(x=>x.uid===g.sourceId);
      if(src)src.qty=Math.max(0,(Number(src.qty)||0)-(Number(g.qty)||0));
    }else if(g.source==='sealed'){
      const src=state.sealed.find(x=>x.uid===g.sourceId);
      if(src)src.qty=Math.max(0,(Number(src.qty)||0)-(Number(g.qty)||0));
    }
    state.collection=state.collection.filter(x=>(Number(x.qty)||0)>0);
    state.sealed=state.sealed.filter(x=>(Number(x.qty)||0)>0);
    g.sentAt=new Date().toISOString();
  }
  g.status=status;
  saveState();renderTools();
}
function removeGiveaway(id){
  state.giveawayLocker=state.giveawayLocker.filter(x=>x.uid!==id);saveState();renderTools();
}
function giveawayStats(){
  const rows=state.giveawayLocker||[];
  return {
    reserved:rows.filter(x=>x.status==='Reserved').length,
    ready:rows.filter(x=>x.status==='Ready').length,
    sent:rows.filter(x=>x.status==='Sent').length,
    value:rows.filter(x=>x.status!=='Sent').reduce((n,x)=>n+(Number(x.valueEach)||0)*(Number(x.qty)||0),0)
  };
}
function addContentIdea(){
  const title=(prompt('Video / content idea','')||'').trim();if(!title)return;
  const platform=(prompt('Platform','YouTube / TikTok / Facebook')||'').trim();
  const type=(prompt('Type','Pack opening')||'Pack opening').trim();
  state.contentQueue.unshift({uid:uid(),title,platform,type,status:'Idea',date:'',notes:'',createdAt:new Date().toISOString()});
  saveState();renderTools();
}
function addContentFromRip(id){
  const s=ripSessionById(id);if(!s)return;
  state.contentQueue.unshift({
    uid:uid(),title:s.name,platform:'YouTube / TikTok / Facebook',type:'Rip Session',
    status:'Ready to edit',date:s.date||todayInput(),
    notes:`${s.packs||0} packs • ${money(ripSessionStats(s).totalValue)} pull value`,
    ripSessionId:s.uid,createdAt:new Date().toISOString()
  });
  saveState();renderTools();toast('Rip added to Content Queue');
}
function updateContentStatus(id,status){
  const c=state.contentQueue.find(x=>x.uid===id);if(!c)return;
  c.status=status;saveState();renderTools();
}
function editContentIdea(id){
  const c=state.contentQueue.find(x=>x.uid===id);if(!c)return;
  const title=prompt('Title / idea',c.title);if(title!==null && title.trim())c.title=title.trim();
  const notes=prompt('Notes',c.notes||'');if(notes!==null)c.notes=notes;
  const date=prompt('Planned date YYYY-MM-DD',c.date||'');if(date!==null)c.date=date;
  saveState();renderTools();
}
function removeContentIdea(id){
  state.contentQueue=state.contentQueue.filter(x=>x.uid!==id);saveState();renderTools();
}
function buildShowcaseData(profileId){
  const p=collectorById(profileId);
  const cards=(state.collection||[]).filter(i=>i.ownerProfileId===profileId)
    .map(i=>({name:i.card?.name,set:i.card?.set,number:i.card?.number,qty:i.qty,market:i.card?.market,image:i.card?.image,format:i.format||'Raw'}));
  const sealed=(state.sealed||[]).filter(i=>i.ownerProfileId===profileId)
    .map(i=>({name:i.name,game:i.game,qty:i.qty,current:i.current}));
  return {brand:'VaultSignal',collector:p.name,role:p.role,cards,sealed,generatedAt:new Date().toISOString()};
}
function exportCollectorShowcase(profileId){
  const data=buildShowcaseData(profileId);
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  a.download=`2gen-showcase-${normalizeName(data.collector).replace(/\s+/g,'-')||'collector'}.json`;
  a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}



function ensureActionSchema(){
  if(!state.actionSnoozes || typeof state.actionSnoozes!=='object') state.actionSnoozes={};
}
function daysSince(value){
  if(!value) return null;
  const t=new Date(value).getTime();
  if(!Number.isFinite(t)) return null;
  return Math.max(0,(Date.now()-t)/86400000);
}
function actionIsSnoozed(id){
  ensureActionSchema();
  const until=state.actionSnoozes[id];
  if(!until) return false;
  if(new Date(until).getTime()<=Date.now()){
    delete state.actionSnoozes[id];
    return false;
  }
  return true;
}
function snoozeAction(id,days=7){
  ensureActionSchema();
  const d=new Date();
  d.setDate(d.getDate()+Math.max(1,Number(days)||7));
  state.actionSnoozes[id]=d.toISOString();
  saveState();renderTools();renderHome();toast(`Hidden for ${days} days`);
}
function clearAllActionSnoozes(){
  state.actionSnoozes={};
  saveState();renderTools();renderHome();toast('Hidden actions restored');
}
function actionPriorityRank(priority){
  return priority==='high'?3:priority==='medium'?2:1;
}
function buildActionCenter(includeSnoozed=false){
  ensureActionSchema();
  const actions=[];
  const push=a=>{
    if(!a?.id)return;
    if(!includeSnoozed && actionIsSnoozed(a.id))return;
    actions.push(a);
  };

  // Price targets reached.
  for(const a of state.priceAlerts||[]){
    const s=priceTargetStatus(a);
    if(s.hit){
      push({
        id:`price-hit-${a.uid}`,priority:'high',icon:'↘',category:'Market',
        title:`Price target hit: ${a.card?.name||'Card'}`,
        detail:`Current ${money(Number(a.card?.market))} • target ${money(Number(a.target))}`,
        tool:'market',cta:'Open Market Pulse'
      });
    }
  }

  // Restock Radar heat / high-priority quiet watch.
  for(const w of state.stockWatches||[]){
    const r=watchRadar(w);
    if(r.score>=75){
      push({
        id:`stock-hot-${w.uid}`,priority:'high',icon:'◎',category:'Stock',
        title:`Hot watch: ${w.product}`,
        detail:`Radar ${r.score} • ${r.sightings} sightings • ${r.bestPrice!==null?money(r.bestPrice):'no price yet'}`,
        tab:'stock',watchId:w.uid,cta:'Open Stock Finder'
      });
    }else if((w.priority||'High')==='High' && r.sightings===0){
      push({
        id:`stock-quiet-${w.uid}`,priority:'low',icon:'⌖',category:'Stock',
        title:`No sightings yet: ${w.product}`,
        detail:`High-priority watch • ${w.radius} mi • ${w.retailers?.length||0} retailers`,
        tab:'stock',watchId:w.uid,cta:'Check Hunt Mode'
      });
    }
  }

  // Budget.
  const budget=Number(state.settings.monthlyBudget)||0;
  const spent=monthSpend();
  const left=budget-spent;
  if(budget>0 && left<0){
    push({
      id:'budget-over',priority:'high',icon:'$',category:'Budget',
      title:'Monthly hobby budget exceeded',
      detail:`${money(spent)} spent • ${money(Math.abs(left))} over budget`,
      tool:'budget',cta:'Review spending'
    });
  }else if(budget>0 && left<=budget*.2){
    push({
      id:'budget-low',priority:'medium',icon:'$',category:'Budget',
      title:'Hobby budget is running low',
      detail:`${money(left)} remaining of ${money(budget)}`,
      tool:'budget',cta:'Review budget'
    });
  }

  // Backup freshness.
  const backupDays=daysSince(state.settings?.lastBackupAt);
  if(backupDays===null || backupDays>14){
    push({
      id:'backup-stale',priority:backupDays===null?'medium':'low',icon:'☁',category:'Safety',
      title:backupDays===null?'Create your first Vault backup':'Vault backup is getting old',
      detail:backupDays===null?'Protect your collection data with a local or cloud backup.':`Last backup ${Math.floor(backupDays)} days ago.`,
      tool:'settings',cta:'Backup Vault'
    });
  }

  // Price-refresh freshness.
  const liveCards=uniqueCollectionCards().filter(liveProviderSupported);
  const lastRefresh=state.priceRefreshLog?.[0]?.finished;
  const refreshDays=daysSince(lastRefresh);
  if(liveCards.length && (refreshDays===null || refreshDays>7)){
    push({
      id:'market-refresh',priority:'medium',icon:'↗',category:'Market',
      title:'Refresh your Vault prices',
      detail:refreshDays===null?`${liveCards.length} supported cards can begin price tracking.`:`Last bulk refresh ${Math.floor(refreshDays)} days ago.`,
      tool:'market',cta:'Refresh prices'
    });
  }


  // Product inventory goals and retail opportunities.
  for(const p of state.productCatalog||[]){
    const ps=productStats(p);
    if(ps.gap>0 && ps.watch){
      const iq=vaultIQProductScore(ps.watch);
      if(ps.bestObserved!==null && ps.watch.maxPrice && ps.bestObserved<=Number(ps.watch.maxPrice)){
        push({
          id:`product-buy-${p.uid}`,priority:iq.score>=68?'high':'medium',icon:'◈',category:'Stock',
          title:`Product target available: ${p.name}`,
          detail:`Need ${ps.gap} more • best observed ${money(ps.bestObserved)} • max ${money(Number(ps.watch.maxPrice))}`,
          tool:'products',cta:'Open Product Command'
        });
      }else if(ps.inventoryStatus.label==='RECENTLY SEEN'){
        push({
          id:`product-gap-${p.uid}`,priority:'medium',icon:'◈',category:'Stock',
          title:`Inventory goal gap: ${p.name}`,
          detail:`Own ${ps.ownedQty}/${ps.desiredQty} • recently seen at ${ps.inventoryStatus.count} store source${ps.inventoryStatus.count===1?'':'s'}`,
          tool:'products',cta:'Review product'
        });
      }
    }
  }

  // Near-complete sets.
  for(const s of collectionSetAnalytics().filter(x=>x.total&&x.pct>=80&&x.pct<100).slice(0,5)){
    push({
      id:`set-near-${normalizeName(s.name)}`,priority:s.pct>=95?'high':'medium',icon:'▦',category:'Sets',
      title:`${s.name} is ${s.pct.toFixed(1)}% complete`,
      detail:`${s.owned}/${s.total} unique cards • ${Math.max(0,s.total-s.owned)} remaining`,
      tool:'sets',cta:'Open Set Explorer'
    });
  }

  // Grading follow-up.
  for(const g of state.grading||[]){
    if(String(g.status||'').toLowerCase()==='complete')continue;
    const age=daysSince(g.date);
    if(age!==null && age>=30){
      push({
        id:`grading-${g.uid}`,priority:age>=60?'medium':'low',icon:'◇',category:'Grading',
        title:`Check grading: ${g.card}`,
        detail:`${g.company} • ${g.status} • tracked ${Math.floor(age)} days`,
        tool:'grading',cta:'Open grading tracker'
      });
    }
  }

  // Sale queue.
  for(const s of state.saleQueue||[]){
    const age=daysSince(s.createdAt);
    if(Number(s.profit)<0){
      push({
        id:`sale-loss-${s.uid}`,priority:'medium',icon:'$',category:'Selling',
        title:`Sale draft loses money: ${s.name}`,
        detail:`Projected profit ${money(Number(s.profit))} • ${s.marketplace}`,
        tool:'sell',cta:'Review Sell Lab'
      });
    }else if(age!==null && age>=7){
      push({
        id:`sale-stale-${s.uid}`,priority:'low',icon:'$',category:'Selling',
        title:`Sale draft waiting: ${s.name}`,
        detail:`Queued ${Math.floor(age)} days • asking ${money(Number(s.priceEach))}`,
        tool:'sell',cta:'Open Sale Queue'
      });
    }
  }

  // Trade proposals.
  for(const t of (state.trades||[]).filter(x=>(x.status||'Completed')==='Proposed')){
    const age=daysSince(t.createdAt||t.date);
    push({
      id:`trade-proposal-${t.uid}`,priority:age!==null&&age>=7?'medium':'low',icon:'⇄',category:'Trading',
      title:`Trade proposal${t.partner?` with ${t.partner}`:''}`,
      detail:`Give ${money(Number(t.valueOut))} • receive ${money(Number(t.valueIn))}${age!==null?` • ${Math.floor(age)} days old`:''}`,
      tool:'trades',cta:'Review Trade Lab'
    });
  }

  // Giveaway locker.
  for(const g of state.giveawayLocker||[]){
    const age=daysSince(g.createdAt);
    if(g.status==='Ready'){
      push({
        id:`giveaway-ready-${g.uid}`,priority:'medium',icon:'🎁',category:'Creator',
        title:`Giveaway ready: ${g.name}`,
        detail:`Qty ${g.qty} • reserved value ${money((Number(g.valueEach)||0)*(Number(g.qty)||0))}`,
        tool:'family',cta:'Open Giveaway Locker'
      });
    }else if(g.status==='Reserved' && age!==null && age>=14){
      push({
        id:`giveaway-old-${g.uid}`,priority:'low',icon:'🎁',category:'Creator',
        title:`Giveaway still reserved: ${g.name}`,
        detail:`Reserved ${Math.floor(age)} days • decide whether to ready or release it`,
        tool:'family',cta:'Review giveaway'
      });
    }
  }

  // Creator content queue.
  for(const c of state.contentQueue||[]){
    const planned=c.date?new Date(`${c.date}T23:59:59`).getTime():null;
    const overdue=planned && planned<Date.now() && c.status!=='Posted';
    if(overdue){
      push({
        id:`content-overdue-${c.uid}`,priority:'medium',icon:'✦',category:'Creator',
        title:`Content date passed: ${c.title}`,
        detail:`${c.platform||'Content'} • ${c.status||'Idea'} • planned ${c.date}`,
        tool:'family',cta:'Open Content Queue'
      });
    }else if(c.status==='Ready to edit'){
      push({
        id:`content-ready-${c.uid}`,priority:'low',icon:'✂',category:'Creator',
        title:`Ready to edit: ${c.title}`,
        detail:`${c.platform||'Content'}${c.date?` • ${c.date}`:''}`,
        tool:'family',cta:'Open Creator Hub'
      });
    }
  }

  actions.sort((a,b)=>actionPriorityRank(b.priority)-actionPriorityRank(a.priority) || a.category.localeCompare(b.category));
  return actions;
}
function actionCounts(actions=buildActionCenter()){
  return {
    total:actions.length,
    high:actions.filter(a=>a.priority==='high').length,
    medium:actions.filter(a=>a.priority==='medium').length,
    low:actions.filter(a=>a.priority==='low').length
  };
}
function openActionItem(id){
  const a=buildActionCenter(true).find(x=>x.id===id);
  if(!a)return;
  if(a.watchId) selectedWatchId=a.watchId;
  if(a.tab){ switchTab(a.tab); return; }
  if(a.tool){ openTool(a.tool); return; }
}
function actionCardMarkup(a,compact=false){
  return `<div class="action-card priority-${a.priority} ${compact?'compact-action':''}">
    <div class="action-icon">${a.icon||'!'}</div>
    <div class="grow">
      <div class="action-meta"><span>${esc(a.category)}</span><b>${esc(a.priority.toUpperCase())}</b></div>
      <strong>${esc(a.title)}</strong>
      <p>${esc(a.detail||'')}</p>
    </div>
    <div class="action-buttons">
      <button class="btn primary" onclick="openActionItem('${a.id}')">${esc(a.cta||'Open')}</button>
      <button class="link-btn" onclick="snoozeAction('${a.id}',7)">Hide 7d</button>
    </div>
  </div>`;
}

function ensureWatchtowerSchema(){
  if(!Array.isArray(state.notificationInbox)) state.notificationInbox=[];
  if(!state.notificationSeenKeys || typeof state.notificationSeenKeys!=='object') state.notificationSeenKeys={};
  state.notificationPrefs={
    enabled:true,
    browserNotifications:false,
    highOnly:false,
    categories:{
      Market:true,Stock:true,Budget:true,Safety:true,Sets:true,
      Grading:true,Selling:true,Trading:true,Creator:true
    },
    ...(state.notificationPrefs||{})
  };
  state.notificationPrefs.categories={
    Market:true,Stock:true,Budget:true,Safety:true,Sets:true,
    Grading:true,Selling:true,Trading:true,Creator:true,
    ...(state.notificationPrefs.categories||{})
  };
}
function watchtowerCategoryEnabled(category){
  ensureWatchtowerSchema();
  return state.notificationPrefs.categories?.[category]!==false;
}
function actionFingerprint(a){
  return `${a.id}|${a.priority}|${a.detail||''}`;
}
function notificationForAction(a){
  return {
    uid:uid(),
    actionId:a.id,
    key:actionFingerprint(a),
    title:a.title,
    detail:a.detail||'',
    priority:a.priority,
    category:a.category,
    icon:a.icon||'!',
    cta:a.cta||'Open',
    tool:a.tool||null,
    tab:a.tab||null,
    watchId:a.watchId||null,
    createdAt:new Date().toISOString(),
    read:false
  };
}
async function showBrowserAlert(n){
  if(!state.notificationPrefs.browserNotifications)return;
  if(!('Notification' in window) || Notification.permission!=='granted')return;
  try{
    if('serviceWorker' in navigator){
      const reg=await navigator.serviceWorker.ready;
      await reg.showNotification(`VaultSignal • ${n.title}`,{
        body:n.detail||n.category,
        icon:'./icon.svg',
        badge:'./icon.svg',
        tag:`2gen-${n.actionId}`,
        data:{url:location.href}
      });
    }else{
      new Notification(`VaultSignal • ${n.title}`,{body:n.detail||n.category});
    }
  }catch{}
}
function evaluateWatchtower({notify=true}={}){
  ensureWatchtowerSchema();
  if(!state.notificationPrefs.enabled){
    watchtowerLastEvaluatedAt=new Date().toISOString();
    return [];
  }

  const actions=buildActionCenter();
  const fresh=[];

  for(const a of actions){
    if(state.notificationPrefs.highOnly && a.priority!=='high')continue;
    if(!watchtowerCategoryEnabled(a.category))continue;
    const key=actionFingerprint(a);
    if(state.notificationSeenKeys[key])continue;

    const n=notificationForAction(a);
    state.notificationInbox.unshift(n);
    state.notificationSeenKeys[key]=n.createdAt;
    fresh.push(n);
  }

  state.notificationInbox=state.notificationInbox.slice(0,200);
  // Keep seen map bounded to roughly the inbox + recent historic events.
  const seenEntries=Object.entries(state.notificationSeenKeys)
    .sort((a,b)=>new Date(b[1])-new Date(a[1]))
    .slice(0,500);
  state.notificationSeenKeys=Object.fromEntries(seenEntries);
  watchtowerLastEvaluatedAt=new Date().toISOString();

  if(fresh.length){
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    if(notify){
      const important=fresh.filter(x=>x.priority==='high');
      const browserBatch=(important.length?important:fresh).slice(0,3);
      browserBatch.forEach(showBrowserAlert);
    }
  }
  return fresh;
}
function watchtowerUnread(){
  ensureWatchtowerSchema();
  return state.notificationInbox.filter(n=>!n.read).length;
}
function watchtowerHighUnread(){
  ensureWatchtowerSchema();
  return state.notificationInbox.filter(n=>!n.read&&n.priority==='high').length;
}
function openWatchtowerNotification(id){
  const n=state.notificationInbox.find(x=>x.uid===id);if(!n)return;
  n.read=true;saveState();
  if(n.watchId) selectedWatchId=n.watchId;
  if(n.tab){switchTab(n.tab);return;}
  if(n.tool){openTool(n.tool);return;}
  openTool('actions');
}
function markWatchtowerRead(id){
  const n=state.notificationInbox.find(x=>x.uid===id);if(!n)return;
  n.read=true;saveState();renderTools();renderHome();
}
function markAllWatchtowerRead(){
  state.notificationInbox.forEach(n=>n.read=true);saveState();renderTools();renderHome();
}
function clearWatchtowerInbox(){
  if(!state.notificationInbox.length)return;
  if(!confirm('Clear the Watchtower notification inbox?'))return;
  state.notificationInbox=[];saveState();renderTools();renderHome();
}
function resetWatchtowerSignals(){
  if(!confirm('Allow current conditions to generate fresh Watchtower alerts again?'))return;
  state.notificationSeenKeys={};saveState();
  const fresh=evaluateWatchtower({notify:false});
  renderTools();renderHome();toast(`${fresh.length} alerts rebuilt`);
}
async function enableBrowserNotifications(){
  if(!('Notification' in window)){
    toast('Browser notifications are not supported on this device/browser');
    return;
  }
  try{
    const result=await Notification.requestPermission();
    state.notificationPrefs.browserNotifications=result==='granted';
    saveState();renderTools();
    if(result==='granted'){
      toast('Browser notifications enabled while supported by the PWA');
      await showBrowserAlert({
        actionId:'test',title:'Watchtower enabled',
        detail:'VaultSignal can now surface supported alerts when the app is active/opened.'
      });
    }else toast('Notification permission was not granted');
  }catch(e){toast('Could not request notification permission')}
}
function disableBrowserNotifications(){
  state.notificationPrefs.browserNotifications=false;saveState();renderTools();toast('Browser alerts disabled in VaultSignal');
}
function toggleWatchtowerPref(key){
  if(key==='enabled') state.notificationPrefs.enabled=!state.notificationPrefs.enabled;
  else if(key==='highOnly') state.notificationPrefs.highOnly=!state.notificationPrefs.highOnly;
  saveState();renderTools();
}
function toggleWatchtowerCategory(category){
  state.notificationPrefs.categories[category]=!watchtowerCategoryEnabled(category);
  saveState();renderTools();
}
function watchtowerNotificationMarkup(n){
  return `<div class="watchtower-row ${n.read?'read':'unread'} priority-${n.priority}">
    <div class="watchtower-icon">${n.icon||'!'}</div>
    <div class="grow">
      <div class="action-meta"><span>${esc(n.category)}</span><b>${esc(n.priority.toUpperCase())}</b>${!n.read?`<i>NEW</i>`:''}</div>
      <strong>${esc(n.title)}</strong>
      <p>${esc(n.detail||'')}</p>
      <small>${humanAge(n.createdAt)}</small>
    </div>
    <div class="right">
      <button class="btn primary" onclick="openWatchtowerNotification('${n.uid}')">${esc(n.cta||'Open')}</button>
      ${!n.read?`<button class="link-btn" onclick="markWatchtowerRead('${n.uid}')">Mark read</button>`:''}
    </div>
  </div>`;
}

function ensureShowcaseSchema(){
  state.showcaseSettings={
    title:'VaultSignal Showcase',
    bio:'Two Generations. One Collection.',
    featuredCardIds:[],
    showCollectionValue:true,
    showWishlist:true,
    showTradeDuplicates:true,
    showSealed:true,
    showSetProgress:true,
    ...(state.showcaseSettings||{})
  };
  if(!Array.isArray(state.showcaseSettings.featuredCardIds)) state.showcaseSettings.featuredCardIds=[];
}
function showcaseProfile(){
  ensureFamilySchema();ensureShowcaseSchema();
  const id=showcasePreviewProfileId||activeCollectorProfileId||state.collectorProfiles[0].uid;
  return collectorById(id);
}
function showcaseCards(profileId){
  return (state.collection||[]).filter(i=>i.ownerProfileId===profileId);
}
function showcaseSealed(profileId){
  return (state.sealed||[]).filter(i=>i.ownerProfileId===profileId);
}
function showcaseWishlist(profileId){
  return (state.wishlist||[]).filter(w=>!w.ownerProfileId || w.ownerProfileId===profileId);
}
function showcaseFeatured(profileId){
  const ids=new Set(state.showcaseSettings.featuredCardIds||[]);
  const cards=showcaseCards(profileId);
  const explicit=cards.filter(i=>ids.has(i.uid));
  if(explicit.length) return explicit.slice(0,9);
  return cards.slice().sort((a,b)=>
    ((Number(b.card?.market)||0)*(Number(b.qty)||0))-
    ((Number(a.card?.market)||0)*(Number(a.qty)||0))
  ).slice(0,9);
}
function toggleShowcaseFeatured(itemId){
  ensureShowcaseSchema();
  const arr=state.showcaseSettings.featuredCardIds;
  const idx=arr.indexOf(itemId);
  if(idx>=0) arr.splice(idx,1);
  else{
    if(arr.length>=9){toast('Showcase supports up to 9 featured cards');return;}
    arr.push(itemId);
  }
  saveState();renderTools();
}
function setShowcaseProfile(id){
  showcasePreviewProfileId=id;renderTools();
}
function editShowcaseText(){
  ensureShowcaseSchema();
  const title=prompt('Showcase title',state.showcaseSettings.title||'VaultSignal Showcase');
  if(title!==null && title.trim()) state.showcaseSettings.title=title.trim();
  const bio=prompt('Short showcase bio',state.showcaseSettings.bio||'');
  if(bio!==null) state.showcaseSettings.bio=bio.trim();
  saveState();renderTools();
}
function toggleShowcaseSetting(key){
  ensureShowcaseSchema();
  state.showcaseSettings[key]=!state.showcaseSettings[key];
  saveState();renderTools();
}
function publicShowcasePayload(profileId){
  ensureShowcaseSchema();
  const p=collectorById(profileId);
  const cards=showcaseCards(profileId);
  const sealed=showcaseSealed(profileId);
  const featured=showcaseFeatured(profileId);
  const wishlist=showcaseWishlist(profileId);
  const dupes=cards.filter(i=>(Number(i.qty)||0)>1);
  const sets=collectionSetAnalytics().filter(x=>x.total).slice(0,8);
  const stats=collectorStats(profileId);

  return {
    brand:'VaultSignal',
    title:state.showcaseSettings.title,
    bio:state.showcaseSettings.bio,
    collector:{name:p.name,role:p.role},
    stats:{
      cards:stats.cards,sealed:stats.sealed,
      value:state.showcaseSettings.showCollectionValue?stats.value:null
    },
    featured:featured.map(i=>({
      name:i.card?.name||'Card',set:i.card?.set||'',number:i.card?.number||'',
      rarity:i.card?.rarity||'',image:i.card?.image||'',
      qty:Number(i.qty)||0,format:i.format||'Raw',
      market:state.showcaseSettings.showCollectionValue?(Number(i.card?.market)||0):null
    })),
    sealed:state.showcaseSettings.showSealed?sealed.map(i=>({
      name:i.name,game:i.game,qty:Number(i.qty)||0,
      current:state.showcaseSettings.showCollectionValue?(Number(i.current)||0):null
    })):[],
    wishlist:state.showcaseSettings.showWishlist?wishlist.slice(0,12).map(w=>({
      name:w.card?.name||'Card',set:w.card?.set||'',number:w.card?.number||'',
      image:w.card?.image||''
    })):[],
    tradeDuplicates:state.showcaseSettings.showTradeDuplicates?dupes.slice(0,12).map(i=>({
      name:i.card?.name||'Card',set:i.card?.set||'',number:i.card?.number||'',
      extras:Math.max(0,(Number(i.qty)||0)-1),image:i.card?.image||''
    })):[],
    sets:state.showcaseSettings.showSetProgress?sets.map(s=>({
      name:s.name,owned:s.owned,total:s.total,pct:s.pct
    })):[],
    generatedAt:new Date().toISOString()
  };
}
function showcaseSafeText(v=''){
  return String(v).replace(/[<>&"]/g,m=>({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;' }[m]));
}
function standaloneShowcaseHtml(payload){
  const p=payload;
  const moneyHtml=v=>v===null||v===undefined?'':`$${Number(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const cards=p.featured.map(c=>`<article class="card">${c.image?`<img src="${showcaseSafeText(c.image)}" alt="${showcaseSafeText(c.name)}">`:`<div class="noimg">2G</div>`}<div><b>${showcaseSafeText(c.name)}</b><span>${showcaseSafeText(c.set)}${c.number?' • #'+showcaseSafeText(c.number):''}</span><small>${showcaseSafeText(c.format)}${c.market!==null?' • '+moneyHtml(c.market):''}</small></div></article>`).join('');
  const sealed=p.sealed.map(s=>`<li><b>${showcaseSafeText(s.name)}</b><span>${showcaseSafeText(s.game)} • Qty ${s.qty}${s.current!==null?' • '+moneyHtml(s.current):''}</span></li>`).join('');
  const wish=p.wishlist.map(w=>`<li><b>${showcaseSafeText(w.name)}</b><span>${showcaseSafeText(w.set)}${w.number?' • #'+showcaseSafeText(w.number):''}</span></li>`).join('');
  const trade=p.tradeDuplicates.map(d=>`<li><b>${showcaseSafeText(d.name)}</b><span>${showcaseSafeText(d.set)} • ${d.extras} extra</span></li>`).join('');
  const sets=p.sets.map(s=>`<li><div><b>${showcaseSafeText(s.name)}</b><span>${s.owned}/${s.total} • ${Number(s.pct).toFixed(1)}%</span></div><i><em style="width:${Math.min(100,Number(s.pct)||0)}%"></em></i></li>`).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${showcaseSafeText(p.title)}</title><style>
  *{box-sizing:border-box}body{margin:0;background:#08101c;color:#f4f7ff;font-family:Arial,sans-serif}.wrap{max-width:980px;margin:auto;padding:24px}.hero{border:1px solid #1b2d46;background:radial-gradient(circle at 90% 0,#143a72 0,transparent 38%),#0c1624;border-radius:24px;padding:24px}.brand{font-size:12px;letter-spacing:.14em;color:#79a6ff;font-weight:800}.hero h1{font-size:34px;margin:10px 0 5px}.hero p{color:#9eb0c7;margin:0}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px}.stat{border:1px solid #203149;border-radius:16px;padding:14px;background:#0a1320}.stat span{display:block;font-size:11px;color:#8396af}.stat b{display:block;font-size:22px;margin-top:5px}.section{margin-top:24px}.section h2{font-size:18px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.card{display:flex;gap:10px;border:1px solid #1b2d46;background:#0b1421;border-radius:16px;padding:10px}.card img,.noimg{width:76px;height:106px;object-fit:cover;border-radius:9px}.noimg{display:grid;place-items:center;background:#142338;color:#79a6ff;font-weight:900}.card b,.card span,.card small{display:block}.card b{font-size:13px}.card span,.card small{font-size:10px;color:#8fa1b8;margin-top:5px}ul{list-style:none;padding:0;margin:0}li{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #17283d;padding:10px 0}li span{font-size:11px;color:#8fa1b8}li div{width:100%}li i{display:block;width:100%;height:6px;background:#122034;border-radius:999px;margin-top:7px;overflow:hidden}li em{display:block;height:100%;background:#2f79ff}.foot{margin-top:30px;color:#637890;font-size:10px;text-align:center}@media(max-width:720px){.grid{grid-template-columns:1fr}.stats{grid-template-columns:1fr 1fr}.hero h1{font-size:28px}}
  </style></head><body><main class="wrap"><section class="hero"><div class="brand">2GEN VAULT • BY 2GEN RIPS</div><h1>${showcaseSafeText(p.collector.name)}</h1><p>${showcaseSafeText(p.collector.role)} • ${showcaseSafeText(p.bio||'')}</p><div class="stats"><div class="stat"><span>Cards</span><b>${p.stats.cards}</b></div><div class="stat"><span>Sealed</span><b>${p.stats.sealed}</b></div>${p.stats.value!==null?`<div class="stat"><span>Tracked value</span><b>${moneyHtml(p.stats.value)}</b></div>`:''}</div></section>
  ${cards?`<section class="section"><h2>Featured Cards</h2><div class="grid">${cards}</div></section>`:''}
  ${sealed?`<section class="section"><h2>Sealed Collection</h2><ul>${sealed}</ul></section>`:''}
  ${wish?`<section class="section"><h2>Wishlist / Hunt List</h2><ul>${wish}</ul></section>`:''}
  ${trade?`<section class="section"><h2>Available Duplicates</h2><ul>${trade}</ul></section>`:''}
  ${sets?`<section class="section"><h2>Set Progress</h2><ul>${sets}</ul></section>`:''}
  <div class="foot">Generated privately from VaultSignal. Cost basis, cert numbers, addresses, ZIP/postal code and private notes are not included.</div></main></body></html>`;
}
function downloadShowcaseHtml(){
  const p=showcaseProfile();
  const payload=publicShowcasePayload(p.uid);
  const html=standaloneShowcaseHtml(payload);
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([html],{type:'text/html'}));
  a.download=`2gen-vault-showcase-${normalizeName(p.name).replace(/\s+/g,'-')||'collector'}.html`;
  a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  toast('Standalone showcase exported');
}
function downloadShowcaseJson(){
  const p=showcaseProfile();
  const payload=publicShowcasePayload(p.uid);
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  a.download=`2gen-vault-showcase-${normalizeName(p.name).replace(/\s+/g,'-')||'collector'}.json`;
  a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function showcaseShareText(){
  const p=showcaseProfile(), data=publicShowcasePayload(p.uid);
  const value=data.stats.value!==null?` • ${money(data.stats.value)} tracked value`:'';
  const wish=data.wishlist.length?`\nHunting: ${data.wishlist.slice(0,5).map(x=>x.name).join(', ')}`:'';
  const trade=data.tradeDuplicates.length?`\nFor trade: ${data.tradeDuplicates.slice(0,5).map(x=>`${x.name} (${x.extras} extra)`).join(', ')}`:'';
  return `${data.title}\n${data.collector.name} • ${data.stats.cards} cards • ${data.stats.sealed} sealed${value}${wish}${trade}\n\nTwo Generations. One Collection.`;
}
async function shareShowcase(){
  const text=showcaseShareText();
  try{
    if(navigator.share){
      await navigator.share({title:state.showcaseSettings.title,text});
    }else if(navigator.clipboard){
      await navigator.clipboard.writeText(text);toast('Showcase summary copied');
    }else prompt('Copy showcase summary:',text);
  }catch(e){}
}
function renderShowcaseCard(i,selected){
  return `<button class="showcase-pick ${selected?'selected':''}" onclick="toggleShowcaseFeatured('${i.uid}')">
    ${cardArt(i.card)}
    <span>${esc(i.card?.name||'Card')}</span>
    <small>${selected?'✓ Featured':'Tap to feature'}</small>
  </button>`;
}
function renderShowcaseStudio(){
  ensureShowcaseSchema();ensureFamilySchema();
  const p=showcaseProfile();
  const data=publicShowcasePayload(p.uid);
  const cards=showcaseCards(p.uid);
  const selectedIds=new Set(state.showcaseSettings.featuredCardIds||[]);
  const featured=showcaseFeatured(p.uid);

  return `<div class="panel showcase-hero">
    <div class="section-head"><div><div class="eyebrow">2GEN SHOWCASE STUDIO</div><h2>Collection Passport</h2><p>Create a clean, privacy-safe collector page from the collection you already track.</p></div><button class="btn" onclick="editShowcaseText()">Edit title & bio</button></div>

    <div class="collector-tabs">${state.collectorProfiles.map(x=>`<button class="collector-tab ${x.uid===p.uid?'active':''}" onclick="setShowcaseProfile('${x.uid}')"><b>${esc(x.name)}</b><span>${esc(x.role||'Collector')}</span></button>`).join('')}</div>

    <div class="showcase-passport">
      <div><div class="eyebrow">COLLECTOR PASSPORT</div><h2>${esc(p.name)}</h2><p>${esc(state.showcaseSettings.bio||'')}</p></div>
      <div class="passport-stats">
        <span><b>${data.stats.cards}</b> cards</span>
        <span><b>${data.stats.sealed}</b> sealed</span>
        ${data.stats.value!==null?`<span><b>${money(data.stats.value)}</b> value</span>`:''}
      </div>
    </div>

    <div class="showcase-actions">
      <button class="btn primary" onclick="downloadShowcaseHtml()">⬇ Standalone page</button>
      <button class="btn" onclick="shareShowcase()">Share summary</button>
      <button class="btn" onclick="downloadShowcaseJson()">Export data</button>
    </div>

    <div class="notice" style="margin-top:10px"><span>✓</span><span>Public showcase exports intentionally exclude cost basis, grading cert numbers, addresses, ZIP/postal code, purchase history, private notes and account data.</span></div>
  </div>

  <div class="showcase-grid">
    <div class="panel">
      <div class="section-head"><div><h2>Featured cards</h2><p>Choose up to 9 cards. If none are selected, your highest tracked-value cards are used automatically.</p></div></div>
      ${cards.length?`<div class="showcase-picker">${cards.slice(0,36).map(i=>renderShowcaseCard(i,selectedIds.has(i.uid))).join('')}</div>`:`<div class="empty">No cards assigned to ${esc(p.name)} yet.</div>`}
    </div>

    <div class="panel">
      <div class="section-head"><div><h2>Privacy controls</h2><p>Choose what can appear in your exported public-facing page.</p></div></div>
      <div class="showcase-toggle-list">
        ${[
          ['showCollectionValue','Tracked collection value'],
          ['showWishlist','Wishlist / hunt list'],
          ['showTradeDuplicates','Available duplicates'],
          ['showSealed','Sealed collection'],
          ['showSetProgress','Set completion progress']
        ].map(([k,label])=>`<button class="showcase-toggle ${state.showcaseSettings[k]?'on':'off'}" onclick="toggleShowcaseSetting('${k}')"><b>${state.showcaseSettings[k]?'✓':'○'} ${esc(label)}</b><span>${state.showcaseSettings[k]?'Included':'Hidden'}</span></button>`).join('')}
      </div>
    </div>
  </div>

  <div class="panel showcase-preview-panel">
    <div class="section-head"><div><div class="eyebrow">LIVE PREVIEW</div><h2>${esc(state.showcaseSettings.title)}</h2><p>This is the information that can appear in the export.</p></div></div>
    <div class="showcase-preview-hero">
      <div><strong>${esc(p.name)}</strong><span>${esc(p.role||'Collector')} • ${esc(state.showcaseSettings.bio||'')}</span></div>
      <div><b>${data.stats.cards}</b><span>cards</span></div>
      <div><b>${data.stats.sealed}</b><span>sealed</span></div>
      ${data.stats.value!==null?`<div><b>${money(data.stats.value)}</b><span>tracked value</span></div>`:''}
    </div>

    ${featured.length?`<div class="eyebrow" style="margin-top:14px">FEATURED CARDS</div><div class="showcase-featured">${featured.map(i=>`<div>${cardArt(i.card)}<b>${esc(i.card?.name||'Card')}</b><span>${esc(i.card?.set||'')}</span></div>`).join('')}</div>`:''}

    ${data.wishlist.length?`<div class="showcase-mini-section"><div class="eyebrow">HUNT LIST</div>${data.wishlist.slice(0,6).map(w=>`<span>${esc(w.name)} • ${esc(w.set)}</span>`).join('')}</div>`:''}
    ${data.tradeDuplicates.length?`<div class="showcase-mini-section"><div class="eyebrow">AVAILABLE DUPLICATES</div>${data.tradeDuplicates.slice(0,6).map(d=>`<span>${esc(d.name)} • ${d.extras} extra</span>`).join('')}</div>`:''}
    ${data.sets.length?`<div class="showcase-mini-section"><div class="eyebrow">SET PROGRESS</div>${data.sets.slice(0,5).map(s=>`<div class="kpi-line"><span>${esc(s.name)}</span><strong>${s.owned}/${s.total} • ${Number(s.pct).toFixed(1)}%</strong></div>`).join('')}</div>`:''}
  </div>`;
}


function vaultSignalFeed(){
  ensureWatchtowerSchema();
  const rows=[];
  for(const s of inventoryControlSignals()){
    rows.push({uid:`invctl:${s.title}`,type:'Inventory Control',priority:s.priority||'medium',title:s.title,detail:s.detail||'',ts:new Date().toISOString(),action:s.action||`openTool('inventory')`});
  }
  for(const x of (state.inventoryPulseEvents||[]).slice(0,10)){
    rows.push({uid:`inv:${x.uid||x.ts||x.title}`,type:'Inventory',priority:x.priority||'medium',title:x.title||'Inventory changed',detail:x.detail||x.store||'',ts:x.ts||new Date().toISOString(),action:`switchTab('stock')`});
  }
  for(const n of (state.notificationInbox||[]).filter(x=>!x.read).slice(0,10)){
    rows.push({uid:`alert:${n.uid||n.signalKey||n.createdAt}`,type:n.category||'Alert',priority:n.priority||'medium',title:n.title||'Collector signal',detail:n.detail||'',ts:n.createdAt||n.ts||new Date().toISOString(),action:n.tool?`openTool('${n.tool}')`:`openTool('watchtower')`});
  }
  for(const s of (state.scannerRecentScans||[]).slice(0,5)){
    rows.push({uid:`scan:${s.uid}`,type:'Scanner',priority:'low',title:`Scanned ${s.card?.name||'card'}`,detail:`${s.primarySource||'Pricing source'} • ${s.value?money(s.value):'value unavailable'}`,ts:s.checkedAt||new Date().toISOString(),action:`openTool('scanner')`});
  }
  for(const a of buildActionCenter().slice(0,8)){
    rows.push({uid:`action:${a.id||a.title}`,type:'Action',priority:a.priority||'medium',title:a.title||'Collector action',detail:a.detail||a.description||'',ts:a.ts||new Date().toISOString(),action:a.tool?`openTool('${a.tool}')`:`openTool('actions')`});
  }
  const rank={high:3,medium:2,low:1};
  return rows.sort((a,b)=>(rank[b.priority]||0)-(rank[a.priority]||0)||new Date(b.ts)-new Date(a.ts)).slice(0,24);
}
function vaultSignalStats(){
  const feed=vaultSignalFeed();
  return {
    total:feed.length,
    high:feed.filter(x=>x.priority==='high').length,
    inventory:(state.inventoryPulseEvents||[]).length,
    scans:(state.scannerRecentScans||[]).length
  };
}
function vaultSignalFeedMarkup(){
  const rows=vaultSignalFeed();
  if(!rows.length)return `<div class="empty">No collector signals yet. Scan cards, save watches, run Inventory Radar or add price targets and this feed will populate.</div>`;
  return `<div class="signal-feed">${rows.map(x=>`
    <button class="signal-feed-row ${esc(x.priority)}" onclick="${x.action}">
      <span class="signal-feed-pulse"></span>
      <div class="grow"><div class="eyebrow">${esc(String(x.type).toUpperCase())} • ${esc(String(x.priority).toUpperCase())}</div><strong>${esc(x.title)}</strong><span>${esc(x.detail||'')}</span></div>
      <small>${humanAge(x.ts)}</small>
    </button>`).join('')}</div>`;
}

function renderWatchtowerTool(){
  ensureWatchtowerSchema();
  evaluateWatchtower({notify:false});
  const unread=watchtowerUnread();
  const high=watchtowerHighUnread();
  const categories=Object.keys(state.notificationPrefs.categories||{});

  const vs=vaultSignalStats();
  return `<div class="panel signal-center-hero">
    <div class="section-head"><div><div class="eyebrow">VAULTSIGNAL • SIGNAL CENTER</div><h2>Your collector radar</h2><p>Inventory changes, collector alerts, scanner activity and next actions in one prioritized feed. It surfaces what changed without pretending to predict the market.</p></div><button class="btn primary" onclick="evaluateWatchtower({notify:false});renderTools()">↻ Refresh</button></div>
    <div class="stat-grid compact-stats">
      <div class="stat-card"><span>Active signals</span><strong>${vs.total}</strong><small>Combined feed</small></div>
      <div class="stat-card"><span>High priority</span><strong class="${vs.high?'bad':''}">${vs.high}</strong><small>Review first</small></div>
      <div class="stat-card"><span>Inventory changes</span><strong>${vs.inventory}</strong><small>Inventory Pulse</small></div>
      <div class="stat-card"><span>Recent scans</span><strong>${vs.scans}</strong><small>Scanner history</small></div>
    </div>
    ${vaultSignalFeedMarkup()}
  </div>

  <div class="panel watchtower-hero">
    <div class="section-head"><div><div class="eyebrow">VAULTSIGNAL SIGNAL CENTER</div><h2>Signal inbox</h2><p>Turns Action Center conditions into a persistent alert feed so important collector events do not disappear the next time the app changes state.</p></div><button class="btn" onclick="evaluateWatchtower({notify:true});renderTools()">↻ Check now</button></div>

    <div class="stat-grid compact-stats">
      <div class="stat-card"><span>Unread alerts</span><strong>${unread}</strong><small>${state.notificationInbox.length} saved total</small></div>
      <div class="stat-card"><span>High priority</span><strong class="${high?'bad':''}">${high}</strong><small>Unread high alerts</small></div>
      <div class="stat-card"><span>Watchtower</span><strong>${state.notificationPrefs.enabled?'ON':'OFF'}</strong><small>In-app alert engine</small></div>
      <div class="stat-card"><span>Browser alerts</span><strong>${state.notificationPrefs.browserNotifications?'ON':'OFF'}</strong><small>${'Notification' in window?Notification.permission:'unsupported'}</small></div>
    </div>

    <div class="watchtower-controls">
      <button class="btn ${state.notificationPrefs.enabled?'primary':''}" onclick="toggleWatchtowerPref('enabled')">${state.notificationPrefs.enabled?'✓ Watchtower on':'Watchtower off'}</button>
      <button class="btn ${state.notificationPrefs.highOnly?'primary':''}" onclick="toggleWatchtowerPref('highOnly')">${state.notificationPrefs.highOnly?'✓ High only':'All priorities'}</button>
      ${state.notificationPrefs.browserNotifications
        ? `<button class="btn" onclick="disableBrowserNotifications()">Disable browser alerts</button>`
        : `<button class="btn" onclick="enableBrowserNotifications()">Enable browser alerts</button>`}
      <button class="btn" onclick="markAllWatchtowerRead()">Mark all read</button>
    </div>

    <div class="notice warn" style="margin-top:10px"><span>!</span><span>Browser notifications here are <b>best-effort while the PWA is active/opened or supported by the browser</b>. True server-triggered alerts while the app is fully closed still require the backend push layer.</span></div>
  </div>

  <div class="panel">
    <div class="section-head"><div><h2>Alert categories</h2><p>Choose what Watchtower should turn into notifications.</p></div></div>
    <div class="watchtower-category-grid">
      ${categories.map(c=>`<button class="watchtower-category ${watchtowerCategoryEnabled(c)?'on':'off'}" onclick='toggleWatchtowerCategory(${JSON.stringify(c)})'><b>${watchtowerCategoryEnabled(c)?'✓':'○'} ${esc(c)}</b><span>${watchtowerCategoryEnabled(c)?'Enabled':'Muted'}</span></button>`).join('')}
    </div>
  </div>

  <div class="panel">
    <div class="section-head"><div><h2>Alert inbox</h2><p>Newest collector alerts first.</p></div><div class="action-row"><button class="btn" onclick="resetWatchtowerSignals()">Rebuild current alerts</button><button class="remove" onclick="clearWatchtowerInbox()">Clear inbox</button></div></div>
    ${state.notificationInbox.length?state.notificationInbox.map(watchtowerNotificationMarkup).join(''):`<div class="empty">No Watchtower alerts yet. Use VaultSignal normally and this inbox will populate when tracked conditions become relevant.</div>`}
  </div>`;
}

function renderActionCenterTool(){
  const actions=buildActionCenter();
  const counts=actionCounts(actions);
  const high=actions.filter(a=>a.priority==='high');
  const medium=actions.filter(a=>a.priority==='medium');
  const low=actions.filter(a=>a.priority==='low');

  return `<div class="panel action-center-hero">
    <div class="section-head"><div><div class="eyebrow">VAULTSIGNAL ACTION CENTER</div><h2>What needs your attention</h2><p>One prioritized feed built from your Vault, stock watches, prices, budget, grading, trades, sales and creator workflow.</p></div><button class="btn" onclick="clearAllActionSnoozes()">Restore hidden</button></div>

    <div class="stat-grid compact-stats">
      <div class="stat-card"><span>Open actions</span><strong>${counts.total}</strong><small>Current local priorities</small></div>
      <div class="stat-card"><span>High</span><strong class="${counts.high?'bad':''}">${counts.high}</strong><small>Worth checking first</small></div>
      <div class="stat-card"><span>Medium</span><strong>${counts.medium}</strong><small>Follow-up items</small></div>
      <div class="stat-card"><span>Low</span><strong>${counts.low}</strong><small>Good housekeeping</small></div>
    </div>

    <div class="notice" style="margin-top:10px"><span>ℹ</span><span>Action Center updates when you open/use VaultSignal. It does not claim to send background push alerts while the app is closed yet.</span></div>
  </div>

  <div class="panel daily-brief-panel">
    <div class="section-head"><div><div class="eyebrow">DAILY BRIEF</div><h2>${counts.total?`${counts.total} things to know`:'You are caught up'}</h2><p>${counts.high?`${counts.high} high-priority item${counts.high===1?'':'s'} should be reviewed first.`:'No high-priority actions right now.'}</p></div></div>
    ${actions.length?actions.slice(0,4).map(a=>actionCardMarkup(a,true)).join(''):`<div class="empty">Nothing needs attention right now. Keep collecting.</div>`}
  </div>

  ${high.length?`<div class="panel"><div class="section-head"><div><h2>High priority</h2><p>Time-sensitive or financially important collector actions.</p></div></div>${high.map(a=>actionCardMarkup(a)).join('')}</div>`:''}
  ${medium.length?`<div class="panel"><div class="section-head"><div><h2>Medium priority</h2><p>Useful follow-ups that can improve your next collecting decision.</p></div></div>${medium.map(a=>actionCardMarkup(a)).join('')}</div>`:''}
  ${low.length?`<div class="panel"><div class="section-head"><div><h2>Low priority</h2><p>Maintenance and workflow reminders.</p></div></div>${low.map(a=>actionCardMarkup(a)).join('')}</div>`:''}`;
}

function renderFamilyCreatorHub(){
  ensureFamilySchema();
  const p=collectorById(activeCollectorProfileId);
  const stats=collectorStats(p.uid);
  const cards=(state.collection||[]).filter(i=>i.ownerProfileId===p.uid);
  const sealed=(state.sealed||[]).filter(i=>i.ownerProfileId===p.uid);
  const dupes=cards.filter(i=>(Number(i.qty)||0)>1);
  const gs=giveawayStats();

  return `<div class="panel family-hub-hero">
    <div class="section-head"><div><div class="eyebrow">2GEN FAMILY + CREATOR HUB</div><h2>One household. Separate collections.</h2><p>Track each collector, move cards between family members, reserve giveaways, and turn Rip Sessions into content.</p></div><button class="btn primary" onclick="addCollectorProfile()">＋ Collector</button></div>

    <div class="collector-tabs">${state.collectorProfiles.map(x=>`<button class="collector-tab ${x.uid===p.uid?'active':''}" onclick="setActiveCollector('${x.uid}')"><b>${esc(x.name)}</b><span>${esc(x.role||'Collector')}</span></button>`).join('')}</div>

    <div class="stat-grid compact-stats">
      <div class="stat-card"><span>${esc(p.name)} cards</span><strong>${stats.cards}</strong><small>Tracked copies</small></div>
      <div class="stat-card"><span>Sealed</span><strong>${stats.sealed}</strong><small>Tracked products</small></div>
      <div class="stat-card"><span>Collection value</span><strong>${money(stats.value)}</strong><small>Current tracked fields</small></div>
      <div class="stat-card"><span>Duplicates</span><strong>${dupes.length}</strong><small>Transfer/trade candidates</small></div>
    </div>
    <div class="action-row" style="margin-top:10px"><button class="btn" onclick="editCollectorProfile('${p.uid}')">Edit profile</button><button class="btn" onclick="exportCollectorShowcase('${p.uid}')">Export showcase</button>${state.collectorProfiles.length>1?`<button class="remove" onclick="deleteCollectorProfile('${p.uid}')">Delete profile</button>`:''}</div>
  </div>

  <div class="family-grid">
    <div class="panel">
      <div class="section-head"><div><h2>${esc(p.name)} cards</h2><p>Move ownership without changing the household total.</p></div></div>
      ${cards.length?cards.slice(0,20).map(i=>`<div class="compact-row">${cardArt(i.card)}<div class="grow"><strong>${esc(i.card.name)}</strong><span>${esc(i.card.set)} • Qty ${i.qty} • ${money(Number(i.card.market))}</span></div><div class="right"><button class="link-btn" onclick="moveCollectionOwner('${i.uid}')">Move</button><button class="link-btn" onclick="addGiveawayFromCollection('${i.uid}')">Giveaway</button></div></div>`).join(''):`<div class="empty">No cards assigned to ${esc(p.name)}.</div>`}
    </div>
    <div class="panel">
      <div class="section-head"><div><h2>${esc(p.name)} sealed</h2><p>Separate family sealed collections while keeping one app.</p></div></div>
      ${sealed.length?sealed.slice(0,20).map(i=>`<div class="compact-row"><div class="thumb square"><b>◈</b></div><div class="grow"><strong>${esc(i.name)}</strong><span>${esc(i.game)} • Qty ${i.qty} • ${money(Number(i.current))}</span></div><div class="right"><button class="link-btn" onclick="moveSealedOwner('${i.uid}')">Move</button><button class="link-btn" onclick="addGiveawayFromSealed('${i.uid}')">Giveaway</button></div></div>`).join(''):`<div class="empty">No sealed products assigned to ${esc(p.name)}.</div>`}
    </div>
  </div>

  ${dupes.length && state.collectorProfiles.length>1?`<div class="panel">
    <div class="section-head"><div><h2>Family duplicate transfers</h2><p>Move one extra copy to another collector without treating it as a sale or trade.</p></div></div>
    ${dupes.slice(0,12).map(i=>`<div class="compact-row">${cardArt(i.card)}<div class="grow"><strong>${esc(i.card.name)}</strong><span>${i.qty} owned by ${esc(p.name)} • ${esc(i.card.set)}</span></div><div class="action-row">${state.collectorProfiles.filter(x=>x.uid!==p.uid).map(x=>`<button class="btn" onclick="transferDuplicateToCollector('${i.uid}','${x.uid}')">→ ${esc(x.name)}</button>`).join('')}</div></div>`).join('')}
  </div>`:''}

  <div class="panel giveaway-panel">
    <div class="section-head"><div><div class="eyebrow">GIVEAWAY LOCKER</div><h2>Reserved channel inventory</h2><p>Keep giveaway items separate from normal sell/trade decisions.</p></div></div>
    <div class="meta-grid">
      <div class="meta"><span>Reserved</span><strong>${gs.reserved}</strong></div>
      <div class="meta"><span>Ready</span><strong>${gs.ready}</strong></div>
      <div class="meta"><span>Sent</span><strong>${gs.sent}</strong></div>
      <div class="meta"><span>Reserved value</span><strong>${money(gs.value)}</strong></div>
    </div>
    ${state.giveawayLocker.length?state.giveawayLocker.map(g=>`<div class="giveaway-row">${g.card?cardArt(g.card):`<div class="thumb square"><b>🎁</b></div>`}<div class="grow"><strong>${esc(g.name)}</strong><span>Qty ${g.qty} • ${money(Number(g.valueEach))} ea. • ${esc(g.status)}</span></div><div class="right">${g.status==='Reserved'?`<button class="btn" onclick="updateGiveawayStatus('${g.uid}','Ready')">Ready</button>`:''}${g.status!=='Sent'?`<button class="btn primary" onclick="updateGiveawayStatus('${g.uid}','Sent')">Sent ✓</button>`:''}<button class="remove" onclick="removeGiveaway('${g.uid}')">Delete</button></div></div>`).join(''):`<div class="empty">Reserve a card or sealed product from a collector panel above.</div>`}
  </div>

  <div class="panel creator-panel">
    <div class="section-head"><div><div class="eyebrow">2GEN RIPS CREATOR HUB</div><h2>Content Queue</h2><p>Turn openings into videos without keeping a separate content spreadsheet.</p></div><button class="btn primary" onclick="addContentIdea()">＋ Idea</button></div>

    ${(state.ripSessions||[]).length?`<div class="subpanel"><div class="section-head"><div><h2>Recent Rip Sessions</h2><p>Push an opening directly into the content queue.</p></div></div>${state.ripSessions.slice(0,5).map(s=>`<div class="compact-row"><div class="thumb square"><b>✦</b></div><div class="grow"><strong>${esc(s.name)}</strong><span>${esc(s.date||'')} • ${s.packs||0} packs • ${money(ripSessionStats(s).totalValue)} pull value</span></div><button class="btn" onclick="addContentFromRip('${s.uid}')">Add to content</button></div>`).join('')}</div>`:''}

    ${state.contentQueue.length?state.contentQueue.map(c=>`<div class="content-row"><div class="content-status-icon">${c.status==='Posted'?'✓':c.status==='Ready to edit'?'✂':'✦'}</div><div class="grow"><strong>${esc(c.title)}</strong><span>${esc(c.platform||'')} • ${esc(c.type||'')} • ${esc(c.status||'Idea')}${c.date?' • '+esc(c.date):''}</span>${c.notes?`<span>${esc(c.notes)}</span>`:''}</div><div class="right"><button class="link-btn" onclick="editContentIdea('${c.uid}')">Edit</button>${c.status!=='Ready to edit'&&c.status!=='Posted'?`<button class="btn" onclick="updateContentStatus('${c.uid}','Ready to edit')">Ready</button>`:''}${c.status!=='Posted'?`<button class="btn primary" onclick="updateContentStatus('${c.uid}','Posted')">Posted ✓</button>`:''}<button class="remove" onclick="removeContentIdea('${c.uid}')">Delete</button></div></div>`).join(''):`<div class="empty">No content ideas yet.</div>`}
  </div>`;
}

function renderSellLabTool(){
  ensureSalesSchema();
  const options=saleInventoryOptions();
  if(!sellDraftSource && options.length) sellDraftSource=`${options[0].type}|${options[0].id}`;
  const src=currentSellSource();
  const mp=marketplaceDefaults(sellMarketplace);
  const analytics=soldAnalytics();
  const dupes=duplicateSaleSuggestions();

  const defaults=src? saleMath({
    price:src.market,qty:1,costEach:src.cost,
    feePct:mp.feePct,fixed:mp.fixed,shipping:mp.shipping,supplies:0
  }) : saleMath({});

  return `<div class="panel sell-lab-hero">
    <div class="section-head"><div><div class="eyebrow">2GEN SELL LAB</div><h2>Sell smarter</h2><p>Turn Vault inventory into listings, estimate fees, protect your cost basis and update inventory when something sells.</p></div></div>
    <div class="stat-grid compact-stats">
      <div class="stat-card"><span>Sales logged</span><strong>${analytics.count}</strong><small>${analytics.units} units sold</small></div>
      <div class="stat-card"><span>Gross sales</span><strong>${money(analytics.gross)}</strong><small>Before estimated fees</small></div>
      <div class="stat-card"><span>Net proceeds</span><strong>${money(analytics.net)}</strong><small>After entered fees/costs</small></div>
      <div class="stat-card"><span>Tracked profit</span><strong class="${analytics.profit>=0?'good':'bad'}">${analytics.profit>=0?'+':''}${money(analytics.profit)}</strong><small>${money(analytics.fees)} estimated fees</small></div>
    </div>
    <div class="notice warn" style="margin-top:10px"><span>!</span><span>Fee presets are <b>planning estimates</b>, not guaranteed platform fee schedules. Review the actual marketplace terms before listing.</span></div>
  </div>

  <div class="sell-builder-grid">
    <div class="panel">
      <div class="section-head"><div><h2>Choose inventory</h2><p>Cards and sealed products already tracked in your Vault.</p></div></div>
      ${options.length?`
        <label class="field full"><span>Vault item</span><select onchange="selectSellSource(this.value)">${options.map(o=>`<option value="${esc(o.type+'|'+o.id)}" ${sellDraftSource===o.type+'|'+o.id?'selected':''}>${esc(o.label)} • ${money(o.market)}</option>`).join('')}</select></label>
        ${src?`<div class="sell-selected">${src.card?cardArt(src.card):`<div class="trade-cash-icon">▣</div>`}<div class="grow"><strong>${esc(src.name)}</strong><span>${esc(src.subtitle)} • ${src.owned} owned</span></div><div class="right"><strong>${money(src.market)}</strong><small>market reference</small></div></div>`:''}
      `:`<div class="empty">Add cards or sealed products to your Vault first.</div>`}

      ${dupes.length?`<div class="subpanel" style="margin-top:10px"><div class="section-head"><div><h2>Sell duplicates</h2><p>Extra copies you may want to move.</p></div></div>${dupes.map(d=>`<div class="compact-row">${cardArt(d.item.card)}<div class="grow"><strong>${esc(d.item.card.name)}</strong><span>${d.extras} extra • ${esc(d.item.card.set)} • ${money(d.value)} ea.</span></div><button class="btn" onclick="queueDuplicateForSale('${d.item.uid}')">Load</button></div>`).join('')}</div>`:''}
    </div>

    <div class="panel">
      <div class="section-head"><div><h2>Sale calculator</h2><p>Estimate what you actually keep after fees and selling costs.</p></div></div>
      ${src?`
        <div class="form-grid">
          <label class="field"><span>Marketplace</span><select onchange="setSellMarketplace(this.value)">${Object.keys(SELL_MARKETPLACES).map(n=>`<option ${n===sellMarketplace?'selected':''}>${esc(n)}</option>`).join('')}</select></label>
          <label class="field"><span>Qty</span><input id="sellQty" type="number" min="1" max="${src.owned}" value="1" oninput="updateSellPreview()"></label>
          <label class="field"><span>Sale price EACH</span><input id="sellPrice" type="number" min="0" step=".01" value="${src.market.toFixed(2)}" oninput="updateSellPreview()"></label>
          <label class="field"><span>Your cost EACH</span><input id="sellCost" type="number" min="0" step=".01" value="${src.cost.toFixed(2)}" oninput="updateSellPreview()"></label>
          <label class="field"><span>Fee %</span><input id="sellFeePct" type="number" min="0" step=".01" value="${mp.feePct}" oninput="updateSellPreview()"></label>
          <label class="field"><span>Fixed fee</span><input id="sellFixedFee" type="number" min="0" step=".01" value="${mp.fixed}" oninput="updateSellPreview()"></label>
          <label class="field"><span>Shipping</span><input id="sellShipping" type="number" min="0" step=".01" value="${mp.shipping}" oninput="updateSellPreview()"></label>
          <label class="field"><span>Supplies</span><input id="sellSupplies" type="number" min="0" step=".01" value="0" oninput="updateSellPreview()"></label>
        </div>
        <div class="sell-math-grid">
          <div><span>Gross</span><strong id="sellGrossPreview">${money(defaults.gross)}</strong></div>
          <div><span>Fees</span><strong id="sellFeesPreview">${money(defaults.fees)}</strong></div>
          <div><span>Net proceeds</span><strong id="sellNetPreview">${money(defaults.net)}</strong></div>
          <div><span>Profit</span><strong id="sellProfitPreview" class="${defaults.profit>=0?'good':'bad'}">${money(defaults.profit)}</strong></div>
          <div><span>Break-even EACH</span><strong id="sellBreakEvenPreview">${money(defaults.breakEvenPer)}</strong></div>
          <div><span>ROI</span><strong id="sellRoiPreview" class="${defaults.roi>=0?'good':'bad'}">${defaults.roi.toFixed(1)}%</strong></div>
        </div>
        <div class="notice" style="margin-top:10px"><span>ℹ</span><span>${esc(mp.note)}</span></div>
        <button class="btn primary wide" style="margin-top:10px" onclick="addSaleToQueue()">＋ Add to Sale Queue</button>
      `:`<div class="empty">Choose inventory to calculate a sale.</div>`}
    </div>
  </div>

  <div class="panel">
    <div class="section-head"><div><h2>Sale Queue</h2><p>Draft listings. Nothing leaves your Vault until you mark it sold.</p></div></div>
    ${state.saleQueue.length?state.saleQueue.map(s=>`<div class="sale-queue-row">
      ${s.card?cardArt(s.card):`<div class="trade-cash-icon">▣</div>`}
      <div class="grow"><strong>${esc(s.name)}</strong><span>${esc(s.marketplace)} • Qty ${s.qty} • ${money(Number(s.priceEach))} ea.</span><span>Net ${money(Number(s.net))} • Profit <b class="${Number(s.profit)>=0?'good':'bad'}">${Number(s.profit)>=0?'+':''}${money(Number(s.profit))}</b> • ROI ${Number(s.roi).toFixed(1)}%</span></div>
      <div class="right"><button class="link-btn" onclick="editSaleQueuePrice('${s.uid}')">Price</button><button class="link-btn" onclick="copySaleListing('${s.uid}')">Copy listing</button><button class="btn primary" onclick="completeSale('${s.uid}')">Sold ✓</button><button class="remove" onclick="removeSaleQueueItem('${s.uid}')">Remove</button></div>
    </div>`).join(''):`<div class="empty">No draft listings yet.</div>`}
  </div>

  <div class="panel">
    <div class="section-head"><div><h2>Sales History</h2><p>Completed sales and tracked profit.</p></div></div>
    ${state.sales.length?state.sales.map(s=>`<div class="sale-history-row">
      ${s.card?cardArt(s.card):`<div class="trade-cash-icon">$</div>`}
      <div class="grow"><strong>${esc(s.name)}</strong><span>${esc(s.marketplace)} • ${esc(s.date||'')} • Qty ${s.qty}</span><span>Gross ${money(Number(s.gross))} • Net ${money(Number(s.net))} • Profit <b class="${Number(s.profit)>=0?'good':'bad'}">${Number(s.profit)>=0?'+':''}${money(Number(s.profit))}</b></span></div>
      <div class="right"><strong>${money(Number(s.priceEach))}</strong><small>sale price ea.</small><button class="link-btn" onclick="copySaleListing('${s.uid}')">Listing copy</button><button class="remove" onclick="removeSaleHistory('${s.uid}')">Delete</button></div>
    </div>`).join(''):`<div class="empty">No completed sales yet.</div>`}
  </div>`;
}

function renderTradesTool(){
  const a=tradeAnalysis();
  const owned=ownedTradeOptions();
  const duplicates=state.collection.filter(i=>(Number(i.qty)||0)>1).slice(0,10);
  return `<div class="panel trade-lab-hero">
    <div class="section-head"><div><div class="eyebrow">2GEN TRADE LAB</div><h2>Fair-trade builder</h2><p>Build both sides from your Vault, wishlist or live card data, then compare reference values before making a deal.</p></div><button class="btn" onclick="clearTradeBuilder()">Clear builder</button></div>

    <div class="trade-score-grid">
      <div class="trade-value-card"><span>You give</span><strong>${money(a.out)}</strong><small>${tradeGiveDraft.reduce((n,i)=>n+(Number(i.qty)||0),0)} item${tradeGiveDraft.reduce((n,i)=>n+(Number(i.qty)||0),0)===1?'':'s'}</small></div>
      <div class="trade-fairness ${a.fairness>=95?'balanced':a.fairness>=85?'close':'review'}"><span>Reference balance</span><strong>${a.fairness.toFixed(1)}%</strong><b>${esc(a.label)}</b></div>
      <div class="trade-value-card"><span>You receive</span><strong>${money(a.incoming)}</strong><small>${tradeReceiveDraft.reduce((n,i)=>n+(Number(i.qty)||0),0)} item${tradeReceiveDraft.reduce((n,i)=>n+(Number(i.qty)||0),0)===1?'':'s'}</small></div>
    </div>

    <div class="trade-balance-note ${a.delta>=0?'good-side':'give-side'}">
      <b>${esc(a.weaker)}</b>
      <span>${a.need?`${money(a.need)} reference-value difference.`:'Both sides are even at the current entered values.'}</span>
    </div>

    <div class="notice warn" style="margin-top:10px"><span>!</span><span>Trade Lab compares <b>reference market values</b>. Condition, grading, exact variant, liquidity, fees and what each collector actually wants can make a perfectly reasonable trade differ from the numbers.</span></div>
  </div>

  <div class="trade-builder-grid">
    <div class="panel">
      <div class="section-head"><div><h2>Your side</h2><p>Add cards or sealed products you own.</p></div><div class="action-row"><button class="btn" onclick="addManualTradeItem('give')">＋ Manual</button><button class="btn" onclick="addCashAdjustment('give')">$ Cash</button></div></div>
      ${owned.length?`<div class="trade-add-row"><select id="tradeOwnedSelect">${owned.map(o=>`<option value="${esc(o.type+'|'+o.sourceId)}">${esc(o.label)} • ${money(o.valueEach)}</option>`).join('')}</select><input id="tradeOwnedQty" type="number" min="1" value="1"><button class="btn primary" onclick="addOwnedTradeItem()">Add</button></div>`:`<div class="empty">No cards or sealed products in your Vault yet.</div>`}
      <div class="trade-draft-list">${tradeGiveDraft.length?tradeGiveDraft.map(i=>renderTradeDraftItem(i,'give')).join(''):`<div class="empty">Nothing on your side yet.</div>`}</div>

      ${duplicates.length?`<div class="subpanel" style="margin-top:10px"><div class="section-head"><div><h2>Duplicate suggestions</h2><p>Extra copies that may be easier to trade.</p></div></div>${duplicates.map(i=>`<div class="compact-row">${cardArt(i.card)}<div class="grow"><strong>${esc(i.card.name)}</strong><span>${esc(i.card.set)} • ${i.qty} owned • ${money(Number(i.card.market))} ea.</span></div><button class="btn" onclick="addDuplicateTradeItem('${i.uid}')">Add extra</button></div>`).join('')}</div>`:''}
    </div>

    <div class="panel">
      <div class="section-head"><div><h2>Their side</h2><p>Add wishlist cards, search live cards, or enter another item manually.</p></div><div class="action-row"><button class="btn" onclick="addManualTradeItem('receive')">＋ Manual</button><button class="btn" onclick="addCashAdjustment('receive')">$ Cash</button></div></div>

      ${state.wishlist.length?`<div class="subpanel wishlist-trade-box"><div class="eyebrow">YOUR WISHLIST</div>${state.wishlist.slice(0,8).map(w=>`<div class="compact-row">${cardArt(w.card)}<div class="grow"><strong>${esc(w.card.name)}</strong><span>${esc(w.card.set)} • ${money(Number(w.card.market))}</span></div><button class="btn" onclick="addWishlistTradeItem('${w.uid}')">Add</button></div>`).join('')}</div>`:''}

      <div class="provider-tabs mini-provider-tabs">${SCANNER_GAME_OPTIONS.map(g=>`<button class="${tradeSearchGame===g?'active':''}" onclick='setTradeSearchGame(${JSON.stringify(g)})'><b>${esc(g)}</b></button>`).join('')}</div>
      <form class="searchbar" onsubmit="tradeCardSearch(event)" style="margin-top:10px"><span>⌕</span><input id="tradeSearchQ" placeholder="Search a ${esc(tradeSearchGame)} card to receive"><button class="btn primary" ${tradeSearchBusy?'disabled':''}>${tradeSearchBusy?'Searching…':'Search'}</button></form>
      ${tradeSearchResults.length?`<div class="trade-search-results">${tradeSearchResults.slice(0,8).map(c=>`<div class="compact-row">${cardArt(c)}<div class="grow"><strong>${esc(c.name)}</strong><span>${esc(c.set)} • ${esc(c.number||'')} • ${money(Number(c.market))}</span></div><button class="btn primary" onclick='addTradeSearchResult(${JSON.stringify(c).replace(/'/g,"&#39;")})'>Add</button></div>`).join('')}</div>`:''}

      <div class="trade-draft-list">${tradeReceiveDraft.length?tradeReceiveDraft.map(i=>renderTradeDraftItem(i,'receive')).join(''):`<div class="empty">Nothing on their side yet.</div>`}</div>
    </div>
  </div>

  <div class="panel">
    <div class="section-head"><div><h2>Deal details</h2><p>Save a proposal first, or complete the deal and update your Vault automatically.</p></div></div>
    <div class="form-grid">
      <label class="field"><span>Trade partner</span><input id="tradePartnerPro" placeholder="Name / handle"></label>
      <label class="field"><span>Date</span><input id="tradeDatePro" type="date" value="${todayInput()}"></label>
      <label class="field full"><span>Notes</span><textarea id="tradeNotesPro" placeholder="Condition notes, meetup, shipping, cash difference..."></textarea></label>
    </div>
    <div class="action-row" style="margin-top:10px">
      <button class="btn" onclick="copyTradeSummary()">Copy summary</button>
      <button class="btn" onclick="saveTradeProposal('Proposed')">Save proposal</button>
      <button class="btn primary" onclick="saveTradeProposal('Completed')">✓ Complete + update Vault</button>
    </div>
  </div>

  <div class="panel">
    <div class="section-head"><div><h2>Trade history</h2><p>Completed deals and saved proposals.</p></div></div>
    ${state.trades.length?state.trades.map(renderTradeHistoryRow).join(''):`<div class="empty">No trades logged yet.</div>`}
  </div>`;
}
function addTrade(){
  // Compatibility wrapper for older UI or imported backups.
  saveTradeProposal('Completed');
}
function removeTrade(id){state.trades=state.trades.filter(x=>x.uid!==id);saveState();renderTools()}
function renderAlertsTool(){
  return `<div class="panel"><div class="section-head"><div><h2>Card price alerts</h2><p>Local targets now; background push notifications arrive with the cloud backend.</p></div></div>${state.priceAlerts.length?state.priceAlerts.map(a=>{const hit=typeof a.card.market==='number'&&a.card.market<=a.target;return `<div class="compact-row">${cardArt(a.card)}<div class="grow"><strong>${esc(a.card.name)}</strong><span>Below ${money(a.target)} • Current ${money(Number(a.card.market))}</span></div><div class="right"><span class="stock-pill ${hit?'in':'low'}">${hit?'TARGET HIT':'WATCHING'}</span><button class="remove" onclick="removePriceAlert('${a.uid}')">Delete</button></div></div>`}).join(''):`<div class="empty">Create a card price alert from Search.</div>`}</div>`;
}
function removePriceAlert(id){state.priceAlerts=state.priceAlerts.filter(x=>x.uid!==id);saveState();renderTools()}
function renderSettingsTool(){
  const cfg=window.TWOGEN_CONFIG||{};
  return `<div class="panel"><div class="section-head"><div><h2>App settings</h2><p>Branding, backup and integration status.</p></div></div><div class="form-grid"><label class="field"><span>App name</span><input id="brandName" value="${esc(state.settings.brand)}"></label><label class="field"><span>Tagline</span><input id="brandTagline" value="${esc(state.settings.tagline)}"></label></div><button class="btn primary" style="margin-top:10px" onclick="saveBrandSettings()">Save branding</button></div>
  <div class="panel"><h2>Cloud status</h2><div class="notice ${cloudReady()?'good':'warn'}"><span>${cloudReady()?'●':'!'}</span><span>${cloudReady()?`Cloud project connected • ${signedIn()?'signed in':'guest mode'}`:'Cloud project not configured. Accounts and community reports remain local-only until setup.'}</span></div></div>
  <div class="panel inventory-setup-panel">
    <div class="section-head"><div><div class="eyebrow">REAL INVENTORY ENGINE</div><h2>Secure retailer connection</h2><p>Retailer secrets stay off GitHub Pages. The app talks only to your public worker URL.</p></div><button class="btn primary" onclick="checkInventoryBackendHealth(true).then(()=>renderTools())">Test connection</button></div>
    <div class="notice ${cfg.inventoryApiBase?'good':'warn'}"><span>${cfg.inventoryApiBase?'●':'!'}</span><span>${cfg.inventoryApiBase?`Configured backend: ${esc(cfg.inventoryApiBase)}`:'No secure inventory backend URL is configured yet. The v5 package contains a ready-to-deploy Cloudflare Worker.'}</span></div>
    <div class="connection-code"><span>config.js</span><code>inventoryApiBase: "${esc(cfg.inventoryApiBase||'https://YOUR-WORKER.workers.dev')}"</code></div>
    ${retailerCapabilityMarkup()}
    <div class="notice" style="margin-top:10px"><span>🔒</span><span>Never paste Best Buy or other private retailer API keys into config.js. Store them as backend secrets only.</span></div>
  </div>
  <div class="panel"><h2>Backup & portability</h2><div class="action-row"><button class="btn" onclick="exportBackup()">Export full backup</button><button class="btn" onclick="$('hiddenImport').click()">Import backup</button><button class="btn red" onclick="resetApp()">Reset local data</button></div><p style="margin-top:9px">Version ${esc(String(cfg.appVersion||'0.4.0'))}. Data currently lives on this device until cloud accounts are added.</p></div>`;
}
function saveBrandSettings(){state.settings.brand=$('brandName')?.value.trim()||'VaultSignal';state.settings.tagline=$('brandTagline')?.value.trim()||'Two Generations. One Collection.';saveState();renderTools();toast('Branding saved')}
function exportBackup(){
  state.settings.lastBackupAt=new Date().toISOString();
  saveState();
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));a.download='2gen-vault-full-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}
$('hiddenImport').addEventListener('change',e=>{
  const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const next=JSON.parse(String(r.result));if(!next.collection||!next.settings)throw new Error('Invalid backup');state={...structuredClone(seed),...next,settings:{...seed.settings,...next.settings}};saveState();render(currentTab);toast('Backup imported')}catch{toast('Backup could not be imported')}};r.readAsText(f)
});
function resetApp(){if(confirm('Reset all local VaultSignal data on this device?')){localStorage.removeItem(STORAGE_KEY);state=structuredClone(seed);render(currentTab);toast('Local data reset')}}
function exportCollectionCSV(){
  const rows=[['Type','Game','Name','Set','Number','Condition','Format','Grader','Grade','Cert','Qty','CostEach','MarketEach','Location']];
  state.collection.forEach(i=>rows.push(['Card',i.card.game,i.card.name,i.card.set,i.card.number||'',i.condition,i.format||'Raw',i.grader||'',i.grade||'',i.cert||'',i.qty,i.cost,i.card.market||'',i.location||'']));
  state.sealed.forEach(i=>rows.push(['Sealed',i.game,i.name,'','','','','','','',i.qty,i.cost,i.current,i.location||'']));
  const csv=rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='2gen-vault-collection.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}

Object.assign(window,{
  switchTab,openVault,openTool,premiumPurchaseAction,refreshLiveDrops,setLiveDropFilter,premiumRestorePurchases,setInventoryFilter,quickInventoryCount,inventoryAuditAll,exportUnifiedInventoryCsv,openProductFromInventory,toggleRetailer,saveStockArea,useMyLocation,runAreaInventoryScan,clearAreaInventory,clearInventoryPulse,toggleAreaGame,setAreaAutoRefresh,setAreaAutoRefreshHours,toggleFavoriteInventoryStore,selectAreaStore,toggleSpecificProductSearch,runInventorySearch,runProductInventorySearch,checkInventoryBackendHealth,openInventorySetup,findNearbyStores,saveStockWatch,toggleWatch,removeWatch,removeStockReport,clearInventoryResults,openRetailerSearch,saveInventoryResultAsReport,
  buildHuntRoute,clearHuntRoute,toggleHuntStop,reportAtHuntStop,confirmStockReport,buyFromReport,buyInventoryResult,huntWatch,
  refreshCommunityReports,confirmCommunityReport,buyCommunityReport,cloudSignUp,cloudSignIn,cloudMagicLink,cloudSignOut,saveCloudProfile,syncVaultToCloud,restoreVaultFromCloud,
  selectWatch,editWatch,setProductSearch,setProductGameFilter,setProductNeedFilter,setProductSort,openProductPage,createCustomProduct,editCatalogProduct,editProductIdentifiers,editSealedLotFromProduct,openProductStockReport,huntProductNow,openProductVaultIQ,watchProduct,buyCatalogProduct,addOwnedSealedFromProduct,logOpeningFromProduct,openSealedProductPage,openInventoryProduct,openCommunityProduct,
  setDiscoverMode,doCardSearch,addCard,addGradedCard,openCardDetail,closeCardDetail,addWishlist,addPriceAlert,setVaultTab,updateCollection,removeCollection,openCollectionCardDetail,addBinder,renameBinder,deleteBinder,addSealed,openOneSealed,removeSealed,addSetGoal,editSetGoal,removeSetGoal,
  setToolTab,setDiscoverGame,setScannerGame,setTradeSearchGame,openVaultIQCard,queueVaultIQCard,queueVaultIQWatch,updateAcquisitionStatus,removeAcquisitionItem,editVaultIQSettings,vaultIQDealCheck,setShowcaseProfile,toggleShowcaseFeatured,editShowcaseText,toggleShowcaseSetting,downloadShowcaseHtml,downloadShowcaseJson,shareShowcase,openWatchtowerNotification,markWatchtowerRead,markAllWatchtowerRead,clearWatchtowerInbox,resetWatchtowerSignals,enableBrowserNotifications,disableBrowserNotifications,toggleWatchtowerPref,toggleWatchtowerCategory,evaluateWatchtower,openActionItem,snoozeAction,clearAllActionSnoozes,addCollectorProfile,editCollectorProfile,deleteCollectorProfile,setActiveCollector,moveCollectionOwner,moveSealedOwner,transferDuplicateToCollector,addGiveawayFromCollection,addGiveawayFromSealed,updateGiveawayStatus,removeGiveaway,addContentIdea,addContentFromRip,updateContentStatus,editContentIdea,removeContentIdea,exportCollectorShowcase,selectSellSource,setSellMarketplace,updateSellPreview,addSaleToQueue,removeSaleQueueItem,editSaleQueuePrice,completeSale,copySaleListing,queueDuplicateForSale,removeSaleHistory,saveSnapshotNow,refreshVaultPrices,selectMarketCard,scannerSearch,openScannerCamera,openScannerFilePicker,openLiveScannerCamera,startLiveScannerStream,retryLiveScannerCamera,closeLiveScannerCamera,captureLiveScannerFrame,scannerCycleZoom,scannerToggleTorch,scannerCameraPermissionHelp,autoIdentifyFromPhoto,selectAutoMatch,scanAnotherCard,clearScannerRecent,queueCard,removeQueuedCard,updateQueuedCard,clearScanQueue,reviewScannerSettings,commitScanQueue,clearScannerPhoto,createRipSession,openRipSession,openRipQuickScanner,promptRipCardSearch,addPullToSession,changePullQty,removePull,editRipSession,finishRipSession,deleteRipSession,exportRipSession,clearRipSearch,clearRipPreview,searchPokemonSets,openSetByInfo,openSetByCard,openCardFromSet,addStockReport,removeWishlist,saveBudget,addPurchase,removePurchase,addGrading,advanceGrading,removeGrading,addOwnedTradeItem,addWishlistTradeItem,addDuplicateTradeItem,addManualTradeItem,addCashAdjustment,removeTradeDraftItem,changeTradeDraftQty,changeTradeDraftValue,clearTradeBuilder,tradeCardSearch,addTradeSearchResult,copyTradeSummary,saveTradeProposal,addTrade,removeTrade,removePriceAlert,saveBrandSettings,exportBackup,resetApp,exportCollectionCSV
});


window.addEventListener('twogen-cloud-ready',()=>{
  updateStatus();
  if(currentTab==='tools' && toolsTab==='account') renderTools();
  if(cloudReady() && state.settings.zip) refreshCommunityReports(false);
});
window.addEventListener('twogen-auth-changed',()=>{
  updateStatus();
  render(currentTab);
  if(cloudReady() && state.settings.zip) refreshCommunityReports(false);
});

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').then(reg=>reg.update()).catch(()=>{}));
}
ensureCollectionSchema();
ensurePriceHistorySchema();
ensureWatchtowerSchema();
ensureVaultIQSchema();
ensureShowcaseSchema();
ensureActionSchema();
ensureFamilySchema();
ensureSalesSchema();
ensureScannerSchema();
ensureCatalogSeed();
ensureProductInventorySchema();
ensureRealInventorySchema();
ensureDailySnapshot();
evaluateWatchtower({notify:false});
render('home');
})();

// v7.2.1: Do not close camera on visibilitychange; Android permission prompts can temporarily hide the PWA.
window.addEventListener('pagehide',()=>{if(scannerLiveCameraOpen)closeLiveScannerCamera();});
