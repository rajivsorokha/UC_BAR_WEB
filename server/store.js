// Tiny document store with two backends: Postgres (DATABASE_URL) or a local JSON file (development).
// Every record is { id, ...fields }; order within a collection is the admin-chosen order.
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');

function fileStore() {
  const dbFile = path.join(DATA_DIR, 'db.json');
  const filesDir = path.join(DATA_DIR, 'files');
  fs.mkdirSync(filesDir, { recursive: true });
  let db = fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile, 'utf8')) : {};
  const save = () => { fs.writeFileSync(dbFile + '.tmp', JSON.stringify(db)); fs.renameSync(dbFile + '.tmp', dbFile); };
  const col = c => (db[c] ||= []);
  return {
    kind: 'file',
    async init() {},
    async list(c) { return structuredClone(col(c)); },
    async get(c, id) { return structuredClone(col(c).find(x => x.id === id) || null); },
    async insert(c, item) { if (!col(c).some(x => x.id === item.id)) { col(c).push(item); save(); } },
    async update(c, id, item) { const i = col(c).findIndex(x => x.id === id); if (i >= 0) { col(c)[i] = item; save(); } },
    async remove(c, id) { db[c] = col(c).filter(x => x.id !== id); save(); },
    async setOrder(c, ids) {
      const by = new Map(col(c).map(x => [x.id, x]));
      const sorted = ids.map(i => by.get(i)).filter(Boolean);
      db[c] = [...sorted, ...col(c).filter(x => !ids.includes(x.id))]; save();
    },
    async count(c) { return col(c).length; },
    async putFile(id, mime, buf) { fs.writeFileSync(path.join(filesDir, id), buf); fs.writeFileSync(path.join(filesDir, id + '.mime'), mime); },
    async getFile(id) {
      const f = path.join(filesDir, id);
      if (!/^[a-z0-9._-]+$/i.test(id) || !fs.existsSync(f)) return null;
      return { mime: fs.readFileSync(f + '.mime', 'utf8'), data: fs.readFileSync(f) };
    },
  };
}

function pgStore(url) {
  const { Pool } = require('pg');
  const local = /localhost|127\.0\.0\.1/.test(url);
  const pool = new Pool({
    connectionString: url,
    max: process.env.VERCEL ? 3 : 8,
    ssl: process.env.PGSSL === 'false' || local ? false : { rejectUnauthorized: false },
  });
  const q = (text, params) => pool.query(text, params);
  return {
    kind: 'postgres',
    async init() {
      await q(`CREATE TABLE IF NOT EXISTS docs (col text NOT NULL, id text NOT NULL, pos integer NOT NULL DEFAULT 0, data jsonb NOT NULL, PRIMARY KEY (col, id))`);
      await q(`CREATE TABLE IF NOT EXISTS files (id text PRIMARY KEY, mime text NOT NULL, data bytea NOT NULL, created timestamptz DEFAULT now())`);
    },
    async list(c) { return (await q('SELECT data FROM docs WHERE col=$1 ORDER BY pos, id', [c])).rows.map(r => r.data); },
    async get(c, id) { return (await q('SELECT data FROM docs WHERE col=$1 AND id=$2', [c, id])).rows[0]?.data || null; },
    async insert(c, item) {
      await q(`INSERT INTO docs (col,id,pos,data) VALUES ($1,$2,(SELECT COALESCE(MAX(pos),0)+1 FROM docs WHERE col=$1),$3) ON CONFLICT DO NOTHING`, [c, item.id, JSON.stringify(item)]);
    },
    async update(c, id, item) { await q('UPDATE docs SET data=$3 WHERE col=$1 AND id=$2', [c, id, JSON.stringify(item)]); },
    async remove(c, id) { await q('DELETE FROM docs WHERE col=$1 AND id=$2', [c, id]); },
    async setOrder(c, ids) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (let i = 0; i < ids.length; i++) await client.query('UPDATE docs SET pos=$3 WHERE col=$1 AND id=$2', [c, ids[i], i + 1]);
        await client.query('COMMIT');
      } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
    },
    async count(c) { return +(await q('SELECT COUNT(*) n FROM docs WHERE col=$1', [c])).rows[0].n; },
    async putFile(id, mime, buf) { await q('INSERT INTO files (id,mime,data) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING', [id, mime, buf]); },
    async getFile(id) { const r = (await q('SELECT mime,data FROM files WHERE id=$1', [id])).rows[0]; return r || null; },
  };
}

module.exports = process.env.DATABASE_URL ? pgStore(process.env.DATABASE_URL) : fileStore();
