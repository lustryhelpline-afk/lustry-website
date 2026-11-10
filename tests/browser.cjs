const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
let BASE = process.env.LUSTRY_TEST_BASE;
let server;
async function startLocalServer() {
 if (BASE) return;
 const directory=path.resolve(__dirname,'../dist');
 if(!fs.existsSync(path.join(directory,'index.html')))throw Error('Missing dist/index.html. Run npm run build:preview before browser tests.');
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.txt':'text/plain; charset=utf-8','.xml':'application/xml'};
 server=http.createServer(async(request,response)=>{
  try {
   const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
   const filename=path.resolve(directory,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
   if(!filename.startsWith(directory+path.sep)){response.writeHead(403);response.end();return;}
   try {const data=await fsp.readFile(filename);response.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream'});response.end(data);}
   catch {response.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});response.end(await fsp.readFile(path.join(directory,'404.html')));}
  }catch {response.writeHead(400);response.end();}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 BASE='http://127.0.0.1:'+server.address().port;
}
const results = [];
let browser;
async function fixture(options={}) {
 const context = await browser.newContext({ viewport:{width:1440,height:1000}, serviceWorkers:'block' });
 const page = await context.newPage();
 page.setDefaultTimeout(12000);page.setDefaultNavigationTimeout(15000);
 const state = { prices:[{product_type:'T-shirts',fabric:'Cotton',gsm:'180',base_price:100,branding_cost:10}], priceStatus:200,
  order:{status:201,body:{success:true,reference:'LOCAL-MOCK-ONLY',estimatedTotal:2500,discountPercent:0}},
  callback:{status:201,body:{success:true,reference:'CALLBACK-MOCK-ONLY'}}, requests:[], errors:[], ...options };
 page.on('pageerror',error=>state.errors.push(error.message));
 await page.route('**/*', async route=>{
  const request=route.request(), url=new URL(request.url());
  if(url.origin === new URL(BASE).origin) return route.continue();
  if(url.hostname.endsWith('.supabase.co')) {
   state.requests.push({url:request.url(),method:request.method(),body:request.postDataJSON?.()});
   if(url.pathname==='/rest/v1/product_prices')return route.fulfill({status:state.priceStatus,json:state.prices});
   if(url.pathname.endsWith('/submit-order'))return route.fulfill({status:state.order.status,json:state.order.body});
   if(url.pathname.endsWith('/callback-request')){if(state.callbackGate)await state.callbackGate;return route.fulfill({status:state.callback.status,json:state.callback.body});}
   return route.fulfill({status:503,json:{error:'Mocked unavailable optional service'}});
  }
  // All external requests are blocked. These tests never reach a live backend.
  return route.abort('blockedbyclient');
 });
 return {context,page,state};
}
async function run(name,fn) {
 let f;
 try { f=await fixture();await fn(f);assert.deepEqual(f.state.errors,[],'uncaught browser error');results.push({test:name,status:'PASS'}); }
 catch(e) {results.push({test:name,status:'FAIL',error:e.message});}
 finally {if(f)await f.context.close();}
 console.log(JSON.stringify(results.at(-1)));
}
async function gotoPricing(page) {
 const [response]=await Promise.all([page.waitForResponse(r=>r.url().includes('/rest/v1/product_prices?')),page.goto(BASE+'/custom.html')]);
 await response.finished();
 await page.evaluate(()=>new Promise(requestAnimationFrame));
}
async function fillEnquiry(page) {
 await page.locator('#custom-form [name=name]').fill('Local Mock Test');
 await page.locator('#custom-form [name=email]').fill('mock-only@example.com');
 await page.locator('#q-consent').check();
}
(async()=>{
 await startLocalServer();
 const executablePath=process.env.LUSTRY_CHROMIUM_PATH||['/usr/bin/chromium','/usr/bin/chromium-browser'].find(file=>fs.existsSync(file));
 browser=await chromium.launch({...(executablePath?{executablePath}:{}),headless:true,args:['--no-sandbox']});
 await run('mobile storefront balances visual categories, campaigns and visible product photography',async({page})=>{
  for(const width of [320,390]){
   await page.setViewportSize({width,height:780});await page.goto(BASE+'/index.html');
   const categories=page.getByRole('navigation',{name:'Product categories'});
   assert.equal(await categories.locator('[data-home-cat]').count(),8);
   assert.equal(await categories.locator('[data-home-cat="tshirts"]').isVisible(),true);
   const header=await page.locator('#site-header').boundingBox();assert.ok(header.height<=130,'compact header on '+width);
   const tiles=page.locator('.c-category-tile');assert.equal(await tiles.count(),4);
   const tileBounds=await tiles.last().boundingBox();assert.ok(tileBounds.y+tileBounds.height<400,'category shortcuts are near the top on '+width);
   assert.equal(await page.locator('.c-campaigns').isVisible(),true);
   const first=await page.locator('#featured-grid .product-photo').first().boundingBox();
   assert.ok(first.y<650&&first.y+Math.min(first.height,120)<780,'first product photography is visible without scrolling on '+width);
   const photos=page.locator('#featured-grid .product-photo img');
   await photos.first().evaluate(img=>img.decode());
   assert.ok((await photos.first().getAttribute('src')).startsWith('assets/photos/'),'first card uses local photography');
   assert.equal(await photos.first().evaluate(img=>img.naturalWidth>0),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  for(const width of [768,1024,1100,1440]){
   await page.setViewportSize({width,height:1000});await page.goto(BASE+'/index.html');
   for(const campaign of await page.locator('.c-campaign').all()){
    const card=await campaign.boundingBox(),button=await campaign.locator('.c-button').boundingBox();
    assert.ok(button.x>=card.x&&button.y>=card.y&&button.x+button.width<=card.x+card.width&&button.y+button.height<=card.y+card.height,'campaign action is not clipped at '+width);
   }
  }
 });
 await run('image categories and campaign links lead to the matching product collections',async({page,state})=>{
  await page.goto(BASE+'/index.html');
  const tiles=page.locator('.c-category-tile');assert.equal(await tiles.count(),4);
  const categories=await tiles.evaluateAll(nodes=>nodes.map(a=>new URL(a.href).searchParams.get('cat')));
  assert.deepEqual(categories,['tshirts','hoodies','bags','accessories']);
  await tiles.filter({hasText:'T-Shirts'}).click();await page.waitForLoadState('load');
  assert.equal(new URL(page.url()).searchParams.get('cat'),'tshirts');
  assert.equal(await page.locator('#tshirt-subfilters').isVisible(),true);
  assert.ok(await page.locator('#shop-grid .product-card').count()>=4);
  await page.goto(BASE+'/index.html');await page.locator('.c-campaign-bags').getByRole('link',{name:'Explore bags'}).click();await page.waitForLoadState('load');
  assert.equal(new URL(page.url()).searchParams.get('cat'),'bags');
  assert.equal(await page.locator('#shop-grid .product-card').count(),102);
  assert.equal(state.requests.filter(r=>r.method==='POST').length,0);
 });
 await run('curated apparel and bags remain distinct and discovery returns after clearing a filter',async({page})=>{
  await page.goto(BASE+'/index.html');
  const productCategories=selector=>page.locator(selector+' .product-photo').evaluateAll(links=>links.map(a=>window.LUSTRY_CATALOG.find(p=>p.id===new URL(a.href).searchParams.get('id'))?.cat));
  const apparel=await productCategories('#featured-grid');assert.equal(apparel.length,4);assert.ok(apparel.every(cat=>['tshirts','hoodies'].includes(cat)));
  assert.deepEqual(await productCategories('#bags-edit-grid'),['bags','bags','bags','bags']);
  await page.locator('[data-home-cat="bags"]').click();
  assert.equal(await page.locator('#featured-grid .product-card').count(),102);
  assert.equal(await page.locator('[data-home-discovery]').evaluateAll(nodes=>nodes.every(el=>el.hidden)),true);
  await page.locator('[data-home-cat=""]').click();
  assert.equal(await page.locator('#featured-grid .product-card').count(),4);
  assert.equal(await page.locator('.c-campaigns').isVisible(),true);
  assert.equal(await page.locator('.c-bags-section').isVisible(),true);
  assert.equal(await page.locator('.c-season').isVisible(),true);
  await page.goto(BASE+'/index.html?cat=bags');
  assert.equal(await page.locator('.c-season').isVisible(),false);
  await page.locator('.c-offer-strip').click();
  await page.waitForURL('**/index.html#season-title');await page.waitForLoadState('load');
  assert.equal(new URL(page.url()).searchParams.has('cat'),false);
  assert.equal(await page.locator('.c-season').isVisible(),true,'seasonal link restores its destination when a category filter is active');
  assert.equal(await page.locator('#featured-grid .product-card').count(),4);
 });
 await run('business and Studio cards preserve quotation and local-editor paths',async({page,state})=>{
  await page.goto(BASE+'/index.html');await page.locator('.c-corporate-card').click();await page.waitForLoadState('load');
  assert.equal(await page.locator('#q-category').inputValue(),'merch');
  assert.equal(await page.locator('#q-qty').inputValue(),'25');
  await page.goto(BASE+'/index.html');await page.locator('.c-manufacture-card').click();await page.waitForLoadState('load');
  assert.equal(new URL(page.url()).pathname,new URL(BASE+'/custom.html').pathname);
  assert.equal(await page.locator('#q-qty').getAttribute('min'),'25');
  await page.goto(BASE+'/index.html');await page.locator('.c-studio-card').click();await page.waitForLoadState('load');
  assert.equal(new URL(page.url()).pathname,new URL(BASE+'/design.html').pathname);
  assert.equal(await page.locator('#studio-product').isVisible(),true);
  assert.equal(state.requests.filter(r=>r.method==='POST').length,0,'discovery must not submit enquiries');
 });
 await run('desktop catalogue search is visible and submits the entered query',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await page.goto(BASE+'/index.html');
  const search=page.locator('.l-search-inline');assert.equal(await search.isVisible(),true);
  await search.locator('#inline-shop-search').fill('cotton');
  await search.getByRole('button',{name:'Submit catalogue search'}).click();
  await page.waitForURL('**/shop.html?q=cotton');await page.waitForLoadState('load');
  assert.equal(await page.locator('#shop-search').inputValue(),'cotton');
  const names=await page.locator('#shop-grid .product-card').allTextContents();
  assert.ok(names.length>0&&names.every(name=>/cotton/i.test(name)));
 });
 await run('home categories and T-shirt subcategories filter in place and survive reload',async({page})=>{
  await page.goto(BASE+'/index.html');
  const count=await page.locator('#featured-grid .product-card').count();assert.ok(count>=4);
  await page.locator('[data-home-cat="bags"]').click();
  assert.equal(await page.locator('#featured-grid .product-card').count(),102);
  assert.equal(await page.locator('#collection-title').innerText(),'Bags & Backpacks');
  assert.equal(new URL(page.url()).pathname,new URL(BASE+'/index.html').pathname);
  assert.equal(new URL(page.url()).searchParams.get('cat'),'bags');
  await page.locator('[data-home-cat="tshirts"]').click();
  assert.equal(await page.locator('#home-style-filters').isVisible(),true);
  await page.locator('[data-home-style="polo"]').click();
  assert.equal(await page.locator('#featured-grid .product-card').count(),5);
  await page.reload();
  assert.equal(await page.locator('[data-home-style="polo"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#featured-grid .product-card').count(),5);
  await page.locator('[data-home-style="dryfit"]').click();
  assert.ok((await page.locator('#featured-grid').innerText()).includes('Dry-fit'));
  await page.goto(BASE+'/index.html?cat=merch');
  assert.equal(await page.locator('#featured-grid .product-card').count(),0);
  await page.getByRole('link',{name:'Build a merchandise brief'}).click();
  await page.waitForLoadState('load');
  assert.equal(new URL(page.url()).searchParams.get('category'),'merch');
  assert.equal(await page.locator('#q-category').inputValue(),'merch');
 });
 await run('compact navigation keeps search, phone, WhatsApp and quick view accessible',async({page})=>{
  await page.setViewportSize({width:390,height:780});await page.goto(BASE+'/index.html');
  await page.getByRole('button',{name:'Open menu',exact:true}).click();
  assert.equal(await page.locator('#l-menu-panel').isVisible(),true);
  assert.equal(await page.locator('#l-menu-panel a[href="tel:+919267373084"]').count(),1);
  assert.equal(await page.locator('#l-menu-panel a[href="https://wa.me/919119076674"]').count(),1);
  await page.keyboard.press('Escape');assert.equal(await page.locator('.l-menu-toggle').getAttribute('aria-expanded'),'false');
  await page.getByRole('button',{name:'Search products',exact:true}).click();
  await page.locator('#top-shop-search').fill('cotton');await page.locator('#top-shop-search').press('Enter');
  await page.waitForURL('**/shop.html?q=cotton');
  assert.equal(await page.locator('#shop-search').inputValue(),'cotton');
  await page.goto(BASE+'/index.html');
  await page.locator('#featured-grid .v7-qv').first().click();
  assert.equal(await page.getByRole('dialog',{name:'Quick view',exact:true}).isVisible(),true);
  await page.locator('.v7-x').click();
  await page.locator('[data-open-bulk-popup]').click();
  assert.equal(await page.locator('.v8-act a[href="tel:+919267373084"]').count(),1);
 });
 await run('browsing stays uninterrupted and FAQ support opens only on request',async({page})=>{
  await page.clock.install();await page.goto(BASE+'/index.html');await page.clock.runFor(25000);
  assert.equal(await page.locator('dialog[open]').count(),0);
  assert.equal(await page.locator('.v7-mbar,.v7-fab,.v7-top,.v8-open').count(),0);
  assert.equal(await page.locator('#v8-chat-window').getAttribute('aria-hidden'),'true');
  const trigger=page.locator('[data-open-lustry-chat]');await trigger.click();
  assert.equal(await trigger.getAttribute('aria-expanded'),'true');
  await page.getByRole('button',{name:'Minimum order?',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#v8m').textContent.includes('25 pieces'));
  assert.ok((await page.locator('#v8s').innerText()).includes('Quick answers'));
  await page.getByRole('button',{name:'Close chat',exact:true}).click();
  assert.equal(await trigger.getAttribute('aria-expanded'),'false');
  assert.equal(await trigger.evaluate(el=>document.activeElement===el),true);
  for(const viewport of [{width:320,height:480},{width:1280,height:560}]){
   await page.setViewportSize(viewport);await trigger.click();
   const close=page.getByRole('button',{name:'Close chat',exact:true}),bounds=await close.boundingBox();
   assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=viewport.width&&bounds.y+bounds.height<=viewport.height,'FAQ close remains in viewport '+viewport.width);
   await close.click();assert.equal(await trigger.getAttribute('aria-expanded'),'false');
  }
 });
 await run('seasonal promotion uses approved bulk tiers and honours reduced motion',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto(BASE+'/index.html');
  const offer=await page.locator('.l-season-offer').innerText();
  for(const text of ['100–199','200–499','500+','5%','20%','25%','final quotation'])assert.ok(offer.includes(text),'missing bulk term '+text);
  const catalogueNote=await page.locator('.l-catalogue-note').innerText();
  assert.match(catalogueNote,/indicative/i);assert.match(catalogueNote,/confirm/i);assert.match(catalogueNote,/Lustry/i);
  assert.equal(await page.locator('.c-campaign-apparel').evaluate(el=>getComputedStyle(el,'::before').animationName),'none');
  assert.equal(await page.locator('.c-season').evaluate(el=>getComputedStyle(el,'::before').animationName),'none');
 });
 await run('shop uses the shared category navigation with persistent URL and selected state',async({page})=>{
  await page.setViewportSize({width:390,height:780});await page.goto(BASE+'/shop.html');
  const categories=page.getByRole('navigation',{name:'Product categories'});
  assert.equal(await categories.locator('[data-cat]').count(),8);
  await categories.locator('[data-cat="bags"]').click();
  assert.equal(new URL(page.url()).searchParams.get('cat'),'bags');
  assert.equal(await page.locator('#shop-grid .product-card').count(),102);
  assert.equal(await categories.locator('[data-cat="bags"]').getAttribute('aria-current'),'true');
  assert.equal(await categories.locator('[aria-current]').count(),1);
  await categories.locator('[data-cat="tshirts"]').click();
  assert.equal(await page.locator('#tshirt-subfilters').isVisible(),true);
  await page.locator('[data-style="polo"]').click();
  assert.equal(new URL(page.url()).searchParams.get('style'),'polo');
  assert.equal(await page.locator('#shop-grid .product-card').count(),5);
  await page.reload();
  assert.equal(await categories.locator('[data-cat="tshirts"]').getAttribute('aria-current'),'true');
  assert.equal(await page.locator('[data-style="polo"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#shop-grid .product-card').count(),5);
  await categories.locator('[data-cat=""]').click();
  assert.equal(new URL(page.url()).searchParams.has('cat'),false);
  assert.equal(new URL(page.url()).searchParams.has('style'),false);
  assert.equal(await page.locator('#tshirt-subfilters').isVisible(),false);
  assert.equal(await categories.locator('[data-cat=""]').getAttribute('aria-current'),'true');
  assert.ok(await page.locator('#shop-grid .product-card').count()>2);
 });
 await run('category and subcategory filters',async({page})=>{
  await page.goto(BASE+'/shop.html?cat=tshirts');
  const all=await page.locator('.product-card').count();assert.ok(all>=4);
  await page.locator('[data-style=polo]').click();assert.ok(await page.locator('.product-card').count()>=1);assert.ok(await page.locator('.product-card').count()<all);
  await page.locator('[data-style=dryfit]').click();assert.ok(await page.locator('.product-card').count()>=1);
  await page.locator('#shop-search').fill('no-match-<img src=x onerror=alert(1)>');
  assert.equal(await page.locator('.product-card').count(),0);
  assert.ok(await page.locator('#shop-grid').innerText().then(t=>t.includes('No matches')));
 });
 await run('new category filters expose their complete uploaded collections on home and shop',async({page})=>{
  const expected={tshirts:10,hoodies:8,jerseys:4,bags:102,accessories:5,gifts:3,print:6};
  for(const [route,grid,attribute]of [['/index.html','#featured-grid','data-home-cat'],['/shop.html','#shop-grid','data-cat']]){
   await page.goto(BASE+route);
   for(const [category,count]of Object.entries(expected)){
    await page.locator('['+attribute+'="'+category+'"]').click();
    assert.equal(await page.locator(grid+' .product-card').count(),count,route+' complete '+category);
    const ids=await page.locator(grid+' .product-photo').evaluateAll(nodes=>nodes.map(a=>new URL(a.href).searchParams.get('id')));
    assert.equal(new Set(ids).size,count,'no duplicate product links');
    if(category==='bags')for(const id of ['bag-001','bag-050','bag-101','tote'])assert.ok(ids.includes(id),'missing '+id);
    assert.ok(!ids.includes('rn-sarina')&&!ids.includes('bag-nw'),'legacy references stay out of new browsing');
   }
  }
 });
 await run('uploaded bag photography is included in the public build and product detail',async({page})=>{
  const responses=await Promise.all(Array.from({length:101},(_,i)=>page.request.get(BASE+'/assets/bags/bag-'+String(i+1).padStart(3,'0')+'.jpg')));
  for(let i=0;i<responses.length;i++){
   const response=responses[i];assert.equal(response.status(),200,'bag photo '+(i+1));
   assert.ok(response.headers()['content-type'].startsWith('image/jpeg'));
   const bytes=await response.body();assert.ok(bytes.length>512);assert.equal(bytes[0],255);assert.equal(bytes[1],216);
  }
  await page.goto(BASE+'/product.html?id=bag-101');
  assert.ok((await page.locator('#product-detail h1').innerText()).includes('101'));
  const image=page.locator('#product-detail .detail-image img');await image.evaluate(img=>img.decode());
  assert.ok((await image.getAttribute('src')).endsWith('/bag-101.jpg'));
  assert.equal(await image.evaluate(img=>img.naturalWidth>0),true);
 });
 await run('unconfirmed stock, delivery and prices are not published as verified offers',async({page})=>{
  for(const route of ['/index.html','/shop.html?cat=bags','/product.html?id=rn-cotton']){
   await page.goto(BASE+route);
   const body=await page.locator('body').innerText();
   assert.ok(!/\b[13][- ]day delivery\b|1 day on T-shirts|in stock/i.test(body),'unverified claim in '+route);
   const schema=(await page.locator('script[type="application/ld+json"]').allTextContents()).join(' ');
   assert.ok(!/schema\.org\/InStock|"@type"\s*:\s*"Offer"/.test(schema),'unverified structured offer in '+route);
   if(route.includes('product.html'))assert.match(await page.locator('.detail-price').innerText(),/demo|indicative|not final/i);
   else assert.match(await page.locator('.product-card').first().innerText(),/demo|indicative|reference/i);
  }
  assert.equal((await page.request.get(BASE+'/google-merchant-feed.tsv')).status(),404,'unverified merchant feed stays unpublished');
 });
 await run('legacy links remain usable while Oversized remains a current T-shirt style',async({page})=>{
  await page.goto(BASE+'/product.html?id=rn-sarina');
  assert.ok((await page.locator('#product-detail h1').innerText()).includes('Essential'));
  assert.equal(await page.locator('#product-qty').getAttribute('min'),'1');
  await page.goto(BASE+'/shop.html?cat=tshirts');
  assert.equal(await page.locator('#shop-grid .product-photo[href*="rn-sarina"]').count(),0);
  await page.locator('[data-style="oversized"]').click();
  assert.equal(await page.locator('#shop-grid .product-photo[href*="os-tee"]').count(),1);
  await page.evaluate(()=>localStorage.setItem('lustry_demo_cart_v3',JSON.stringify([{id:'rn-sarina',color:'Ivory',size:'M',quantity:1},{id:'polo-dry',color:'Forest',size:'M',quantity:1}])));
  await page.goto(BASE+'/cart.html');
  assert.equal(await page.locator('.cart-row').count(),1,'compatible legacy selection survives the catalogue update');
  assert.match(await page.locator('#catalogue-cart-notice').innerText(),/updated catalogue.*omitted/i);
 });
 await run('new apparel White swatches and pack quantities use the correct unit',async({page})=>{
  await page.goto(BASE+'/product.html?id=rn-cotton');
  const white=page.locator('[data-colour="White"]');
  assert.equal(await white.locator('span').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)');
  await page.locator('#product-qty').fill('2');await white.click();assert.equal(await page.locator('#product-qty').inputValue(),'2');
  await page.goto(BASE+'/product.html?id=js-v1');
  assert.match(await page.locator('.detail-price').innerText(),/per set of 11 pieces/i);
  assert.equal(await page.locator('#product-qty').getAttribute('min'),'1');
  assert.match(await page.locator('#product-detail').innerText(),/(?:set|pack)[^\n]{0,25}11|11[^\n]{0,25}(?:set|pack|pieces)/i);
  await page.locator('#product-qty').fill('2');await page.locator('#add-demo-cart').click();await page.goto(BASE+'/cart.html');
  const text=await page.locator('.cart-row .product-price').innerText();
  assert.equal(Number(text.match(/₹\s*([\d,]+)/)[1].replaceAll(',','')),15652,'two packs multiply the pack price once');
  assert.equal(await page.getByRole('button',{name:'Checkout not yet available'}).isDisabled(),true);
 });
 await run('new catalogue enquiries keep their reference and correct backend category',async({page,state})=>{
  for(const [id,category,quantity]of [['js-v1','merch',33],['cap','merch',25],['jk-eco','merch',25],['sipper','merch',25],['vcard','merch',100],['bag-001','bags',25]]){
   await page.goto(BASE+'/custom.html?product='+id);
   assert.equal(await page.locator('#q-category').inputValue(),category,'quotation category '+id);
   assert.equal(Number(await page.locator('#q-qty').inputValue()),quantity,'MOQ/pack quantity '+id);
   const brief=await page.locator('#custom-form [name=design]').inputValue();
   assert.ok(/Catalogue reference/i.test(brief));
   if(id==='sipper'){
    assert.ok(brief.includes('Sublimation Sipper Bottle'));
    await fillEnquiry(page);await page.locator('#custom-submit').click();
    await page.waitForFunction(()=>document.querySelector('#enquiry-response').textContent.includes('LOCAL-MOCK-ONLY'));
    const sent=state.requests.filter(r=>r.url.includes('/submit-order')).at(-1);
    assert.equal(sent.body.order.product,'merch');assert.ok(sent.body.order.design.includes('Sublimation Sipper Bottle'));
   }
  }
 });
 await run('Studio links are restricted to matching T-shirt and bag templates',async({page})=>{
  await page.goto(BASE+'/product.html?id=tote');
  assert.equal(await page.locator('a[href="design.html?product=tote"]').count(),1);
  await page.goto(BASE+'/product.html?id=rn-cotton');
  assert.equal(await page.locator('a[href="design.html?product=tee"]').count(),1);
  await page.goto(BASE+'/product.html?id=bag-001');
  assert.equal(await page.locator('#product-detail a[href^="design.html?product="]').count(),0,'unverified bag type is not assumed to be a backpack');
 });
 await run('malformed cart storage does not crash pages',async({page})=>{
  await page.goto(BASE+'/index.html');
  await page.evaluate(()=>localStorage.setItem('lustry_demo_cart_v3',JSON.stringify([null,{},false,{id:'unknown',quantity:1},{id:'rn-sarina',color:'Ivory',size:'M',quantity:'2'},{id:'rn-sarina',color:'Ivory',size:'L',quantity:999999},{id:'rn-sarina',color:'<img src=x onerror=alert(1)>',size:'M',quantity:1},{id:'rn-sarina',color:'Ivory',size:'S',quantity:true}])));
  await page.goto(BASE+'/cart.html');
  const qty=await page.locator('[data-q]').evaluateAll(nodes=>nodes.map(n=>Number(n.value)));
  assert.ok(qty.every(n=>Number.isInteger(n)&&n>=1&&n<=500),'cart quantities sanitized');
  assert.equal(await page.locator('.cart-row').count(),1,'only the valid numeric quantity survives');
  assert.equal(await page.locator('[data-cart-count]').first().innerText(),'2');
  assert.equal(await page.locator('[data-cart-count]').first().innerText().then(Number).then(Number.isFinite),true);
  assert.equal(await page.locator('#cart-items img[src=x]').count(),0);
 });
 await run('demo cart add/update/remove and disabled checkout',async({page})=>{
  await page.goto(BASE+'/product.html?id=rn-sarina');
  await page.locator('#product-qty').fill('2');await page.locator('#add-demo-cart').click();
  await page.goto(BASE+'/cart.html');assert.equal(await page.locator('.cart-row').count(),1);
  assert.equal(await page.getByRole('button',{name:'Checkout not yet available'}).isDisabled(),true);
  await page.locator('[data-q]').fill('3');await page.locator('[data-q]').press('Tab');
  assert.equal(await page.locator('[data-cart-count]').first().innerText(),'3');
  await page.locator('[data-remove]').click();assert.equal(await page.locator('.cart-row').count(),0);
 });
 await run('product quantity survives colour and size changes',async({page})=>{
  await page.goto(BASE+'/product.html?id=rn-sarina');
  await page.locator('#product-qty').fill('4');
  await page.locator('[data-colour="Ivory"]').click();
  assert.equal(await page.locator('#product-qty').inputValue(),'4');
  await page.locator('[data-size="L"]').click();
  assert.equal(await page.locator('#product-qty').inputValue(),'4');
  assert.equal(await page.locator('[data-colour="Ivory"]').getAttribute('aria-pressed'),'true');
 });
 await run('corporate merchandise uses honest quotation-only path',async({page})=>{
  await page.goto(BASE+'/shop.html?cat=merch');
  assert.equal(await page.locator('.product-card').count(),0);
  await page.getByRole('link',{name:'Build a merchandise brief'}).click();
  await page.waitForLoadState('load');
  assert.equal(await page.locator('#q-category').inputValue(),'merch');
  assert.ok((await page.locator('#q-style').innerText()).includes('Pens'));
 });
 await run('bulk discount boundary estimates',async({page})=>{
  await page.goto(BASE+'/custom.html');await page.waitForFunction(()=>document.querySelector('#sum-estimate').textContent.startsWith('₹'));
  for(const [quantity,discount] of [[25,0],[99,0],[100,5],[199,5],[200,20],[499,20],[500,25]]) {
   await page.locator('#q-qty').fill(String(quantity));
   assert.equal(await page.locator('#sum-discount').innerText(),discount+'%');
   const total=Number((await page.locator('#sum-estimate').innerText()).replace(/[^\d.]/g,''));
   assert.equal(total,Math.round(100*quantity*(1-discount/100)));
  }
 });
 await run('null/empty/negative/invalid public prices are rejected',async({page,state})=>{
  for(const bad of [null,'',-5,'not-a-number']) {
   state.prices=[{base_price:bad,branding_cost:10}];
   await gotoPricing(page);
   assert.ok(!(await page.locator('#sum-estimate').innerText()).startsWith('₹'),'invalid price shown: '+JSON.stringify(bad));
  }
 });
 await run('minimum quantity and consent prevent submissions',async({page,state})=>{
  await page.goto(BASE+'/custom.html');await fillEnquiry(page);
  await page.locator('#q-qty').fill('24');await page.locator('#custom-submit').click();
  assert.equal(state.requests.filter(r=>r.url.includes('/submit-order')).length,0);
  await page.locator('#q-qty').fill('25');await page.locator('#q-consent').uncheck();await page.locator('#custom-submit').click();
  assert.equal(state.requests.filter(r=>r.url.includes('/submit-order')).length,0);
 });
 await run('confirmed enquiry preserves backend payload and reference',async({page,state})=>{
  await page.goto(BASE+'/custom.html');await fillEnquiry(page);await page.locator('#custom-submit').click();
  await page.waitForFunction(()=>document.querySelector('#enquiry-response').textContent.includes('LOCAL-MOCK-ONLY'));
  const sent=state.requests.find(r=>r.url.includes('/submit-order'));assert.ok(sent);assert.equal(sent.body.order.quantity,25);assert.equal(sent.body.order.product,'tee');assert.equal(sent.body.consent,true);
 });
 await run('unconfirmed and error enquiries never claim saved',async({page,state})=>{
  for(const response of [{status:201,body:{success:true}},{status:502,body:{error:'Mock server rejected'}}]) {
   state.order=response;await page.goto(BASE+'/custom.html');await fillEnquiry(page);await page.locator('#custom-submit').click();
   await page.waitForFunction(()=>document.querySelector('#enquiry-response').classList.contains('error'));
   assert.ok((await page.locator('#enquiry-response').innerText()).includes('NOT confirmed'));
   assert.equal(await page.locator('#custom-submit').isEnabled(),true);
  }
 });
 await run('callback form success and failure keep working controls',async({page,state})=>{
  for(const [status,body,ok] of [[201,{success:true,reference:'CALLBACK-MOCK-ONLY'},true],[502,{error:'Mock callback error'},false]]) {
   state.callback={status,body};await page.goto(BASE+'/index.html');await page.locator('[data-open-bulk-popup]').click();
   await page.locator('#v8n').fill('Local Mock Test');await page.locator('#v8p').fill('9119076674');await page.locator('#v8c').check();await page.locator('#v8b').click();
   await page.waitForFunction(()=>/Thank you|could not|couldn.t/i.test(document.querySelector('#v8o').textContent));
   assert.equal(await page.locator('#v8o').evaluate(n=>n.classList.contains('ok')),ok);
   assert.equal(await page.locator('#v8b').isEnabled(),true);
   assert.equal(await page.locator('.v8-act a[href^="tel:"]').count(),1);
  }
 });
 await run('callback validates quantity and prevents duplicate requests',async({page,state})=>{
  await page.goto(BASE+'/index.html');await page.locator('[data-open-bulk-popup]').click();
  await page.locator('#v8n').fill('Local Mock Test');await page.locator('#v8p').fill('9119076674');await page.locator('#v8c').check();
  await page.locator('#v8q').fill('2.5');await page.locator('#v8b').click();
  assert.ok((await page.locator('#v8o').innerText()).includes('whole quantity'));
  assert.equal(state.requests.filter(r=>r.url.includes('/callback-request')).length,0);
  await page.locator('#v8q').fill('25');
  let release;state.callbackGate=new Promise(resolve=>{release=resolve});
  const requested=page.waitForRequest(r=>r.url().includes('/callback-request'));
  await page.evaluate(()=>{const form=document.querySelector('#v8f');form.requestSubmit();form.requestSubmit()});
  await requested;
  assert.equal(await page.locator('#v8b').isDisabled(),true);
  assert.equal(state.requests.filter(r=>r.url.includes('/callback-request')).length,1);
  release();await page.waitForFunction(()=>document.querySelector('#v8o').classList.contains('ok'));
 });
 await run('callback requires saved reference and reuses request ID after an error',async({page,state})=>{
  state.callback={status:201,body:{success:true}};
  await page.goto(BASE+'/index.html');await page.locator('[data-open-bulk-popup]').click();
  await page.locator('#v8n').fill('Local Mock Test');await page.locator('#v8p').fill('9119076674');await page.locator('#v8c').check();
  await page.locator('#v8b').click();await page.waitForFunction(()=>document.querySelector('#v8o').classList.contains('er'));
  assert.equal(await page.locator('#v8o').evaluate(n=>n.classList.contains('ok')),false);
  const first=state.requests.find(r=>r.url.includes('/callback-request')).body.requestId;
  assert.match(first,/^[0-9a-f-]{36}$/);
  const reference='5f6c0302-732d-4ae5-ae76-3ab701536cf9';state.callback={status:201,body:{success:true,reference}};
  await page.locator('#v8b').click();await page.waitForFunction(()=>document.querySelector('#v8o').classList.contains('ok'));
  const requests=state.requests.filter(r=>r.url.includes('/callback-request'));
  assert.equal(requests.length,2);assert.equal(requests[1].body.requestId,first);
  assert.ok((await page.locator('#v8o').innerText()).includes(reference));
 });
 await run('callback changed details get a new request ID',async({page,state})=>{
  state.callback={status:502,body:{error:'Mock save error'}};
  await page.goto(BASE+'/index.html');await page.locator('[data-open-bulk-popup]').click();
  await page.locator('#v8n').fill('Local Mock Test');await page.locator('#v8p').fill('9119076674');await page.locator('#v8c').check();
  await page.locator('#v8b').click();await page.waitForFunction(()=>document.querySelector('#v8o').classList.contains('er'));
  await page.locator('#v8n').fill('Changed Local Mock Test');await page.locator('#v8b').click();
  await page.waitForFunction(()=>document.querySelector('#v8o').classList.contains('er'));
  const requests=state.requests.filter(r=>r.url.includes('/callback-request'));
  assert.equal(requests.length,2);assert.notEqual(requests[0].body.requestId,requests[1].body.requestId);
 });
 await run('callback close remains reachable on short narrow and enlarged layouts',async({page})=>{
  for(const viewport of [{width:320,height:480},{width:1280,height:560}]){
   await page.setViewportSize(viewport);await page.goto(BASE+'/custom.html?source=studio');
   await page.evaluate(()=>document.documentElement.style.fontSize='125%');
   await page.locator('[data-open-bulk-popup]').click();
   await page.locator('.v8-pb').evaluate(el=>el.scrollTop=el.scrollHeight);
   const close=await page.locator('.v8-x2').boundingBox();
   assert.ok(close.y>=0&&close.y+close.height<=viewport.height);assert.ok(close.width>=44&&close.height>=44);
   await page.locator('.v8-x2').click();assert.equal(await page.locator('.v8-pop').evaluate(el=>el.open),false);
  }
 });
 await run('local Studio artwork edits and real quote handoff',async({page,state})=>{
  await page.goto(BASE+'/design.html');
  await page.locator('#studio-product').selectOption('tote');
  await page.locator('#studio-text').fill('TEAM LUSTRY');
  assert.equal(await page.locator('#studio-text-preview').textContent(),'TEAM LUSTRY');
  await page.locator('#studio-logo').setInputFiles({name:'unsafe.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')});
  await page.waitForFunction(()=>document.querySelector('#studio-upload-status').textContent.includes('Choose a PNG'));
  const png=Buffer.from(await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=2;return canvas.toDataURL('image/png').split(',')[1]}),'base64');
  await page.locator('#studio-logo').setInputFiles({name:'local-logo.png',mimeType:'image/png',buffer:png});
  await page.waitForFunction(()=>document.querySelector('#studio-upload-status').textContent.includes('No upload has taken place'));
  assert.equal(state.requests.length,0,'editing must not call a remote service');
  await page.locator('#studio-side').selectOption('back');
  const prompt='Canvas bags for our team. '.repeat(25);
  await page.locator('#studio-prompt').fill(prompt);
  await page.getByRole('button',{name:'Continue to quotation'}).click();
  await page.waitForURL('**/custom.html?source=studio');
  await page.waitForLoadState('load');
  assert.equal(await page.locator('#q-category').inputValue(),'bags');
  assert.equal(await page.locator('#q-style').inputValue(),'Cotton Tote Bag');
  const saved=await page.evaluate(()=>sessionStorage.getItem('lustry_studio_brief_v1'));
  assert.ok(saved.includes('local-logo.png'));assert.ok(!saved.includes('data:image'));assert.ok(!saved.includes('blob:'));
  assert.equal(JSON.parse(saved).artworkUploaded,false);
  assert.ok((await page.locator('#custom-form [name=design]').inputValue()).includes(prompt.trim()),'entire permitted prompt survives quotation handoff');
  assert.ok((await page.locator('#studio-brief-notice').innerText()).includes('not attached'));
 });
 await run('Studio metadata transfers safely without an attached artwork claim',async({page})=>{
  await page.goto(BASE+'/index.html');
  await page.evaluate(()=>sessionStorage.setItem('lustry_studio_brief_v1',JSON.stringify({version:1,createdAt:new Date().toISOString(),category:'apparel',style:'Dry-Fit T-Shirt',fabric:'Dry Fit',gsm:'180',color:'Navy',placement:'Front centre',design:'Local concept <img src=x onerror=alert(1)>; no upload.'})));
  await page.goto(BASE+'/custom.html?source=studio');
  assert.equal(await page.locator('#q-style').inputValue(),'Dry-Fit T-Shirt');
  assert.equal(await page.locator('#q-fabric').inputValue(),'Dry Fit');
  assert.equal(await page.locator('#custom-form [name=color]').inputValue(),'Navy');
  assert.ok((await page.locator('#studio-brief-notice').innerText()).includes('not attached'));
  assert.equal(await page.locator('img[src=x]').count(),0);
  assert.ok((await page.locator('#custom-form [name=design]').inputValue()).includes('<img'));
 });
 await run('expired Studio draft does not overwrite enquiry fields',async({page})=>{
  await page.goto(BASE+'/index.html');
  await page.evaluate(()=>sessionStorage.setItem('lustry_studio_brief_v1',JSON.stringify({version:1,createdAt:'2000-01-01T00:00:00Z',category:'apparel',color:'Stale colour'})));
  await page.goto(BASE+'/custom.html?source=studio');
  assert.equal(await page.locator('#studio-brief-notice').count(),0);
  assert.notEqual(await page.locator('#custom-form [name=color]').inputValue(),'Stale colour');
 });
 await run('optional size breakdown must match the requested quantity',async({page,state})=>{
  await page.goto(BASE+'/custom.html');await fillEnquiry(page);
  await page.locator('#custom-form [name=sizes]').fill('S: 10, M: 10');await page.locator('#custom-submit').click();
  assert.equal(state.requests.filter(r=>r.url.includes('/submit-order')).length,0);
  await page.locator('#custom-form [name=sizes]').fill('S: 10, M: 15');await page.locator('#custom-submit').click();
  await page.waitForFunction(()=>document.querySelector('#enquiry-response').textContent.includes('LOCAL-MOCK-ONLY'));
  const sent=state.requests.find(r=>r.url.includes('/submit-order'));
  assert.deepEqual(sent.body.order.sizes,{S:10,M:15});
 });
 await run('key pages fit mobile, tablet and desktop widths',async({page})=>{
  for(const width of [320,390,768,1024,1440]) {
   await page.setViewportSize({width,height:900});
   for(const route of ['/index.html','/shop.html','/custom.html','/product.html?id=rn-sarina','/design.html']) {
    await page.goto(BASE+route);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'overflow '+width+' '+route);
   }
  }
  await page.setViewportSize({width:320,height:900});await page.goto(BASE+'/product.html?id=rn-sarina');
  await page.addStyleTag({content:':root{--sans:"DejaVu Sans",sans-serif!important}'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'legacy detail fits a wider fallback font at 320px');
 });
 await browser.close();browser=null;if(server){await new Promise(resolve=>server.close(resolve));server=null;}
 console.log(JSON.stringify({passed:results.filter(r=>r.status==='PASS').length,failed:results.filter(r=>r.status==='FAIL').length,results},null,2));
 process.exitCode=results.some(r=>r.status==='FAIL')?1:0;
})().catch(async e=>{console.error(e);if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));process.exitCode=1});
