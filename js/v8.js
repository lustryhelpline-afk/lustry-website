/* Lustry V8: chat assistant + bulk callback popup. AI replies only come from the ai-support Edge Function; otherwise it is a labelled FAQ helper. */
(()=>{'use strict';const C=window.LUSTRY_CONFIG||{},base=(C.supabaseUrl||'').replace(/\/$/,''),key=C.sb_publishable,wa=C.whatsappNumber||'919119076674',phone=String(C.callingNumber||'919267373084').replace(/\D/g,''),phoneLabel='+91 '+phone.slice(-10,-5)+' '+phone.slice(-5),$=(s,r=document)=>r.querySelector(s);
const call=async(fn,body)=>{if(!base||!key)throw Error('not configured');const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);try{const r=await fetch(base+'/functions/v1/'+encodeURIComponent(fn),{method:'POST',headers:{'Content-Type':'application/json',apikey:key,Authorization:'Bearer '+key},body:JSON.stringify(body),signal:controller.signal});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error('Request could not be confirmed');return d}finally{clearTimeout(timer)}};
// ---- FAQ fallback (verified facts only)
const FAQ=[[/moq|minimum|kam se kam|least/i,'Custom manufacturing starts at 25 pieces. Selected ready-stock items may be available from 1 piece; availability is confirmed per product.'],[/discount|slab|bulk|offer|chhoot/i,'Bulk discounts: 25–99 pcs 0%, 100–199 pcs 5%, 200–499 pcs 20%, 500+ pcs 25%. Final price is confirmed in your Lustry quotation.'],[/print|embroid|dtf|dtg|sublim|brand|logo/i,'Branding options: screen printing, DTF, DTG (where compatible), embroidery and sublimation (where compatible). Lustry confirms the best method for your fabric and artwork.'],[/fabric|gsm|cotton|polyester|material|sarina|terry/i,'We work with fabrics like Sarina, combed cotton, polyester, dry fit, pique and French Terry for apparel, and bag materials like 210D polyester, Oxford and non-woven. Exact availability is confirmed per order.'],[/estimate|quote|quotation|price|rate|kitna|cost/i,'Prices shown online are indicative. Submit the custom enquiry and the Lustry team will confirm the final quotation.'],[/contact|call|phone|email|whatsapp|number/i,'Call: +91 92673 73084 · WhatsApp: +91 91190 76674 · Email: info@lustry.in']];
const NOTE='I do not have confirmed details on that. The Lustry team can confirm on a call at +91 92673 73084, WhatsApp +91 91190 76674 or via the custom enquiry form.';
// ---- chat
const w=document.createElement('div');w.className='v8-chat';w.innerHTML=`<div class="v8-win" id="v8-chat-window" role="dialog" aria-label="Lustry assistant" aria-hidden="true"><div class="v8-h"><div><b>Lustry Assistant</b><small id="v8s">Quick answers · team confirms final details</small></div><button type="button" aria-label="Close chat">×</button></div><div class="v8-m" id="v8m" aria-live="polite"></div><div class="v8-n">Do not share passwords or payment details here.</div><form class="v8-f"><input id="v8i" maxlength="300" placeholder="Ask about bulk orders, fabrics…" aria-label="Your message" autocomplete="off"><button>Send</button></form></div>`;document.body.append(w);
const win=$('.v8-win',w),m=$('#v8m'),inp=$('#v8i'),sendButton=$('.v8-f button',w),hist=[];let ai=null,chatBusy=false,chatTrigger=null;
const add=(t,c)=>{const d=document.createElement('div');d.className='v8-b '+c;d.textContent=t;m.append(d);m.scrollTop=m.scrollHeight;return d};
const chips=()=>{const q=document.createElement('div');q.className='v8-q';[['Minimum order?','What is the minimum order?'],['Bulk discounts','Bulk discount slabs?'],['Branding methods','Which branding options do you offer?'],['Talk to team','Contact details']].forEach(([a,b])=>{const x=document.createElement('button');x.type='button';x.textContent=a;x.onclick=()=>{if(chatBusy)return;q.remove();send(b)};q.append(x)});m.append(q)};
function openChat(trigger){if(trigger instanceof HTMLElement)chatTrigger=trigger;else if(!win.classList.contains('on'))chatTrigger=document.activeElement;win.classList.add('on');win.setAttribute('aria-hidden','false');document.querySelectorAll('[data-open-lustry-chat]').forEach(t=>{t.setAttribute('aria-controls','v8-chat-window');t.setAttribute('aria-expanded','true')});if(!m.children.length){add('Hi! Ask me about custom orders, fabrics or branding. You can also ask in Hindi.','bot');chips()}inp.focus()}
function closeChat(restoreFocus=true){const wasOpen=win.classList.contains('on');win.classList.remove('on');win.setAttribute('aria-hidden','true');document.querySelectorAll('[data-open-lustry-chat]').forEach(t=>t.setAttribute('aria-expanded','false'));if(wasOpen&&restoreFocus&&chatTrigger?.isConnected)chatTrigger.focus()}
window.LustryChat=()=>openChat();
document.addEventListener('click',e=>{const trigger=e.target.closest('[data-open-lustry-chat]');if(trigger){e.preventDefault();openChat(trigger)}});
$('.v8-h button',w).onclick=()=>closeChat();addEventListener('keydown',e=>{if(e.key==='Escape')closeChat()});
async function send(text){
 const t=String(text).trim().slice(0,300);if(!t||chatBusy)return;
 chatBusy=true;sendButton.disabled=true;win.setAttribute('aria-busy','true');
 add(t,'me');hist.push({role:'user',content:t});const bubble=add('…','bot');let out='';
 try{
  if(ai!==false){try{const d=await call(C.aiSupportFunction||'ai-support',{messages:hist.slice(-8)});if(typeof d.reply==='string'&&d.reply.trim()){out=d.reply.trim();ai=true;$('#v8s').textContent='AI assistant · team confirms final details'}else{throw Error('Empty reply')}}catch(e){if(ai===null)ai=false;$('#v8s').textContent='Quick answers · team confirms final details'}}
  if(!out){const f=FAQ.find(x=>x[0].test(t));out=f?f[1]:NOTE;$('#v8s').textContent='Quick answers · team confirms final details'}
  bubble.textContent=out;hist.push({role:'assistant',content:out});if(hist.length>16)hist.splice(0,hist.length-16);m.scrollTop=m.scrollHeight;
  if(out===NOTE){const a=document.createElement('a');a.href='https://wa.me/'+wa;a.target='_blank';a.rel='noopener';a.textContent='Open WhatsApp ↗';a.style.cssText='display:inline-block;margin-top:6px;color:#86672f;font-weight:700';bubble.append(document.createElement('br'),a)}
 }finally{chatBusy=false;sendButton.disabled=false;win.setAttribute('aria-busy','false')}
}
$('.v8-f',w).onsubmit=e=>{e.preventDefault();const t=inp.value.trim();if(!t||chatBusy)return;inp.value='';send(t)};
// ---- bulk callback popup
const pop=document.createElement('dialog');pop.className='v8-pop';pop.setAttribute('aria-label','Bulk order callback');
pop.innerHTML=`<button class="v8-x2" aria-label="Close" type="button">×</button><div class="v8-pb"><div class="v8-k">BULK ORDERS · 25+ PIECES</div><h3>Planning a bulk order? <em>Talk to us.</em></h3><p style="margin:0;color:#6c6b68;font-size:.92rem">Get a call from the Lustry team, or reach us right now.</p><form id="v8f" novalidate><input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><label for="v8n">Name</label><input id="v8n" name="name" required maxlength="100" autocomplete="name"><label for="v8p">Mobile number</label><input id="v8p" name="phone" maxlength="25" type="tel" inputmode="tel" required autocomplete="tel" placeholder="10-digit mobile"><label for="v8q">Approx. quantity (optional)</label><input id="v8q" name="quantity" type="number" min="1" max="100000" step="1"><label style="display:flex;gap:8px;font-weight:500"><input id="v8c" type="checkbox" style="width:auto"> I agree to be contacted by Lustry about my enquiry.</label><div class="v8-act"><button class="p" id="v8b" type="submit">Request a call</button><a class="v8-direct-popup-call" href="tel:+${phone}">☎ Call ${phoneLabel}</a><a href="https://wa.me/${wa}" target="_blank" rel="noopener">WhatsApp</a></div><div class="v8-ms" id="v8o" aria-live="polite"></div></form></div>`;document.body.append(pop);
// Callback opens only on an explicit request, so browsing stays uninterrupted.
const showPop=()=>{
 if(pop.open||typeof pop.showModal!=='function')return;
 try{closeChat(false);pop.showModal();}catch(e){console.warn('Unable to open callback dialog',e)}
};
window.LustryBulkPopup=showPop;
document.addEventListener('click',e=>{if(e.target.closest('[data-open-bulk-popup]')){e.preventDefault();showPop()}});
pop.addEventListener('click',e=>{if(e.target===pop)pop.close()});$('.v8-x2',pop).onclick=()=>pop.close();
if(new URLSearchParams(location.search).get('popup')==='1')setTimeout(showPop,100);
let callbackBusy=false,callbackRequestId=null,callbackSignature='';
$('#v8f').onsubmit=async e=>{
 e.preventDefault();if(callbackBusy)return;
 const f=e.target,o=$('#v8o'),b=$('#v8b');o.className='v8-ms';
 const fd=Object.fromEntries(new FormData(f));
 if(!fd.name.trim()||fd.name.trim().length>100||!/^(\+?91)?[6-9]\d{9}$/.test(fd.phone.replace(/[^\d+]/g,''))){o.classList.add('er');o.textContent='Please enter your name and a valid 10-digit mobile number.';return}
 const rawQuantity=String(fd.quantity||'').trim(),quantity=Number(rawQuantity);
 if(rawQuantity&&(!Number.isInteger(quantity)||quantity<1||quantity>100000)){o.classList.add('er');o.textContent='Please enter a whole quantity between 1 and 100,000, or leave it blank.';return}
 if(!$('#v8c').checked){o.classList.add('er');o.textContent='Please tick the consent box.';return}
 const signature=JSON.stringify([fd.name.trim(),'+91'+fd.phone.replace(/\D/g,'').slice(-10),rawQuantity?quantity:null]);
 if(signature!==callbackSignature){callbackSignature=signature;callbackRequestId=globalThis.crypto?.randomUUID?.()||null}
 callbackBusy=true;b.disabled=true;f.setAttribute('aria-busy','true');o.textContent='Sending…';
 try{const d=await call(C.callbackFunction||'callback-request',{name:fd.name,phone:fd.phone,quantity:fd.quantity||null,website:fd.website,consent:true,source:'popup',...(callbackRequestId?{requestId:callbackRequestId}:{})});if(d.success!==true||typeof d.reference!=='string'||!d.reference.trim())throw Error('Unconfirmed save');o.classList.add('ok');o.textContent='Thank you! Your callback request has been saved. Reference: '+d.reference+'. Our team will review your request.';f.reset();callbackRequestId=null;callbackSignature=''}
 catch(x){o.classList.add('er');o.textContent=x.name==='AbortError'?'We could not confirm your request in time. Please contact us on WhatsApp or Call now before submitting again.':'We could not confirm your request. Please tap WhatsApp or Call now before submitting again.'}
 finally{callbackBusy=false;b.disabled=false;f.setAttribute('aria-busy','false')}
};
})();
