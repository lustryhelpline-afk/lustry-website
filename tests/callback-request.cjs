// Callback Edge Function executes in an isolated VM; all backend calls are mocked.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');
const source = fs.readFileSync(require('node:path').join(__dirname, '../supabase/functions/callback-request/index.ts'), 'utf8');
const executable = stripTypeScriptTypes(source.replace(/^import "jsr:@supabase\/functions-js\/edge-runtime\.d\.ts";\s*/m, ''));
const origin = 'https://lustry.in';
const id = '11111111-1111-4111-8111-111111111111';
const requestId = '22222222-2222-4222-8222-222222222222';
const canonical = { name: 'Mock Test', phone: '+919876543210', quantity: null, consent: true, note: null, source: 'popup' };
function fixture(overrides={}) {
  let handler;const calls=[],logs=[];
  const state={status:201,saved:[{id}],lookupStatus:200,existing:[{id,...canonical}],...overrides};
  const env={SUPABASE_URL:'https://mock-project.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'mock-service-only',...overrides.env};
  vm.runInNewContext(executable,{
    Deno:{env:{get:name=>env[name]},serve:fn=>{handler=fn}},Request,Response,Headers,URL,TextDecoder,Uint8Array,
    crypto:{randomUUID:()=>requestId},console:{error:(...args)=>logs.push(args)},
    fetch:async(url,init)=>{calls.push({url:String(url),init});if(state.networkError)throw Error('mock network failure');assert.ok(String(url).startsWith('https://mock-project.supabase.co/rest/v1/callback_requests'),'unexpected backend URL');return new Response(JSON.stringify(init.method==='POST'?state.saved:state.existing),{status:init.method==='POST'?state.status:state.lookupStatus});}
  });
  return {handle:handler,state,calls,logs};
}
function req(body={name:'Mock Test',phone:'9876543210',quantity:null,consent:true,website:'',source:'popup'},options={}) {
  const method=options.method||'POST',headers={};if(options.origin!==null)headers.Origin=options.origin||origin;
  if(method==='POST'){headers['Content-Type']='application/json';if(options.contentLength)headers['Content-Length']=options.contentLength;}
  return new Request('https://mock-project.supabase.co/functions/v1/callback-request',{method,headers,...(method==='POST'?{body:options.raw===undefined?JSON.stringify(body):options.raw}:{})});
}
const valid=(changes={})=>({name:' Mock Test ',phone:'+91 98765 43210',quantity:'',consent:true,website:'',source:'popup',...changes});
for(const allowed of [origin,'https://www.lustry.in','https://lustryhelpline-afk.github.io','https://v8-preview-lustry-website.lustryhelpline.workers.dev']) {
  test('allowed preflight: '+allowed,async()=>{const f=fixture(),r=await f.handle(req(null,{method:'OPTIONS',origin:allowed}));assert.equal(r.status,200);assert.equal(r.headers.get('Access-Control-Allow-Origin'),allowed);assert.equal(r.headers.get('Vary'),'Origin');assert.equal(f.calls.length,0)});
}
test('configured origins remain supported',async()=>{const f=fixture({env:{ALLOWED_ORIGIN:' https://extra.example,https://second.example '}});const r=await f.handle(req(null,{method:'OPTIONS',origin:'https://extra.example'}));assert.equal(r.status,200);assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://extra.example')});
for(const hostile of ['https://example.com','https://lustry.in.example.com','https://other-worker.lustryhelpline.workers.dev','null']) {
  test('unapproved Origin never reaches database: '+hostile,async()=>{const f=fixture(),r=await f.handle(req(valid(),{origin:hostile}));assert.equal(r.status,403);assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);assert.equal(f.calls.length,0)});
}
test('programmatic no-Origin request preserves authenticated gateway compatibility',async()=>{const f=fixture(),r=await f.handle(req(valid(),{origin:null}));assert.equal(r.status,201);assert.equal(r.headers.get('Access-Control-Allow-Origin'),null)});
test('only confirmed insert UUID produces success',async()=>{const f=fixture(),r=await f.handle(req(valid())),d=await r.json();assert.equal(r.status,201);assert.deepEqual(d,{success:true,reference:id});assert.equal(r.headers.get('Cache-Control'),'no-store');assert.equal(f.calls.length,1);const saved=JSON.parse(f.calls[0].init.body);assert.deepEqual(saved,{request_id:requestId,...canonical});assert.equal(f.calls[0].init.headers.Prefer,'return=representation')});
for(const phone of ['9876543210','919876543210','+919876543210','+91 (98765) 43210']) {
  test('phone normalizes to canonical +91: '+phone,async()=>{const f=fixture(),r=await f.handle(req(valid({phone})));assert.equal(r.status,201);assert.equal(JSON.parse(f.calls[0].init.body).phone,'+919876543210')});
}
for(const quantity of [undefined,null,'',' ',1,'25',100000]) {
  test('valid optional quantity: '+String(quantity),async()=>{const f=fixture(),r=await f.handle(req(valid({quantity})));assert.equal(r.status,201);assert.equal(JSON.parse(f.calls[0].init.body).quantity,quantity===undefined||quantity===null||String(quantity).trim()===''?null:Number(quantity))});
}
for(const changes of [{name:''},{name:'x'.repeat(101)},{name:33},{phone:'123'},{phone:'phone9876543210'},{phone:'++919876543210'},{consent:false},{consent:'true'},{quantity:0},{quantity:'0'},{quantity:1.5},{quantity:100001},{quantity:true},{quantity:{}},{note:'x'.repeat(301)},{source:''},{source:'x'.repeat(41)},{requestId:'not-uuid'}]) {
  test('invalid fields cannot insert: '+JSON.stringify(changes),async()=>{const f=fixture(),r=await f.handle(req(valid(changes)));assert.equal(r.status,400);assert.notEqual((await r.json()).success,true);assert.equal(f.calls.length,0)});
}
test('honeypot never claims a saved callback',async()=>{const f=fixture(),r=await f.handle(req(valid({website:'spam.example'})));assert.equal(r.status,400);assert.notEqual((await r.json()).success,true);assert.equal(f.calls.length,0)});
test('GET rejects without backend access',async()=>{const f=fixture(),r=await f.handle(req(null,{method:'GET'}));assert.equal(r.status,405);assert.equal(r.headers.get('Allow'),'POST, OPTIONS');assert.equal(f.calls.length,0)});
for(const raw of ['{','null','[]','"text"']) {
  test('malformed/non-object JSON rejects: '+raw,async()=>{const f=fixture(),r=await f.handle(req(null,{raw}));assert.equal(r.status,400);assert.equal(f.calls.length,0)});
}
test('body size enforced from actual streamed bytes',async()=>{const f=fixture(),r=await f.handle(req(null,{raw:JSON.stringify(valid({name:'x'.repeat(9000)}))}));assert.equal(r.status,413);assert.equal(f.calls.length,0)});
test('declared oversized body rejected early',async()=>{const f=fixture(),r=await f.handle(req(valid(),{contentLength:'9000'}));assert.equal(r.status,413);assert.equal(f.calls.length,0)});
for(const settings of [{status:502,saved:{message:'private backend detail'}},{status:201,saved:[]},{status:201,saved:[{}]},{status:201,saved:[{id:'bad-id'}]},{networkError:true}]) {
  test('unconfirmed backend result never claims saved: '+JSON.stringify(settings),async()=>{const f=fixture(settings),r=await f.handle(req(valid()));assert.equal(r.status,502);const text=await r.text();assert.ok(!text.includes('private backend detail'));assert.notEqual(JSON.parse(text).success,true);assert.ok(!JSON.stringify(f.logs).includes('Mock Test'))});
}
test('missing server configuration rejects without backend calls',async()=>{const f=fixture({env:{SUPABASE_SERVICE_ROLE_KEY:''}}),r=await f.handle(req(valid()));assert.equal(r.status,500);assert.equal(f.calls.length,0)});
test('identical requestId retry returns same existing confirmed reference',async()=>{const f=fixture({status:409,saved:{code:'23505'}}),r=await f.handle(req(valid({requestId})));assert.equal(r.status,200);assert.deepEqual(await r.json(),{success:true,reference:id});assert.equal(f.calls.length,2);const lookup=new URL(f.calls[1].url);assert.equal(lookup.searchParams.get('request_id'),'eq.'+requestId);assert.ok(lookup.searchParams.get('select').includes('phone'));assert.equal(f.calls[1].init.method,undefined)});
test('reused requestId with changed details never overwrites previous request',async()=>{const f=fixture({status:409,saved:{code:'23505'},existing:[{id,...canonical,name:'Other Person'}]}),r=await f.handle(req(valid({requestId})));assert.equal(r.status,409);assert.notEqual((await r.json()).success,true);assert.equal(f.calls.length,2);assert.equal(f.calls.filter(c=>c.init.method==='POST').length,1)});
test('unrelated409 is not accepted as a duplicate success',async()=>{const f=fixture({status:409,saved:{code:'other'}}),r=await f.handle(req(valid({requestId})));assert.equal(r.status,502);assert.equal(f.calls.length,1)});
test('duplicate lookup failure cannot claim success',async()=>{const f=fixture({status:409,saved:{code:'23505'},lookupStatus:502}),r=await f.handle(req(valid({requestId})));assert.equal(r.status,502);assert.notEqual((await r.json()).success,true)});
test('duplicate lookup without a confirmed UUID cannot claim success',async()=>{const f=fixture({status:409,saved:{code:'23505'},existing:[]}),r=await f.handle(req(valid({requestId})));assert.equal(r.status,409);assert.notEqual((await r.json()).success,true)});
