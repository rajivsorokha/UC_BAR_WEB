try { process.loadEnvFile(require('path').join(__dirname, '..', '.env')); } catch (e) { /* .env is optional (hosts set real env vars) */ }

const express = require('express');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const store = require('./store');
const chat = require('./chat');
const providers = require('./providers');
const patches = require('./patches');
const { collections, settingsGroups, settingsFields, PRIVATE_SETTINGS } = require('./schema');

const IS_PROD = process.env.NODE_ENV === 'production' || !!process.env.RENDER || !!process.env.VERCEL;
const uid = () => Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'item';
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

/* ------------------------------------------------------------------ startup: tables, demo content, first admin */
let readyP;
const ready = () => readyP || (readyP = (async () => {
  await store.init();
  if (!(await store.count('categories')) && !(await store.get('settings', 'main'))) {
    const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed.json'), 'utf8'));
    for (const [col, list] of Object.entries(seed)) {
      if (col === 'settings') await store.insert('settings', { id: 'main', ...list });
      else for (const item of list) await store.insert(col, item);
    }
    console.log('[setup] imported starter content');
    await store.insert('meta', { id: 'patches', applied: patches.map(p => p.id) }); // a fresh install already has everything
  }
  {
    const rec = (await store.get('meta', 'patches')) || { id: 'patches', applied: [] };
    const todo = patches.filter(p => !rec.applied.includes(p.id));
    for (const p of todo) { await p.run(store); rec.applied.push(p.id); console.log(`[setup] applied content update ${p.id}`); }
    if (todo.length) (await store.get('meta', 'patches')) ? await store.update('meta', 'patches', rec) : await store.insert('meta', rec);
  }
  // Admin login. ADMIN_USER / ADMIN_PASS are applied on first start AND whenever you change them later
  // (so "I changed the variable and restarted" works). A password changed inside the admin panel is kept
  // until the environment values change again.
  const envUser = (process.env.ADMIN_USER || '').trim(), envPass = process.env.ADMIN_PASS || '';
  const fp = crypto.createHash('sha256').update(`${envUser || 'admin'}|${envPass}`).digest('hex');
  const users = await store.list('users');
  if (!users.length) {
    const username = envUser || 'admin';
    let pass = envPass;
    if (!pass) { pass = crypto.randomBytes(9).toString('base64url'); console.log(`\n[setup] Admin login created → username: ${username}  password: ${pass}\n        (set ADMIN_PASS in your environment to choose your own)\n`); }
    await store.insert('users', { id: 'u1', username, hash: await bcrypt.hash(pass, 12), envFp: envPass ? fp : '' });
    if (envPass) console.log(`[setup] Admin login created from ADMIN_USER/ADMIN_PASS → username: ${username}`);
  } else if (envPass && users[0].envFp !== fp) {
    await store.update('users', users[0].id, { ...users[0], username: envUser || users[0].username, hash: await bcrypt.hash(envPass, 12), envFp: fp });
    console.log(`[setup] Admin login updated from ADMIN_USER/ADMIN_PASS → username: ${envUser || users[0].username}`);
  }
  const fsx = require('fs'), rootDir = path.join(__dirname, '..');
  if (!fsx.existsSync(path.join(rootDir, '.env')) && fsx.existsSync(path.join(rootDir, '.env.example')) && !process.env.RENDER && !process.env.VERCEL)
    console.log('[setup] No .env file found (only .env.example). Copy .env.example to .env and edit that copy if you want local settings.');
  console.log(`[setup] Admin sign-in: username "${(await store.list('users'))[0]?.username}" — password ${envPass ? 'comes from ADMIN_PASS (or was changed in the admin panel later)' : 'was set on first start (see log above) or in the admin panel'}`);
  if (envPass && envPass.length < 10) console.warn('[security] ADMIN_PASS is shorter than 10 characters — please use a longer one.');
  console.log(`[setup] storage: ${store.kind}${store.kind === 'file' && IS_PROD ? '  ⚠ NOT persistent on this host — set DATABASE_URL' : ''}`);
})());

/* ------------------------------------------------------------------ site data (cached briefly) */
let cache = null, cacheAt = 0;
const bust = () => { cache = null; };
const byDateDesc = (a, b) => (b.date || '').localeCompare(a.date || '');
async function loadSite() {
  if (cache && Date.now() - cacheAt < 15000) return cache;
  const [settings, cats, products, ...rest] = await Promise.all([
    store.get('settings', 'main'), store.list('categories'), store.list('products'),
    ...['events', 'software', 'support', 'updates', 'faqs', 'sectors', 'partners', 'offices', 'slides'].map(c => store.list(c)),
  ]);
  const [events, software, support, updates, faqs, sectors, partners, offices, slides] = rest.map(l => l.filter(x => x.active !== false));
  const categories = cats.filter(c => c.active !== false);
  const ids = new Set(categories.map(c => c.id));
  cache = {
    settings: settings || {}, categories,
    products: products.filter(p => p.active !== false && ids.has(p.category)),
    events: events.sort(byDateDesc), software, support, updates: updates.sort(byDateDesc), faqs, sectors, partners, offices, slides,
  };
  cacheAt = Date.now();
  return cache;
}

/* ------------------------------------------------------------------ app + middleware */
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

const secret = process.env.SESSION_SECRET || crypto.createHash('sha256').update('ucbar|' + (process.env.DATABASE_URL || '') + '|' + (process.env.ADMIN_PASS || 'dev')).digest('hex');
if (IS_PROD && !process.env.SESSION_SECRET) console.warn('[security] SESSION_SECRET is not set — set a long random value.');

app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'SAMEORIGIN', 'Referrer-Policy': 'strict-origin-when-cross-origin' });
  next();
});
app.use(wrap(async (req, res, next) => { await ready(); next(); }));
// `secure` is left unset on purpose: the cookie is marked Secure automatically when the request really is HTTPS
// (Render/Vercel, via trust proxy) and works on plain http (a local `npm start`). Forcing it broke login over http.
app.use(cookieSession({ name: 'ucbar', keys: [secret], maxAge: 8 * 3600 * 1000, httpOnly: true, sameSite: 'lax' }));
app.use(express.json({ limit: '300kb' }));

const hits = new Map();
const limiter = (max, windowMs, name) => (req, res, next) => {
  const k = name + '|' + req.ip, now = Date.now();
  const h = (hits.get(k) || []).filter(t => now - t < windowMs);
  if (h.length >= max) return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  h.push(now); hits.set(k, h);
  if (hits.size > 5000) for (const [key, v] of hits) if (!v.some(t => now - t < windowMs)) hits.delete(key);
  next();
};

/* ------------------------------------------------------------------ public API */
app.get('/api/public/site', wrap(async (req, res) => {
  const site = await loadSite();
  const settings = { ...site.settings }; delete settings.id; PRIVATE_SETTINGS.forEach(k => delete settings[k]);
  res.set('Cache-Control', 'no-cache').json({ ...site, settings });
}));

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
async function notify(lead) {
  const url = process.env.LEAD_WEBHOOK_URL; if (!url) return;
  try {
    await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: `New enquiry from ${lead.name} (${lead.phone || lead.email}) — ${lead.interest || 'general'}\n${lead.message}`, lead }) });
  } catch (e) { console.error('[webhook]', e.message); }
}
app.post('/api/public/leads', limiter(6, 3600e3, 'lead'), wrap(async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot field: bots fill it
  const t = (v, n) => String(v ?? '').trim().slice(0, n);
  const lead = { name: t(b.name, 100), phone: t(b.phone, 30), email: t(b.email, 120), interest: t(b.interest, 150), message: t(b.message, 2000), source: t(b.source, 30) || 'contact-form' };
  if (lead.name.length < 2) return res.status(400).json({ error: 'Please enter your name.' });
  if (!lead.phone && !lead.email) return res.status(400).json({ error: 'Please enter a phone number or email.' });
  if (lead.phone && !/^[0-9+()\-\s]{6,20}$/.test(lead.phone)) return res.status(400).json({ error: 'Please enter a valid phone number.' });
  if (lead.email && !emailRe.test(lead.email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (Array.isArray(b.transcript)) lead.message += '\n\n--- chat transcript ---\n' + b.transcript.slice(-12).map(m => `${m.role === 'user' ? 'Visitor' : 'Assistant'}: ${t(m.content, 400)}`).join('\n');
  const doc = { id: uid(), status: 'new', createdAt: new Date().toISOString(), ...lead, message: lead.message.slice(0, 4500) };
  await store.insert('leads', doc);
  notify(doc);
  res.json({ ok: true });
}));

app.post('/api/chat', limiter(25, 600e3, 'chat'), wrap(async (req, res) => {
  const site = await loadSite();
  if (['off', 'whatsapp'].includes(site.settings.chatMode)) return res.status(404).json({ error: 'Chat is disabled' });
  const r = await chat.reply(site, req.body?.messages);
  res.json({ reply: r.reply, source: r.source }); // provider/model/errors are admin-only
}));

app.get('/uploads/:id', wrap(async (req, res) => {
  const f = await store.getFile(req.params.id);
  if (!f) return res.status(404).send('Not found');
  const isImg = /^image\/(jpeg|png|gif|webp)$/.test(f.mime);
  res.set({ 'Content-Type': f.mime, 'Cache-Control': 'public, max-age=31536000, immutable' });
  if (!isImg) res.set('Content-Disposition', `attachment; filename="${req.params.id.replace(/"/g, '')}"`);
  res.send(Buffer.isBuffer(f.data) ? f.data : Buffer.from(f.data));
}));

app.get('/robots.txt', (req, res) => res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nDisallow: /api/\nSitemap: ${process.env.SITE_URL || req.protocol + '://' + req.get('host')}/sitemap.xml\n`));
app.get('/sitemap.xml', wrap(async (req, res) => {
  const site = await loadSite(), base = (process.env.SITE_URL || req.protocol + '://' + req.get('host')).replace(/\/$/, '');
  const urls = ['/', '/products', ...site.categories.map(c => '/products/' + c.id), '/software', '/support', '/about', '/contact'];
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${esc(base + u)}</loc></url>`).join('\n')}\n</urlset>`);
}));

/* ------------------------------------------------------------------ admin API */
const admin = express.Router();
app.use('/api/admin', admin);

// Only our own admin UI sends this header; cross-site requests can't add it without a CORS preflight.
admin.use((req, res, next) => (req.method === 'GET' || req.get('x-requested-with') === 'ucbar') ? next() : res.status(403).json({ error: 'Forbidden' }));

const attempts = new Map();
const DUMMY = bcrypt.hashSync('not-a-password', 10);
admin.post('/login', wrap(async (req, res) => {
  const a = attempts.get(req.ip) || { n: 0, until: 0 };
  if (a.until > Date.now()) return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
  const username = String(req.body?.username || '').trim().toLowerCase();
  const u = (await store.list('users')).find(x => x.username.toLowerCase() === username);
  const ok = await bcrypt.compare(String(req.body?.password || ''), u ? u.hash : DUMMY);
  if (!u || !ok) { a.n++; if (a.n >= 5) { a.until = Date.now() + 15 * 60e3; a.n = 0; } attempts.set(req.ip, a); return res.status(401).json({ error: 'Wrong username or password.' }); }
  attempts.delete(req.ip);
  req.session = { user: u.username };
  res.json({ user: u.username });
}));
admin.post('/logout', (req, res) => { req.session = null; res.json({ ok: true }); });
admin.get('/me', (req, res) => res.json({ user: req.session?.user || null }));

admin.use((req, res, next) => req.session?.user ? next() : res.status(401).json({ error: 'Please sign in.' }));

admin.post('/password', wrap(async (req, res) => {
  const { current, next } = req.body || {};
  const u = (await store.list('users')).find(x => x.username === req.session.user);
  if (!u || !(await bcrypt.compare(String(current || ''), u.hash))) return res.status(400).json({ error: 'Current password is wrong.' });
  if (String(next || '').length < 10) return res.status(400).json({ error: 'New password must be at least 10 characters.' });
  await store.update('users', u.id, { ...u, hash: await bcrypt.hash(next, 12) });
  res.json({ ok: true });
}));

const resolveOptions = async () => {
  const cats = await store.list('categories');
  return Object.fromEntries(Object.entries(collections).map(([k, c]) => [k, {
    ...c, fields: c.fields.map(f => f.optionsFrom ? { ...f, options: Object.fromEntries(cats.map(x => [x.id, x.name])) } : f),
  }]));
};
admin.get('/schema', wrap(async (req, res) => res.json({ collections: await resolveOptions(), settingsGroups })));

admin.get('/stats', wrap(async (req, res) => {
  const counts = {}; for (const k of Object.keys(collections)) counts[k] = await store.count(k);
  const leads = await store.list('leads');
  const ai = providers.status((await store.get('settings', 'main')) || {});
  res.json({ counts, newLeads: leads.filter(l => l.status === 'new').length, aiConfigured: ai.some(x => x.configured), aiActive: ai.find(x => x.active) || null, storage: store.kind, persistent: store.kind !== 'file' || !IS_PROD,
    recentLeads: leads.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5) });
}));

admin.get('/chat-status', wrap(async (req, res) => res.json(providers.status((await store.get('settings', 'main')) || {}))));
admin.post('/chat-test', limiter(10, 600e3, 'chat-test'), wrap(async (req, res) => {
  bust(); // use the latest saved settings
  const r = await chat.reply(await loadSite(), [{ role: 'user', content: 'Hello! Which products do you sell?' }]);
  res.json({ ok: r.source === 'ai', provider: r.provider || null, model: r.model || null, reply: r.reply, error: r.error || null });
}));
admin.get('/settings', wrap(async (req, res) => { const s = (await store.get('settings', 'main')) || {}; delete s.id; res.json(s); }));
admin.put('/settings', wrap(async (req, res) => {
  const cur = (await store.get('settings', 'main')) || { id: 'main' }, next = { ...cur };
  for (const f of settingsFields) if (f.name in (req.body || {})) {
    const v = String(req.body[f.name] ?? '').trim().slice(0, 8000);
    if (v && f.type === 'select' && !(v in f.options)) return res.status(400).json({ error: `${f.label}: invalid option` });
    next[f.name] = v;
  }
  if (cur.id) await store.update('settings', 'main', next); else await store.insert('settings', next);
  bust(); res.json({ ok: true });
}));

/* uploads: stored in the database so they survive redeploys on Render/Vercel */
const IMG = /\.(jpe?g|png|gif|webp)$/i, DOC = /\.(pdf|zip|7z|exe|msi|docx?|xlsx?|pptx?|txt|csv)$/i;
const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', pdf: 'application/pdf', zip: 'application/zip' };
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (req, f, cb) => cb(null, (req.query.kind === 'file' ? DOC : IMG).test(f.originalname)) });
admin.post('/upload', upload.single('file'), wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File type not allowed or file larger than 8 MB.' });
  const ext = path.extname(req.file.originalname).toLowerCase(), base = slug(path.basename(req.file.originalname, ext));
  const id = `${base}-${crypto.randomBytes(4).toString('hex')}${ext}`;
  await store.putFile(id, MIME[ext.slice(1)] || 'application/octet-stream', req.file.buffer);
  res.json({ path: '/uploads/' + id });
}));

/* generic CRUD for every collection */
const BAD_URL = /^\s*(javascript|data|vbscript):/i;
function parse(def, body, existing) {
  const out = {}, errors = [];
  for (const f of def.fields) {
    if (f.readOnly) continue;
    let v = body[f.name];
    if (f.type === 'checkbox') v = v === true || v === 'true' || v === 'on';
    else if (f.type === 'lines') v = (Array.isArray(v) ? v : String(v ?? '').split(/\r?\n/)).map(s => String(s).trim()).filter(Boolean).slice(0, 80);
    else v = String(v ?? '').trim().slice(0, 8000);
    if (f.type === 'select' && f.options && !(v in f.options)) errors.push(`${f.label}: choose a valid option`);
    if (['url', 'image', 'file'].includes(f.type) && (BAD_URL.test(v) || v.includes('..'))) errors.push(`${f.label}: invalid address`);
    if (f.type === 'date' && v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) errors.push(`${f.label}: invalid date`);
    if (f.required && (Array.isArray(v) ? !v.length : !v)) errors.push(`${f.label} is required`);
    if (f.requiredIf && f.requiredIf.in.includes(body[f.requiredIf.field]) && !v) errors.push(`${f.label} is required for this slide type`);
    if (f.name === 'accent' && v && !/^#[0-9a-fA-F]{6}$/.test(v)) errors.push('Accent colour must look like #3b82f6');
    out[f.name] = v;
  }
  return { out, errors };
}
const defOf = async (req, res, next) => {
  const d = (await resolveOptions())[req.params.col];
  if (!d) return res.status(404).json({ error: 'Unknown section' });
  req.def = d; next();
};
const D = fn => [wrap(defOf), wrap(fn)];

admin.get('/:col', ...D(async (req, res) => {
  let list = await store.list(req.params.col);
  if (req.def.newestFirst) list = list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json(list);
}));
admin.post('/:col', ...D(async (req, res) => {
  if (req.def.noCreate) return res.status(405).json({ error: 'Not allowed' });
  const { out, errors } = parse(req.def, req.body || {});
  if (errors.length) return res.status(400).json({ error: errors.join('. ') });
  let id = uid();
  if (req.def.slugId) {
    const existing = new Set((await store.list(req.params.col)).map(x => x.id));
    const base = slug(out[req.def.slugId]); id = base; for (let n = 2; existing.has(id); n++) id = `${base}-${n}`;
  }
  await store.insert(req.params.col, { id, ...out }); bust();
  res.json({ id });
}));
admin.put('/:col/order', ...D(async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
  await store.setOrder(req.params.col, ids); bust(); res.json({ ok: true });
}));
admin.put('/:col/:id', ...D(async (req, res) => {
  const cur = await store.get(req.params.col, req.params.id);
  if (!cur) return res.status(404).json({ error: 'Not found' });
  const { out, errors } = parse(req.def, req.body || {}, cur);
  if (errors.length) return res.status(400).json({ error: errors.join('. ') });
  await store.update(req.params.col, cur.id, { ...cur, ...out, id: cur.id }); bust();
  res.json({ ok: true });
}));
admin.delete('/:col/:id', ...D(async (req, res) => {
  if (req.params.col === 'categories') {
    const n = (await store.list('products')).filter(p => p.category === req.params.id).length;
    if (n) return res.status(400).json({ error: `This category still has ${n} product(s). Move or delete them first.` });
  }
  await store.remove(req.params.col, req.params.id); bust(); res.json({ ok: true });
}));
admin.use((req, res) => res.status(404).json({ error: 'Not found' }));

/* ------------------------------------------------------------------ React app (production build) */
const dist = path.join(__dirname, '..', 'client', 'dist');
const shell = ['app.html', 'index.html'].map(f => path.join(dist, f)).find(f => fs.existsSync(f));
if (shell) {
  const template = fs.readFileSync(shell, 'utf8');
  app.use('/assets', express.static(path.join(dist, 'assets'), { immutable: true, maxAge: '1y' }));
  app.use(express.static(dist, { index: false, maxAge: '1d' }));
  app.get('*', wrap(async (req, res) => {
    if (/^\/(api|uploads)\//.test(req.path)) return res.status(404).json({ error: 'Not found' });
    const s = (await loadSite()).settings;
    const title = req.path.startsWith('/admin') ? 'Admin · ' + (s.companyName || '') : (s.siteTitle || s.companyName || 'Website');
    res.type('html').send(template.replace('__TITLE__', esc(title)).replace('__DESC__', esc(s.siteDescription || '')));
  }));
}

app.use((err, req, res, next) => {
  console.error(err);
  const status = err instanceof multer.MulterError ? 400 : 500;
  if (req.path.startsWith('/api')) return res.status(status).json({ error: status === 400 ? 'Upload failed (max 8 MB).' : 'Server error' });
  res.status(status).send('Server error');
});

module.exports = app;
if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  ready().then(() => app.listen(port, () => console.log(`Server running on http://localhost:${port}`))).catch(e => { console.error(e); process.exit(1); });
}
