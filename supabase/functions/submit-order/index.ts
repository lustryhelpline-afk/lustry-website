
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin":
    Deno.env.get("ALLOWED_ORIGIN") || "https://lustry.in",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getProductType(key: string): string {
  const map: Record<string, string> = {
    tee: "T-shirts",
    hoodie: "Hoodies & sweatshirts",
    backpack: "Bags & backpacks",
    tote: "Bags & backpacks",
    merch: "Corporate merchandise",
    jacket: "Other custom product",
  };

  return map[key] || key;
}

function getDiscount(quantity: number): number {
  if (quantity >= 500) return 25;
  if (quantity >= 200) return 20;
  if (quantity >= 100) return 5;
  return 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return reply({ error: "Only POST requests are allowed." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      console.error("Missing server-side Supabase secrets.");
      return reply({ error: "Server configuration is incomplete." }, 500);
    }

    const body = await req.json();
    const customer = body?.customer;
    const order = body?.order;

    const name = String(customer?.name || "").trim();
    const email = String(customer?.email || "").trim();
    const quantity = Number(order?.quantity);
    const productType = getProductType(String(order?.product || ""));

    if (!name || !email || !email.includes("@")) {
      return reply({ error: "Please enter a valid name and email." }, 400);
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 25 ||
      quantity > 100000
    ) {
      return reply({
        error: "Quantity must be between 25 and 100000.",
      }, 400);
    }

    if (body?.consent !== true) {
      return reply({
        error: "Please confirm consent before submitting.",
      }, 400);
    }

    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    };

    const priceUrl = new URL(
      `${supabaseUrl}/rest/v1/product_prices`,
    );

    priceUrl.searchParams.set(
      "select",
      "product_type,fabric,gsm,base_price,branding_cost",
    );
    priceUrl.searchParams.set("product_type", `eq.${productType}`);
    priceUrl.searchParams.set("active", "eq.true");
    priceUrl.searchParams.set("limit", "1");

    const priceResponse = await fetch(priceUrl, { headers });

    if (!priceResponse.ok) {
      console.error("Price lookup failed:", await priceResponse.text());
      return reply({ error: "Could not load current pricing." }, 502);
    }

    const prices = await priceResponse.json();

    if (!Array.isArray(prices) || prices.length === 0) {
      return reply({
        error: "Pricing is not available for this product.",
      }, 400);
    }

    const price = prices[0];
    const basePrice = Number(price.base_price);
    const brandingCost =
      order.branding === "none" ? 0 : Number(price.branding_cost);

    const discountPercent = getDiscount(quantity);
    const unitPrice = basePrice + brandingCost;

    const estimatedTotal =
      Math.round(
        unitPrice * quantity * (1 - discountPercent / 100) * 100,
      ) / 100;

    const enquiry = {
      customer_name: name,
      company: String(customer.company || "").trim() || null,
      email,
      phone: String(customer.phone || "").trim() || null,
      product_type: productType,
      fabric: String(order.fabric || price.fabric),
      gsm: String(order.gsm || price.gsm),
      quantity,
      branding_method:
        String(order.brandingLabel || order.branding || "").trim() || null,
      timeline: String(order.needBy || "").trim() || null,
      notes: [
        order.style ? `Style: ${order.style}` : "",
        order.color ? `Colour: ${order.color}` : "",
        order.placement ? `Branding placement: ${order.placement}` : "",
        order.design ? `Design notes: ${order.design}` : "",
        order.sizes ? `Sizes: ${JSON.stringify(order.sizes)}` : "",
        order.coupon ? `Coupon: ${order.coupon}` : "",
        "Indicative estimate only; final quotation subject to Lustry approval.",
      ].filter(Boolean).join("\n"),
      base_unit_price: basePrice,
      branding_unit_cost: brandingCost,
      discount_percent: discountPercent,
      estimated_total: estimatedTotal,
      status: "pending",
    };

    const insertResponse = await fetch(
      `${supabaseUrl}/rest/v1/order_enquiries?select=id`,
      {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "return=representation",
        },
        body: JSON.stringify(enquiry),
      },
    );

    const inserted = await insertResponse.json().catch(() => null);

    if (!insertResponse.ok) {
      console.error("Order insert failed:", inserted);
      return reply({
        error: "We could not save your request. Please try again.",
      }, 502);
    }

    const saved = Array.isArray(inserted) ? inserted[0] : null;

    if (!saved?.id) {
      return reply({
        error: "Request could not be confirmed. Please try again.",
      }, 502);
    }

    return reply({
      success: true,
      reference: saved.id,
      estimatedTotal,
      discountPercent,
      message:
        "Order request received! Our customer executive will connect with you shortly.",
    }, 201);
  } catch (error) {
    console.error("submit-order error:", error);
    return reply({ error: "Something went wrong. Please try again." }, 500);
  }
});
