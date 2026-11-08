import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Public callers use the gateway's existing JWT verification. The service-role
// credential stays here and writes only to the private callback_requests table.
const allowedOrigins = new Set([
  "https://lustry.in",
  "https://www.lustry.in",
  "https://lustryhelpline-afk.github.io",
  "https://v8-preview-lustry-website.lustryhelpline.workers.dev",
  ...String(Deno.env.get("ALLOWED_ORIGIN") || "").split(",").map(origin => origin.trim()).filter(Boolean),
]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const maxBodyBytes = 8192;

function reply(req: Request, data: unknown, status = 200): Response {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  });
  const origin = req.headers.get("Origin");
  if (origin && allowedOrigins.has(origin)) headers.set("Access-Control-Allow-Origin", origin);
  if (status === 405) headers.set("Allow", "POST, OPTIONS");
  return new Response(JSON.stringify(data), { status, headers });
}

async function readPayload(req: Request): Promise<unknown> {
  if (Number(req.headers.get("Content-Length")) > maxBodyBytes) throw Error("payload-too-large");
  const reader = req.body?.getReader();
  if (!reader) throw Error("invalid-json");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > maxBodyBytes) {
        await reader.cancel();
        throw Error("payload-too-large");
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("Origin");
  if (origin !== null && !allowedOrigins.has(origin)) {
    return reply(req, { error: "This website origin is not allowed." }, 403);
  }
  if (req.method === "OPTIONS") return reply(req, { ok: true });
  if (req.method !== "POST") return reply(req, { error: "Only POST requests are allowed." }, 405);

  let input: unknown;
  try { input = await readPayload(req); }
  catch (error) {
    const tooLarge = error instanceof Error && error.message === "payload-too-large";
    return reply(req, { error: tooLarge ? "Request is too large." : "Please send valid JSON." }, tooLarge ? 413 : 400);
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) return reply(req, { error: "Invalid callback request." }, 400);
  const body = input as Record<string, unknown>;
  if (body.website !== undefined && (typeof body.website !== "string" || body.website.trim() !== "")) {
    return reply(req, { error: "This callback request could not be accepted." }, 400);
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
  const compactPhone = rawPhone.replace(/[\s()-]/g, "");
  if (!name || name.length > 100 || !rawPhone || rawPhone.length > 40 || !/^(\+?91)?[6-9]\d{9}$/.test(compactPhone)) {
    return reply(req, { error: "Please enter your name and a valid 10-digit mobile number." }, 400);
  }
  if (body.consent !== true) return reply(req, { error: "Please agree to be contacted." }, 400);
  let quantity: number | null = null;
  if (body.quantity !== undefined && body.quantity !== null && body.quantity !== "") {
    if (!["string", "number"].includes(typeof body.quantity)) return reply(req, { error: "Invalid quantity." }, 400);
    const value = typeof body.quantity === "string" ? body.quantity.trim() : body.quantity;
    if (value !== "") {
      quantity = Number(value);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) return reply(req, { error: "Quantity must be a whole number between 1 and 100000." }, 400);
    }
  }
  if (body.note !== undefined && body.note !== null && (typeof body.note !== "string" || body.note.trim().length > 300)) return reply(req, { error: "Notes must be at most 300 characters." }, 400);
  if (body.source !== undefined && (typeof body.source !== "string" || !body.source.trim() || body.source.trim().length > 40)) return reply(req, { error: "Invalid request source." }, 400);
  if (body.requestId !== undefined && (typeof body.requestId !== "string" || !uuid.test(body.requestId))) return reply(req, { error: "Invalid request reference. Please refresh the page." }, 400);

  const requestId = typeof body.requestId === "string" ? body.requestId.toLowerCase() : crypto.randomUUID();
  const callback = {
    request_id: requestId,
    name,
    phone: "+91" + compactPhone.slice(-10),
    quantity,
    consent: true,
    note: typeof body.note === "string" ? body.note.trim() || null : null,
    source: typeof body.source === "string" ? body.source.trim() : "popup",
  };
  const base = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!base || !key) return reply(req, { error: "Callback service configuration is incomplete." }, 500);
  const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  try {
    const response = await fetch(base + "/rest/v1/callback_requests?select=id", {
      method: "POST", headers: { ...headers, Prefer: "return=representation" }, body: JSON.stringify(callback),
    });
    const saved = await response.json().catch(() => null);
    if (response.status === 409 && saved?.code === "23505") {
      const lookup = new URL(base + "/rest/v1/callback_requests");
      lookup.searchParams.set("select", "id,name,phone,quantity,consent,source,note");
      lookup.searchParams.set("request_id", "eq." + requestId);
      lookup.searchParams.set("limit", "1");
      const existingResponse = await fetch(lookup, { headers });
      const rows = await existingResponse.json().catch(() => null);
      if (!existingResponse.ok) return reply(req, { error: "We could not confirm your request. Please contact Lustry before retrying." }, 502);
      const existing = Array.isArray(rows) ? rows[0] : null;
      if (!existing || typeof existing.id !== "string" || !uuid.test(existing.id)
        || !["name", "phone", "quantity", "consent", "source", "note"].every(field => existing[field] === callback[field as keyof typeof callback])) {
        return reply(req, { error: "This request reference was already used for different details. Please refresh the page." }, 409);
      }
      return reply(req, { success: true, reference: existing.id });
    }
    const row = Array.isArray(saved) ? saved[0] : null;
    if (!response.ok || !row || typeof row.id !== "string" || !uuid.test(row.id)) {
      console.error("callback-request insert was not confirmed", { status: response.status });
      return reply(req, { error: "We could not confirm your request. Please contact Lustry before retrying." }, 502);
    }
    return reply(req, { success: true, reference: row.id }, 201);
  } catch {
    console.error("callback-request backend connection failed");
    return reply(req, { error: "We could not confirm your request. Please contact Lustry before retrying." }, 502);
  }
});
