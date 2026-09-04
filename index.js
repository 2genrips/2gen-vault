/**
 * VaultSignal Real Inventory Worker v5
 * Cloudflare Workers backend.
 *
 * Secrets:
 *   BESTBUY_API_KEY          - Best Buy Developer API key
 *   PRICECHARTING_API_TOKEN   - PriceCharting API token
 *
 * Vars:
 *   ALLOWED_ORIGIN   - e.g. https://2genrips.github.io
 *
 * Endpoints:
 *   GET /health
 *   GET /inventory?q=...&zip=...&radius=25&retailers=Best%20Buy,...
 *   GET /card-price?q=...&game=...
 *   GET /area-scan?zip=28761&radius=25&games=Pokemon,Lorcana
 */

const VERSION = "10.3.0";
const BESTBUY_BASE = "https://api.bestbuy.com/v1";
const MAX_PRODUCT_MATCHES = 4;
const CACHE_TTL_SECONDS = 120;

function json(data, status=200, origin="*"){
  return new Response(JSON.stringify(data),{
    status,
    headers:{
      "content-type":"application/json; charset=utf-8",
      "cache-control":"no-store",
      "access-control-allow-origin":origin,
      "access-control-allow-methods":"GET,OPTIONS",
      "access-control-allow-headers":"Accept,Content-Type"
    }
  });
}
function corsOrigin(request, env){
  const origin=request.headers.get("Origin")||"*";
  const allowed=(env.ALLOWED_ORIGIN||"*").trim();
  if(allowed==="*")return "*";
  const set=new Set(allowed.split(",").map(x=>x.trim()).filter(Boolean));
  return set.has(origin)?origin:"null";
}
function safeText(v,max=160){
  return String(v||"").replace(/[^\p{L}\p{N}\s\-_'&.:/]/gu," ").replace(/\s+/g," ").trim().slice(0,max);
}
function boundedNumber(v,min,max,fallback){
  const n=Number(v);
  return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;
}
function selectedRetailers(url){
  return new Set((url.searchParams.get("retailers")||"").split(",").map(x=>x.trim()).filter(Boolean));
}
function bestBuySelected(retailers){
  return !retailers.size || [...retailers].some(x=>/best\s*buy/i.test(x));
}
function providerStatus(env){
  return [
    {
      id:"bestbuy",
      name:"Best Buy",
      mode:"official_api",
      configured:!!env.BESTBUY_API_KEY,
      description:env.BESTBUY_API_KEY
        ?"Official Best Buy Developer API connected for product lookup and near-real-time in-store SKU availability."
        :"Official connector is ready, but BESTBUY_API_KEY has not been added as a Worker secret."
    },
    {
      id:"target",
      name:"Target",
      mode:"retailer_check",
      configured:true,
      description:"Retailer-site availability handoff only. This worker does not scrape or invent Target store stock."
    },
    {
      id:"walmart",
      name:"Walmart",
      mode:"retailer_check",
      configured:true,
      description:"Retailer-site shopping handoff only. Walmart Marketplace inventory APIs manage seller inventory, not arbitrary shopper store shelves."
    },
    {
      id:"gamestop",
      name:"GameStop",
      mode:"retailer_check",
      configured:true,
      description:"Retailer search handoff until an authorized inventory integration is connected."
    }
  ];
}

function dollarsFromPennies(v){
  const n=Number(v);
  return Number.isFinite(n)&&n>0?n/100:null;
}
function priceChartingStatus(env){
  return {
    id:"pricecharting",
    name:"PriceCharting",
    mode:"premium_api",
    configured:!!env.PRICECHARTING_API_TOKEN,
    description:env.PRICECHARTING_API_TOKEN
      ?"Primary current card-price guide connector is configured server-side."
      :"Connector ready. Add PRICECHARTING_API_TOKEN as a Cloudflare Worker secret."
  };
}
async function priceChartingProduct(q,env,cache){
  if(!env.PRICECHARTING_API_TOKEN)return null;
  const clean=safeText(q,140);
  if(!clean)return null;

  const cacheKey=new Request(`https://cache.2gen-vault.local/pricecharting?q=${encodeURIComponent(clean.toLowerCase())}`);
  const cached=await cache.match(cacheKey);
  if(cached)return await cached.json();

  const u=new URL("https://www.pricecharting.com/api/product");
  u.searchParams.set("t",env.PRICECHARTING_API_TOKEN);
  u.searchParams.set("q",clean);

  const r=await fetch(u.toString(),{headers:{Accept:"application/json"}});
  const d=await r.json().catch(()=>({}));
  if(!r.ok || d.status==="error")throw new Error(d["error-message"]||`PriceCharting lookup ${r.status}`);

  const result={
    id:String(d.id||""),
    productName:d["product-name"]||clean,
    category:d["console-name"]||d.genre||"Trading Card",
    genre:d.genre||"",
    releaseDate:d["release-date"]||"",
    salesVolume:Number(d["sales-volume"])||null,
    ungraded:dollarsFromPennies(d["loose-price"]),
    grade7:dollarsFromPennies(d["cib-price"]),
    grade8:dollarsFromPennies(d["new-price"]),
    grade9:dollarsFromPennies(d["graded-price"]),
    grade95:dollarsFromPennies(d["box-only-price"]),
    psa10:dollarsFromPennies(d["manual-only-price"]),
    bgs10:dollarsFromPennies(d["bgs-10-price"]),
    source:"PriceCharting",
    sourceType:"premium_api",
    checkedAt:new Date().toISOString(),
    searchUrl:`https://www.pricecharting.com/search-products?type=prices&q=${encodeURIComponent(d["product-name"]||clean)}`
  };

  const cacheResponse=new Response(JSON.stringify(result),{
    headers:{"content-type":"application/json","cache-control":"public, max-age=300"}
  });
  await cache.put(cacheKey,cacheResponse.clone());
  return result;
}

function retailerFallbackResults({q,retailers}){
  const enc=encodeURIComponent(q);
  const rows=[];
  const add=(name,url)=>{
    if(retailers.size && ![...retailers].some(r=>r.toLowerCase()===name.toLowerCase()))return;
    rows.push({
      id:`check-${name.toLowerCase().replace(/\W+/g,"-")}`,
      provider:name,retailer:name,store:name,product:q,
      status:"retailer_check",quantity:null,price:0,distanceMiles:null,
      sourceType:"retailer_verified",
      sourceAttribution:`${name} website`,
      checkedAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
      url
    });
  };
  add("Target",`https://www.target.com/s?searchTerm=${enc}`);
  add("Walmart",`https://www.walmart.com/search?q=${enc}`);
  add("GameStop",`https://www.gamestop.com/search/?q=${enc}`);
  add("Sam's Club",`https://www.samsclub.com/s/${enc}`);
  add("Costco",`https://www.costco.com/CatalogSearch?keyword=${enc}`);
  add("Walgreens",`https://www.walgreens.com/search/results.jsp?Ntt=${enc}`);
  add("CVS",`https://www.cvs.com/search?searchTerm=${enc}`);
  add("Dollar General",`https://www.dollargeneral.com/search?searchTerm=${enc}`);
  add("Family Dollar",`https://www.familydollar.com/searchresults?Ntt=${enc}`);
  return rows;
}
function bestBuyQueryFromInput({q,bestBuySku,sku,upc}){
  const exact=String(bestBuySku||"").trim() || (/^\d{5,10}$/.test(String(sku||"").trim())?String(sku).trim():"");
  if(exact)return `sku=${exact}`;
  if(/^\d{8,14}$/.test(String(upc||"").trim()))return `upc=${String(upc).trim()}`;
  const words=safeText(q,100).split(/\s+/).filter(Boolean).slice(0,8);
  if(!words.length)return "";
  return words.map(w=>`search=${w}`).join("&");
}
async function bbyFetch(url, apiKey, cache){
  const u=new URL(url);
  u.searchParams.set("apiKey",apiKey);
  const key=new Request(u.toString(),{headers:{Accept:"application/json"}});
  const cached=await cache.match(key);
  if(cached)return cached.clone();
  const r=await fetch(key);
  if(r.ok){
    const clone=new Response(r.body,{
      status:r.status,
      statusText:r.statusText,
      headers:r.headers
    });
    const h=new Headers(clone.headers);
    h.set("cache-control",`public, max-age=${CACHE_TTL_SECONDS}`);
    const cacheable=new Response(await clone.arrayBuffer(),{status:r.status,headers:h});
    await cache.put(key,cacheable.clone());
    return cacheable;
  }
  return r;
}
async function bestBuyProducts(args,env,cache){
  const query=bestBuyQueryFromInput(args);
  if(!query)return [];
  const url=new URL(`${BESTBUY_BASE}/products(${query})`);
  url.searchParams.set("format","json");
  url.searchParams.set("pageSize",String(MAX_PRODUCT_MATCHES));
  url.searchParams.set("show","sku,name,salePrice,regularPrice,inStorePickup,inStoreAvailability,onlineAvailability,url,addToCartUrl,image,upc");
  const r=await bbyFetch(url.toString(),env.BESTBUY_API_KEY,cache);
  if(!r.ok){
    const text=await r.text();
    throw new Error(`Best Buy product lookup ${r.status}${text?`: ${text.slice(0,120)}`:""}`);
  }
  const d=await r.json();
  return Array.isArray(d.products)?d.products:[];
}
async function bestBuyAvailability(product,args,env,cache){
  if(!args.zip)return [];
  const url=new URL(`${BESTBUY_BASE}/products/${encodeURIComponent(product.sku)}/stores.json`);
  url.searchParams.set("postalCode",args.zip);
  const r=await bbyFetch(url.toString(),env.BESTBUY_API_KEY,cache);
  if(!r.ok)throw new Error(`Best Buy availability lookup ${r.status}`);
  const d=await r.json();
  const radius=boundedNumber(args.radius,1,250,25);
  return (d.stores||[])
    .filter(s=>Number(s.distance)<=radius)
    .map(s=>({
      id:`bestbuy-${product.sku}-${s.storeID}`,
      provider:"Best Buy",
      retailer:"Best Buy",
      store:`Best Buy - ${s.name||s.storeID}`,
      storeId:String(s.storeID||""),
      address:[s.address,s.city,s.state,s.postalCode].filter(Boolean).join(", "),
      city:s.city||"",
      state:s.state||"",
      postalCode:s.postalCode||"",
      distanceMiles:Number(s.distance),
      product:product.name,
      retailerSku:String(product.sku),
      upc:product.upc||"",
      game:args.game||"",
      price:Number(product.salePrice)||Number(product.regularPrice)||0,
      regularPrice:Number(product.regularPrice)||0,
      status:s.lowStock?"low_stock":"in_stock",
      quantity:null,
      pickupEligible:d.ispuEligible===true,
      lowStock:s.lowStock===true,
      sourceType:"official_api",
      sourceAttribution:"Best Buy Developer API",
      sourceAttributionUrl:"https://developer.bestbuy.com",
      checkedAt:new Date().toISOString(),
      updatedAt:new Date().toISOString(),
      url:product.url||"",
      addToCartUrl:product.addToCartUrl||"",
      image:product.image||"",
      confidence:s.lowStock?88:96
    }));
}
async function bestBuyResults(args,env,cache){
  if(!env.BESTBUY_API_KEY)return [];
  const products=await bestBuyProducts(args,env,cache);
  const rows=[];
  for(let i=0;i<products.length;i++){
    const p=products[i];
    const available=await bestBuyAvailability(p,args,env,cache);
    rows.push(...available);
    if(i<products.length-1)await new Promise(r=>setTimeout(r,220));
  }
  return rows;
}
function dedupe(rows){
  const m=new Map();
  for(const x of rows){
    const key=[x.provider,x.storeId||x.store,x.retailerSku||x.product,x.status].join("|").toLowerCase();
    if(!m.has(key))m.set(key,x);
  }
  return [...m.values()];
}


function withTimeout(url,options={},ms=6500){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),ms);
  return fetch(url,{...options,signal:controller.signal}).finally(()=>clearTimeout(timer));
}
async function geocodeZip(zip,cache){
  const cacheKey=new Request(`https://cache.vaultsignal.local/zip/${zip}`);
  const cached=await cache.match(cacheKey);
  if(cached)return await cached.json();

  let result=null;
  try{
    const r=await withTimeout(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`,{headers:{Accept:"application/json"}},3500);
    if(r.ok){
      const d=await r.json();
      const p=d.places?.[0];
      if(p)result={
        zip,
        lat:Number(p.latitude),
        lon:Number(p.longitude),
        city:p["place name"]||"",
        state:p["state abbreviation"]||p.state||""
      };
    }
  }catch{}

  if(!result){
    const u=new URL("https://nominatim.openstreetmap.org/search");
    u.searchParams.set("format","jsonv2");
    u.searchParams.set("countrycodes","us");
    u.searchParams.set("postalcode",zip);
    u.searchParams.set("limit","1");
    const r=await withTimeout(u.toString(),{headers:{Accept:"application/json","User-Agent":"VaultSignal/10.3"}},4000);
    if(!r.ok)throw new Error("ZIP lookup failed");
    const d=await r.json();
    if(!d[0])throw new Error("ZIP could not be located");
    result={zip,lat:Number(d[0].lat),lon:Number(d[0].lon),city:"",state:""};
  }

  if(!Number.isFinite(result.lat)||!Number.isFinite(result.lon))throw new Error("ZIP coordinates unavailable");

  await cache.put(cacheKey,new Response(JSON.stringify(result),{
    headers:{"content-type":"application/json","cache-control":"public,max-age=86400"}
  }));
  return result;
}
function distanceMiles(lat1,lon1,lat2,lon2){
  const R=3958.8,toRad=x=>x*Math.PI/180;
  const dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function workerRetailerFamily(name=""){
  const n=String(name).toLowerCase();
  if(n.includes("walmart"))return "Walmart";
  if(n.includes("target"))return "Target";
  if(n.includes("best buy"))return "Best Buy";
  if(n.includes("gamestop"))return "GameStop";
  if(n.includes("sam's")||n.includes("sams club"))return "Sam's Club";
  if(n.includes("costco"))return "Costco";
  if(n.includes("walgreens"))return "Walgreens";
  if(n.includes("cvs"))return "CVS";
  if(n.includes("dollar general"))return "Dollar General";
  if(n.includes("family dollar"))return "Family Dollar";
  return "";
}
async function nearbyStoresForArea(location,radius,cache){
  const cacheKey=new Request(`https://cache.vaultsignal.local/stores/${location.zip}/${Math.round(radius)}`);
  const cached=await cache.match(cacheKey);
  if(cached)return await cached.json();

  const meters=Math.round(radius*1609.344);
  const regex="Walmart|Target|Best Buy|GameStop|Sam's Club|Costco|Walgreens|CVS|Dollar General|Family Dollar";
  const q=`[out:json][timeout:7];(
    nwr(around:${meters},${location.lat},${location.lon})["name"~"${regex}",i];
    nwr(around:${meters},${location.lat},${location.lon})["brand"~"${regex}",i];
    nwr(around:${meters},${location.lat},${location.lon})["operator"~"${regex}",i];
  );out center tags;`;

  const endpoints=["https://overpass.kumi.systems/api/interpreter","https://overpass-api.de/api/interpreter"];
  let elements=[];

  for(const ep of endpoints){
    try{
      const r=await withTimeout(ep,{
        method:"POST",
        headers:{"content-type":"application/x-www-form-urlencoded;charset=UTF-8"},
        body:"data="+encodeURIComponent(q)
      },6500);
      if(!r.ok)continue;
      const d=await r.json();
      if(Array.isArray(d.elements)&&d.elements.length){elements=d.elements;break;}
    }catch{}
  }

  const seen=new Set();
  const rows=elements.map(e=>{
    const t=e.tags||{};
    const lat=e.lat??e.center?.lat,lon=e.lon??e.center?.lon;
    if(!Number.isFinite(lat)||!Number.isFinite(lon))return null;
    const name=t.name||t.brand||t.operator||"Retailer";
    const family=workerRetailerFamily(name)||workerRetailerFamily(t.brand||"")||workerRetailerFamily(t.operator||"");
    if(!family)return null;
    const dist=distanceMiles(location.lat,location.lon,lat,lon);
    if(dist>radius+1)return null;
    const key=`${family}|${Number(lat).toFixed(4)}|${Number(lon).toFixed(4)}`;
    if(seen.has(key))return null;
    seen.add(key);
    return {
      id:key,name,family,
      brand:t.brand||"",
      operator:t.operator||"",
      address:[t["addr:housenumber"],t["addr:street"],t["addr:city"],t["addr:state"],t["addr:postcode"]].filter(Boolean).join(", "),
      lat:Number(lat),lon:Number(lon),distanceMiles:dist,
      shop:t.shop||"",website:t.website||t["contact:website"]||"",
      source:"OpenStreetMap"
    };
  }).filter(Boolean).sort((a,b)=>a.distanceMiles-b.distanceMiles).slice(0,40);

  await cache.put(cacheKey,new Response(JSON.stringify(rows),{
    headers:{"content-type":"application/json","cache-control":"public,max-age=900"}
  }));
  return rows;
}
function areaGameQuery(game){
  const q={
    Pokemon:"pokemon trading cards",
    Lorcana:"lorcana trading cards",
    Magic:"magic the gathering cards",
    "Yu-Gi-Oh!":"yu gi oh cards",
    "One Piece":"one piece trading cards"
  };
  return q[game]||`${game} trading cards`;
}
async function fastAreaScan(url,env){
  const started=Date.now();
  const zip=safeText(url.searchParams.get("zip"),10).replace(/\D/g,"").slice(0,5);
  if(zip.length!==5)return {status:400,data:{error:"A 5-digit ZIP code is required"}};

  const radius=boundedNumber(url.searchParams.get("radius"),1,100,25);
  const games=(url.searchParams.get("games")||"Pokemon").split(",").map(x=>safeText(x,40)).filter(Boolean).slice(0,5);
  const retailers=selectedRetailers(url);
  const cache=caches.default;
  const errors=[];

  const location=await geocodeZip(zip,cache);
  const liveTasks=[];

  if(env.BESTBUY_API_KEY && bestBuySelected(retailers)){
    for(const game of games){
      const args={
        q:areaGameQuery(game),zip,radius,game,
        sku:"",upc:"",bestBuySku:"",productId:"",retailers
      };
      liveTasks.push(
        bestBuyResults(args,env,cache)
          .catch(e=>{errors.push({provider:"Best Buy",game,error:e.message||"Best Buy lookup failed"});return [];})
      );
    }
  }

  const [nearbyStores,liveChunks]=await Promise.all([
    nearbyStoresForArea(location,radius,cache).catch(e=>{
      errors.push({provider:"Store discovery",error:e.message||"Store discovery failed"});return [];
    }),
    Promise.all(liveTasks)
  ]);

  const results=dedupe(liveChunks.flat());

  const retailerChecks=[];
  for(const game of games){
    retailerChecks.push(...retailerFallbackResults({
      q:areaGameQuery(game),
      retailers
    }).map(x=>({...x,game})));
  }

  return {
    status:200,
    data:{
      version:VERSION,
      location,
      nearbyStores,
      results,
      retailerChecks:dedupe(retailerChecks),
      providers:providerStatus(env),
      meta:{
        zip,radius,games,
        liveResultCount:results.length,
        nearbyStoreCount:nearbyStores.length,
        retailerCheckCount:retailerChecks.length,
        errors,
        durationMs:Date.now()-started,
        checkedAt:new Date().toISOString()
      }
    }
  };
}

export default {
  async fetch(request, env, ctx){
    const origin=corsOrigin(request,env);
    if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{
      "access-control-allow-origin":origin,
      "access-control-allow-methods":"GET,OPTIONS",
      "access-control-allow-headers":"Accept,Content-Type",
      "access-control-max-age":"86400"
    }});
    if(request.method!=="GET")return json({error:"Method not allowed"},405,origin);

    const url=new URL(request.url);
    if(url.pathname==="/health"){
      return json({
        ok:true,version:VERSION,message:"VaultSignal Inventory Worker is online",
        providers:providerStatus(env),
        pricingProviders:[priceChartingStatus(env)],
        checkedAt:new Date().toISOString()
      },200,origin);
    }
    if(url.pathname==="/area-scan"){
      try{
        const out=await fastAreaScan(url,env);
        return json(out.data,out.status,origin);
      }catch(e){
        return json({ok:false,error:e.message||"Area scan failed",checkedAt:new Date().toISOString()},502,origin);
      }
    }

    if(url.pathname==="/card-price"){
      const q=safeText(url.searchParams.get("q"),140);
      const game=safeText(url.searchParams.get("game"),40);
      if(!q)return json({error:"Missing q card query"},400,origin);

      if(!env.PRICECHARTING_API_TOKEN){
        return json({
          ok:true,
          configured:false,
          provider:priceChartingStatus(env),
          result:null,
          message:"PRICECHARTING_API_TOKEN is not configured"
        },200,origin);
      }

      try{
        const result=await priceChartingProduct([q,game].filter(Boolean).join(" "),env,caches.default);
        return json({
          ok:true,
          configured:true,
          provider:priceChartingStatus(env),
          result,
          checkedAt:new Date().toISOString()
        },200,origin);
      }catch(e){
        return json({
          ok:false,
          configured:true,
          provider:priceChartingStatus(env),
          error:e.message||"PriceCharting lookup failed"
        },502,origin);
      }
    }

    if(url.pathname!=="/inventory")return json({error:"Not found"},404,origin);

    const q=safeText(url.searchParams.get("q"),120);
    if(!q)return json({error:"Missing q product search parameter"},400,origin);
    const zip=safeText(url.searchParams.get("zip"),10).replace(/\D/g,"").slice(0,5);
    if(!zip)return json({error:"A 5-digit ZIP code is required for local inventory"},400,origin);

    const retailers=selectedRetailers(url);
    const args={
      q,zip,
      radius:boundedNumber(url.searchParams.get("radius"),1,250,25),
      game:safeText(url.searchParams.get("game"),40),
      sku:safeText(url.searchParams.get("sku"),40),
      upc:safeText(url.searchParams.get("upc"),20),
      bestBuySku:safeText(url.searchParams.get("bestBuySku"),20),
      productId:safeText(url.searchParams.get("productId"),80),
      retailers
    };

    const cache=caches.default;
    const rows=[];
    const errors=[];

    if(bestBuySelected(retailers)){
      if(env.BESTBUY_API_KEY){
        try{rows.push(...await bestBuyResults(args,env,cache))}
        catch(e){errors.push({provider:"Best Buy",error:e.message||"Best Buy lookup failed"})}
      }else{
        errors.push({provider:"Best Buy",error:"BESTBUY_API_KEY is not configured on the Worker"})
      }
    }

    // Retailer fallbacks are not represented as live stock. They are explicit handoff actions.
    rows.push(...retailerFallbackResults({q,retailers}));

    const results=dedupe(rows).map(x=>({...x,productId:args.productId||x.productId||""}));
    return json({
      version:VERSION,
      results,
      providers:providerStatus(env),
      meta:{
        query:q,zip,radius:args.radius,
        liveResultCount:results.filter(x=>x.sourceType==="official_api").length,
        retailerCheckCount:results.filter(x=>x.sourceType==="retailer_verified").length,
        errors,
        checkedAt:new Date().toISOString()
      }
    },200,origin);
  }
};
