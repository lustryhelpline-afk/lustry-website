/* Lustry Design Studio: browser-only illustrative mockups. No AI or file upload requests. */
(() => {
  'use strict';
  const form = document.getElementById('studio-form');
  if (!form) return;
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const specs = {
    tee: { label: 'T-Shirt', fabrics: ['Combed Cotton', 'Polyester', 'Cotton Pique', 'Dry Fit', 'Other — discuss with team'], gsm: ['140', '160', '180', '200', '220', '240', 'Confirm with team'], defaultGsm: '180', category: 'apparel', printable: { x: 250, y: 286, w: 182, h: 210 } },
    tote: { label: 'Tote Bag', fabrics: ['Cotton', 'Canvas', 'Non-woven', 'Other — discuss with team'], gsm: ['140', '180', '220', 'Confirm with team'], defaultGsm: '180', category: 'bags', printable: { x: 250, y: 320, w: 194, h: 190 } },
    backpack: { label: 'Backpack', fabrics: ['210D Polyester', 'Oxford', 'Padded polyester', 'Other — discuss with team'], gsm: ['Not applicable — confirm material specification'], defaultGsm: 'Not applicable — confirm material specification', category: 'bags', printable: { x: 250, y: 322, w: 156, h: 114 } }
  };
  const controls = { product: $('studio-product'), style: $('studio-style'), fabric: $('studio-fabric'), gsm: $('studio-gsm'), color: $('studio-color'), side: $('studio-side'), text: $('studio-text'), textColor: $('studio-text-color'), scale: $('studio-scale'), x: $('studio-x'), y: $('studio-y'), prompt: $('studio-prompt') };
  const shape = $('studio-product-shape'), previewLogo = $('studio-logo-preview'), previewText = $('studio-text-preview');
  let logoURL = null, filename = null, fileSequence = 0, colourName = 'Navy';
  function svg(tag, attrs, parent = shape) {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value)));
    parent.appendChild(el);
    return el;
  }
  function fillSelect(select, values, selected) {
    select.replaceChildren(...values.map(value => {
      const option = document.createElement('option');
      option.value = value; option.textContent = value;
      option.selected = value === selected;
      return option;
    }));
  }
  function currentSpec() { return specs[controls.product.value] || specs.tee; }
  function syncProduct() {
    const spec = currentSpec();
    fillSelect(controls.fabric, spec.fabrics, spec.fabrics[0]);
    fillSelect(controls.gsm, spec.gsm, spec.defaultGsm);
    $('studio-style-field').hidden = controls.product.value !== 'tee';
    controls.style.disabled = controls.product.value !== 'tee';
    controls.x.value = '0'; controls.y.value = '-20';
    render();
  }
  function renderShape() {
    shape.replaceChildren();
    const product = controls.product.value, back = controls.side.value === 'back';
    const color = controls.color.value;
    const path = (d, attrs = {}) => svg('path', { d, ...attrs });
    const surface = (d, attrs = {}) => {
      path(d, { fill: color, stroke: '#172029', 'stroke-opacity': '.2', 'stroke-width': 1.5, ...attrs });
      path(d, { fill: 'url(#studio-shading)', 'pointer-events': 'none' });
    };
    if (product === 'tee') {
      const oversized = controls.style.value.includes('Oversized');
      const d = oversized ? 'M197 102 Q250 120 303 102 L371 139 L424 240 L356 273 L342 236 L346 458 Q250 472 154 458 L158 236 L144 273 L76 240 L129 139 Z' : 'M202 104 Q250 120 298 104 L357 138 L404 220 L349 249 L331 217 L336 449 Q250 462 164 449 L169 217 L151 249 L96 220 L143 138 Z';
      surface(d);
      path(back ? 'M207 106 Q250 131 293 106' : 'M202 104 Q211 153 250 155 Q289 153 298 104', { fill: back ? 'none' : '#000', 'fill-opacity': '.13', stroke: '#fff', 'stroke-opacity': '.2', 'stroke-width': 4 });
      path('M176 430 Q250 441 324 430', { fill: 'none', stroke: '#fff', 'stroke-opacity': '.12', 'stroke-width': 2 });
      path('M171 224 L179 414 M329 224 L321 414', { fill: 'none', stroke: '#000', 'stroke-opacity': '.08', 'stroke-width': 3 });
      if (controls.style.value.includes('Polo') && !back) {
        path('M202 104 L228 133 L246 120 L223 100 Z M298 104 L272 133 L254 120 L277 100 Z', { fill: color, stroke: '#fff', 'stroke-opacity': '.24', 'stroke-width': 2 });
        path('M246 125 L246 183 L257 183 L257 125', { fill: '#000', 'fill-opacity': '.12', stroke: '#fff', 'stroke-opacity': '.16' });
        [140, 160, 178].forEach(cy => svg('circle', { cx: 251, cy, r: 2, fill: '#d5ceb9' }));
      }
    } else if (product === 'tote') {
      path('M180 211 L180 123 Q180 75 218 75 L282 75 Q320 75 320 123 L320 211 M200 211 L200 128 Q200 99 224 99 L276 99 Q300 99 300 128 L300 211', { fill: color, 'fill-rule': 'evenodd', stroke: '#172029', 'stroke-opacity': '.25', 'stroke-width': 2 });
      surface('M126 190 L374 190 L386 454 Q250 476 114 454 Z');
      path('M138 205 L362 205 M130 439 Q250 457 370 439', { fill: 'none', stroke: '#fff', 'stroke-opacity': '.25', 'stroke-width': 2 });
      path('M138 209 L126 430 M362 209 L374 430', { fill: 'none', stroke: '#000', 'stroke-opacity': '.1', 'stroke-width': 3 });
    } else {
      path('M218 126 L218 96 Q250 63 282 96 L282 126 M231 121 L231 102 Q250 85 269 102 L269 121', { fill: color, 'fill-rule': 'evenodd', stroke: '#172029', 'stroke-opacity': '.3', 'stroke-width': 2 });
      if (back) {
        path('M184 160 Q123 188 150 441 L180 447 Q168 264 208 196 Z M316 160 Q377 188 350 441 L320 447 Q332 264 292 196 Z', { fill: color, stroke: '#172029', 'stroke-opacity': '.3', 'stroke-width': 3 });
      }
      surface('M145 220 Q139 129 250 125 Q361 129 355 220 L365 436 Q363 470 330 473 L170 473 Q137 470 135 436 Z');
      path('M157 234 Q154 153 250 150 Q346 153 343 234', { fill: 'none', stroke: '#fff', 'stroke-opacity': '.28', 'stroke-width': 3 });
      if (back) {
        path('M175 213 L175 422 M325 213 L325 422', { fill: 'none', stroke: '#000', 'stroke-opacity': '.15', 'stroke-width': 22, 'stroke-linecap': 'round' });
      } else {
        surface('M155 281 Q250 260 345 281 L350 421 Q250 444 150 421 Z', { 'stroke-opacity': '.12' });
        path('M158 296 Q250 277 342 296', { fill: 'none', stroke: '#fff', 'stroke-opacity': '.35', 'stroke-width': 3 });
        svg('rect', { x: 320, y: 292, width: 5, height: 17, rx: 1, fill: '#c8ad78' });
      }
    }
  }
  function renderArtwork() {
    const area = currentSpec().printable;
    const scale = Number(controls.scale.value) / 100;
    const width = area.w * scale;
    const text = controls.text.value.trim();
    const imageHeight = logoURL ? Math.min(width, area.h * .60) : 0;
    const fontSize = Math.max(10, width * .14);
    const textHeight = text ? fontSize + 12 : 0;
    const height = Math.max(18, imageHeight + textHeight);
    const cx = area.x + (area.w - width) / 2 * Number(controls.x.value) / 60;
    const cy = area.y + Math.max(0, area.h - height) / 2 * Number(controls.y.value) / 80;
    if (logoURL) {
      previewLogo.setAttribute('x', cx - width / 2); previewLogo.setAttribute('y', cy - height / 2);
      previewLogo.setAttribute('width', width); previewLogo.setAttribute('height', imageHeight);
    }
    previewText.textContent = text;
    previewText.setAttribute('x', cx);
    previewText.setAttribute('y', logoURL ? cy - height / 2 + imageHeight + fontSize + 4 : cy + fontSize / 3);
    previewText.setAttribute('fill', controls.textColor.value);
    previewText.setAttribute('font-size', fontSize);
    previewText.setAttribute('letter-spacing', Math.max(.5, fontSize * .08));
    previewText.removeAttribute('textLength'); previewText.removeAttribute('lengthAdjust');
    if (text && previewText.getComputedTextLength() > width) {
      previewText.setAttribute('textLength', width); previewText.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    }
    $('studio-scale-value').textContent = controls.scale.value + '%';
  }
  function render() {
    renderShape(); renderArtwork();
    const spec = currentSpec(), label = controls.product.value === 'tee' ? controls.style.value : spec.label;
    $('studio-svg-title').textContent = 'Illustrative ' + colourName + ' ' + label + ' mockup';
    $('studio-product-label').textContent = label + ' / ' + colourName;
    $('studio-view-label').textContent = controls.side.value.toUpperCase() + ' VIEW';
    $('studio-fabric-summary').textContent = controls.fabric.value;
    $('studio-gsm-summary').textContent = /^\d+$/.test(controls.gsm.value) ? controls.gsm.value + ' GSM' : controls.gsm.value;
    $('studio-color-name').textContent = colourName;
  }
  function clearLogo() {
    if (logoURL) URL.revokeObjectURL(logoURL);
    logoURL = null; filename = null;
    previewLogo.removeAttribute('href'); previewLogo.style.display = 'none';
    $('studio-logo').value = ''; $('studio-remove-logo').hidden = true;
  }
  $('studio-logo').addEventListener('change', async event => {
    const sequence = ++fileSequence, file = event.target.files && event.target.files[0];
    const status = $('studio-upload-status');
    if (!file) return;
    status.textContent = 'Reading your image locally…';
    try {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || !/\.(png|jpe?g|webp)$/i.test(file.name)) throw Error('Choose a PNG, JPEG or WebP image.');
      if (!file.size || file.size > 5 * 1024 * 1024) throw Error('Choose an image no larger than 5 MB.');
      const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
      const isPNG = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
      const isJPEG = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      const isWebP = String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
      if (!((file.type === 'image/png' && isPNG) || (file.type === 'image/jpeg' && isJPEG) || (file.type === 'image/webp' && isWebP))) throw Error('The file contents do not match a supported image.');
      const nextURL = URL.createObjectURL(file);
      try {
        const probe = new Image(); probe.src = nextURL; await probe.decode();
        if (!probe.naturalWidth || !probe.naturalHeight || probe.naturalWidth * probe.naturalHeight > 16000000) throw Error('Choose an image with at most 16 megapixels.');
        if (sequence !== fileSequence) { URL.revokeObjectURL(nextURL); return; }
        if (logoURL) URL.revokeObjectURL(logoURL);
        logoURL = nextURL; filename = file.name;
        previewLogo.setAttribute('href', logoURL); previewLogo.style.display = '';
        $('studio-remove-logo').hidden = false;
        status.textContent = file.name + ' — local preview only. No upload has taken place.';
        renderArtwork();
      } catch (error) { URL.revokeObjectURL(nextURL); throw error; }
    } catch (error) {
      if (sequence !== fileSequence) return;
      status.textContent = (error.message || 'This image could not be opened. Try another PNG, JPEG or WebP.') + (filename ? ' Your previous image remains in the preview.' : '');
      $('studio-logo').value = '';
    }
  });
  $('studio-remove-logo').addEventListener('click', () => {
    ++fileSequence; clearLogo(); $('studio-upload-status').textContent = 'Image removed from the local preview.'; renderArtwork();
  });
  document.querySelectorAll('.studio-colours [data-color]').forEach(button => button.addEventListener('click', () => {
    controls.color.value = button.dataset.color; colourName = button.dataset.name;
    document.querySelectorAll('.studio-colours [data-color]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    render();
  }));
  controls.color.addEventListener('input', () => {
    colourName = controls.color.value.toUpperCase();
    document.querySelectorAll('.studio-colours [data-color]').forEach(b => b.setAttribute('aria-pressed', 'false'));
    render();
  });
  controls.product.addEventListener('change', syncProduct);
  Object.entries(controls).forEach(([key, control]) => {
    if (key !== 'product' && key !== 'color') control.addEventListener('input', render);
  });
  $('studio-reset-placement').addEventListener('click', () => { controls.x.value = '0'; controls.y.value = '0'; controls.scale.value = '40'; renderArtwork(); });
  function brief() {
    const spec = currentSpec(), product = controls.product.value;
    const details = [
      'Local mockup concept; not AI-generated or production-approved artwork.',
      'GSM / specification preference: ' + controls.gsm.value + '.',
      controls.text.value.trim() ? 'Mockup text: ' + controls.text.value.trim() : '',
      'View: ' + controls.side.value + '; scale ' + controls.scale.value + '%; position ' + controls.x.value + ', ' + controls.y.value + ' (relative settings, not print dimensions).',
      filename ? 'Local reference: ' + filename.slice(0, 80) + '. NOT uploaded or attached; arrange the original file separately with Lustry.' : 'No reference file attached.',
      'Material, colour and artwork suitability require Lustry confirmation.'
    ].filter(Boolean).join('\n');
    const prompt = controls.prompt.value.trim();
    const design = details + (prompt ? '\nDesign brief: ' + prompt : '');
    const toteStyle = controls.fabric.value === 'Non-woven' ? 'Non-woven Bag' : controls.fabric.value === 'Canvas' ? 'Canvas Tote Bag' : controls.fabric.value === 'Cotton' ? 'Cotton Tote Bag' : 'Tote Bag';
    return { version: 1, product, category: spec.category, style: product === 'tee' ? controls.style.value : product === 'tote' ? toteStyle : 'Laptop Backpack', fabric: controls.fabric.value, gsm: /^\d+$/.test(controls.gsm.value) ? controls.gsm.value : '', color: colourName + ' (' + controls.color.value + ')', placement: controls.side.value, design, artworkFilename: filename, artworkUploaded: false, createdAt: new Date().toISOString() };
  }
  function plainBrief(value) {
    return ['LUSTRY — DESIGN CONCEPT BRIEF', '', 'Product: ' + value.style, 'Fabric preference: ' + value.fabric, 'GSM: ' + (value.gsm || 'Confirm specification with team'), 'Colour: ' + value.color, '', value.design, '', 'Bulk manufacturing MOQ: 25 pieces. Final quotation requires Lustry approval.'].join('\n');
  }
  $('studio-download-brief').addEventListener('click', () => {
    const blob = new Blob([plainBrief(brief())], { type: 'text/plain;charset=utf-8' });
    const href = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = href; link.download = 'lustry-design-brief.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
    $('studio-status').textContent = 'Text brief downloaded. Your image is not included; keep your original file for the team.';
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    try {
      sessionStorage.setItem('lustry_studio_brief_v1', JSON.stringify(brief()));
      location.href = 'custom.html?source=studio';
    } catch (_error) {
      $('studio-status').textContent = 'This browser could not save your brief for the next page. Download the text brief and paste it into the manufacturing enquiry.';
    }
  });
  window.addEventListener('pagehide', event => { if (logoURL && !event.persisted) URL.revokeObjectURL(logoURL); });
  const initial = new URLSearchParams(location.search);
  if (Object.hasOwn(specs, initial.get('product'))) controls.product.value = initial.get('product');
  if (Array.from(controls.style.options).some(option => option.value === initial.get('style'))) controls.style.value = initial.get('style');
  syncProduct();
})();
