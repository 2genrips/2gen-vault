(() => {
'use strict';

const STORAGE_KEY = '2gen-vault-collector-os-v4';
const retailers = ['Walmart','Target','Best Buy','GameStop',"Sam's Club",'Costco','Walgreens','CVS','Dollar General','Family Dollar','Local Card Shop'];
const games = ['Pokemon','Lorcana','One Piece','Magic','Yu-Gi-Oh!','Sports','Other'];

const demoCards = [
  {id:'demo-pkm-1',provider:'demo',game:'Pokemon',name:'Charizard ex',set:'Demo Scarlet Set',number:'199/198',rarity:'Special Illustration Rare',market:128.42,low:115},
  {id:'demo-pkm-2',provider:'demo',game:'Pokemon',name:'Pikachu ex',set:'Demo Journey Set',number:'238/191',rarity:'Special Illustration Rare',market:84.15,low:72},
  {id:'demo-lor-1',provider:'demo',game:'Lorcana',name:'Elsa — Spirit of Winter',set:'Demo First Chapter',number:'207/204',rarity:'Enchanted',market:412,low:380},
  {id:'demo-op-1',provider:'demo',game:'One Piece',name:'Monkey D. Luffy',set:'Demo Romance Dawn',number:'OP01-024',rarity:'Parallel',market:145.9,low:132},
  {id:'demo-mtg-1',provider:'demo',game:'Magic',name:'Mana Vault',set:'Demo Masters',number:'001',rarity:'Mythic',market:71.25,low:64},
  {id:'demo-ygo-1',provider:'demo',game:'Yu-Gi-Oh!',name:'Blue-Eyes White Dragon',set:'Demo Anniversary',number:'SDK-001',rarity:'Ultra Rare',market:39.9,low:31}
];

const seed = {
  collection: [
    {uid:uid(),card:demoCards[0],qty:1,condition:'Near Mint',cost:92,location:'Binder 1'},
    {uid:uid(),card:demoCards[1],qty:2,condition:'Near Mint',cost:51,location:'Binder 1'}
  ],
  sealed: [],
  wishlist: [],
  priceAlerts: [],
  stockWatches: [],
  stockReports: [],
  purchases: [],
  trades: [],
  grading: [],
  setGoals: [],
  inventoryResults: [],
  nearbyStores: [],
  huntRoute: [],
  settings: {
    zip:'',
    radius:25,
    lat:null,
    lon:null,
    locationLabel:'',
    monthlyBudget:200,
    brand:'2GEN Vault',
    tagline:'Two Generations. One Collection.'
  }
};

let state = loadState();
let currentTab = 'home';
let vaultTab = 'cards';
let toolsTab = 'scanner';
let discoverMode = 'live';
let discoverResults = [];
let selectedRetailers = new Set(['Walmart','Target','Best Buy','GameStop','Local Card Shop']);
let stockGame = 'Pokemon';
let stockQuery = '';
let cameraPreview = '';
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
  pill.classList.toggle('live', !!backend);
  pill.querySelector('span').textContent = backend ? 'Inventory Connected' : 'Collector OS';
}

function renderHome(){
  const t = totals();
  const spent = monthSpend();
  const budget = Number(state.settings.monthlyBudget)||0;
  const left = budget - spent;
  const top = [...state.collection].sort((a,b)=>(Number(b.card.market)||0)*b.qty-(Number(a.card.market)||0)*a.qty).slice(0,4);
  const recentStock = [...state.stockReports].sort((a,b)=>new Date(b.ts)-new Date(a.ts)).slice(0,3);
  $('home').innerHTML = `
    <div class="hero">
      <div class="eyebrow">2GEN RIPS PRESENTS</div>
      <h1>${esc(state.settings.brand)}</h1>
      <p>${esc(state.settings.tagline)}</p>
      <p class="sub">Find stock • Build your vault • Track value • Collect smarter</p>
      <div class="hero-badges">
        <span class="badge primary">◆ COLLECTOR OS</span>
        <span class="badge">◎ ${state.stockWatches.length} STOCK WATCHES</span>
        <span class="badge">⌖ ${state.huntRoute.filter(x=>!x.visited).length} HUNT STOPS</span>
        <span class="badge red">2GEN RIPS</span>
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
        <button class="quick-card" onclick="openVault('sealed')"><span class="big-icon">◈</span><b>Sealed tracker</b><span>Track ETBs, boxes, tins, bundles and opening inventory.</span></button>
        <button class="quick-card" onclick="openTool('scanner')"><span class="big-icon">◉</span><b>Scan a card</b><span>Camera capture now; smart matching is ready for the backend phase.</span></button>
      </div>
    </div>

    <div class="panel">
      <div class="section-head"><div><h2>Portfolio pulse</h2><p>Collection + sealed value compared with total cost basis.</p></div></div>
      <div class="meter"><div style="width:${Math.min(100,Math.max(5,t.cost?t.market/t.cost*50:50))}%"></div></div>
      <div class="split"><span>Cost ${money(t.cost)}</span><span>Market ${money(t.market)}</span></div>
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
  const watch = {
    uid:uid(), product:stockQuery, game:stockGame,
    retailers:[...selectedRetailers], radius:Number(state.settings.radius)||25,
    maxPrice:maxPriceRaw ? Number(maxPriceRaw) : null, enabled:true, createdAt:new Date().toISOString()
  };
  state.stockWatches.unshift(watch); saveState(); renderStock(); toast('Stock watch saved');
}
function renderStockWatches(){
  if(!state.stockWatches.length) return `<div class="empty">Save your first product hunt to build a restock watchlist.</div>`;
  return state.stockWatches.map(w=>`
    <div class="compact-row"><div class="thumb square"><b>◎</b></div><div class="grow"><strong>${esc(w.product)}</strong><span>${esc(w.game)} • ${w.radius} mi • ${w.retailers.length} retailers${w.maxPrice?` • max ${money(w.maxPrice)}`:''}</span></div>
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
      <div class="action-row">${x.url?`<a class="btn primary" href="${esc(x.url)}" target="_blank" rel="noreferrer">Open retailer ↗</a>`:''}<button class="btn" onclick='saveInventoryResultAsReport(${JSON.stringify(x).replace(/'/g,"&#39;")})'>Save report</button><button class="btn green" onclick='buyInventoryResult(${JSON.stringify(x).replace(/'/g,"&#39;")})'>$ Bought it</button></div>
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
      return {id:key,name,brand:t.brand||'',address,lat:slat,lon:slon,distance:haversine(lat,lon,slat,slon),shop:t.shop||''};
    }).filter(Boolean).sort((a,b)=>a.distance-b.distance).slice(0,30);
    state.nearbyStores=stores; saveState(); renderStock(); toast(`${stores.length} nearby stores found`);
  }catch(e){ toast(e.message||'Nearby store lookup failed'); }
}
function renderNearbyStores(){
  if(!state.nearbyStores.length) return `<div class="empty">Save a ZIP or use GPS, then tap “Nearby stores.”</div>`;
  return state.nearbyStores.map(s=>`
    <div class="compact-row"><div class="thumb square"><b>⌖</b></div><div class="grow"><strong>${esc(s.name)}</strong><span>${esc(s.address||s.shop||'Store')} • ${s.distance.toFixed(1)} mi</span></div>
    <div class="right"><a class="btn" target="_blank" rel="noreferrer" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.lat+','+s.lon)}">Map ↗</a></div></div>
  `).join('');
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

function renderDiscover(){
  $('discover').innerHTML = `
    <div class="page-title"><div><h1>Card Search</h1><p>Discover cards, compare market data and add them straight to your vault.</p></div></div>
    <div class="segmented">
      <button class="${discoverMode==='live'?'active':''}" onclick="setDiscoverMode('live')">Live Pokémon</button>
      <button class="${discoverMode==='demo'?'active':''}" onclick="setDiscoverMode('demo')">Multi-TCG demo</button>
    </div>
    <form class="searchbar" onsubmit="doCardSearch(event)"><span>⌕</span><input id="cardSearchQ" placeholder="${discoverMode==='live'?'Charizard, Pikachu, Mew...':'Search game, card, set...'}"><button class="btn primary">Search</button></form>
    <div class="notice" style="margin-top:9px"><span>ℹ</span><span>${discoverMode==='live'?'This uses the public Pokémon TCG data source when available. Other TCG providers can plug into the same normalized card model later.':'Demo data is clearly labeled and exists only to test the multi-TCG experience.'}</span></div>
    <div class="result-grid">${discoverResults.map(cardResultMarkup).join('')}</div>`;
}
function setDiscoverMode(m){ discoverMode=m; discoverResults=m==='demo'?demoCards:[]; renderDiscover(); }
async function doCardSearch(e){
  e.preventDefault();
  const q=$('cardSearchQ')?.value.trim()||'';
  if(!q){ discoverResults=discoverMode==='demo'?demoCards:[]; renderDiscover(); return; }
  if(discoverMode==='demo'){
    const z=q.toLowerCase();
    discoverResults=demoCards.filter(c=>`${c.name} ${c.set} ${c.game} ${c.number} ${c.rarity}`.toLowerCase().includes(z));
    renderDiscover(); return;
  }
  toast('Searching live card data…');
  try{
    const safe=q.replace(/"/g,'');
    const url=`https://api.pokemontcg.io/v2/cards?q=name:%22${encodeURIComponent(safe)}%22&pageSize=24&orderBy=-set.releaseDate`;
    const r=await fetch(url);
    if(!r.ok) throw new Error(`Card API returned ${r.status}`);
    const d=await r.json();
    discoverResults=(d.data||[]).map(c=>{
      const ps=Object.values(c.tcgplayer?.prices||{});
      const market=ps.find(p=>typeof p.market==='number')?.market;
      const lows=ps.map(p=>p.low).filter(v=>typeof v==='number');
      return {id:c.id,provider:'pokemontcg',game:'Pokemon',name:c.name,set:c.set?.name||'Unknown set',number:c.number||'',rarity:c.rarity||'',image:c.images?.small||c.images?.large||'',market,low:lows.length?Math.min(...lows):undefined,url:c.tcgplayer?.url||''};
    });
    renderDiscover(); toast(`${discoverResults.length} cards found`);
  }catch(e){ discoverResults=[]; renderDiscover(); toast(e.message||'Card search failed'); }
}
function cardResultMarkup(c){
  return `<article class="card-result">${cardArt(c)}<div><div class="eyebrow">${esc(c.game)} • ${esc(c.set)}</div><h3>${esc(c.name)}</h3><div class="tiny">${esc(c.number||'—')} ${c.rarity?'• '+esc(c.rarity):''}</div><div class="price-row"><strong>${money(Number(c.market))}</strong>${typeof c.low==='number'?`<span>Low ${money(c.low)}</span>`:''}</div><div class="action-row"><button class="btn primary" onclick='addCard(${JSON.stringify(c).replace(/'/g,"&#39;")})'>＋ Add</button><button class="btn" onclick='addWishlist(${JSON.stringify(c).replace(/'/g,"&#39;")})'>♡ Watch</button><button class="btn" onclick='addPriceAlert(${JSON.stringify(c).replace(/'/g,"&#39;")})'>◎ Price alert</button>${c.url?`<a class="btn" href="${esc(c.url)}" target="_blank" rel="noreferrer">Market ↗</a>`:''}</div></div></article>`;
}
function addCard(card){
  const ex=state.collection.find(x=>x.card.id===card.id&&x.condition==='Near Mint');
  if(ex) ex.qty+=1;
  else state.collection.unshift({uid:uid(),card,qty:1,condition:'Near Mint',cost:Number(card.market)||0,location:'Binder'});
  saveState(); toast('Added to vault');
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
    <div class="segmented"><button class="${vaultTab==='cards'?'active':''}" onclick="setVaultTab('cards')">Cards</button><button class="${vaultTab==='sealed'?'active':''}" onclick="setVaultTab('sealed')">Sealed</button><button class="${vaultTab==='sets'?'active':''}" onclick="setVaultTab('sets')">Set goals</button></div>
    <div id="vaultBody">${vaultTab==='cards'?renderCardVault():vaultTab==='sealed'?renderSealedVault():renderSetGoals()}</div>`;
}
function setVaultTab(t){ vaultTab=t; renderVault(); }
function renderCardVault(){
  if(!state.collection.length) return `<div class="panel"><div class="empty">Your card vault is empty. Add cards from Search.</div></div>`;
  return `<div class="panel">${state.collection.map(i=>{
    const val=(Number(i.card.market)||0)*(Number(i.qty)||0), gain=(Number(i.card.market)||0-Number(i.cost)||0)*(Number(i.qty)||0);
    return `<div class="vault-item">${cardArt(i.card)}<div><div class="eyebrow">${esc(i.card.game)} • ${esc(i.card.set)}</div><h3>${esc(i.card.name)}</h3><div class="mini-grid">
      <label class="field"><span>Qty</span><input type="number" min="1" value="${i.qty}" onchange="updateCollection('${i.uid}','qty',this.value)"></label>
      <label class="field"><span>Cost ea.</span><input type="number" min="0" step=".01" value="${i.cost}" onchange="updateCollection('${i.uid}','cost',this.value)"></label>
      <label class="field"><span>Condition</span><select onchange="updateCollection('${i.uid}','condition',this.value)">${['Near Mint','Lightly Played','Moderately Played','Heavily Played'].map(c=>`<option ${c===i.condition?'selected':''}>${c}</option>`).join('')}</select></label>
    </div></div><div class="right"><strong>${money(val)}</strong><small class="${gain>=0?'good':'bad'}">${gain>=0?'+':''}${money(gain)}</small><button class="remove" onclick="removeCollection('${i.uid}')">Remove</button></div></div>`;
  }).join('')}</div>`;
}
function updateCollection(id,key,val){
  const i=state.collection.find(x=>x.uid===id); if(!i) return;
  i[key]=key==='condition'?val:Math.max(key==='qty'?1:0,Number(val)||0); saveState(); renderVault();
}
function removeCollection(id){ state.collection=state.collection.filter(x=>x.uid!==id); saveState(); renderVault(); }
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
      <div class="compact-row"><div class="thumb square"><b>◈</b></div><div class="grow"><strong>${esc(i.name)}</strong><span>${esc(i.game)} • Qty ${i.qty} • ${esc(i.location||'No location')}</span></div><div class="right"><strong>${money((Number(i.current)||0)*i.qty)}</strong><div><button class="link-btn" onclick="openOneSealed('${i.uid}')">Open one</button><button class="remove" onclick="removeSealed('${i.uid}')">Delete</button></div></div></div>
    `).join(''):`<div class="empty">No sealed products tracked yet.</div>`}</div>`;
}
function addSealed(){
  const name=$('sealedName')?.value.trim(); if(!name){toast('Enter a product name');return;}
  state.sealed.unshift({uid:uid(),name,game:$('sealedGame')?.value||'Pokemon',qty:Math.max(1,Number($('sealedQty')?.value)||1),cost:Number($('sealedCost')?.value)||0,current:Number($('sealedCurrent')?.value)||0,location:$('sealedLocation')?.value.trim()||'',addedAt:new Date().toISOString()});
  saveState(); renderVault(); toast('Sealed product added');
}
function openOneSealed(id){
  const i=state.sealed.find(x=>x.uid===id); if(!i) return;
  if(!confirm(`Mark one ${i.name} as opened?`)) return;
  i.qty-=1; state.purchases.unshift({uid:uid(),merchant:'Vault',item:`Opened: ${i.name}`,category:'Opened sealed',amount:0,qty:1,date:todayInput(),notes:'Marked opened from sealed tracker'});
  if(i.qty<=0) state.sealed=state.sealed.filter(x=>x.uid!==id);
  saveState(); renderVault(); toast('Opening logged');
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
      ${toolButton('scanner','◉','Scanner','Capture cards')}
      ${toolButton('wishlist','♡','Wishlist','Cards you want')}
      ${toolButton('stockreport','◎','Stock report','Log store inventory')}
      ${toolButton('budget','$','Budget','Spending & purchases')}
      ${toolButton('grading','◇','Grading','Submission tracker')}
      ${toolButton('trades','⇄','Trades','Trade history')}
      ${toolButton('alerts','!','Alerts','Price targets')}
      ${toolButton('settings','⚙','Settings','Backup & integrations')}
    </div>
    <div id="toolBody">${renderToolBody()}</div>`;
}
function toolButton(id,icon,title,sub){return `<button class="tool-tab ${toolsTab===id?'active':''}" onclick="setToolTab('${id}')"><b>${icon} ${title}</b><span>${sub}</span></button>`}
function setToolTab(t){toolsTab=t;renderTools()}
function renderToolBody(){
  if(toolsTab==='scanner') return renderScannerTool();
  if(toolsTab==='wishlist') return renderWishlistTool();
  if(toolsTab==='stockreport') return renderStockReportTool();
  if(toolsTab==='budget') return renderBudgetTool();
  if(toolsTab==='grading') return renderGradingTool();
  if(toolsTab==='trades') return renderTradesTool();
  if(toolsTab==='alerts') return renderAlertsTool();
  return renderSettingsTool();
}
function renderScannerTool(){
  return `<div class="panel"><div class="section-head"><div><h2>Camera scanner</h2><p>Capture a clean card photo. Automatic identification will plug into the future vision service.</p></div></div>
    <div class="scanbox">${cameraPreview?`<img src="${cameraPreview}" alt="Card preview">`:`<span style="font-size:44px">◉</span><span>Place one card inside the frame</span>`}</div>
    <button class="btn primary wide" onclick="$('hiddenCamera').click()">Take / choose photo</button>
    <div class="notice" style="margin-top:10px"><span>✓</span><span>This Pages build keeps the selected image on the device. It is not uploaded by 2GEN Vault.</span></div>
  </div>`;
}
$('hiddenCamera').addEventListener('change',e=>{
  const f=e.target.files?.[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{cameraPreview=String(r.result||'');renderTools()};r.readAsDataURL(f);
});
function renderWishlistTool(){
  return `<div class="panel"><div class="section-head"><div><h2>Wishlist</h2><p>Keep your chase cards organized.</p></div></div>${state.wishlist.length?state.wishlist.map(w=>`<div class="compact-row">${cardArt(w.card)}<div class="grow"><strong>${esc(w.card.name)}</strong><span>${esc(w.card.set)} • Market ${money(Number(w.card.market))}</span></div><div class="right"><button class="remove" onclick="removeWishlist('${w.uid}')">Remove</button></div></div>`).join(''):`<div class="empty">Tap “Watch” on a card in Search.</div>`}</div>`;
}
function removeWishlist(id){state.wishlist=state.wishlist.filter(x=>x.uid!==id);saveState();renderTools()}
function renderStockReportTool(){
  return `<div class="panel"><div class="section-head"><div><h2>Add stock report</h2><p>Record what you saw and when. This becomes community reporting when cloud accounts are added.</p></div></div>
    <div class="form-grid"><label class="field"><span>Store</span><input id="reportStore" placeholder="Target - Asheville"></label><label class="field"><span>Status</span><select id="reportStatus"><option>In stock</option><option>Low stock</option><option>Out of stock</option></select></label><label class="field full"><span>Product</span><input id="reportProduct" placeholder="Prismatic Evolutions ETB"></label><label class="field"><span>Quantity seen</span><input id="reportQty" type="number" min="0" placeholder="4"></label><label class="field"><span>Price</span><input id="reportPrice" type="number" min="0" step=".01" placeholder="49.99"></label><label class="field full"><span>Notes</span><textarea id="reportNotes" placeholder="Aisle, limit, restock notes..."></textarea></label></div>
    <button class="btn primary" style="margin-top:10px" onclick="addStockReport()">Save report</button>
  </div>`;
}
function addStockReport(){
  const store=$('reportStore')?.value.trim(), product=$('reportProduct')?.value.trim(); if(!store||!product){toast('Store and product are required');return;}
  state.stockReports.unshift({uid:uid(),store,product,status:$('reportStatus')?.value||'In stock',qty:Number($('reportQty')?.value)||0,price:Number($('reportPrice')?.value)||0,notes:$('reportNotes')?.value.trim()||'',ts:new Date().toISOString(),confirmations:0,soldOutConfirmations:0});
  saveState(); toast('Stock report saved'); switchTab('stock');
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
  state.grading.unshift({uid:uid(),card,company:$('gradeCompany')?.value||'PSA',status:$('gradeStatus')?.value||'Preparing',fee:Number($('gradeFee')?.value)||0,date:todayInput()});saveState();renderTools()
}
function advanceGrading(id){
  const g=state.grading.find(x=>x.uid===id);if(!g)return;const statuses=['Preparing','Submitted','Received','Grading','Shipped back','Complete'];const v=prompt('Status:',g.status);if(v===null)return;g.status=v;saveState();renderTools()
}
function removeGrading(id){state.grading=state.grading.filter(x=>x.uid!==id);saveState();renderTools()}
function renderTradesTool(){
  return `<div class="panel"><div class="section-head"><div><h2>Trade journal</h2><p>Track what you gave up versus what you received.</p></div></div><div class="form-grid"><label class="field"><span>Trade partner</span><input id="tradePartner" placeholder="Name / handle"></label><label class="field"><span>Date</span><input id="tradeDate" type="date" value="${todayInput()}"></label><label class="field full"><span>You gave</span><input id="tradeGive" placeholder="Cards / products"></label><label class="field full"><span>You received</span><input id="tradeReceive" placeholder="Cards / products"></label><label class="field"><span>Value out</span><input id="tradeOut" type="number" step=".01" min="0"></label><label class="field"><span>Value in</span><input id="tradeIn" type="number" step=".01" min="0"></label></div><button class="btn primary" style="margin-top:10px" onclick="addTrade()">＋ Log trade</button></div>
  <div class="panel">${state.trades.length?state.trades.map(t=>`<div class="compact-row"><div class="thumb square"><b>⇄</b></div><div class="grow"><strong>${esc(t.partner||'Trade')}</strong><span>Gave: ${esc(t.give)} • Got: ${esc(t.receive)} • ${esc(t.date)}</span></div><div class="right"><strong class="${t.valueIn>=t.valueOut?'good':'bad'}">${money(t.valueIn-t.valueOut)}</strong><button class="remove" onclick="removeTrade('${t.uid}')">Delete</button></div></div>`).join(''):`<div class="empty">No trades logged yet.</div>`}</div>`;
}
function addTrade(){
  const give=$('tradeGive')?.value.trim(),receive=$('tradeReceive')?.value.trim();if(!give||!receive){toast('Enter both sides of the trade');return;}
  state.trades.unshift({uid:uid(),partner:$('tradePartner')?.value.trim()||'',date:$('tradeDate')?.value||todayInput(),give,receive,valueOut:Number($('tradeOut')?.value)||0,valueIn:Number($('tradeIn')?.value)||0});saveState();renderTools()
}
function removeTrade(id){state.trades=state.trades.filter(x=>x.uid!==id);saveState();renderTools()}
function renderAlertsTool(){
  return `<div class="panel"><div class="section-head"><div><h2>Card price alerts</h2><p>Local targets now; background push notifications arrive with the cloud backend.</p></div></div>${state.priceAlerts.length?state.priceAlerts.map(a=>{const hit=typeof a.card.market==='number'&&a.card.market<=a.target;return `<div class="compact-row">${cardArt(a.card)}<div class="grow"><strong>${esc(a.card.name)}</strong><span>Below ${money(a.target)} • Current ${money(Number(a.card.market))}</span></div><div class="right"><span class="stock-pill ${hit?'in':'low'}">${hit?'TARGET HIT':'WATCHING'}</span><button class="remove" onclick="removePriceAlert('${a.uid}')">Delete</button></div></div>`}).join(''):`<div class="empty">Create a card price alert from Search.</div>`}</div>`;
}
function removePriceAlert(id){state.priceAlerts=state.priceAlerts.filter(x=>x.uid!==id);saveState();renderTools()}
function renderSettingsTool(){
  const cfg=window.TWOGEN_CONFIG||{};
  return `<div class="panel"><div class="section-head"><div><h2>App settings</h2><p>Branding, backup and integration status.</p></div></div><div class="form-grid"><label class="field"><span>App name</span><input id="brandName" value="${esc(state.settings.brand)}"></label><label class="field"><span>Tagline</span><input id="brandTagline" value="${esc(state.settings.tagline)}"></label></div><button class="btn primary" style="margin-top:10px" onclick="saveBrandSettings()">Save branding</button></div>
  <div class="panel"><h2>Inventory integration</h2><div class="notice ${cfg.inventoryApiBase?'good':'warn'}"><span>${cfg.inventoryApiBase?'●':'!'}</span><span>${cfg.inventoryApiBase?`Connected to ${esc(cfg.inventoryApiBase)}`:'No secure retailer-inventory backend is configured. Edit only the public inventoryApiBase in config.js after we create the backend. Never put secret retailer/API keys in GitHub Pages.'}</span></div></div>
  <div class="panel"><h2>Backup & portability</h2><div class="action-row"><button class="btn" onclick="exportBackup()">Export full backup</button><button class="btn" onclick="$('hiddenImport').click()">Import backup</button><button class="btn red" onclick="resetApp()">Reset local data</button></div><p style="margin-top:9px">Version ${esc(String(cfg.appVersion||'0.4.0'))}. Data currently lives on this device until cloud accounts are added.</p></div>`;
}
function saveBrandSettings(){state.settings.brand=$('brandName')?.value.trim()||'2GEN Vault';state.settings.tagline=$('brandTagline')?.value.trim()||'Two Generations. One Collection.';saveState();renderTools();toast('Branding saved')}
function exportBackup(){
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));a.download='2gen-vault-full-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}
$('hiddenImport').addEventListener('change',e=>{
  const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const next=JSON.parse(String(r.result));if(!next.collection||!next.settings)throw new Error('Invalid backup');state={...structuredClone(seed),...next,settings:{...seed.settings,...next.settings}};saveState();render(currentTab);toast('Backup imported')}catch{toast('Backup could not be imported')}};r.readAsText(f)
});
function resetApp(){if(confirm('Reset all local 2GEN Vault data on this device?')){localStorage.removeItem(STORAGE_KEY);state=structuredClone(seed);render(currentTab);toast('Local data reset')}}
function exportCollectionCSV(){
  const rows=[['Type','Game','Name','Set','Number','Condition','Qty','CostEach','MarketEach','Location']];
  state.collection.forEach(i=>rows.push(['Card',i.card.game,i.card.name,i.card.set,i.card.number||'',i.condition,i.qty,i.cost,i.card.market||'',i.location||'']));
  state.sealed.forEach(i=>rows.push(['Sealed',i.game,i.name,'','','',i.qty,i.cost,i.current,i.location||'']));
  const csv=rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='2gen-vault-collection.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}

Object.assign(window,{
  switchTab,openVault,openTool,toggleRetailer,saveStockArea,useMyLocation,runInventorySearch,findNearbyStores,saveStockWatch,toggleWatch,removeWatch,removeStockReport,clearInventoryResults,openRetailerSearch,saveInventoryResultAsReport,
  buildHuntRoute,clearHuntRoute,toggleHuntStop,reportAtHuntStop,confirmStockReport,buyFromReport,buyInventoryResult,huntWatch,
  setDiscoverMode,doCardSearch,addCard,addWishlist,addPriceAlert,setVaultTab,updateCollection,removeCollection,addSealed,openOneSealed,removeSealed,addSetGoal,editSetGoal,removeSetGoal,
  setToolTab,addStockReport,removeWishlist,saveBudget,addPurchase,removePurchase,addGrading,advanceGrading,removeGrading,addTrade,removeTrade,removePriceAlert,saveBrandSettings,exportBackup,resetApp,exportCollectionCSV
});

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').then(reg=>reg.update()).catch(()=>{}));
}
render('home');
})();