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
 await page.addInitScript(()=>sessionStorage.setItem('v8pop','1'));
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
 await run('category and subcategory filters',async({page})=>{
  await page.goto(BASE+'/shop.html?cat=tshirts');
  const all=await page.locator('.product-card').count();assert.ok(all>=4);
  await page.locator('[data-style=polo]').click();assert.ok(await page.locator('.product-card').count()>=1);assert.ok(await page.locator('.product-card').count()<all);
  await page.locator('[data-style=dryfit]').click();assert.ok(await page.locator('.product-card').count()>=1);
  await page.locator('#shop-search').fill('no-match-<img src=x onerror=alert(1)>');
  assert.equal(await page.locator('.product-card').count(),0);
  assert.ok(await page.locator('#shop-grid').innerText().then(t=>t.includes('No matches')));
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
  for(const width of [320,390,1024,1440]) {
   await page.setViewportSize({width,height:900});
   for(const route of ['/index.html','/shop.html','/custom.html','/product.html?id=rn-sarina','/design.html']) {
    await page.goto(BASE+route);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'overflow '+width+' '+route);
   }
  }
 });
 await browser.close();browser=null;if(server){await new Promise(resolve=>server.close(resolve));server=null;}
 console.log(JSON.stringify({passed:results.filter(r=>r.status==='PASS').length,failed:results.filter(r=>r.status==='FAIL').length,results},null,2));
 process.exitCode=results.some(r=>r.status==='FAIL')?1:0;
})().catch(async e=>{console.error(e);if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));process.exitCode=1});
