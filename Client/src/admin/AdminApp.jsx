import { createContext, useContext, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import Resource from './Resource.jsx';
import Settings from './Settings.jsx';
import './admin.css';

const Ctx = createContext(null);
export const useAdmin = () => useContext(Ctx);

function Login({ onLogin }) {
  const [f, setF] = useState({ username: '', password: '' }), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('');
    try { onLogin((await api('/api/admin/login', { method: 'POST', body: f })).user); } catch (ex) { setErr(ex.message); setBusy(false); }
  }
  return (
    <div className="adm login"><form className="card login-card" onSubmit={submit}>
      <h1>Website admin</h1><p className="muted">Sign in to manage your website</p>
      {err && <div className="flash err">{err}</div>}
      <div className="field"><label>Username</label><input value={f.username} onChange={e => setF({ ...f, username: e.target.value })} autoComplete="username" autoFocus required /></div>
      <div className="field"><label>Password</label><input type="password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} autoComplete="current-password" required /></div>
      <button className="btn primary wide" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      <p className="muted" style={{ fontSize: '.8rem', marginBottom: 0 }}>Locked out? Set <code>ADMIN_PASS</code> on your host and restart, or run <code>npm run reset-admin</code>.</p>
    </form></div>
  );
}

function Dashboard() {
  const { schema } = useAdmin();
  const [st, setSt] = useState(null);
  useEffect(() => { api('/api/admin/stats').then(setSt); }, []);
  if (!st) return <p>Loading…</p>;
  return (
    <>
      {!st.persistent && <div className="flash err"><b>Data is not persistent.</b> The site is running with file storage on a hosted server, so your edits will be lost on the next deploy/restart. Set the <code>DATABASE_URL</code> environment variable (Postgres) — see the README.</div>}
      {!st.aiConfigured && <div className="flash warn"><b>AI assistant is in basic mode.</b> Add an API key on your host — <code>OPENAI_API_KEY</code>, <code>DEEPSEEK_API_KEY</code>, <code>ANTHROPIC_API_KEY</code>, <code>GEMINI_API_KEY</code>… — to enable full AI answers; until then the chat searches your catalogue and FAQs.</div>}
      {st.aiConfigured && st.aiActive && <div className="flash ok">🤖 Chat assistant is using <b>{st.aiActive.label}</b> ({st.aiActive.model}). <Link to="/admin/settings">Test / change</Link></div>}
      {st.newLeads > 0 && <div className="flash ok">📥 You have <b>{st.newLeads}</b> new enquir{st.newLeads === 1 ? 'y' : 'ies'}. <Link to="/admin/c/leads">View</Link></div>}
      <div className="grid-tiles">
        {Object.entries(schema.collections).map(([k, c]) => (
          <Link key={k} to={`/admin/c/${k}`} className="card tile"><span className="ico">{c.icon}</span><div><b>{c.label}</b><div className="muted">{st.counts[k]} item{st.counts[k] === 1 ? '' : 's'}</div></div></Link>
        ))}
        <Link to="/admin/settings" className="card tile"><span className="ico">⚙️</span><div><b>Website Settings</b><div className="muted">Hero, contact, WhatsApp, AI chat</div></div></Link>
      </div>
      {st.recentLeads.length > 0 && (
        <div className="card" style={{ marginTop: 18, padding: 18 }}>
          <h3 style={{ marginTop: 0 }}>Latest enquiries</h3>
          {st.recentLeads.map(l => <div key={l.id} className="lead-row"><b>{l.name}</b> <span className="muted">{l.phone || l.email}</span><div>{(l.message || '').split('\n')[0].slice(0, 120)}</div><small className="muted">{new Date(l.createdAt).toLocaleString()} · {l.source}</small></div>)}
        </div>
      )}
    </>
  );
}

function Password() {
  const [f, setF] = useState({ current: '', next: '', confirm: '' }), [msg, setMsg] = useState(null);
  async function submit(e) {
    e.preventDefault();
    if (f.next !== f.confirm) return setMsg({ t: 'err', m: 'New passwords do not match.' });
    try { await api('/api/admin/password', { method: 'POST', body: f }); setMsg({ t: 'ok', m: 'Password changed.' }); setF({ current: '', next: '', confirm: '' }); } catch (ex) { setMsg({ t: 'err', m: ex.message }); }
  }
  return (
    <form className="card" style={{ maxWidth: 440, padding: 22 }} onSubmit={submit}>
      {msg && <div className={'flash ' + msg.t}>{msg.m}</div>}
      {[['current', 'Current password'], ['next', 'New password (min. 10 characters)'], ['confirm', 'Repeat new password']].map(([k, l]) => (
        <div className="field" key={k}><label>{l}</label><input type="password" value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} required minLength={k === 'current' ? 1 : 10} /></div>
      ))}
      <button className="btn primary">Change password</button>
    </form>
  );
}

function Shell() {
  const { user, schema, logout } = useAdmin();
  return (
    <div className="adm shell">
      <aside className="side">
        <div className="brand">Website admin<small>{user}</small></div>
        <nav>
          <NavLink to="/admin" end><span>🏠</span> Dashboard</NavLink>
          {Object.entries(schema.collections).map(([k, c]) => <NavLink key={k} to={`/admin/c/${k}`}><span>{c.icon}</span> {c.label}</NavLink>)}
          <NavLink to="/admin/settings"><span>⚙️</span> Settings</NavLink>
          <a href="/" target="_blank" rel="noopener noreferrer" className="ext"><span>🌐</span> View website ↗</a>
        </nav>
        <div className="who"><NavLink to="/admin/password">Change password</NavLink><button className="linkbtn" onClick={logout}>Log out</button></div>
      </aside>
      <main><Outlet /></main>
    </div>
  );
}

export default function AdminApp() {
  const [user, setUser] = useState(undefined), [schema, setSchema] = useState(null);
  const nav = useNavigate();
  useEffect(() => { api('/api/admin/me').then(r => setUser(r.user)).catch(() => setUser(null)); }, []);
  useEffect(() => { if (user) api('/api/admin/schema').then(setSchema); }, [user]);
  useEffect(() => { document.title = 'Admin'; }, []);
  if (user === undefined || (user && !schema)) return <div className="center-msg">Loading…</div>;
  if (!user) return <Login onLogin={setUser} />;
  const logout = async () => { await api('/api/admin/logout', { method: 'POST' }); setUser(null); setSchema(null); nav('/admin'); };
  return (
    <Ctx.Provider value={{ user, schema, logout }}>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Dashboard />} />
          <Route path="c/:col" element={<Resource />} />
          <Route path="settings" element={<Settings />} />
          <Route path="password" element={<Password />} />
        </Route>
      </Routes>
    </Ctx.Provider>
  );
}
