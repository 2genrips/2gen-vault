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
    title:'2GEN Vault Showcase',
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
  openingLog: [],
  ripSessions: [],
  portfolioSnapshots: [],
  scanQueue: [],
  cardPriceHistory: {},
  priceRefreshLog: [],
  scannerSettings: {gradingValueThreshold:25, preferredBinder:'Main Binder'},
  inventoryResults: [],
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
    brand:'2GEN Vault',
    tagline:'Two Generations. One Collection.',
    lastBackupAt:null
  }
};

let state = loadState();
let currentTab = 'home';
let vaultTab = 'cards';
let toolsTab = 'scanner';
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
let selectedWatchId = null;
let cameraPreview = '';
let scannerSearchResults = [];
let scannerBusy = false;
let scannerLastQuery = '';
let scannerGame = 'Pokemon';
let scannerOcrBusy = false;
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
    image:c.images?.small||c.images?.large||'',
    market,low:lows.length?Math.min(...lows):undefined,
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
document.querySelectorAll('.bottom-nav button').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));

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
  pill.classList.toggle('live', !!backend || cloud);
  pill.querySelector('span').textContent = signedIn() ? 'Cloud Synced' : backend ? 'Inventory Connected' : cloud ? 'Cloud Ready' : 'Collector OS';
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
      <div class="eyebrow">2GEN RIPS PRESENTS</div>
      <h1>${esc(state.settings.brand)}</h1>
      <p>${esc(state.settings.tagline)}</p>
      <p class="sub">Find stock • Scan cards • Track live values • Decide smarter • Trade • Sell</p>
      <div class="hero-badges">
        <span class="badge primary">◆ COLLECTOR OS</span>
        <span class="badge">◎ ${state.stockWatches.length} STOCK WATCHES</span>
        <span class="badge">⌖ ${state.huntRoute.filter(x=>!x.visited).length} HUNT STOPS</span>
        <span class="badge red">2GEN RIPS</span>
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
        <button class="quick-card" onclick="switchTab('stock')"><span class="big-icon">◎</span><b>Find inventory</b><span>Nearby stores, live connector, watchlists and stock reports.</span></button>
        <button class="quick-card" onclick="switchTab('discover')"><span class="big-icon">⌕</span><b>Search cards</b><span>Live Pokémon lookup plus the multi-TCG catalog foundation.</span></button>
        <button class="quick-card" onclick="openTool('products')"><span class="big-icon">◈</span><b>Smart products</b><span>Sealed product pages, targets, sightings, ownership and opening history.</span></button>
        <button class="quick-card" onclick="openTool('scanner')"><span class="big-icon">◉</span><b>Smart Scanner</b><span>Batch intake, duplicates, set gaps, binder suggestions and grading review flags.</span></button>
        <button class="quick-card" onclick="openTool('sets')"><span class="big-icon">▦</span><b>Master sets</b><span>Live set checklists, owned progress and missing-card tracking.</span></button>
        <button class="quick-card" onclick="openTool('rips')"><span class="big-icon">✦</span><b>Rip sessions</b><span>Track openings, pulls, value, hits, ROI and set progress.</span></button>
        <button class="quick-card" onclick="openTool('analytics')"><span class="big-icon">⌁</span><b>Dashboard Pro</b><span>Growth, spending, allocation, positions, sets and rip performance.</span></button>
        <button class="quick-card" onclick="openTool('market')"><span class="big-icon">↗</span><b>Market Pulse</b><span>Refresh live card pricing, track snapshots and watch price targets.</span></button>
        <button class="quick-card" onclick="openTool('trades')"><span class="big-icon">⇄</span><b>Trade Lab</b><span>Build deals from your Vault and wishlist with reference-value balancing.</span></button>
        <button class="quick-card" onclick="openTool('sell')"><span class="big-icon">$</span><b>Sell Lab</b><span>Estimate fees, protect cost basis, create listings and track profit.</span></button>
        <button class="quick-card" onclick="openTool('family')"><span class="big-icon">2G</span><b>2GEN Hub</b><span>Family collections, giveaways and creator content in one place.</span></button>
        <button class="quick-card" onclick="openTool('actions')"><span class="big-icon">✓</span><b>Action Center</b><span>${homeActionCounts.total} priorities • ${homeActionCounts.high} high • know what to do next.</span></button>
        <button class="quick-card" onclick="openTool('watchtower')"><span class="big-icon">◉</span><b>Watchtower</b><span>${homeWatchtowerUnread} unread alerts • ${homeWatchtowerHigh} high priority.</span></button>
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
  ensureCatalogSeed();
  const q=normalizeName(query);
  if(!q) return state.productCatalog;
  return state.productCatalog.filter(p=>normalizeName(`${p.game} ${p.set} ${p.name} ${p.type}`).includes(q));
}
function productStats(product){
  const owned = state.sealed.filter(s=>watchMatchesText({product:product.name}, s.name) && (!product.game || s.game===product.game));
  const ownedQty = owned.reduce((n,x)=>n+(Number(x.qty)||0),0);
  const costAvg = ownedQty ? owned.reduce((n,x)=>n+(Number(x.cost)||0)*(Number(x.qty)||0),0)/ownedQty : 0;
  const currentAvg = ownedQty ? owned.reduce((n,x)=>n+(Number(x.current)||0)*(Number(x.qty)||0),0)/ownedQty : 0;

  const reports = [
    ...state.stockReports.map(r=>({product:r.product,store:r.store,price:Number(r.price)||0,ts:r.ts,status:r.status,source:'Your reports'})),
    ...(state.communityReports||[]).map(r=>({product:r.product,store:r.store,price:Number(r.price)||0,ts:r.updated_at||r.created_at,status:r.status,source:'Community'})),
    ...(state.inventoryResults||[]).map(r=>({product:r.product,store:r.store||r.retailer,price:Number(r.price)||0,ts:r.updatedAt,status:r.status,source:'Live connector'}))
  ].filter(r=>watchMatchesText({product:product.name},r.product));

  const inStock = reports.filter(r=>!/out/i.test(String(r.status||'')));
  const prices = inStock.map(r=>r.price).filter(v=>v>0);
  const bestObserved = prices.length ? Math.min(...prices) : null;
  const newest = inStock.map(r=>r.ts).filter(Boolean).sort((a,b)=>new Date(b)-new Date(a))[0] || null;

  const watch = state.stockWatches.find(w=>watchMatchesText(w,product.name) && (!product.game || w.game===product.game));
  const opened = state.openingLog.filter(o=>watchMatchesText({product:product.name},o.product)).reduce((n,o)=>n+(Number(o.qty)||0),0);

  return {ownedQty,costAvg,currentAvg,reports,inStock,bestObserved,newest,watch,opened};
}
function addCatalogProduct(product){
  ensureCatalogSeed();
  const key=productKeyFromParts(product.game,product.set,product.name);
  const existing=state.productCatalog.find(p=>productKeyFromParts(p.game,p.set,p.name)===key);
  if(existing) return existing;
  const next={uid:uid(),id:product.id||uid(),game:product.game||'Pokemon',name:product.name||'Sealed Product',set:product.set||'',type:product.type||'Sealed',msrp:Number(product.msrp)||0,target:Number(product.target)||0,image:product.image||'',notes:product.notes||'',createdAt:new Date().toISOString()};
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

function renderStock(){
  const cfg = window.TWOGEN_CONFIG || {};
  const hasBackend = !!(cfg.inventoryApiBase||'').trim();
  const radius = Number(state.settings.radius)||25;
  const locationText = state.settings.locationLabel || state.settings.zip || (state.settings.lat ? 'GPS location saved' : 'Location not set');

  $('stock').innerHTML = `
    <div class="page-title">
      <div><h1>Stock Finder</h1><p>Find nearby stores, watch products and connect live retailer inventory as integrations are added.</p></div>
      <span class="badge ${hasBackend?'primary':''}">${hasBackend?'● LIVE CONNECTOR':'○ CONNECTOR READY'}</span>
    </div>

    <div class="panel">
      <div class="section-head"><div><h2>Your search area</h2><p>Use GPS or enter a ZIP. Precise location is never required when a ZIP is provided.</p></div></div>
      <div class="form-grid">
        <label class="field"><span>ZIP / postal code</span><input id="stockZip" inputmode="numeric" value="${esc(state.settings.zip||'')}" placeholder="28752"></label>
        <label class="field"><span>Radius</span><select id="stockRadius">${[5,10,15,25,50,75,100].map(v=>`<option value="${v}" ${v===radius?'selected':''}>${v} miles</option>`).join('')}</select></label>
      </div>
      <div class="action-row" style="margin-top:9px">
        <button class="btn primary" onclick="saveStockArea()">Save area</button>
        <button class="btn" onclick="useMyLocation()">⌖ Use my location</button>
      </div>
      <div class="notice" style="margin-top:10px"><span>◎</span><span><b>Current area:</b> ${esc(locationText)} • ${radius} mi. Nearby store discovery uses OpenStreetMap data; retailer inventory requires a connected inventory source.</span></div>
    </div>

    <div class="panel">
      <div class="section-head"><div><h2>Product hunt</h2><p>Search once, then save it as a watch.</p></div></div>
      <div class="form-grid">
        <label class="field full"><span>Product / set / SKU keywords</span><input id="stockQuery" value="${esc(stockQuery)}" placeholder="Prismatic Evolutions ETB, Lorcana booster box..."></label>
        <label class="field"><span>TCG</span><select id="stockGame">${games.map(g=>`<option ${g===stockGame?'selected':''}>${g}</option>`).join('')}</select></label>
        <label class="field"><span>Max price (optional)</span><input id="stockMaxPrice" type="number" min="0" step=".01" placeholder="49.99"></label>
      </div>
      <div style="margin:11px 0 7px" class="eyebrow">RETAILERS</div>
      <div class="retailer-grid">${retailers.map(r=>`<button class="retailer-chip ${selectedRetailers.has(r)?'on':''}" onclick='toggleRetailer(${JSON.stringify(r)})'>${esc(r)}</button>`).join('')}</div>
      <div class="action-row" style="margin-top:11px">
        <button class="btn primary" onclick="runInventorySearch()">◎ Check inventory</button>
        <button class="btn" onclick="findNearbyStores()">⌖ Nearby stores</button>
        <button class="btn green" onclick="saveStockWatch()">＋ Save watch</button>
      </div>
    </div>

    ${hasBackend
      ? `<div class="notice good"><span>●</span><span>Your inventory backend URL is configured. “Check inventory” will request current data from that connector.</span></div>`
      : `<div class="notice warn"><span>!</span><span><b>No live retailer backend is connected yet.</b> The app will not invent stock counts. Nearby store locations, retailer search links, watchlists and your own reports work now. We can connect supported retailer feeds/APIs to the same screen later without rebuilding the app.</span></div>`
    }



    <div class="panel radar-panel">
      <div class="section-head"><div><div class="eyebrow">2GEN RESTOCK RADAR</div><h2>Watch intelligence</h2><p>Ranks your saved hunts using only real reports and connected inventory results already available to the app.</p></div><span class="badge primary">BETA</span></div>
      <div>${renderRestockRadar()}</div>
    </div>

    <div class="panel">
      <div class="section-head"><div><h2>Watch detail</h2><p>Observed retailer prices and recent sightings for one product watch.</p></div></div>
      ${renderSelectedWatch()}
    </div>

    <div class="panel hot-panel">
      <div class="section-head"><div><div class="eyebrow">HOT DROPS</div><h2>What collectors are seeing</h2><p>Heat is calculated from recency and repeated sightings — it is not a retailer stock guarantee.</p></div></div>
      ${renderHotDrops()}
    </div>

    <div class="panel network-panel">
      <div class="section-head">
        <div><div class="eyebrow">2GEN LIVE STOCK NETWORK</div><h2>Hunt Mode</h2><p>Turn nearby stores into a collector run. Check stops off as you go and report what you actually find.</p></div>
        <span class="badge ${state.huntRoute.length?'primary':''}">${state.huntRoute.length?state.huntRoute.filter(x=>!x.visited).length+' LEFT':'READY'}</span>
      </div>
      <div class="action-row">
        <button class="btn primary" onclick="buildHuntRoute()">⌖ Build hunt</button>
        <button class="btn" onclick="clearHuntRoute()">Clear route</button>
      </div>
      <div id="huntRoute" style="margin-top:10px">${renderHuntRoute()}</div>
    </div>


    <div class="panel community-panel">
      <div class="section-head">
        <div><div class="eyebrow">2GEN COMMUNITY NETWORK</div><h2>Collector reports</h2><p>See recent reports from other collectors after the free cloud project is connected.</p></div>
        <span class="badge ${signedIn()?'primary':''}">${signedIn()?'SIGNED IN':cloudReady()?'GUEST':'LOCAL ONLY'}</span>
      </div>
      <div class="action-row">
        <button class="btn primary" onclick="refreshCommunityReports()">↻ Refresh reports</button>
        <button class="btn" onclick="openTool('account')">${signedIn()?'My account':'Sign in'}</button>
      </div>
      <div id="communityReports" style="margin-top:10px">${renderCommunityReports()}</div>
    </div>

    <div class="panel">
      <div class="section-head"><div><h2>Community-style freshness</h2><p>Your reports already use freshness/confidence scoring. When cloud accounts are added, the same system can combine multiple collector confirmations.</p></div></div>
      <div class="confidence-legend">
        <span><i class="confidence-dot c-high"></i> 85–99 very fresh</span>
        <span><i class="confidence-dot c-mid"></i> 50–84 recent</span>
        <span><i class="confidence-dot c-low"></i> under 50 stale</span>
      </div>
    </div>

    <div class="panel">
      <div class="section-head"><div><h2>Inventory results</h2><p id="inventoryResultCaption">${state.inventoryResults.length ? `${state.inventoryResults.length} saved/live results` : 'No inventory results yet.'}</p></div><button class="link-btn" onclick="clearInventoryResults()">Clear</button></div>
      <div id="inventoryResults">${renderInventoryResults()}</div>
    </div>

    <div class="panel">
      <div class="section-head"><div><h2>Nearby stores</h2><p>Real nearby place discovery from OpenStreetMap based on your saved search area.</p></div><button class="link-btn" onclick="findNearbyStores()">Refresh</button></div>
      <div id="nearbyStores">${renderNearbyStores()}</div>
    </div>

    <div class="panel">
      <div class="section-head"><div><h2>Quick retailer checks</h2><p>Open the retailer's public product search while live stock integrations are being connected.</p></div></div>
      <div class="retailer-grid">${[...selectedRetailers].map(r=>`<button class="retailer-chip on" onclick='openRetailerSearch(${JSON.stringify(r)}, document.getElementById("stockQuery")?.value || "")'>↗ ${esc(r)}</button>`).join('') || '<span class="tiny">Select at least one retailer above.</span>'}</div>
    </div>

    <div class="panel">
      <div class="section-head"><div><h2>Stock watches</h2><p>Products you want 2GEN Vault to track when the live connector is active.</p></div></div>
      ${renderStockWatches()}
    </div>

    <div class="panel">
      <div class="section-head"><div><h2>Your stock reports</h2><p>Log what you actually saw in stores. These are local to your phone in the Pages build.</p></div><button class="btn" onclick="openTool('stockreport')">＋ Add report</button></div>
      ${state.stockReports.length ? [...state.stockReports].sort((a,b)=>new Date(b.ts)-new Date(a.ts)).slice(0,10).map(r=>{
        const cs=confidenceScore(r);
        return `<div class="stock-report-card">
          <div class="stock-report-head">
            <div class="thumb square"><b>${r.status==='In stock'?'✓':r.status==='Low stock'?'!':'×'}</b></div>
            <div class="grow"><strong>${esc(r.product)}</strong><span>${esc(r.store)} • ${esc(r.status)} • ${humanAge(r.ts)}</span></div>
            <div class="right"><strong>${money(Number(r.price))}</strong><span class="confidence-badge ${cs>=85?'high':cs>=50?'mid':'low'}">${cs}% ${confidenceLabel(cs)}</span></div>
          </div>
          <div class="report-actions">
            <button class="btn green" onclick="confirmStockReport('${r.uid}','still')">✓ Still there</button>
            <button class="btn red" onclick="confirmStockReport('${r.uid}','gone')">× Sold out</button>
            <button class="btn" onclick="buyFromReport('${r.uid}')">$ Bought it</button>
            <button class="remove" onclick="removeStockReport('${r.uid}')">Delete</button>
          </div>
        </div>`
      }).join('') : `<div class="empty">No stock reports yet.</div>`}
    </div>`;
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
  stockQuery = $('stockQuery')?.value.trim() || '';
  stockGame = $('stockGame')?.value || 'Pokemon';
  const base = (window.TWOGEN_CONFIG?.inventoryApiBase||'').trim().replace(/\/+$/,'');
  if(!stockQuery){ toast('Enter a product or set first'); return; }
  if(!base){
    toast('Live inventory connector is not configured yet');
    return;
  }
  const zip = state.settings.zip || '';
  const params = new URLSearchParams({
    zip, radius:String(state.settings.radius||25), q:stockQuery, game:stockGame,
    retailers:[...selectedRetailers].join(',')
  });
  const cap = $('inventoryResultCaption'); if(cap) cap.textContent='Checking live inventory…';
  try{
    const r = await fetch(`${base}/inventory?${params.toString()}`,{headers:{'Accept':'application/json'}});
    if(!r.ok) throw new Error(`Inventory service returned ${r.status}`);
    const data = await r.json();
    state.inventoryResults = Array.isArray(data.results) ? data.results : [];
    saveState(); renderStock(); toast(`${state.inventoryResults.length} inventory results`);
  }catch(e){
    renderStock(); toast(e.message || 'Inventory lookup failed');
  }
}
function renderInventoryResults(){
  if(!state.inventoryResults.length) return `<div class="empty">No connected inventory results yet. Use Nearby stores or retailer search links while integrations are being added.</div>`;
  return state.inventoryResults.map(x=>{
    const status = String(x.status||'unknown').toLowerCase();
    const cls = status.includes('in') ? 'in' : status.includes('low') ? 'low' : 'out';
    const label = status==='in_stock'?'IN STOCK':status==='low_stock'?'LOW STOCK':status==='out_of_stock'?'OUT OF STOCK':esc(String(x.status||'UNKNOWN').toUpperCase());
    return `<div class="inventory-card">
      <div class="topline"><div class="grow"><div class="eyebrow">${esc(x.retailer||'Retailer')}</div><h3>${esc(x.product||'Product')}</h3><p>${esc(x.store||'')} ${x.address?`• ${esc(x.address)}`:''}</p></div><span class="stock-pill ${cls}">${label}</span></div>
      <div class="meta-grid"><div class="meta"><span>Price</span><strong>${money(Number(x.price))}</strong></div><div class="meta"><span>Qty</span><strong>${x.quantity ?? '—'}</strong></div><div class="meta"><span>Distance</span><strong>${typeof x.distanceMiles==='number'?x.distanceMiles.toFixed(1)+' mi':'—'}</strong></div></div>
      <div class="action-row">${x.url?`<a class="btn primary" href="${esc(x.url)}" target="_blank" rel="noreferrer">Open retailer ↗</a>`:''}<button class="btn" onclick='saveInventoryResultAsReport(${JSON.stringify(x).replace(/'/g,"&#39;")})'>Save report</button><button class="btn green" onclick='buyInventoryResult(${JSON.stringify(x).replace(/'/g,"&#39;")})'>$ Bought it</button><button class="btn" onclick='openInventoryProduct(${JSON.stringify(x).replace(/'/g,"&#39;")})'>◈ Product page</button></div>
      <div class="tiny" style="margin-top:8px">Updated ${dateShort(x.updatedAt)}</div>
    </div>`;
  }).join('');
}
function saveInventoryResultAsReport(x){
  state.stockReports.unshift({uid:uid(),store:x.store||x.retailer||'',product:x.product||'',status:x.status==='in_stock'?'In stock':x.status==='low_stock'?'Low stock':'Out of stock',qty:x.quantity||'',price:Number(x.price)||0,notes:'Saved from inventory connector',ts:new Date().toISOString(),confirmations:1,soldOutConfirmations:0});
  saveState(); renderStock(); toast('Saved to stock reports');
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
async function findNearbyStores(){
  try{
    const {lat,lon}=await geocodeSavedArea();
    const meters=(Number(state.settings.radius)||25)*1609.344;
    const names=['Walmart','Target','Best Buy','GameStop',"Sam's Club",'Costco','Walgreens','CVS','Dollar General','Family Dollar'];
    const regex=names.join('|').replace(/'/g,"'");
    const q=`[out:json][timeout:25];(
      nwr(around:${Math.round(meters)},${lat},${lon})["name"~"${regex}",i];
      nwr(around:${Math.round(meters)},${lat},${lon})["shop"~"games|toys|department_store|supermarket|variety_store"];
    );out center tags;`;
    const endpoints=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
    let data=null,lastErr=null;
    for(const ep of endpoints){
      try{
        const r=await fetch(ep,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:'data='+encodeURIComponent(q)});
        if(!r.ok) throw new Error(`Store lookup ${r.status}`);
        data=await r.json(); break;
      }catch(e){ lastErr=e; }
    }
    if(!data) throw lastErr||new Error('Store lookup failed');
    const seen=new Set();
    const stores=(data.elements||[]).map(e=>{
      const t=e.tags||{}, slat=e.lat??e.center?.lat, slon=e.lon??e.center?.lon;
      if(typeof slat!=='number'||typeof slon!=='number') return null;
      const name=t.name||t.brand||'Local store';
      const key=`${name}|${slat.toFixed(4)}|${slon.toFixed(4)}`;
      if(seen.has(key)) return null; seen.add(key);
      const address=[t['addr:housenumber'],t['addr:street'],t['addr:city'],t['addr:state'],t['addr:postcode']].filter(Boolean).join(' ');
      return {id:key,name,brand:t.brand||'',address,lat:slat,lon:slon,distance:haversine(lat,lon,slat,slon),shop:t.shop||'',openingHours:t.opening_hours||'',phone:t.phone||t['contact:phone']||'',website:t.website||t['contact:website']||''};
    }).filter(Boolean).sort((a,b)=>a.distance-b.distance).slice(0,30);
    state.nearbyStores=stores; saveState(); renderStock(); toast(`${stores.length} nearby stores found`);
  }catch(e){ toast(e.message||'Nearby store lookup failed'); }
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
  if(!state.huntRoute.length) return `<div class="empty">Find nearby stores, then build a hunt route. 2GEN Vault will prioritize nearby selected retailers.</div>`;
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
  logPurchaseAndSealed(x.product||'TCG product',x.store||x.retailer||'Retailer',Number(x.price)||0);
}
function logPurchaseAndSealed(product,merchant,defaultPrice){
  const qRaw=prompt(`How many ${product} did you buy?`,'1');
  if(qRaw===null)return;
  const qty=Math.max(1,Number(qRaw)||1);
  const pRaw=prompt('Price paid EACH:',defaultPrice?String(defaultPrice.toFixed(2)):'');
  if(pRaw===null)return;
  const each=Math.max(0,Number(pRaw)||0);
  const addSealedChoice=confirm('Add this purchase to your Sealed Vault too?');
  state.purchases.unshift({uid:uid(),merchant,item:product,category:'Stock Finder purchase',amount:each*qty,qty,date:todayInput(),notes:'Logged from Stock Finder'});
  if(addSealedChoice){
    state.sealed.unshift({uid:uid(),name:product,game:stockGame||'Pokemon',qty,cost:each,current:each,location:'New purchase',addedAt:new Date().toISOString()});
  }
  saveState();renderStock();toast(addSealedChoice?'Purchase + sealed vault updated':'Purchase logged');
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
  if(['condition','location','format','grader','grade','cert','language','variant'].includes(key)) i[key]=val;
  else i[key]=Math.max(key==='qty'?1:0,Number(val)||0);
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
  state.sealed.unshift({uid:uid(),name,game,qty:Math.max(1,Number($('sealedQty')?.value)||1),cost:Number($('sealedCost')?.value)||0,current:Number($('sealedCurrent')?.value)||0,location:$('sealedLocation')?.value.trim()||'',productId:cat.uid,ownerProfileId:activeCollectorProfileId,addedAt:new Date().toISOString()});
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

function openTool(tab){ toolsTab=tab; switchTab('tools'); }
function renderTools(){
  $('tools').innerHTML = `
    <div class="page-title"><div><h1>Collector Tools</h1><p>The rest of your collecting workflow, all under one roof.</p></div></div>
    <div class="tool-menu">
      ${toolButton('watchtower','◉','Watchtower','Collector alert inbox')}
      ${toolButton('actions','✓','Action Center','Smart collector priorities')}
      ${toolButton('vaultiq','IQ','VaultIQ','Personal buy decisions')}
      ${toolButton('market','↗','Market Pulse','Live price tracking')}
      ${toolButton('analytics','⌁','Dashboard Pro','Collection analytics')}
      ${toolButton('rips','✦','Rip Sessions','Openings & pull analytics')}
      ${toolButton('sets','▦','Sets','Master-set explorer')}
      ${toolButton('products','◈','Products','Smart sealed pages')}
      ${toolButton('scanner','◉','Smart Scanner','Batch collection intake')}
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
    </div>
    <div id="toolBody">${renderToolBody()}</div>`;
}
function toolButton(id,icon,title,sub){return `<button class="tool-tab ${toolsTab===id?'active':''}" onclick="setToolTab('${id}')"><b>${icon} ${title}</b><span>${sub}</span></button>`}
function setToolTab(t){toolsTab=t;renderTools()}
function renderToolBody(){
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
    <div class="notice warn" style="margin-top:10px"><span>!</span><span>“Market movement” below means change between <b>your saved 2GEN Vault price snapshots</b>. It is not a complete exchange-wide historical chart and is not investment advice.</span></div>
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
  ensureCatalogSeed();
  const query = window._productSearchQuery || '';
  const results = findCatalogMatches(query);
  const active = activeProductId ? catalogProductById(activeProductId) : null;

  return `<div class="panel product-search-panel">
    <div class="section-head"><div><div class="eyebrow">SMART PRODUCT DATABASE</div><h2>Sealed product explorer</h2><p>Create or open a product page, then connect stock sightings, purchase history, sealed ownership and opening logs.</p></div></div>
    <div class="searchbar"><span>⌕</span><input id="productSearchQ" value="${esc(query)}" placeholder="Search ETB, booster box, tin, set..." oninput="setProductSearch(this.value)"><button class="btn primary" onclick="createCustomProduct()">＋ Product</button></div>
    <div class="product-list">${results.length?results.slice(0,30).map(productListCard).join(''):`<div class="empty">No matching products. Create one above.</div>`}</div>
  </div>
  <div class="panel">${active ? renderProductDetail(active) : `<div class="empty">Choose a product to open its smart product page.</div>`}</div>`;
}
function setProductSearch(v){ window._productSearchQuery=v; renderTools(); }
function productListCard(p){
  const s=productStats(p);
  return `<button class="product-row ${activeProductId===p.uid?'active':''}" onclick="openProductPage('${p.uid}')">
    <div class="product-icon">${p.image?`<img src="${esc(p.image)}" alt="">`:'◈'}</div>
    <div class="grow"><strong>${esc(p.name)}</strong><span>${esc(p.game)} • ${esc(p.set||'No set')} • ${esc(p.type||'Sealed')}</span></div>
    <div class="right"><strong>${p.msrp?money(Number(p.msrp)):'—'}</strong><small>${s.ownedQty} owned</small></div>
  </button>`;
}
function openProductPage(id){ activeProductId=id; renderTools(); }
function createCustomProduct(){
  const name=prompt('Product name');if(!name)return;
  const game=prompt('TCG / game','Pokemon')||'Pokemon';
  const set=prompt('Set / release name','')||'';
  const type=prompt('Product type (ETB, Booster Box, Tin, Bundle...)','ETB')||'Sealed';
  const msrp=Number(prompt('MSRP (optional)','49.99')||0);
  const target=Number(prompt('Your target buy price (optional)',msrp?String(msrp):'')||0);
  const p=addCatalogProduct({game,name,set,type,msrp,target});
  activeProductId=p.uid;renderTools();toast('Product page created');
}
function renderProductDetail(p){
  const s=productStats(p);
  const costDiff=s.bestObserved!==null && p.msrp ? s.bestObserved-Number(p.msrp) : null;
  return `<div class="product-detail">
    <div class="product-hero">
      <div class="product-hero-icon">${p.image?`<img src="${esc(p.image)}" alt="">`:'◈'}</div>
      <div class="grow"><div class="eyebrow">${esc(p.game)} • ${esc(p.type||'Sealed')}</div><h2>${esc(p.name)}</h2><p>${esc(p.set||'No set specified')}</p></div>
      <button class="btn" onclick="editCatalogProduct('${p.uid}')">Edit</button>
    </div>

    <div class="stat-grid compact-stats">
      <div class="stat-card"><span>MSRP</span><strong>${p.msrp?money(Number(p.msrp)):'—'}</strong><small>Reference price</small></div>
      <div class="stat-card"><span>Your target</span><strong>${p.target?money(Number(p.target)):'—'}</strong><small>Desired buy price</small></div>
      <div class="stat-card"><span>Best observed</span><strong>${s.bestObserved!==null?money(s.bestObserved):'—'}</strong><small class="${costDiff!==null&&costDiff<=0?'good':''}">${costDiff!==null?(costDiff<=0?'At/below MSRP':'Above MSRP'):'No sightings yet'}</small></div>
      <div class="stat-card"><span>Owned sealed</span><strong>${s.ownedQty}</strong><small>${s.opened} opened logged</small></div>
    </div>

    <div class="product-action-grid">
      <button class="quick-card" onclick="watchProduct('${p.uid}')"><span class="big-icon">◎</span><b>${s.watch?'Edit stock watch':'Watch inventory'}</b><span>${s.watch?`${esc(s.watch.priority||'High')} priority • ${s.watch.radius} mi`:'Create a Restock Radar watch from this product.'}</span></button>
      <button class="quick-card" onclick="buyCatalogProduct('${p.uid}')"><span class="big-icon">$</span><b>Log purchase</b><span>Add the purchase and optionally place it in your sealed vault.</span></button>
      <button class="quick-card" onclick="addOwnedSealedFromProduct('${p.uid}')"><span class="big-icon">▣</span><b>Add owned</b><span>Add sealed copies you already own.</span></button>
      <button class="quick-card" onclick="logOpeningFromProduct('${p.uid}')"><span class="big-icon">✦</span><b>Open product</b><span>Reduce sealed quantity and add an opening log entry.</span></button>
    </div>

    <div class="subpanel">
      <div class="section-head"><div><h2>Inventory sightings</h2><p>Only real reports/results already known to 2GEN Vault are shown.</p></div></div>
      ${s.inStock.length?s.inStock.sort((a,b)=>new Date(b.ts)-new Date(a.ts)).slice(0,12).map(r=>`<div class="compact-row"><div class="grow"><strong>${esc(r.store||'Retailer')}</strong><span>${esc(r.source)} • ${humanAge(r.ts)} • ${esc(r.status||'')}</span></div><div class="right"><strong>${r.price?money(r.price):'—'}</strong></div></div>`).join(''):`<div class="empty">No sightings for this product yet.</div>`}
    </div>

    <div class="subpanel">
      <div class="section-head"><div><h2>Your sealed holdings</h2><p>Average cost and current tracked value for this product.</p></div></div>
      <div class="meta-grid">
        <div class="meta"><span>Quantity</span><strong>${s.ownedQty}</strong></div>
        <div class="meta"><span>Avg cost</span><strong>${s.ownedQty?money(s.costAvg):'—'}</strong></div>
        <div class="meta"><span>Avg tracked value</span><strong>${s.ownedQty?money(s.currentAvg):'—'}</strong></div>
      </div>
    </div>

    <div class="subpanel">
      <div class="section-head"><div><h2>Opening history</h2><p>Track when sealed product leaves your vault because you opened it.</p></div></div>
      ${state.openingLog.filter(o=>watchMatchesText({product:p.name},o.product)).length
        ? state.openingLog.filter(o=>watchMatchesText({product:p.name},o.product)).slice(0,12).map(o=>`<div class="compact-row"><div class="thumb square"><b>✦</b></div><div class="grow"><strong>${esc(o.product)}</strong><span>${esc(o.date)} • Qty ${o.qty}${o.notes?' • '+esc(o.notes):''}</span></div></div>`).join('')
        : `<div class="empty">No openings logged for this product yet.</div>`}
    </div>

    ${p.notes?`<div class="notice"><span>ℹ</span><span>${esc(p.notes)}</span></div>`:''}
  </div>`;
}
function editCatalogProduct(id){
  const p=catalogProductById(id);if(!p)return;
  const set=prompt('Set / release',p.set||'');if(set!==null)p.set=set;
  const type=prompt('Product type',p.type||'Sealed');if(type!==null)p.type=type;
  const msrp=prompt('MSRP',p.msrp??'');if(msrp!==null)p.msrp=msrp===''?0:Math.max(0,Number(msrp)||0);
  const target=prompt('Target buy price',p.target??'');if(target!==null)p.target=target===''?0:Math.max(0,Number(target)||0);
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
  logPurchaseAndSealed(p.name,'Retail purchase',Number(p.target)||Number(p.msrp)||0);
}
function addOwnedSealedFromProduct(id){
  const p=catalogProductById(id);if(!p)return;
  const qty=Math.max(1,Number(prompt(`How many ${p.name} do you own?`,'1'))||1);
  const cost=Math.max(0,Number(prompt('Cost paid EACH',p.target?String(p.target):p.msrp?String(p.msrp):'0'))||0);
  const current=Math.max(0,Number(prompt('Current estimated value EACH',p.msrp?String(p.msrp):String(cost)))||0);
  const location=prompt('Storage location','Shelf / bin')||'';
  state.sealed.unshift({uid:uid(),name:p.name,game:p.game,qty,cost,current,location,productId:p.uid,ownerProfileId:activeCollectorProfileId,addedAt:new Date().toISOString()});
  saveState();renderTools();toast('Added to sealed vault');
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
  state.openingLog.unshift({uid:uid(),product:p.name,game:p.game,qty:actual,date:todayInput(),notes:prompt('Opening notes (optional)','')||''});
  if(actual>0 && confirm('Start a Rip Session for this opening?')){
    const packs=Math.max(0,Number(prompt('How many packs are inside / being opened?','1'))||0);
    const session={uid:uid(),name:`${p.name} Opening`,game:p.game,product:p.name,packs,cost:spent,hitThreshold:5,date:todayInput(),notes:'Created from Smart Product page',pulls:[],createdAt:new Date().toISOString()};
    state.ripSessions.unshift(session);activeRipSessionId=session.uid;toolsTab='rips';
  }
  saveState();renderTools();toast('Opening logged');
}



async function loadTesseract(){
  if(window.Tesseract?.recognize) return window.Tesseract;
  await new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    s.async=true;
    s.onload=resolve;
    s.onerror=()=>reject(new Error('Could not load the on-device text reader.'));
    document.head.appendChild(s);
  });
  if(!window.Tesseract?.recognize) throw new Error('Text reader did not initialize.');
  return window.Tesseract;
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
function candidateScore(card,ocrText,numberHint){
  const hay=normalizeOcrText(ocrText).toLowerCase();
  const name=String(card.name||'').toLowerCase();
  let score=0;
  const nameParts=name.split(/\s+/).filter(Boolean);
  nameParts.forEach(p=>{ if(p.length>2 && hay.includes(p)) score+=18; });
  if(hay.includes(name)) score+=35;
  if(numberHint && String(card.number||'').toLowerCase()===String(numberHint).toLowerCase()) score+=40;
  if(card.set && hay.includes(String(card.set).toLowerCase())) score+=8;
  if(card.rarity && hay.includes(String(card.rarity).toLowerCase())) score+=5;
  return Math.min(100,score);
}
async function autoIdentifyFromPhoto(){
  if(!cameraPreview){toast('Take or choose a card photo first');return;}
  if(scannerOcrBusy)return;
  scannerOcrBusy=true;
  scannerOcrText='';
  scannerOcrConfidence=null;
  scannerAutoCandidates=[];
  renderTools();
  try{
    toast('Reading card text on your phone…');
    const T=await loadTesseract();
    const result=await T.recognize(cameraPreview,'eng',{
      logger:m=>{
        if(m?.status==='recognizing text' && typeof m.progress==='number'){
          const pct=Math.round(m.progress*100);
          const el=$('ocrProgressText'); if(el) el.textContent=`Reading text… ${pct}%`;
        }
      }
    });
    const raw=result?.data?.text||'';
    const conf=Number(result?.data?.confidence);
    scannerOcrText=normalizeOcrText(raw);
    scannerOcrConfidence=Number.isFinite(conf)?conf:null;
    if(!scannerOcrText) throw new Error('No readable card text was found. Try a sharper photo with less glare.');

    const numberHint=extractLikelyCardNumber(scannerOcrText);
    const tokens=likelyNameTokens(scannerOcrText);
    const queryTerms=tokens.slice(0,7);

    // Search several likely OCR clues through the selected live provider.
    const candidateMap=new Map();
    const queries=[];
    if(numberHint)queries.push(numberHint);
    for(const token of queryTerms.slice(0,5))queries.push(token);

    for(const q of queries.slice(0,6)){
      try{
        const cards=await universalSearchCards(scannerGame,q,25);
        for(const card of cards){
          const score=candidateScore(card,scannerOcrText,numberHint);
          const prior=candidateMap.get(card.id);
          if(!prior || score>prior.autoScore)candidateMap.set(card.id,{...card,autoScore:score});
        }
      }catch{}
    }

    scannerAutoCandidates=[...candidateMap.values()]
      .sort((a,b)=>b.autoScore-a.autoScore)
      .slice(0,12);

    if(!scannerAutoCandidates.length){
      throw new Error(`Text was read, but no confident ${scannerGame} card matches were found. Use Manual Identify instead.`);
    }

    scannerSearchResults=scannerAutoCandidates;
    scannerAutoCandidates.forEach(c=>captureCardPrice(c,'Auto Identify Beta'));
    saveState();
    scannerLastMarketLookupAt=new Date().toISOString();
    toast(`Auto Identify found ${scannerAutoCandidates.length} possible matches`);
  }catch(e){
    scannerAutoCandidates=[];
    toast(e.message||'Auto Identify failed');
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
function setScannerGame(game){
  scannerGame=game;
  scannerSearchResults=[];
  scannerAutoCandidates=[];
  scannerLastQuery='';
  renderTools();
}
async function scannerSearch(event){
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
function clearScannerPhoto(){
  cameraPreview='';
  scannerOcrText='';
  scannerOcrConfidence=null;
  scannerAutoCandidates=[];
  renderTools();
}

function renderScannerTool(){
  ensureScannerSchema();
  const activeRip=activeRipSessionId?ripSessionById(activeRipSessionId):null;
  return `<div class="panel scanner-pro-panel">
    <div class="section-head"><div><div class="eyebrow">2GEN AUTO IDENTIFY BETA</div><h2>Smart Scanner</h2><p>Take a card photo, read visible text on-device, rank likely Pokémon matches, then show live market fields for the match you confirm.</p></div><button class="btn" onclick="reviewScannerSettings()">⚙ Scanner rules</button></div>

    <div class="scanner-stats">
      <div><span>Queued</span><strong>${state.scanQueue.reduce((n,q)=>n+(Number(q.qty)||0),0)}</strong></div>
      <div><span>Duplicate types</span><strong>${state.scanQueue.filter(q=>scannerOwnedQty(q.card)>0).length}</strong></div>
      <div><span>Missing-set hits</span><strong>${state.scanQueue.filter(q=>scannerSetSignal(q.card).type==='missing').length}</strong></div>
      <div><span>Grading review</span><strong>${state.scanQueue.filter(q=>gradingCandidate(q.card).candidate).length}</strong></div>
    </div>

    ${activeRip?`<div class="notice good"><span>✦</span><span>Active Rip Session: <b>${esc(activeRip.name)}</b>. Committed cards can also be added to that opening.</span></div>`:''}

    <div class="scanner-workspace">
      <div>
        <div class="scanbox">${cameraPreview?`<img src="${cameraPreview}" alt="Card preview">`:`<span style="font-size:44px">◉</span><span>Fill the frame with one card</span>`}</div>
        <div class="action-row">
          <button class="btn primary" onclick="$('hiddenCamera').click()">◉ Take / choose photo</button>
          ${cameraPreview?`<button class="btn auto-btn" onclick="autoIdentifyFromPhoto()" ${scannerOcrBusy?'disabled':''}>${scannerOcrBusy?'Reading…':'✦ Auto Identify Beta'}</button><button class="btn" onclick="clearScannerPhoto()">Clear</button>`:''}
        </div>
        ${scannerOcrBusy?`<div class="ocr-progress"><i></i><span id="ocrProgressText">Reading text…</span></div>`:''}
      </div>

      <div>
        <div class="scanner-game-tabs">${Object.keys(LIVE_CARD_PROVIDERS).map(g=>`<button class="${scannerGame===g?'active':''}" onclick='setScannerGame(${JSON.stringify(g)})'>${esc(g)}</button>`).join('')}</div>
        <form class="searchbar" onsubmit="scannerSearch(event)">
          <span>⌕</span>
          <input id="scannerSearchQ" value="${esc(scannerLastQuery)}" placeholder="Manual fallback: ${esc(scannerGame)} card name or number">
          <button class="btn primary" ${scannerBusy?'disabled':''}>${scannerBusy?'Searching…':'Manual Identify'}</button>
        </form>

        <div class="scanner-accuracy-box">
          <b>How Auto Identify works</b>
          <span>1. The photo is processed on your device to read printed text.</span>
          <span>2. Only extracted text is used to search live Pokémon card data.</span>
          <span>3. 2GEN Vault ranks possible matches.</span>
          <span>4. <b>You confirm the exact card</b> before it enters your Vault.</span>
        </div>

        ${scannerOcrText?`<div class="ocr-readout"><div class="kpi-line"><span>Text-reader confidence</span><strong>${scannerOcrConfidence!==null?scannerOcrConfidence.toFixed(0)+'%':'—'}</strong></div><p>${esc(scannerOcrText.slice(0,300))}${scannerOcrText.length>300?'…':''}</p></div>`:''}
      </div>
    </div>

    ${scannerSearchResults.length?`<div class="subpanel" style="margin-top:11px"><div class="section-head"><div><h2>${scannerAutoCandidates.length?'Ranked possible matches':'Possible matches'}</h2><p>${scannerAutoCandidates.length?'Confirm the exact printing before adding it.':'Choose the correct live card result.'}</p></div><button class="link-btn" onclick="scannerSearchResults=[];scannerAutoCandidates=[];renderTools()">Clear</button></div>${scannerLastMarketLookupAt?`<div class="market-refresh-note">Market lookup retrieved ${humanAge(scannerLastMarketLookupAt)}.</div>`:''}<div class="scanner-match-list">${scannerSearchResults.map(scannerResultMarkup).join('')}</div></div>`:''}
  </div>

  <div class="panel">
    <div class="section-head"><div><h2>Batch review</h2><p>Review quantity, cost and binder suggestions before writing anything to your Vault.</p></div><div class="action-row"><button class="btn red" onclick="clearScanQueue()">Clear</button><button class="btn primary" onclick="commitScanQueue()">✓ Add queue to Vault</button></div></div>
    ${renderScanQueue()}
  </div>

  <div class="panel">
    <div class="section-head"><div><h2>Collector automation</h2><p>Useful assistance without pretending the camera can determine physical grade or authenticity.</p></div></div>
    <div class="automation-grid">
      <div><b>Auto Identify Beta</b><span>Reads visible text locally and ranks likely Pokémon card matches. You still confirm the exact printing.</span></div>
      <div><b>Real market fields</b><span>After identification, available market/low fields come from the live card data provider instead of demo pricing.</span></div>
      <div><b>Duplicate detection</b><span>Flags cards already in your Vault and shows how many copies are owned.</span></div>
      <div><b>Set-gap detection</b><span>Flags cards that appear missing from the set when live set metadata is available.</span></div>
      <div><b>Binder suggestion</b><span>Suggests the binder that already contains the most cards from the same set/game.</span></div>
      <div><b>Grading review flag</b><span>Uses market threshold/rarity only. It does not judge centering, surface, edges, condition, or authenticity.</span></div>
    </div>
  </div>`;
}

$('hiddenCamera').addEventListener('change',e=>{
  const f=e.target.files?.[0]; if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    if(toolsTab==='rips'){
      ripScannerPreview=String(r.result||'');
      renderTools();
      setTimeout(()=>{ if(activeRipSessionId) promptRipCardSearch(activeRipSessionId); },50);
    }else{
      cameraPreview=String(r.result||'');
      scannerOcrText='';
      scannerOcrConfidence=null;
      scannerAutoCandidates=[];
      scannerSearchResults=[];
      renderTools();
      toast('Photo captured — tap Auto Identify Beta');
    }
  };
  r.readAsDataURL(f);
});
function renderWishlistTool(){
  return `<div class="panel"><div class="section-head"><div><h2>Wishlist</h2><p>Keep your chase cards organized.</p></div></div>${state.wishlist.length?state.wishlist.map(w=>`<div class="compact-row">${cardArt(w.card)}<div class="grow"><strong>${esc(w.card.name)}</strong><span>${esc(w.card.set)} • Market ${money(Number(w.card.market))}</span></div><div class="right"><button class="remove" onclick="removeWishlist('${w.uid}')">Remove</button></div></div>`).join(''):`<div class="empty">Tap “Watch” on a card in Search.</div>`}</div>`;
}
function removeWishlist(id){state.wishlist=state.wishlist.filter(x=>x.uid!==id);saveState();renderTools()}
function renderStockReportTool(){
  return `<div class="panel"><div class="section-head"><div><h2>Add stock report</h2><p>Record what you saw and when. This becomes community reporting when cloud accounts are added.</p></div></div>
    <div class="form-grid"><label class="field"><span>Store</span><input id="reportStore" placeholder="Target - Asheville"></label><label class="field"><span>Status</span><select id="reportStatus"><option>In stock</option><option>Low stock</option><option>Out of stock</option></select></label><label class="field full"><span>Product</span><input id="reportProduct" placeholder="Prismatic Evolutions ETB"></label><label class="field"><span>Quantity seen</span><input id="reportQty" type="number" min="0" placeholder="4"></label><label class="field"><span>Price</span><input id="reportPrice" type="number" min="0" step=".01" placeholder="49.99"></label><label class="field full"><span>Notes</span><textarea id="reportNotes" placeholder="Aisle, limit, restock notes..."></textarea></label></div>
    <label class="field" style="margin-top:10px"><span>Community</span><select id="reportPublish"><option value="local">Save on this phone only</option><option value="cloud">Publish to 2GEN Community Network</option></select></label>
    <button class="btn primary" style="margin-top:10px" onclick="addStockReport()">Save report</button>
  </div>`;
}
async function addStockReport(){
  const store=$('reportStore')?.value.trim(), product=$('reportProduct')?.value.trim(); if(!store||!product){toast('Store and product are required');return;}
  const report={uid:uid(),store,product,game:stockGame||'Pokemon',status:$('reportStatus')?.value||'In stock',qty:Number($('reportQty')?.value)||0,price:Number($('reportPrice')?.value)||0,notes:$('reportNotes')?.value.trim()||'',ts:new Date().toISOString(),confirmations:0,soldOutConfirmations:0};
  state.stockReports.unshift(report);
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
  return `2GEN Vault Trade Check\nYou give: ${give}\nValue out: ${money(a.out)}\nYou receive: ${receive}\nValue in: ${money(a.incoming)}\nDifference: ${a.delta>=0?'+':''}${money(a.delta)}\nReference balance: ${a.label} (${a.fairness.toFixed(1)}%)\n\nValues are market references and may vary by condition, exact printing, grade and marketplace.`;
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
  return {brand:'2GEN Vault',collector:p.name,role:p.role,cards,sealed,generatedAt:new Date().toISOString()};
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
      await reg.showNotification(`2GEN Vault • ${n.title}`,{
        body:n.detail||n.category,
        icon:'./icon.svg',
        badge:'./icon.svg',
        tag:`2gen-${n.actionId}`,
        data:{url:location.href}
      });
    }else{
      new Notification(`2GEN Vault • ${n.title}`,{body:n.detail||n.category});
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
        detail:'2GEN Vault can now surface supported alerts when the app is active/opened.'
      });
    }else toast('Notification permission was not granted');
  }catch(e){toast('Could not request notification permission')}
}
function disableBrowserNotifications(){
  state.notificationPrefs.browserNotifications=false;saveState();renderTools();toast('Browser alerts disabled in 2GEN Vault');
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
    title:'2GEN Vault Showcase',
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
  const title=prompt('Showcase title',state.showcaseSettings.title||'2GEN Vault Showcase');
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
    brand:'2GEN Vault',
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
  <div class="foot">Generated privately from 2GEN Vault. Cost basis, cert numbers, addresses, ZIP/postal code and private notes are not included.</div></main></body></html>`;
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

function renderWatchtowerTool(){
  ensureWatchtowerSchema();
  evaluateWatchtower({notify:false});
  const unread=watchtowerUnread();
  const high=watchtowerHighUnread();
  const categories=Object.keys(state.notificationPrefs.categories||{});

  return `<div class="panel watchtower-hero">
    <div class="section-head"><div><div class="eyebrow">2GEN WATCHTOWER</div><h2>Collector alert inbox</h2><p>Turns Action Center conditions into a persistent alert feed so important collector events do not disappear the next time the app changes state.</p></div><button class="btn" onclick="evaluateWatchtower({notify:true});renderTools()">↻ Check now</button></div>

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
    ${state.notificationInbox.length?state.notificationInbox.map(watchtowerNotificationMarkup).join(''):`<div class="empty">No Watchtower alerts yet. Use 2GEN Vault normally and this inbox will populate when tracked conditions become relevant.</div>`}
  </div>`;
}

function renderActionCenterTool(){
  const actions=buildActionCenter();
  const counts=actionCounts(actions);
  const high=actions.filter(a=>a.priority==='high');
  const medium=actions.filter(a=>a.priority==='medium');
  const low=actions.filter(a=>a.priority==='low');

  return `<div class="panel action-center-hero">
    <div class="section-head"><div><div class="eyebrow">2GEN ACTION CENTER</div><h2>What needs your attention</h2><p>One prioritized feed built from your Vault, stock watches, prices, budget, grading, trades, sales and creator workflow.</p></div><button class="btn" onclick="clearAllActionSnoozes()">Restore hidden</button></div>

    <div class="stat-grid compact-stats">
      <div class="stat-card"><span>Open actions</span><strong>${counts.total}</strong><small>Current local priorities</small></div>
      <div class="stat-card"><span>High</span><strong class="${counts.high?'bad':''}">${counts.high}</strong><small>Worth checking first</small></div>
      <div class="stat-card"><span>Medium</span><strong>${counts.medium}</strong><small>Follow-up items</small></div>
      <div class="stat-card"><span>Low</span><strong>${counts.low}</strong><small>Good housekeeping</small></div>
    </div>

    <div class="notice" style="margin-top:10px"><span>ℹ</span><span>Action Center updates when you open/use 2GEN Vault. It does not claim to send background push alerts while the app is closed yet.</span></div>
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

      <div class="provider-tabs mini-provider-tabs">${Object.keys(LIVE_CARD_PROVIDERS).map(g=>`<button class="${tradeSearchGame===g?'active':''}" onclick='setTradeSearchGame(${JSON.stringify(g)})'><b>${esc(g)}</b></button>`).join('')}</div>
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
  <div class="panel"><h2>Inventory integration</h2><div class="notice ${cfg.inventoryApiBase?'good':'warn'}"><span>${cfg.inventoryApiBase?'●':'!'}</span><span>${cfg.inventoryApiBase?`Connected to ${esc(cfg.inventoryApiBase)}`:'No secure retailer-inventory backend is configured. Edit only the public inventoryApiBase in config.js after we create the backend. Never put secret retailer/API keys in GitHub Pages.'}</span></div></div>
  <div class="panel"><h2>Backup & portability</h2><div class="action-row"><button class="btn" onclick="exportBackup()">Export full backup</button><button class="btn" onclick="$('hiddenImport').click()">Import backup</button><button class="btn red" onclick="resetApp()">Reset local data</button></div><p style="margin-top:9px">Version ${esc(String(cfg.appVersion||'0.4.0'))}. Data currently lives on this device until cloud accounts are added.</p></div>`;
}
function saveBrandSettings(){state.settings.brand=$('brandName')?.value.trim()||'2GEN Vault';state.settings.tagline=$('brandTagline')?.value.trim()||'Two Generations. One Collection.';saveState();renderTools();toast('Branding saved')}
function exportBackup(){
  state.settings.lastBackupAt=new Date().toISOString();
  saveState();
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));a.download='2gen-vault-full-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}
$('hiddenImport').addEventListener('change',e=>{
  const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const next=JSON.parse(String(r.result));if(!next.collection||!next.settings)throw new Error('Invalid backup');state={...structuredClone(seed),...next,settings:{...seed.settings,...next.settings}};saveState();render(currentTab);toast('Backup imported')}catch{toast('Backup could not be imported')}};r.readAsText(f)
});
function resetApp(){if(confirm('Reset all local 2GEN Vault data on this device?')){localStorage.removeItem(STORAGE_KEY);state=structuredClone(seed);render(currentTab);toast('Local data reset')}}
function exportCollectionCSV(){
  const rows=[['Type','Game','Name','Set','Number','Condition','Format','Grader','Grade','Cert','Qty','CostEach','MarketEach','Location']];
  state.collection.forEach(i=>rows.push(['Card',i.card.game,i.card.name,i.card.set,i.card.number||'',i.condition,i.format||'Raw',i.grader||'',i.grade||'',i.cert||'',i.qty,i.cost,i.card.market||'',i.location||'']));
  state.sealed.forEach(i=>rows.push(['Sealed',i.game,i.name,'','','','','','','',i.qty,i.cost,i.current,i.location||'']));
  const csv=rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='2gen-vault-collection.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}

Object.assign(window,{
  switchTab,openVault,openTool,toggleRetailer,saveStockArea,useMyLocation,runInventorySearch,findNearbyStores,saveStockWatch,toggleWatch,removeWatch,removeStockReport,clearInventoryResults,openRetailerSearch,saveInventoryResultAsReport,
  buildHuntRoute,clearHuntRoute,toggleHuntStop,reportAtHuntStop,confirmStockReport,buyFromReport,buyInventoryResult,huntWatch,
  refreshCommunityReports,confirmCommunityReport,buyCommunityReport,cloudSignUp,cloudSignIn,cloudMagicLink,cloudSignOut,saveCloudProfile,syncVaultToCloud,restoreVaultFromCloud,
  selectWatch,editWatch,setProductSearch,openProductPage,createCustomProduct,editCatalogProduct,watchProduct,buyCatalogProduct,addOwnedSealedFromProduct,logOpeningFromProduct,openSealedProductPage,openInventoryProduct,openCommunityProduct,
  setDiscoverMode,doCardSearch,addCard,addGradedCard,openCardDetail,closeCardDetail,addWishlist,addPriceAlert,setVaultTab,updateCollection,removeCollection,openCollectionCardDetail,addBinder,renameBinder,deleteBinder,addSealed,openOneSealed,removeSealed,addSetGoal,editSetGoal,removeSetGoal,
  setToolTab,setDiscoverGame,setScannerGame,setTradeSearchGame,openVaultIQCard,queueVaultIQCard,queueVaultIQWatch,updateAcquisitionStatus,removeAcquisitionItem,editVaultIQSettings,vaultIQDealCheck,setShowcaseProfile,toggleShowcaseFeatured,editShowcaseText,toggleShowcaseSetting,downloadShowcaseHtml,downloadShowcaseJson,shareShowcase,openWatchtowerNotification,markWatchtowerRead,markAllWatchtowerRead,clearWatchtowerInbox,resetWatchtowerSignals,enableBrowserNotifications,disableBrowserNotifications,toggleWatchtowerPref,toggleWatchtowerCategory,evaluateWatchtower,openActionItem,snoozeAction,clearAllActionSnoozes,addCollectorProfile,editCollectorProfile,deleteCollectorProfile,setActiveCollector,moveCollectionOwner,moveSealedOwner,transferDuplicateToCollector,addGiveawayFromCollection,addGiveawayFromSealed,updateGiveawayStatus,removeGiveaway,addContentIdea,addContentFromRip,updateContentStatus,editContentIdea,removeContentIdea,exportCollectorShowcase,selectSellSource,setSellMarketplace,updateSellPreview,addSaleToQueue,removeSaleQueueItem,editSaleQueuePrice,completeSale,copySaleListing,queueDuplicateForSale,removeSaleHistory,saveSnapshotNow,refreshVaultPrices,selectMarketCard,scannerSearch,autoIdentifyFromPhoto,selectAutoMatch,queueCard,removeQueuedCard,updateQueuedCard,clearScanQueue,reviewScannerSettings,commitScanQueue,clearScannerPhoto,createRipSession,openRipSession,openRipQuickScanner,promptRipCardSearch,addPullToSession,changePullQty,removePull,editRipSession,finishRipSession,deleteRipSession,exportRipSession,clearRipSearch,clearRipPreview,searchPokemonSets,openSetByInfo,openSetByCard,openCardFromSet,addStockReport,removeWishlist,saveBudget,addPurchase,removePurchase,addGrading,advanceGrading,removeGrading,addOwnedTradeItem,addWishlistTradeItem,addDuplicateTradeItem,addManualTradeItem,addCashAdjustment,removeTradeDraftItem,changeTradeDraftQty,changeTradeDraftValue,clearTradeBuilder,tradeCardSearch,addTradeSearchResult,copyTradeSummary,saveTradeProposal,addTrade,removeTrade,removePriceAlert,saveBrandSettings,exportBackup,resetApp,exportCollectionCSV
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
ensureDailySnapshot();
evaluateWatchtower({notify:false});
render('home');
})();