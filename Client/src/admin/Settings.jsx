import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAdmin } from './AdminApp.jsx';
import Field from './fields.jsx';

export default function Settings() {
  const { schema } = useAdmin();
  const [vals, setVals] = useState(null), [msg, setMsg] = useState(null), [busy, setBusy] = useState(false);
  useEffect(() => {
    api('/api/admin/settings').then(v => {
      const withDefaults = { ...v };   // a select that was never saved yet must start on a real option
      schema.settingsGroups.flatMap(g => g.fields).forEach(f => { if (f.type === 'select' && !withDefaults[f.name]) withDefaults[f.name] = Object.keys(f.options)[0]; });
      setVals(withDefaults);
    });
  }, []); // eslint-disable-line
  if (!vals) return <p>Loading…</p>;
  async function save(e) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try { await api('/api/admin/settings', { method: 'PUT', body: vals }); setMsg({ t: 'ok', m: 'Settings saved. Live on the website.' }); } catch (ex) { setMsg({ t: 'err', m: ex.message }); }
    setBusy(false);
  }
  return (
    <form onSubmit={save} className="settings">
      {msg && <div className={'flash ' + msg.t}>{msg.m}</div>}
      {schema.settingsGroups.map(g => (
        <fieldset className="card" key={g.title}><legend>{g.title}</legend>
          {g.fields.map(f => <Field key={f.name} f={f} value={vals[f.name] ?? ''} onChange={v => setVals({ ...vals, [f.name]: v })} />)}
        </fieldset>
      ))}
      <div className="actions"><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button></div>
      <AiStatus />
    </form>
  );
}

function AiStatus() {
  const [list, setList] = useState(null), [test, setTest] = useState(null), [busy, setBusy] = useState(false);
  const load = () => api('/api/admin/chat-status').then(setList).catch(() => {});
  useEffect(() => { load(); }, []);
  async function run() {
    setBusy(true); setTest(null);
    try { setTest(await api('/api/admin/chat-test', { method: 'POST' })); } catch (e) { setTest({ ok: false, error: e.message }); }
    setBusy(false); load();
  }
  if (!list) return null;
  return (
    <fieldset className="card" style={{ marginTop: 16 }}><legend>AI provider status</legend>
      <p className="muted" style={{ marginTop: 0 }}>Keys are read from your host's environment variables. Save your settings first, then send a test message.</p>
      <table>
        <tbody>{list.map(p => (
          <tr key={p.id}><td>{p.active ? '▶' : ''}</td><td><b>{p.label}</b></td>
            <td>{p.configured ? <span className="chip vis">Key found</span> : <span className="chip hid">Not set</span>}</td>
            <td className="muted"><code>{p.keyEnv}</code></td><td className="muted">{p.configured ? p.model || '—' : ''}</td></tr>
        ))}</tbody>
      </table>
      <div className="actions" style={{ marginTop: 12 }}><button type="button" className="btn" onClick={run} disabled={busy}>{busy ? 'Testing…' : 'Send test message'}</button></div>
      {test && (test.ok
        ? <div className="flash ok" style={{ marginTop: 12 }}>✅ Working — <b>{test.provider}</b> ({test.model}) replied:<br /><i>{test.reply}</i></div>
        : <div className="flash err" style={{ marginTop: 12 }}>❌ Not working. Visitors currently get basic catalogue-search answers instead.<br />{test.error}</div>)}
    </fieldset>
  );
}
