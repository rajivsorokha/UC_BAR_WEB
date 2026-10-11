#!/usr/bin/env node
// Reset (or create) the admin login directly in the database. Works with the local file store and with Postgres (DATABASE_URL).
//   npm run reset-admin                          → asks for username + new password
//   npm run reset-admin -- admin 'New-Pass-123'  → no questions (single quotes protect characters like $ in a terminal)
const path = require('path'), crypto = require('crypto'), readline = require('readline');
try { process.loadEnvFile(path.join(__dirname, '..', '.env')); } catch (e) { /* .env is optional */ }
const bcrypt = require('bcryptjs');
const store = require('../server/store');

function ask(q, hidden) {
  return new Promise(res => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: !!process.stdin.isTTY });
    if (hidden && process.stdin.isTTY) rl._writeToOutput = s => { if (s.includes(q)) rl.output.write(s); };
    rl.question(q, a => { rl.close(); if (hidden && process.stdin.isTTY) console.log(); res(a); });
  });
}

(async () => {
  await store.init();
  const users = await store.list('users');
  let [user, pass] = process.argv.slice(2);
  user = (user || process.env.RESET_USER || '').trim();
  pass = pass || process.env.RESET_PASS || '';
  if (!user) { const def = users[0]?.username || 'admin'; user = (await ask(`Admin username [${def}]: `)).trim() || def; }
  if (!pass) { pass = await ask('New password (min. 10 characters): ', true); if (pass !== await ask('Repeat new password: ', true)) { console.error('✗ Passwords do not match.'); process.exit(1); } }
  if (pass.length < 10) { console.error('✗ The password must be at least 10 characters.'); process.exit(1); }

  // If ADMIN_USER/ADMIN_PASS are also set in the environment, mark them as "already applied" so the server
  // does not overwrite this reset on its next start. (Same fingerprint formula as server/index.js.)
  const envUser = (process.env.ADMIN_USER || '').trim(), envPass = process.env.ADMIN_PASS || '';
  const envFp = envPass ? crypto.createHash('sha256').update(`${envUser || 'admin'}|${envPass}`).digest('hex') : '';
  const hash = await bcrypt.hash(pass, 12);
  const existing = users.find(u => u.username.toLowerCase() === user.toLowerCase()) || (users.length === 1 ? users[0] : null);
  if (existing) await store.update('users', existing.id, { ...existing, username: user, hash, envFp });
  else await store.insert('users', { id: 'u' + Date.now().toString(36), username: user, hash, envFp });
  console.log(`✔ Admin login saved in the ${store.kind} database → username: ${user}`);
  console.log('  Restart the site if it is running (this also clears any "too many attempts" lockout), then sign in at /admin.');
  process.exit(0);
})().catch(e => { console.error('✗ Reset failed:', e.message); process.exit(1); });
