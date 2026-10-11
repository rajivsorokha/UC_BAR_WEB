import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAdmin } from './AdminApp.jsx';
import Field, { toForm } from './fields.jsx';

function Cell({ f, v }) {
  if (!f) return null;
  if (f.type === 'image') return v ? <img className="thumb" src={v} alt="" /> : <span className="thumb empty" />;
  if (f.type === 'select') return <span className="pill">{f.options?.[v] || v}</span>;
  if (f.type === 'checkbox') return v ? '✓' : '–';
  if (f.name === 'createdAt') return v ? new Date(v).toLocaleString() : '';
  if (Array.isArray(v)) return v.join(', ').slice(0, 80);
  return String(v ?? '').slice(0, 90);
}

function FormModal({ col, def, item, preset, onClose, onSaved }) {
  const [vals, setVals] = useState(() => ({ ...toForm(def, item), ...(item ? {} : preset) }));
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  async function save(e) {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      await api(item ? `/api/admin/${col}/${item.id}` : `/api/admin/${col}`, { method: item ? 'PUT' : 'POST', body: vals });
      onSaved();
    } catch (ex) { setErr(ex.message); setBusy(false); }
  }
  return (
    <div className="modal-bg" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <form className="adm-modal" onSubmit={save}>
        <h2>{item ? 'Edit' : 'Add'} {def.singular.toLowerCase()}</h2>
        {err && <div className="flash err">{err}</div>}
        {def.fields.filter(f => !f.showIf || f.showIf.in.includes(vals[f.showIf.field])).map(f => <Field key={f.name} f={f} value={vals[f.name]} onChange={v => setVals({ ...vals, [f.name]: v })} />)}
        <div className="actions"><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button><button type="button" className="btn" onClick={onClose}>Cancel</button></div>
      </form>
    </div>
  );
}

export default function Resource() {
  const { col } = useParams();
  const { schema } = useAdmin();
  const def = schema.collections[col];
  const [items, setItems] = useState(null), [g, setG] = useState(''), [edit, setEdit] = useState(null), [msg, setMsg] = useState(null);
  const load = () => api(`/api/admin/${col}`).then(setItems).catch(e => setMsg({ t: 'err', m: e.message }));
  useEffect(() => { setItems(null); setG(''); setMsg(null); setEdit(null); if (def) load(); }, [col]); // eslint-disable-line
  if (!def) return <p>Unknown section.</p>;

  const gf = def.group && def.fields.find(f => f.name === def.group);
  const shown = (items || []).filter(i => !g || i[def.group] === g);
  const flash = (t, m) => setMsg({ t, m });

  async function move(item, dir) {
    const ids = items.map(i => i.id);
    let a = ids.indexOf(item.id), b = a + dir;
    while (b >= 0 && b < items.length && gf && items[b][def.group] !== item[def.group]) b += dir;
    if (b < 0 || b >= items.length) return;
    [ids[a], ids[b]] = [ids[b], ids[a]];
    setItems(ids.map(id => items.find(i => i.id === id)));
    try { await api(`/api/admin/${col}/order`, { method: 'PUT', body: { ids } }); } catch (e) { flash('err', e.message); load(); }
  }
  async function toggle(item) {
    try { await api(`/api/admin/${col}/${item.id}`, { method: 'PUT', body: { ...item, active: item.active === false } }); load(); } catch (e) { flash('err', e.message); }
  }
  async function remove(item) {
    if (!confirm(`Delete this ${def.singular.toLowerCase()}? This cannot be undone.`)) return;
    try { await api(`/api/admin/${col}/${item.id}`, { method: 'DELETE' }); flash('ok', 'Deleted.'); load(); } catch (e) { flash('err', e.message); }
  }

  return (
    <>
      <div className="bar">
        <div className="tabs">
          {gf && <><button className={!g ? 'on' : ''} onClick={() => setG('')}>All</button>{Object.entries(gf.options || {}).map(([k, l]) => <button key={k} className={g === k ? 'on' : ''} onClick={() => setG(k)}>{l}</button>)}</>}
        </div>
        {!def.noCreate && <button className="btn primary" onClick={() => setEdit({ item: null, preset: g && def.group ? { [def.group]: g } : {} })}>+ Add {def.singular.toLowerCase()}</button>}
      </div>
      {def.help && <p className="muted">{def.help}</p>}
      {msg && <div className={'flash ' + msg.t}>{msg.m}</div>}
      <div className="card tablewrap">
        <table>
          <thead><tr>{def.columns.map(c => <th key={c}>{def.fields.find(f => f.name === c)?.label || c}</th>)}{!def.noActive && <th>Status</th>}{!def.noOrder && <th className="r">Order</th>}<th className="r">Actions</th></tr></thead>
          <tbody>
            {!items && <tr><td colSpan={9} className="empty">Loading…</td></tr>}
            {items && !shown.length && <tr><td colSpan={9} className="empty">Nothing here yet.</td></tr>}
            {shown.map(it => (
              <tr key={it.id} className={it.active === false ? 'off' : ''}>
                {def.columns.map(c => <td key={c}><Cell f={def.fields.find(f => f.name === c)} v={it[c]} /></td>)}
                {!def.noActive && <td><button className={'chip ' + (it.active === false ? 'hid' : 'vis')} onClick={() => toggle(it)} title="Click to toggle">{it.active === false ? 'Hidden' : 'Visible'}</button></td>}
                {!def.noOrder && <td className="r nowrap"><button className="icon" onClick={() => move(it, -1)} title="Move up">↑</button> <button className="icon" onClick={() => move(it, 1)} title="Move down">↓</button></td>}
                <td className="r nowrap"><button className="btn sm" onClick={() => setEdit({ item: it })}>Edit</button> <button className="btn sm danger" onClick={() => remove(it)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && <FormModal col={col} def={def} item={edit.item} preset={edit.preset} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); flash('ok', 'Saved. Changes are live on the website.'); load(); }} />}
    </>
  );
}
