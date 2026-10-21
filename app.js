(() => {
  "use strict";
  const config = window.LUSTRY_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const money = (n) => new Intl.NumberFormat("en-IN", {style:"currency",currency:"INR",maximumFractionDigits:0}).format(Math.round(n || 0));
  const products = {
    tee: {label:"T-shirts & polos", styles:["Round neck T-shirt","Oversized T-shirt","Polo T-shirt","Full-sleeve T-shirt","Dry-fit sports T-shirt"], fabrics:[["Combed cotton",20],["Cotton single jersey",0],["Cotton blend",0],["Polyester dry-fit",5],["Piqué polo fabric",15],["Organic cotton (quote required)",35]], gsm:[["140 GSM",0],["160 GSM",0],["180 GSM",10],["200 GSM",18],["220 GSM",28],["240 GSM",38],["Custom GSM (quote required)",45]], base:120, sized:true},
    hoodie: {label:"Hoodies & sweatshirts", styles:["Pullover hoodie","Zip-up hoodie","Crewneck sweatshirt","Oversized hoodie"], fabrics:[["Fleece cotton blend",0],["French terry",15],["Brushed fleece",20],["100% cotton (quote required)",35],["Polyester blend",5]], gsm:[["240 GSM",0],["280 GSM",15],["300 GSM",25],["320 GSM",35],["350 GSM",45],["Custom GSM (quote required)",60]], base:360, sized:true},
    jacket: {label:"Jackets", styles:["Bomber jacket","Varsity jacket","Lightweight windcheater","Corporate zip jacket"], fabrics:[["Polyester",0],["Nylon / water-resistant shell",45],["Cotton twill",35],["Fleece",20],["Quilted / lined (quote required)",70]], gsm:[["Lightweight",0],["Medium weight",25],["Heavy weight",50],["Lined / padded",80],["Custom specification",100]], base:550, sized:true},
    backpack: {label:"Pittu bags & backpacks", styles:["School pittu bag","Two-compartment backpack","Laptop / corporate backpack","Drawstring backpack"], fabrics:[["Polyester 600D",0],["Polyester 900D",35],["Oxford fabric",20],["Canvas",30],["Water-resistant fabric",45]], gsm:[["Standard bag material",0],["Heavy-duty material",35],["Padded construction",60],["Custom thickness",80]], base:240, sized:false},
    tote: {label:"Tote & promotional bags", styles:["Cotton tote bag","Canvas tote bag","Non-woven promotional bag","Drawstring bag","Jute-look bag"], fabrics:[["Cotton",0],["Canvas",25],["Non-woven",0],["Jute / jute blend",30],["Recycled fabric (quote required)",35]], gsm:[["Standard",0],["140 GSM",10],["180 GSM",20],["220 GSM",30],["Heavy canvas",45]], base:65, sized:false},
    merch: {label:"Pens & bag tags", styles:["Branded pen","Plastic bag tag","Metal bag tag","Luggage tag set","Mixed merchandise pack"], fabrics:[["Standard plastic",0],["Metal",25],["Silicone / rubber",15],["Leatherette",25],["Mixed materials",30]], gsm:[["Standard product",0],["Premium finish",15],["Gift packaging",25],["Custom specification",35]], base:25, sized:false}
  };
  const brandPrices = {none:0,screen:12,dtf:28,sublimation:20,embroidery:35,woven:12,multiple:40};
  const brandLabels = {none:"No branding",screen:"Screen printing",dtf:"DTF printing",sublimation:"Sublimation",embroidery:"Embroidery",woven:"Woven label / tag",multiple:"Multiple methods"};
  const discounts = [{min:1000,rate:15},{min:500,rate:12},{min:250,rate:9},{min:100,rate:6},{min:50,rate:4},{min:25,rate:2}];
  const state = { language:"en", busy:false };
  const configured = () => !!(config.supabaseUrl && config.supabaseAnonKey && !config.supabaseUrl.includes("YOUR-PROJECT") && !config.supabaseAnonKey.includes("YOUR_SUPABASE"));
  const selectedProduct = () => products[$("product").value] || products.tee;
  const selectedExtra = (select, options) => {
    const found = options.find(o => o[0] === select.value);
    return found ? Number(found[1]) : 0;
  };
  function fillSelect(el, entries, selected) {
    el.innerHTML = "";
    entries.forEach((entry) => {
      const opt = document.createElement("option");
      opt.value = Array.isArray(entry) ? entry[0] : entry;
      opt.textContent = Array.isArray(entry) ? entry[0] : entry;
      if (selected && opt.value === selected) opt.selected = true;
      el.appendChild(opt);
    });
  }
  function updateProductOptions() {
    const p = selectedProduct();
    fillSelect($("style"), p.styles);
    fillSelect($("fabric"), p.fabrics);
    fillSelect($("gsm"), p.gsm);
    $("sizeGrid").classList.toggle("hidden", !p.sized);
    $("estimateProduct").textContent = p.label;
    updateEstimate();
  }
  function getQty() {
    return Math.floor(Number($("quantity").value) || 0);
  }
  function getDiscount(qty) {
    return (discounts.find(d => qty >= d.min) || {rate:0}).rate;
  }
  function estimate() {
    const p = selectedProduct();
    const qty = getQty();
    const fabricAdd = selectedExtra($("fabric"), p.fabrics);
    const gsmAdd = selectedExtra($("gsm"), p.gsm);
    const brandAdd = brandPrices[$("branding").value] || 0;
    const unit = Math.max(0, p.base + fabricAdd + gsmAdd + brandAdd);
    const rate = getDiscount(qty);
    const subtotal = unit * Math.max(0, qty);
    const discount = subtotal * rate / 100;
    return {p,qty,unit,rate,subtotal,discount,total:subtotal-discount};
  }
  function updateEstimate() {
    const e = estimate();
    $("estimateProduct").textContent = e.p.label;
    $("estimateTotal").textContent = money(e.total);
    $("estimateQuantity").textContent = `${Math.max(0,e.qty).toLocaleString("en-IN")} pieces`;
    $("estimateUnit").textContent = `${money(e.unit)} / pc`;
    $("estimateDiscount").textContent = `${e.rate}% · −${money(e.discount)}`;
    $("discountBar").style.width = `${e.rate/15*100}%`;
    $("discountHint").textContent = e.qty < 25 ? "Minimum request quantity is 25 pieces." : `You’re getting a ${e.rate}% indicative bulk discount.`;
    updateSizeStatus(false);
  }
  function getSizeBreakdown() {
    const result = {};
    document.querySelectorAll("[data-size]").forEach(input => { const n = Math.max(0,Math.floor(Number(input.value)||0)); if(n) result[input.dataset.size]=n; });
    return result;
  }
  function updateSizeStatus(showError) {
    const p = selectedProduct(), sizes = getSizeBreakdown(), sum = Object.values(sizes).reduce((a,b)=>a+b,0), hasSizes = sum > 0, qty = getQty();
    const status = $("sizeStatus");
    if (!p.sized) { status.textContent = "Size breakdown is not needed for this category."; status.classList.remove("error"); return !showError; }
    if (!hasSizes) { status.textContent = "Add sizes if needed. If used, size quantities must total the order quantity."; status.classList.remove("error"); return true; }
    if (sum !== qty) { status.textContent = `Size quantities total ${sum}; order quantity is ${qty}. Please make them match.`; status.classList.toggle("error",!!showError); return false; }
    status.textContent = `Size breakdown matches your order: ${sum} pieces.`; status.classList.remove("error"); return true;
  }
  function toast(msg) { const el=$("toast"); el.textContent=msg; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),3500); }
  function getSupabaseHeaders() { return {"Content-Type":"application/json","apikey":config.supabaseAnonKey,"Authorization":`Bearer ${config.supabaseAnonKey}`}; }
  async function callFunction(name, payload) {
    if (!configured()) throw new Error("Website backend is not configured yet. Please add the Supabase project URL and public anon key in config.js.");
    const url = `${config.supabaseUrl.replace(/\/$/,"")}/functions/v1/${name}`;
    const res = await fetch(url,{method:"POST",headers:getSupabaseHeaders(),body:JSON.stringify(payload)});
    const body = await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(body.error || body.message || "Request failed. Please try again or contact Lustry.");
    return body;
  }
  async function submitOrder(event) {
    event.preventDefault();
    if (state.busy) return;
    const qty = getQty(), e = estimate();
    if (qty < 25) { $("quantity").setCustomValidity("Minimum order quantity is 25 pieces."); $("quantity").reportValidity(); $("quantity").setCustomValidity(""); return; }
    if (!updateSizeStatus(true)) { $("sizeStatus").scrollIntoView({behavior:"smooth",block:"center"}); return; }
    if (!$("consent").checked) { $("consent").reportValidity(); return; }
    const file = $("artwork").files[0];
    if (file && file.size > 5*1024*1024) { $("formMessage").textContent="Please upload artwork smaller than 5 MB."; $("formMessage").className="form-message error"; return; }
    // Starter stores text order data. Artwork upload needs a private Storage bucket integration before enabling uploads in production.
    if (file) { $("formMessage").textContent="Artwork upload is not connected yet. Please submit the request and email the artwork to Lustry, or configure a private storage bucket."; $("formMessage").className="form-message error"; return; }
    const payload = {
      customer: {name:$("customerName").value.trim(), company:$("company").value.trim(), email:$("email").value.trim(), phone:$("phone").value.trim()},
      order: {product:$("product").value, productLabel:e.p.label, style:$("style").value, fabric:$("fabric").value, gsm:$("gsm").value, color:$("color").value, quantity:qty, branding:$("branding").value, brandingLabel:brandLabels[$("branding").value], placement:$("placement").value, needBy:$("needBy").value||null, sizes:getSizeBreakdown(), design:$("design").value.trim(), coupon:$("coupon").value.trim()},
      estimate: {currency:"INR", unitPrice:e.unit, subtotal:e.subtotal, quantityDiscountPercent:e.rate, quantityDiscountAmount:e.discount, estimatedTotal:e.total, disclaimer:"Indicative estimate only. Final quote subject to Lustry approval."},
      consent:true, source:"website"
    };
    state.busy=true; $("submitOrder").disabled=true; $("submitOrder").textContent="Sending request…";
    $("formMessage").textContent=""; $("formMessage").className="form-message";
    try {
      const result=await callFunction(config.submitOrderFunction||"submit-order",payload);
      $("formMessage").textContent=`Request received. Your reference is ${result.reference || result.orderId || "pending"}. Lustry will review your brief and confirm the final quotation.`;
      $("formMessage").className="form-message success";
      toast("Quotation request submitted.");
      $("orderForm").reset(); $("quantity").value=100; updateProductOptions(); updateEstimate();
    } catch(err) {
      $("formMessage").textContent=err.message || "Could not submit online. Please contact Lustry.";
      $("formMessage").className="form-message error";
    } finally {
      state.busy=false; $("submitOrder").disabled=false; $("submitOrder").innerHTML='Submit quotation request <span>↗</span>';
    }
  }
  const translations = {
    en:{navProducts:"Products",navHow:"How it works",navAbout:"About us",navQuote:"Build your order"},
    hi:{navProducts:"उत्पाद",navHow:"कैसे काम करता है",navAbout:"हमारे बारे में",navQuote:"ऑर्डर बनाएँ"}
  };
  function setLanguage(lang) {
    state.language=lang;
    document.documentElement.lang=lang;
    document.querySelectorAll("[data-i18n]").forEach(el=>{const key=el.dataset.i18n;if(translations[lang]&&translations[lang][key])el.textContent=translations[lang][key];});
    // This starter translates navigation labels only. Product data and full page translations need a reviewed translation file.
  }
  function addBubble(text,who) { const el=document.createElement("div"); el.className=`chat-bubble ${who}`; el.textContent=text; $("chatMessages").appendChild(el); $("chatMessages").scrollTop=$("chatMessages").scrollHeight; return el; }
  async function sendChat(event) {
    event.preventDefault(); const input=$("chatInput"), message=input.value.trim(); if(!message)return;
    input.value=""; addBubble(message,"user"); const pending=addBubble("Thinking…","bot");
    try {
      const result=await callFunction(config.aiSupportFunction||"ai-support",{message,language:state.language,context:{page:"Lustry custom manufacturing website",products:Object.values(products).map(p=>p.label),minimumQuantity:25,discountSlabs:discounts.map(d=>({minimumQuantity:d.min,percent:d.rate})),pricingPolicy:"All website estimates are indicative; Lustry must approve the final quote."}});
      pending.textContent=result.answer||"I couldn't prepare an answer. Please contact the Lustry team.";
    } catch(err) {
      pending.textContent="AI support is not connected yet. Please use the quotation form or contact Lustry directly. ("+err.message+")";
    }
  }
  $("product").addEventListener("change",updateProductOptions);
  ["quantity","fabric","gsm","branding","style","color"].forEach(id=>$(id).addEventListener("input",updateEstimate));
  $("clearSizes").addEventListener("click",()=>{document.querySelectorAll("[data-size]").forEach(i=>i.value=0);updateSizeStatus(false);});
  document.querySelectorAll("[data-size]").forEach(i=>i.addEventListener("input",()=>updateSizeStatus(false)));
  $("orderForm").addEventListener("submit",submitOrder);
  $("languageSelect").addEventListener("change",e=>setLanguage(e.target.value));
  $("menuToggle").addEventListener("click",()=>{const open=$("navLinks").classList.toggle("open");$("menuToggle").setAttribute("aria-expanded",String(open));});
  document.querySelectorAll("#navLinks a").forEach(a=>a.addEventListener("click",()=>{$("navLinks").classList.remove("open");$("menuToggle").setAttribute("aria-expanded","false");}));
  document.querySelectorAll("[data-product]").forEach(btn=>btn.addEventListener("click",()=>{$("product").value=btn.dataset.product;updateProductOptions();$("builder").scrollIntoView({behavior:"smooth"});}));
  $("chatLauncher").addEventListener("click",()=>{$("chatPanel").hidden=false;$("chatInput").focus();});
  $("chatClose").addEventListener("click",()=>$("chatPanel").hidden=true);
  $("chatForm").addEventListener("submit",sendChat);
  $("year").textContent=new Date().getFullYear();
  updateProductOptions(); updateEstimate();
  if(config.whatsappNumber) {
    const a=document.createElement("a");a.className="whatsapp-fab";a.href=`https://wa.me/${config.whatsappNumber}`;a.target="_blank";a.rel="noopener noreferrer";a.textContent="WhatsApp";a.setAttribute("aria-label","Contact Lustry on WhatsApp");document.body.appendChild(a);
  }
})();
