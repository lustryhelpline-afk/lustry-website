/* Lustry Luxe V6 — progressive animation; content remains visible when JavaScript is unavailable. */
(()=>{'use strict';
const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduce&&'IntersectionObserver' in window){
 const candidates=document.querySelectorAll('.v5-section-head,.v5-cat-card,.v5-business-card,.v5-bulk-copy,.v5-bulk-visual,.v5-material-card,.v5-process-grid>div,.v5-faq-items,.v5-final-inner,.product-card,.page-hero-inner,.v5-shop-help');
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}},{threshold:.07,rootMargin:'0px 0px -24px 0px'});
 candidates.forEach(el=>{el.classList.add('v6-reveal');observer.observe(el)});
 // newly inserted cards (shop filter, recommended products) animate with reduced layout work
 const gridObserver=new MutationObserver(records=>{for(const record of records){for(const node of record.addedNodes){if(!(node instanceof Element))continue;const cards=node.matches('.product-card')?[node]:Array.from(node.querySelectorAll('.product-card'));for(const card of cards){card.classList.add('v6-reveal');observer.observe(card)}}}});
 document.querySelectorAll('#featured-grid,#shop-grid,#related-grid').forEach(el=>gridObserver.observe(el,{childList:true,subtree:false}));
}
})();
