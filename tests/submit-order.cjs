// Executes the Edge Function in an isolated VM. All backend fetches are mocked.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');
const source = fs.readFileSync(require('node:path').join(__dirname, '../supabase/functions/submit-order/index.ts'), 'utf8');
const executable = stripTypeScriptTypes(source.replace(/^import "jsr:@supabase\/functions-js\/edge-runtime\.d\.ts";\s*/m, ''));
const preview = 'https://v8-preview-lustry-website.lustryhelpline.workers.dev';
function fixture(overrides = {}) {
  let handler;
  const calls = [];
  const state = { prices: [{ base_price: 100, branding_cost: 10, fabric: 'Cotton', gsm: '180' }], priceStatus: 200, insertStatus: 201, saved: [{ id: 'MOCK-ONLY' }], ...overrides };
  const env = { SUPABASE_URL: 'https://mock-project.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'mock-service-only', ALLOWED_ORIGIN: '', ...overrides.env };
  vm.runInNewContext(executable, {
    Deno: { env: { get: name => env[name] }, serve: fn => { handler = fn; } },
    Request, Response, URL,
    console: { error() {} },
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      if (String(url).includes('/rest/v1/product_prices?')) return new Response(JSON.stringify(state.prices), { status: state.priceStatus });
      if (String(url).includes('/rest/v1/order_enquiries?')) return new Response(JSON.stringify(state.saved), { status: state.insertStatus });
      throw new Error('Unexpected backend URL; real network is not permitted in this test');
    }
  });
  return { handle: handler, calls, state };
}
function request(method = 'OPTIONS', origin = preview, body) {
  const options = { method, headers: origin ? { Origin: origin } : {} };
  if (body) { options.headers['Content-Type'] = 'application/json'; options.body = JSON.stringify(body); }
  return new Request('https://mock-project.supabase.co/functions/v1/submit-order', options);
}
function brief(quantity = 25, branding = 'none') {
  return { customer: { name: 'Mock Test', email: 'mock@example.com' }, order: { product: 'tee', quantity, branding, fabric: 'Cotton', gsm: '180' }, consent: true };
}
for (const origin of ['https://lustry.in', 'https://www.lustry.in', 'https://lustryhelpline-afk.github.io', preview]) {
  test('preflight preserves exact allowed origin: ' + origin, async () => {
    const f = fixture(), response = await f.handle(request('OPTIONS', origin));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
    assert.equal(response.headers.get('Vary'), 'Origin');
    assert.match(response.headers.get('Access-Control-Allow-Headers'), /apikey/);
    assert.match(response.headers.get('Access-Control-Allow-Methods'), /POST/);
    assert.equal(f.calls.length, 0);
  });
}
test('unknown and lookalike origins receive no browser permission', async () => {
  const f = fixture();
  for (const origin of ['https://example.com', 'https://other-worker.lustryhelpline.workers.dev', preview + '.example.com', 'http://v8-preview-lustry-website.lustryhelpline.workers.dev', 'null']) {
    const response = await f.handle(request('OPTIONS', origin));
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
    assert.equal(response.headers.get('Vary'), 'Origin');
  }
  assert.equal(f.calls.length, 0);
});
test('existing comma-separated configured origins remain supported', async () => {
  const f = fixture({ env: { ALLOWED_ORIGIN: ' https://additional.example, https://second.example ' } });
  for (const origin of ['https://additional.example', 'https://second.example']) {
    assert.equal((await f.handle(request('OPTIONS', origin))).headers.get('Access-Control-Allow-Origin'), origin);
  }
});
for (const quantity of [24, 25.5, 100001]) {
  test('quantity validation remains unchanged: ' + quantity, async () => {
    const f = fixture(), response = await f.handle(request('POST', preview, brief(quantity)));
    assert.equal(response.status, 400); assert.equal(f.calls.length, 0);
  });
}
test('consent remains required before backend access', async () => {
  const f = fixture(), payload = brief(); payload.consent = false;
  assert.equal((await f.handle(request('POST', preview, payload))).status, 400); assert.equal(f.calls.length, 0);
});
test('invalid customer remains rejected before backend access', async () => {
  const f = fixture(); assert.equal((await f.handle(request('POST', preview, { consent: false }))).status, 400); assert.equal(f.calls.length, 0);
});
test('unsupported methods remain rejected', async () => {
  const f = fixture(); assert.equal((await f.handle(request('GET'))).status, 405); assert.equal(f.calls.length, 0);
});
for (const [quantity, discount] of [[25, 0], [99, 0], [100, 5], [199, 5], [200, 20], [499, 20], [500, 25]]) {
  test('saved-enquiry result and discount boundary preserved: ' + quantity, async () => {
    const f = fixture(), response = await f.handle(request('POST', preview, brief(quantity))), result = await response.json();
    assert.equal(response.status, 201); assert.equal(result.success, true); assert.equal(result.reference, 'MOCK-ONLY');
    assert.equal(result.discountPercent, discount); assert.equal(result.estimatedTotal, Math.round(100 * quantity * (1 - discount / 100) * 100) / 100);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), preview);
    assert.equal(f.calls.length, 2);
    const saved = JSON.parse(f.calls[1].init.body);
    assert.equal(saved.quantity, quantity); assert.equal(saved.product_type, 'T-shirts'); assert.equal(saved.status, 'pending');
    assert.equal(saved.discount_percent, discount); assert.equal(saved.estimated_total, result.estimatedTotal);
  });
}
test('branding cost and optional size notes preserve existing save format', async () => {
  const f = fixture(), payload = brief(25, 'DTF'); payload.order.sizes = { S: 10, M: 15 };
  const response = await f.handle(request('POST', preview, payload));
  assert.equal((await response.json()).estimatedTotal, 2750);
  const saved = JSON.parse(f.calls[1].init.body); assert.equal(saved.branding_unit_cost, 10); assert.match(saved.notes, /Sizes: \{"S":10,"M":15\}/);
});
for (const [name, settings, status] of [
  ['price lookup error', { priceStatus: 502 }, 502],
  ['unavailable product pricing', { prices: [] }, 400],
  ['insert error', { insertStatus: 502 }, 502],
  ['unconfirmed insert', { saved: [] }, 502],
  ['missing server configuration', { env: { SUPABASE_SERVICE_ROLE_KEY: '' } }, 500]
]) {
  test(name + ' never claims an enquiry was saved', async () => {
    const f = fixture(settings), response = await f.handle(request('POST', preview, brief()));
    assert.equal(response.status, status); assert.notEqual((await response.json()).success, true);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), preview);
  });
}
