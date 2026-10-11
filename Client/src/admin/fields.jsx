import { useState } from 'react';
import { uploadFile } from '../api.js';

// Turn a white-background product photo into a transparent PNG, entirely in the browser:
// flood-fill from the edges over near-white pixels, then trim the light fringe.
async function whiteToTransparent(url) {
  const img = new Image(); img.src = url; await img.decode();
  const sc = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * sc), h = Math.round(img.naturalHeight * sc);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h), px = d.data, seen = new Uint8Array(w * h), q = new Int32Array(w * h);
  let qh = 0, qt = 0;
  const isBg = i => { const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2]; if (px[i * 4 + 3] < 10) return true; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mn >= 232 && mx - mn <= 18; };
  const push = i => { if (!seen[i] && isBg(i)) { seen[i] = 1; q[qt++] = i; } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  while (qh < qt) { const i = q[qh++], x = i % w, y = (i / w) | 0; if (x > 0) push(i - 1); if (x < w - 1) push(i + 1); if (y > 0) push(i - w); if (y < h - 1) push(i + w); }
  for (let i = 0; i < w * h; i++) if (seen[i]) px[i * 4 + 3] = 0;
  const fringe = [];
  for (let i = 0; i < w * h; i++) {
    if (seen[i]) continue; const x = i % w, y = (i / w) | 0;
    if (((x > 0 && seen[i - 1]) || (x < w - 1 && seen[i + 1]) || (y > 0 && seen[i - w]) || (y < h - 1 && seen[i + w])) && Math.min(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]) >= 200) fringe.push(i);
  }
  fringe.forEach(i => { px[i * 4 + 3] = 0; });
  ctx.putImageData(d, 0, 0);
  // trim the empty margins so the product fills its slot (and the preview card) like the built-in slides do
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return new Promise(res => c.toBlob(res, 'image/png'));
  const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.02), cw = x1 - x0 + 1 + pad * 2, ch = y1 - y0 + 1 + pad * 2;
  const out = document.createElement('canvas'); out.width = cw; out.height = ch;
  out.getContext('2d').drawImage(c, x0, y0, x1 - x0 + 1, y1 - y0 + 1, pad, pad, x1 - x0 + 1, y1 - y0 + 1);
  return new Promise(res => out.toBlob(res, 'image/png'));
}

function Upload({ f, value, onChange, disabled }) {
  const [state, setState] = useState('');
  async function pick(e) {
    const file = e.target.files[0]; if (!file) return;
    setState('Uploading…');
    try { onChange(await uploadFile(file, f.type)); setState('Uploaded ✓'); } catch (err) { setState('⚠ ' + err.message); }
    e.target.value = '';
  }
  async function cutout() {
    setState('Removing background…');
    try { const blob = await whiteToTransparent(value); onChange(await uploadFile(new File([blob], 'cutout.png', { type: 'image/png' }), 'image')); setState('Background removed ✓ (check the preview)'); }
    catch (err) { setState('⚠ ' + (err.message || 'Could not process this image')); }
  }
  return (
    <div className="upl">
      <input value={value || ''} onChange={e => onChange(e.target.value)} disabled={disabled} placeholder={f.type === 'image' ? '/images/… or upload' : 'Upload a file'} />
      {!disabled && <label className="btn sm">Upload<input type="file" hidden onChange={pick} accept={f.type === 'image' ? 'image/jpeg,image/png,image/gif,image/webp' : '.pdf,.zip,.7z,.exe,.msi,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv'} /></label>}
      {f.cutout && value && !disabled && <button type="button" className="btn sm" onClick={cutout}>✂ Remove white background</button>}
      <span className="muted">{state}</span>
      {f.type === 'image' && value && <img className="preview cutprev" src={value} alt="" />}
    </div>
  );
}

export function defaultFor(f) {
  return f.type === 'checkbox' ? f.default !== false && f.default !== undefined ? !!f.default : false : f.type === 'lines' ? '' : (f.default ?? (f.type === 'select' && f.options ? Object.keys(f.options)[0] : ''));
}
export const toForm = (def, item) => Object.fromEntries(def.fields.map(f => {
  const v = item?.[f.name];
  if (f.type === 'lines') return [f.name, Array.isArray(v) ? v.join('\n') : (v || '')];
  return [f.name, v === undefined ? defaultFor(f) : v];
}));

export default function Field({ f, value, onChange }) {
  const dis = !!f.readOnly;
  return (
    <div className="field">
      {f.type === 'checkbox'
        ? <label className="check"><input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} disabled={dis} /> {f.label}</label>
        : <>
            <label>{f.label}{f.required && <b className="req"> *</b>}</label>
            {f.type === 'select' && <select value={value} onChange={e => onChange(e.target.value)} disabled={dis}>{Object.entries(f.options || {}).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>}
            {(f.type === 'textarea' || f.type === 'lines') && <textarea rows={f.rows || (f.type === 'lines' ? 8 : 4)} value={value} onChange={e => onChange(e.target.value)} disabled={dis} />}
            {(f.type === 'image' || f.type === 'file') && <Upload f={f} value={value} onChange={onChange} disabled={dis} />}
            {['text', 'url', 'date'].includes(f.type) && <input type={f.type === 'date' ? 'date' : 'text'} value={value} onChange={e => onChange(e.target.value)} disabled={dis} />}
          </>}
      {f.help && <div className="help">{f.help}</div>}
    </div>
  );
}
