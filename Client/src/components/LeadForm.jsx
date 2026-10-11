import { useState } from 'react';
import { api } from '../api.js';

// Enquiry / quote form. `interest` pre-fills what the visitor is asking about.
export default function LeadForm({ interest = '', source = 'contact-form', transcript, submitLabel = 'Send enquiry', compact = false, onDone }) {
  const [f, setF] = useState({ name: '', phone: '', email: '', message: '', website: '' });
  const [state, setState] = useState({ busy: false, ok: false, error: '' });
  const set = k => e => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setState({ busy: true, ok: false, error: '' });
    try {
      await api('/api/public/leads', { method: 'POST', body: { ...f, interest, source, transcript } });
      setState({ busy: false, ok: true, error: '' }); onDone?.();
    } catch (err) { setState({ busy: false, ok: false, error: err.message }); }
  }
  if (state.ok) return <div className="note ok">✅ Thank you! Our team will contact you shortly.</div>;
  return (
    <form className="form" onSubmit={submit}>
      <div className="two">
        <label>Name *<input value={f.name} onChange={set('name')} required autoComplete="name" /></label>
        <label>Phone / WhatsApp<input value={f.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" /></label>
      </div>
      {!compact && <label>Email<input type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>}
      {interest && <div className="note" style={{ background: '#f1f5f9' }}>Enquiry about: <b>{interest}</b></div>}
      <label>Your requirement<textarea rows={compact ? 2 : 4} value={f.message} onChange={set('message')} placeholder="Product, quantity, industry…" /></label>
      <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set('website')} placeholder="website" />
      {state.error && <div className="note err">{state.error}</div>}
      <button className="btn primary" disabled={state.busy}>{state.busy ? 'Sending…' : submitLabel}</button>
      {!compact && <small style={{ color: 'var(--muted)' }}>Provide a phone number or an email so we can reply.</small>}
    </form>
  );
}
