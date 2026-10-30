// Lustry V5: progressive product photography with reliable local mockup fallback.
(function(){'use strict';
 const loaded=new Set();
 function upgrade(){
  document.querySelectorAll('img[data-stock-src]').forEach(img=>{
   const remote=img.getAttribute('data-stock-src');
   if(!remote || !/^https:\/\//.test(remote) || img.dataset.queued) return;
   img.dataset.queued='1';
   if(loaded.has(remote)){img.src=remote;return;}
   const image=new Image();
   image.onload=()=>{loaded.add(remote);if(img.isConnected)img.src=remote;};
   image.onerror=()=>{/* keep the bundled SVG if external stock photo is unavailable */};
   image.src=remote;
  });
 }
 upgrade();
 const observer=new MutationObserver(upgrade);
 observer.observe(document.body,{childList:true,subtree:true});
})();
