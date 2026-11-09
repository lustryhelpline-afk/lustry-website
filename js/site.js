(()=>{'use strict';
const $=(s,root=document)=>root.querySelector(s), $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
const P=window.LUSTRY_CATALOG||[], CFG=window.LUSTRY_CONFIG||{}, url=new URLSearchParams(location.search);
const CALL=String(CFG.callingNumber||'919267373084').replace(/\D/g,''),CALL_DISPLAY='+91 '+CALL.slice(-10,-5)+' '+CALL.slice(-5);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'₹'+Number(n).toLocaleString('en-IN',{maximumFractionDigits:0});
// Browser storage is visitor-controlled: validate every line before rendering or counting it.
function normalizeCart(value){
 if(!Array.isArray(value))return [];
 const lines=new Map();
 for(const row of value.slice(0,100)){
  if(!row||typeof row!=='object'||!['number','string'].includes(typeof row.quantity)||String(row.quantity).trim()==='')continue;
  const product=P.find(p=>p.id===row.id),quantity=Number(row.quantity);
  if(!product||product.demo_price==null||!product.colors.includes(row.color)||!product.sizes.includes(row.size)||!Number.isInteger(quantity)||quantity<1||quantity>500)continue;
  const key=[product.id,row.color,row.size].join('|'),previous=lines.get(key);
  lines.set(key,{key,id:product.id,color:row.color,size:row.size,quantity:Math.min(500,quantity+(previous?.quantity||0))});
 }
 return [...lines.values()];
}
const store={read(){try{return normalizeCart(JSON.parse(localStorage.getItem('lustry_demo_cart_v3')))}catch{return[]}},write(rows){try{localStorage.setItem('lustry_demo_cart_v3',JSON.stringify(normalizeCart(rows)));updateCartCount();return true}catch{toast('Your browser could not save the bag. Please allow site storage or contact Lustry.');return false}}};
const validPrice=value=>((typeof value==='number')||(typeof value==='string'&&value.trim()!==''))&&Number.isFinite(Number(value))&&Number(value)>=0;
const catNames={tshirts:'T-Shirts',hoodies:'Hoodies & Sweatshirts',bags:'Bags & Backpacks',merch:'Corporate Merchandise'};
function updateCartCount(){const n=store.read().reduce((s,x)=>s+(Number(x.quantity)||0),0);$$('[data-cart-count]').forEach(e=>e.textContent=n)}
function toast(t){const e=$('#toast');if(!e)return;e.textContent=t;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),3500)}
function productImage(p){return `<img loading="lazy" src="${referencePhotos[p.id]||p.fallback}" alt="Reference image for ${esc(p.name)}">`}
function productCard(p){return `<article class="product-card"><a class="product-photo" href="product.html?id=${encodeURIComponent(p.id)}">${productImage(p)}<span class="product-tag">REFERENCE</span><span class="product-circle" aria-hidden="true"><svg class="l-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 15 15 5M5 5h10v10"/></svg></span></a><div class="product-bottom"><div><a class="product-name" href="product.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a><small>${esc(p.fabric)}</small></div><div class="product-price">Request price<small>On enquiry</small></div></div></article>`}
// Reference photography illustrates product types; it does not verify inventory or specifications.
const referencePhotos={
 'rn-sarina':'assets/photos/reference-round-neck.jpg',
 'rn-comb':'assets/photos/reference-black-tee.jpg',
 'os-tee':'assets/photos/reference-black-tee.jpg',
 'polo-pq':'assets/photos/reference-polo.jpg','polo-dry':'assets/photos/reference-polo.jpg',
 'hood-ft':'assets/photos/reference-hoodie.jpg','sweat-ft':'assets/photos/reference-sweatshirt.jpg',
 'bp-lap':'assets/photos/reference-backpack.jpg','bag-nw':'assets/photos/reference-tote.jpg'
};
const icon=(name)=>({search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',bag:'<path d="M5 7.5h14l1 13H4l1-13Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',phone:'<path d="m7 3 3 4-2 3a15 15 0 0 0 6 6l3-2 4 3-1 4C10 22 2 14 3 4l4-1Z"/>'}[name]);
function headerIcon(name){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon(name)}</svg>`}
function common(){
 const h=$('#site-header');
 if(h){h.className='site-header l-header';h.innerHTML=`
  <div class="l-head wrap"><a href="index.html" class="l-logo" aria-label="Lustry Home"><img src="assets/lustry-wordmark.jpg" width="190" height="52" alt="Lustry — Apparel and Bags Manufacturer"></a>
   <form class="l-search-inline" action="shop.html" method="get" role="search" aria-label="Search catalogue"><label class="sr-only" for="inline-shop-search">Search products and fabrics</label><input id="inline-shop-search" name="q" type="search" placeholder="Search products, fabrics and styles" autocomplete="off"><button type="submit" aria-label="Submit catalogue search">${headerIcon('search')}</button></form>
   <nav class="l-business-nav" aria-label="Services"><a href="custom.html">Bulk manufacturing</a><a href="design.html">Design Studio</a></nav>
   <div class="l-actions"><button class="l-icon-btn l-search-toggle" type="button" aria-label="Search products" aria-expanded="false" aria-controls="l-search-panel">${headerIcon('search')}</button><button class="l-icon-btn l-contact-toggle" type="button" data-open-bulk-popup aria-label="Request a call">${headerIcon('phone')}<span>Contact</span></button><a class="l-icon-btn l-bag" href="cart.html" aria-label="Preview shopping bag">${headerIcon('bag')}<b data-cart-count>0</b></a><button class="l-icon-btn l-menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="l-menu-panel">${headerIcon('menu')}</button></div>
  </div>
  <div class="l-category-band"><nav class="l-categories wrap" aria-label="Product categories"><a href="shop.html" data-home-cat="">All products</a><a href="shop.html?cat=tshirts" data-home-cat="tshirts">T-Shirts</a><a href="shop.html?cat=hoodies" data-home-cat="hoodies">Hoodies &amp; Sweatshirts</a><a href="shop.html?cat=bags" data-home-cat="bags">Bags &amp; Backpacks</a><a href="shop.html?cat=merch" data-home-cat="merch">Corporate merchandise</a></nav></div>
  <div id="l-search-panel" class="l-search-panel" hidden><form class="wrap l-search-form" action="shop.html" method="get" role="search"><label for="top-shop-search" class="sr-only">Search the Lustry catalogue</label><input id="top-shop-search" name="q" type="search" placeholder="Search products, fabrics or styles" autocomplete="off"><button type="submit">Search <svg class="l-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 15 15 5M5 5h10v10"/></svg></button></form></div>
  <nav id="l-menu-panel" class="l-menu-panel" aria-label="More from Lustry" hidden><a href="custom.html">Bulk manufacturing <span>25+ pieces <svg class="l-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 15 15 5M5 5h10v10"/></svg></span></a><a href="design.html">Design Studio <span><svg class="l-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 15 15 5M5 5h10v10"/></svg></span></a><a href="about.html">About Lustry <span><svg class="l-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 15 15 5M5 5h10v10"/></svg></span></a><a href="contact.html">Contact &amp; support <span><svg class="l-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 15 15 5M5 5h10v10"/></svg></span></a><a href="tel:+${CALL}">Call ${CALL_DISPLAY} <span><svg class="l-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 15 15 5M5 5h10v10"/></svg></span></a><a href="https://wa.me/919119076674" target="_blank" rel="noopener">WhatsApp <span><svg class="l-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 15 15 5M5 5h10v10"/></svg></span></a></nav>`;
  const searchToggle=$('.l-search-toggle'),menuToggle=$('.l-menu-toggle'),searchPanel=$('#l-search-panel'),menuPanel=$('#l-menu-panel');
  function closePanels(){searchPanel.hidden=true;menuPanel.hidden=true;searchToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Open menu')}
  searchToggle.addEventListener('click',()=>{const open=searchPanel.hidden;closePanels();searchPanel.hidden=!open;searchToggle.setAttribute('aria-expanded',String(open));if(open)$('#top-shop-search').focus()});
  menuToggle.addEventListener('click',()=>{const open=menuPanel.hidden;closePanels();menuPanel.hidden=!open;menuToggle.setAttribute('aria-expanded',String(open));menuToggle.setAttribute('aria-label',open?'Close menu':'Open menu');if(open)$('a',menuPanel)?.focus()});
  document.addEventListener('click',ev=>{if(!h.contains(ev.target))closePanels()});
  document.addEventListener('keydown',ev=>{if(ev.key==='Escape'){const trigger=!searchPanel.hidden?searchToggle:!menuPanel.hidden?menuToggle:null;closePanels();trigger?.focus()}});
  const page=document.body.dataset.page,active=page==='index'||page==='shop'?url.get('cat')||'':null;
  if(active!==null)$$('[data-home-cat]').forEach(link=>{if(page==='shop')link.dataset.cat=link.dataset.homeCat;if(link.dataset.homeCat===active)link.setAttribute('aria-current','true')});
 }
 const f=$('#site-footer');
 if(f){f.className='footer l-footer';f.innerHTML=`<div class="wrap"><div class="l-footer-top"><div class="l-footer-intro"><a class="l-logo" href="index.html" aria-label="Lustry Home"><img src="assets/lustry-wordmark.jpg" width="190" height="52" alt="Lustry"></a><p>Everyday apparel.<br>Thoughtful bags. Your brand.</p></div><div><h2>Explore</h2><a href="shop.html">The collection</a><a href="custom.html">Bulk manufacturing</a><a href="design.html">Design Studio</a></div><div><h2>Company</h2><a href="about.html">About Lustry</a><a href="clients.html">Collaborations</a><a href="gallery.html">Gallery</a></div><div><h2>Let’s talk</h2><a href="tel:+${CALL}">${CALL_DISPLAY}</a><a href="mailto:info@lustry.in">info@lustry.in</a><a href="https://wa.me/919119076674" target="_blank" rel="noopener">WhatsApp <svg class="l-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 15 15 5M5 5h10v10"/></svg></a><button type="button" data-open-lustry-chat aria-expanded="false" aria-controls="v8-chat-window">Quick answers <svg class="l-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 15 15 5M5 5h10v10"/></svg></button><a href="contact.html">Contact &amp; support</a></div></div><div class="l-footer-bottom"><span>© ${new Date().getFullYear()} Lustry</span><span>Reference catalogue. Prices &amp; availability require confirmation. Online checkout unavailable.</span></div></div>`}
 updateCartCount();
}
function homeCard(p,index){
 const link='product.html?id='+encodeURIComponent(p.id),image=referencePhotos[p.id]||p.fallback;
 return `<article class="product-card l-product"><a class="product-photo" href="${link}"><img src="${image}" alt="Reference image for ${esc(p.name)}" width="900" height="900" loading="${index<2?'eager':'lazy'}" ${index===0?'fetchpriority="high"':''}><span class="l-photo-label">Reference</span></a><div class="product-bottom"><div><a class="product-name" href="${link}">${esc(p.name.replace(/^The /,''))}</a><small>${esc(p.fabric.replace(/ • /g,' · '))}</small></div><a class="l-product-details" href="${link}" aria-label="View ${esc(p.name)}"><svg class="l-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 15 15 5M5 5h10v10"/></svg></a></div><a class="l-price-link" href="${link}">View details &amp; request price</a></article>`
}
function initHome(){
 const grid=$('#featured-grid'),styleFilters=$('#home-style-filters');if(!grid)return;
 let active=url.get('cat')||'',style=url.get('style')||'';
 const validStyles=new Set(['round-neck','polo','oversized','dryfit']);
 if(!Object.hasOwn(catNames,active))active='';if(active!=='tshirts'||!validStyles.has(style))style='';
 function render(){
  const order=['rn-sarina','bp-lap','hood-ft','bag-nw','polo-pq','os-tee','sweat-ft','rn-comb','polo-dry'];
  const products=order.filter(id=>active||['rn-sarina','polo-pq','hood-ft','sweat-ft'].includes(id)).map(id=>P.find(p=>p.id===id)).filter(p=>p&&(!active||p.cat===active)&&(!style||(style==='dryfit'?/dry[ -]?fit/i.test(p.fabric+' '+p.name+' '+p.spec):p.subcat===style)));
  grid.innerHTML=active==='merch'?`<div class="l-merch"><span class="l-eyebrow">CUSTOM MERCHANDISE</span><h2>A little more you.</h2><p>Notebooks, bottles, welcome kits and corporate gifts. Tell us what you have in mind; our team will confirm specifications and a quotation.</p><a class="l-button" href="custom.html?category=merch">Build a merchandise brief <svg class="l-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 15 15 5M5 5h10v10"/></svg></a><small>Custom manufacturing from 25 pieces.</small></div>`:products.map(homeCard).join('');
  $('#collection-title').textContent=active?catNames[active]:'The apparel edit';
  $('#collection-count').textContent=active==='merch'?'Made to your brief':products.length+' reference styles';
  $$('[data-home-cat]').forEach(link=>{if(link.dataset.homeCat===active)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current')});
  styleFilters.hidden=active!=='tshirts';
  $$('[data-home-discovery]').forEach(section=>section.hidden=Boolean(active));
  $$('[data-home-style]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.homeStyle===style))});
  const params=new URLSearchParams(location.search);if(active)params.set('cat',active);else params.delete('cat');if(style)params.set('style',style);else params.delete('style');
  try{history.replaceState(null,'',location.pathname+(params.size?'?'+params.toString():'')+location.hash)}catch{}
 }
 $$('[data-home-cat]').forEach(link=>link.addEventListener('click',ev=>{if(ev.ctrlKey||ev.metaKey||ev.shiftKey||ev.altKey||ev.button!==0)return;ev.preventDefault();active=link.dataset.homeCat;style='';render();link.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'})}));
 $$('[data-home-style]').forEach(b=>b.addEventListener('click',()=>{style=b.dataset.homeStyle;render()}));
 const bagsGrid=$('#bags-edit-grid');if(bagsGrid)bagsGrid.innerHTML=P.filter(p=>p.cat==='bags').map(homeCard).join('');
 render();
}
function initShop(){
 let active=url.get('cat')||'', style=url.get('style')||'', search=(url.get('q')||'').toLowerCase().trim(), sort='featured';
 const validStyles=new Set(['round-neck','polo','oversized','dryfit']);
 // Old Polo links remain usable; route them to the T-Shirts > Polo subcategory.
 if(active==='polos'){active='tshirts';style='polo'}
 if(!Object.hasOwn(catNames,active))active='';
 if(active!=='tshirts'||!validStyles.has(style))style='';
 const grid=$('#shop-grid'), subtype=$('#tshirt-subfilters');
 if($('#shop-search'))$('#shop-search').value=url.get('q')||'';
 function updateUrl(){
   const params=new URLSearchParams();
   if(active)params.set('cat',active);
   if(active==='tshirts'&&style)params.set('style',style);
   if(search)params.set('q',search);
   const next='shop.html'+(params.toString()?'?'+params.toString():'');
   try{history.replaceState(null,'',next)}catch(_e){/* file:// browser restrictions */}
 }
 function render(){
  const arr=P.filter(p=>{
   if(active && p.cat!==active)return false;
   if(active==='tshirts'&&style){
    if(style==='dryfit'){
     if(!/dry[ -]?fit/i.test(p.fabric+' '+p.name+' '+p.spec))return false;
    }else if(p.subcat!==style)return false;
   }
   return (p.name+' '+p.fabric+' '+p.spec).toLowerCase().includes(search);
  });
  if(sort==='az')arr.sort((a,b)=>a.name.localeCompare(b.name));
  if(sort==='low')arr.sort((a,b)=>(a.demo_price??Infinity)-(b.demo_price??Infinity));
  if(sort==='high')arr.sort((a,b)=>(b.demo_price??-1)-(a.demo_price??-1));
  grid.innerHTML=active==='merch'?`<div class="empty-state" style="grid-column:1/-1"><p class="eyebrow">MADE FOR YOUR ORGANISATION</p><h2>Merchandise with <em>your mark.</em></h2><p>Discuss pens, notebooks, bag tags, bottles and welcome kits with our team. Product specifications, branding feasibility and prices are confirmed in your quotation. Custom manufacturing starts at 25 pieces.</p><a class="btn btn-dark" href="custom.html?category=merch">Build a merchandise brief ↗</a></div>`:arr.length?arr.map(productCard).join(''):`<div class="empty-state" style="grid-column:1/-1"><h2>No matches yet.</h2><p>Try another category or keyword.</p><a class="btn btn-dark" href="custom.html">Custom enquiries ↗</a></div>`;
  $('#result-count').textContent=active==='merch'?'CUSTOM MERCHANDISE / QUOTATION ONLY':arr.length+' PIECES IN THE EDIT';
  $$('[data-cat]').forEach(b=>{const chosen=b.dataset.cat===active;b.classList.toggle('is-active',chosen);if(chosen)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current')});
  if(subtype){subtype.hidden=active!=='tshirts';$$('[data-style]',subtype).forEach(b=>{const chosen=b.dataset.style===style;b.classList.toggle('is-active',chosen);b.setAttribute('aria-pressed',String(chosen))})}
 }
 $$('[data-cat]').forEach(b=>b.addEventListener('click',ev=>{if(ev.ctrlKey||ev.metaKey||ev.shiftKey||ev.altKey||ev.button!==0)return;ev.preventDefault();active=b.dataset.cat;style='';updateUrl();render()}));
 if(subtype)$$('[data-style]',subtype).forEach(b=>b.addEventListener('click',()=>{style=b.dataset.style;updateUrl();render()}));
 $('#shop-search').addEventListener('input',e=>{search=e.target.value.trim().toLowerCase();updateUrl();render()});
 $('#shop-sort').addEventListener('change',e=>{sort=e.target.value;render()});
 updateUrl();render();
}
function initProduct(){const p=P.find(x=>x.id===url.get('id'));const e=$('#product-detail');if(!p){e.innerHTML=`<div class="empty-state"><h2>Piece not found.</h2><a href="shop.html" class="btn btn-dark">Return to collection ↗</a></div>`;return;}document.title=p.name+' | Lustry';let color=p.colors[0],size=p.sizes[0],quantity=1;const studioProduct=p.cat==='tshirts'?'tee':p.id==='bag-nw'?'tote':p.cat==='bags'?'backpack':'';const colorMap={Forest:'#214636',Ivory:'#eee9de',Charcoal:'#454545',Black:'#202020',Navy:'#253653',Stone:'#b8b5a5'};
 function render(){e.innerHTML=`<div class="product-page"><div class="detail-image">${productImage(p)}<span class="product-tag">ILLUSTRATIVE IMAGE</span></div><div class="detail-info"><div class="breadcrumb"><a href="index.html">Home</a> / <a href="shop.html?cat=${p.cat}">${catNames[p.cat]}</a> / ${esc(p.name)}</div><p class="eyebrow">THE COLLECTION / PRODUCT PREVIEW</p><h1>${esc(p.name)}</h1><p class="detail-sub">${esc(p.fabric)} · ${esc(p.spec)}</p><div class="detail-price">${p.demo_price==null?'Request price':money(p.demo_price)} ${p.demo_price==null?'':'<small>DEMO / NOT FINAL</small>'}</div><div class="notice">This is a design demonstration. Product colour, sizes, price and stock are not confirmed. Cart is a preview only, with no checkout or payment.</div><div class="detail-option"><strong>Colour: ${esc(color)}</strong><div class="swatches">${p.colors.map(c=>`<button type="button" class="swatch ${c===color?'selected':''}" aria-label="Select ${esc(c)}" title="${esc(c)}" aria-pressed="${c===color}" data-colour="${esc(c)}"><span style="background:${colorMap[c]||'#999'}"></span></button>`).join('')}</div></div><div class="detail-option"><strong>Size</strong><div class="sizes">${p.sizes.map(s=>`<button type="button" class="size-btn ${s===size?'selected':''}" aria-pressed="${s===size}" data-size="${esc(s)}">${esc(s)}</button>`).join('')}</div></div><div class="detail-option"><strong>Quantity</strong><input type="number" id="product-qty" aria-label="Quantity" min="1" max="500" step="1" value="${esc(quantity)}"></div><div class="detail-actions">${p.demo_price!=null?`<button id="add-demo-cart" type="button" class="btn btn-dark">Add to demo bag <span>↗</span></button>`:''}<a href="custom.html?product=${encodeURIComponent(p.id)}" class="btn btn-outline">Need bulk 25+? ↗</a></div>${studioProduct?`<p><a class="text-link" href="design.html?product=${studioProduct}">Preview your branding in the Design Studio ↗</a></p>`:''}<p class="detail-note">No retail order or payment is created. For actual retail availability please contact Lustry.</p><a class="text-link" style="margin-top:15px" href="https://wa.me/919119076674" target="_blank" rel="noopener">Ask about availability ↗</a></div></div>`;
 $$('[data-colour]',e).forEach(b=>b.addEventListener('click',()=>{color=b.dataset.colour;render();$$('[data-colour]',e).find(x=>x.dataset.colour===color)?.focus()}));$$('[data-size]',e).forEach(b=>b.addEventListener('click',()=>{size=b.dataset.size;render();$$('[data-size]',e).find(x=>x.dataset.size===size)?.focus()}));$('#product-qty').addEventListener('input',ev=>{quantity=ev.target.value});$('#add-demo-cart')?.addEventListener('click',()=>{const raw=Number($('#product-qty').value);if(!Number.isInteger(raw)||raw<1||raw>500){toast('Select a quantity between 1 and 500.');return}const rows=store.read(),key=[p.id,color,size].join('|'),line=rows.find(r=>r.key===key);if(line)line.quantity=Math.min(500,line.quantity+raw);else rows.push({key,id:p.id,color,size,quantity:raw});if(store.write(rows))toast('Added to demo bag — no order placed.')});}render();$('#related-grid').innerHTML=P.filter(x=>x.id!==p.id&&(x.cat===p.cat)).slice(0,4).concat(P.filter(x=>x.id!==p.id&&x.cat!==p.cat).slice(0,4)).slice(0,4).map(productCard).join('')}
function initCart(){const e=$('#cart-items'),sum=$('#cart-summary');function render(){const cart=store.read().filter(x=>P.some(p=>p.id===x.id)&&Number.isInteger(+x.quantity)&&+x.quantity>0);if(cart.length!==store.read().length)store.write(cart);if(!cart.length){e.innerHTML='<div class="empty-state"><span>↗</span><h2>Your bag is empty.</h2><p>Explore our collection and build a demo selection.</p><a class="btn btn-dark" href="shop.html">Explore the edit ↗</a></div>';sum.innerHTML='<h3>Nothing in your bag.</h3><p>Retail checkout is not connected. Explore products or submit a bulk manufacturing enquiry.</p><a class="text-link" href="custom.html">Custom manufacturing ↗</a>';return}let total=0;e.innerHTML=cart.map((line,i)=>{const p=P.find(p=>p.id===line.id);total+=(p.demo_price||0)*line.quantity;return `<div class="cart-row">${productImage(p)}<div><h3>${esc(p.name)}</h3><p>${esc(line.color)} / ${esc(line.size)}</p><div class="cart-controls"><label class="sr-only" for="cart-qty-${i}">Quantity for ${esc(p.name)}</label><input type="number" min="1" max="500" step="1" value="${line.quantity}" id="cart-qty-${i}" data-q="${i}"> <button data-remove="${i}" type="button">Remove</button></div></div><div class="product-price">${money((p.demo_price||0)*line.quantity)}<small>Demo total</small></div></div>`}).join('');sum.innerHTML=`<h3>Bag summary</h3><div class="cart-line"><span>Items</span><b>${cart.reduce((n,x)=>n+x.quantity,0)}</b></div><div class="cart-line"><span>Illustrative subtotal</span><strong>${money(total)}</strong></div><p>Product prices are not approved. Shipping, taxes and stock availability are not calculated. No payment is collected.</p><button class="btn btn-dark" disabled aria-disabled="true">Checkout not yet available</button><a class="text-link" href="shop.html" style="margin-top:27px">Continue exploring ↗</a>`;$$('[data-q]').forEach(inp=>inp.addEventListener('change',()=>{const n=Number(inp.value);if(!Number.isInteger(n)||n<1||n>500){toast('Use quantity 1–500.');render();return}const rows=store.read();rows[Number(inp.dataset.q)].quantity=n;store.write(rows);render()}));$$('[data-remove]').forEach(b=>b.addEventListener('click',()=>{const rows=store.read();rows.splice(Number(b.dataset.remove),1);store.write(rows);render()}));}render()}
const options={
 apparel:{label:'T-shirts',styles:['Round Neck T-Shirt','Polo T-Shirt','Oversized T-Shirt','Dry-Fit T-Shirt'],fabrics:['Sarina','Cotton Matty','Polyester','Knitted Polyester','Dry Fit','Dot Net','Combed Cotton','Bio-washed Cotton','Polyester-Cotton (PC)','Cotton Pique','PC Pique','Double Pique','Cotton Interlock'],gsm:['90','120','140','160','180','200','220','240'],brand:['none','Screen printing','DTF','DTG','Embroidery','Sublimation'],db:'T-shirts',key:'tee'},
 hoodies:{label:'Hoodies & sweatshirts',styles:['Pullover Hoodie','Zip-up Hoodie','Crewneck Sweatshirt'],fabrics:['French Terry','Fleece','Cotton Blend'],gsm:['240','280','300','320','350','400'],brand:['none','Screen printing','DTF','Embroidery'],db:'Hoodies & sweatshirts',key:'hoodie'},
 bags:{label:'Bags & backpacks',styles:['Non-woven Bag','Cotton Tote Bag','Canvas Tote Bag','Pittu Bag','Laptop Backpack','Laptop Sleeve','School Backpack','Institute Bag','Seminar Bag','Corporate Bag'],fabrics:['Non-woven','Polyester','Cotton','Canvas','210D Polyester','Oxford','Mesh','Padded polyester','Twill'],gsm:[],brand:['none','Screen printing','DTF','Embroidery'],db:'Bags & backpacks',key:'backpack'},
 merch:{label:'Corporate merchandise',styles:['Pens','Bag tags','Notebooks','Water bottles','Welcome kits','Other corporate gifts'],fabrics:['Standard (confirm with team)'],gsm:[],brand:['none','Screen printing','Embroidery (where suitable)','Other branding (confirm)'],db:'Corporate merchandise',key:'merch'}
};
function discount(q){return q>=500?25:q>=200?20:q>=100?5:0}
function setOptions(e,items,placeholder){e.innerHTML='<option value="">'+esc(placeholder)+'</option>'+items.map(v=>`<option value="${esc(v)}">${esc(v==='none'?'No branding':v)}</option>`).join('');e.disabled=!items.length; if(items.length)e.selectedIndex=1}
function initCustom(){const form=$('#custom-form'),cat=$('#q-category'),style=$('#q-style'),fabric=$('#q-fabric'),gsm=$('#q-gsm'),brand=$('#q-branding'),qty=$('#q-qty'),submit=$('#custom-submit'),out=$('#enquiry-response');let quoteRow=null,seq=0,busy=false;
const supabaseURL=String(CFG.supabaseUrl||'').replace(/\/$/,''),pub=CFG.sb_publishable||CFG.supabaseAnonKey||'';
const textSet=(id,t)=>{$('#'+id).textContent=t};
function syncFields(){const o=options[cat.value];setOptions(style,o.styles,'Select style');setOptions(fabric,o.fabrics,'Select material');setOptions(gsm,o.gsm,'Not applicable');setOptions(brand,o.brand,'Select branding');lookup()}
function estimate(){const n=Number(qty.value),d=discount(n);textSet('sum-product',style.value||options[cat.value].label);textSet('sum-qty',Number.isFinite(n)?n+' pieces':'—');textSet('sum-discount',d+'%');if(!Number.isInteger(n)||n<25||n>100000){textSet('sum-estimate','Minimum 25 pieces');textSet('sum-description','Enter a whole quantity between 25 and 100,000.');return}if(!quoteRow){textSet('sum-estimate','Request Price');textSet('sum-description','A verified fabric/GSM-specific estimate is unavailable. Submit your enquiry for a team-reviewed quotation.');return}const v=(Number(quoteRow.base_price)+(brand.value==='none'?0:Number(quoteRow.branding_cost)))*n*(1-d/100);textSet('sum-estimate',money(Math.round(v)));textSet('sum-description','Category-level indicative estimate from the existing Supabase price table. NOT verified for your selected fabric, GSM, colour or branding method. Final price requires approval.');}
async function lookup(){const id=++seq;quoteRow=null;estimate();if(!supabaseURL||!pub){textSet('sum-description','Supabase public configuration missing. Enquiries cannot be submitted until configured.');return}try{const params=new URLSearchParams({select:'product_type,base_price,branding_cost,fabric,gsm',product_type:'eq.'+options[cat.value].db,active:'eq.true',limit:'1'});const response=await fetch(supabaseURL+'/rest/v1/product_prices?'+params.toString(),{headers:{apikey:pub,Authorization:'Bearer '+pub}});if(!response.ok)throw Error('Cannot load configured pricing');const rows=await response.json();if(id!==seq)return;const row=Array.isArray(rows)?rows[0]:null;if(row&&validPrice(row.base_price)&&Number(row.base_price)>0&&validPrice(row.branding_cost))quoteRow=row;estimate()}catch(e){if(id===seq){quoteRow=null;estimate();textSet('sum-description','Pricing data could not be loaded right now. You may still submit your enquiry for a final quote.')}}}
cat.addEventListener('change',syncFields);style.addEventListener('change',estimate);qty.addEventListener('input',estimate);brand.addEventListener('change',estimate);fabric.addEventListener('change',estimate);gsm.addEventListener('change',estimate);syncFields();prefillBrief();
function prefillBrief(){
 const requestedCategory=url.get('category');
 if(Object.hasOwn(options,requestedCategory||'')){cat.value=requestedCategory;syncFields()}
 const product=P.find(p=>p.id===url.get('product'));
 if(product){
  cat.value=product.cat==='tshirts'?'apparel':product.cat==='hoodies'?'hoodies':'bags';syncFields();
  const styles={'round-neck':'Round Neck T-Shirt',polo:'Polo T-Shirt',oversized:'Oversized T-Shirt',dryfit:'Dry-Fit T-Shirt'};
  if(product.subcat&&styles[product.subcat])style.value=styles[product.subcat];
  form.elements.namedItem('design').value='Catalogue reference: '+product.name+'. Please confirm fabric, sizes, colours, availability and final pricing.';estimate();
 }
 if(url.get('source')!=='studio')return;
 try{
  const brief=JSON.parse(sessionStorage.getItem('lustry_studio_brief_v1')||'null');
  if(!brief||brief.version!==1||!['apparel','bags'].includes(brief.category))return;
  const age=Date.now()-Date.parse(brief.createdAt);if(!Number.isFinite(age)||age<0||age>7*86400000)return;
  cat.value=brief.category;syncFields();
  for(const [element,value] of [[style,brief.style],[fabric,brief.fabric],[gsm,brief.gsm]]){
   if(element.disabled||typeof value!=='string'||!value.trim())continue;
   const clean=value.trim().slice(0,100);
   if(!Array.from(element.options).some(o=>o.value===clean))element.add(new Option(clean+' (confirm with team)',clean));
   element.value=clean;
  }
  form.elements.namedItem('color').value=String(brief.color||'').slice(0,160);
  form.elements.namedItem('placement').value=String(brief.placement||'').slice(0,160);
  const text=typeof brief.design==='string'?brief.design.slice(0,2000):'';
  form.elements.namedItem('design').value=text||'Studio concept only; artwork was not uploaded. Final artwork and specifications require Lustry approval.';
  const notice=document.createElement('p');notice.id='studio-brief-notice';notice.className='note-soft';notice.setAttribute('role','status');notice.textContent='Your Design Studio brief has been added. Review the specifications below. Logo/reference files remain on your device and are not attached to this enquiry.';
  form.querySelector('.form-main').prepend(notice);estimate();
 }catch{/* Storage may be disabled or the saved brief may be invalid. The enquiry form stays usable. */}
}
form.addEventListener('submit',async ev=>{ev.preventDefault();if(busy)return;out.textContent='';out.className='response';if(!form.reportValidity())return;const n=Number(qty.value);if(!Number.isInteger(n)||n<25||n>100000){out.textContent='Quantity must be between 25 and 100,000.';out.classList.add('error');return}if(!$('#q-consent').checked){out.textContent='Please agree to be contacted about your enquiry.';out.classList.add('error');return}if(!supabaseURL||!pub){out.textContent='Backend configuration is missing. No enquiry has been submitted.';out.classList.add('error');return}
const d=Object.fromEntries(new FormData(form).entries()),o=options[cat.value];if(!String(d.name||'').trim()){out.textContent='Please enter your name.';out.classList.add('error');return}let sizes={};const sizeText=String(d.sizes||'').trim();
if(sizeText){
 let sizeTotal=0;for(const part of sizeText.split(/[,;\n]+/)){
  const match=part.trim().match(/^([a-z0-9][a-z0-9 \/-]{0,25})\s*[:=]\s*(\d+)$/i);
  if(!match){out.textContent='Use size quantities like S: 10, M: 15. Their total must match your order quantity.';out.classList.add('error');return}
  const label=match[1].trim().toUpperCase(),count=Number(match[2]);
  if(Object.hasOwn(sizes,label)||!Number.isInteger(count)||count<1||count>100000){out.textContent='Enter each size once with a whole quantity greater than zero.';out.classList.add('error');return}
  sizes[label]=count;sizeTotal+=count;
 }
 if(sizeTotal!==n){out.textContent='Size quantities total '+sizeTotal+'; order quantity is '+n+'. Please make them match.';out.classList.add('error');return}
}
const payload={customer:{name:d.name,email:d.email,phone:d.phone,company:d.company},order:{product:o.key,style:d.style,fabric:d.fabric,gsm:d.gsm||'',branding:d.branding==='none'?'none':d.branding,brandingLabel:d.branding,quantity:n,placement:d.placement,color:d.color,sizes,needBy:d.needBy,design:d.design},consent:true};
busy=true;submit.disabled=true;submit.textContent='Submitting your enquiry…';try{const api=(CFG.submitOrderFunction||'submit-order');const res=await fetch(supabaseURL+'/functions/v1/'+encodeURIComponent(api),{method:'POST',headers:{'Content-Type':'application/json',apikey:pub,Authorization:'Bearer '+pub},body:JSON.stringify(payload),signal:AbortSignal.timeout(25000)});let data={};try{data=await res.json()}catch{}if(!res.ok||data.success!==true||!data.reference)throw Error(data.error||'Server did not confirm the saved enquiry');out.classList.add('ok');out.textContent='Your manufacturing enquiry has been received. Enquiry ID: '+data.reference+'. Server estimate: '+(validPrice(data.estimatedTotal)?money(data.estimatedTotal):'Not available')+'. Our customer executive will connect with you shortly. Final quotation is pending Lustry approval.';form.reset();try{sessionStorage.removeItem('lustry_studio_brief_v1')}catch{}$('#studio-brief-notice')?.remove();syncFields();out.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){out.classList.add('error');out.textContent='Your enquiry was NOT confirmed as saved. '+(e instanceof TypeError?'Network connection or CORS may be blocking submission.':'Error: '+String(e.message||'Please retry.'))+' Please contact support before retrying if the connection was interrupted.'}finally{busy=false;submit.disabled=false;submit.innerHTML='Submit manufacturing enquiry <span>↗</span>'}})
}
common();const page=document.body.dataset.page;
if(page==='index')initHome();else if(page==='shop')initShop();else if(page==='product')initProduct();else if(page==='cart')initCart();else if(page==='custom')initCustom();
})();
