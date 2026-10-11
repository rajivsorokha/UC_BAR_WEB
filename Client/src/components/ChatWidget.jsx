import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { useSite, waLink } from '../site.jsx';
import LeadForm from './LeadForm.jsx';

const WA_ICON = <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16.04 3C9.4 3 4 8.4 4 15.03c0 2.12.55 4.18 1.6 6L4 29l8.17-1.57a12 12 0 0 0 3.87.64C22.67 28.07 28 22.67 28 16.04 28 9.4 22.68 3 16.04 3zm0 22.1c-1.2 0-2.38-.3-3.42-.9l-.5-.28-4.85.93.95-4.72-.3-.5a9.9 9.9 0 0 1-1.5-5.2c0-5.5 4.5-9.97 10.02-9.97 5.5 0 9.96 4.47 9.96 9.97s-4.47 9.97-9.97 9.97zm5.5-7.4c-.3-.15-1.8-.9-2.08-1-.28-.1-.48-.15-.68.15s-.8 1-.97 1.2c-.18.2-.36.22-.66.08-.3-.15-1.3-.48-2.46-1.52-.9-.8-1.52-1.8-1.7-2.1-.18-.3-.02-.47.13-.62.14-.13.3-.36.45-.54.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.65-.93-2.25-.25-.6-.5-.5-.68-.5h-.58c-.2 0-.53.08-.8.38s-1.05 1.02-1.05 2.5 1.08 2.9 1.23 3.1c.15.2 2.1 3.2 5.1 4.5.72.3 1.28.5 1.7.63.72.23 1.37.2 1.88.12.57-.08 1.8-.73 2.05-1.45.25-.7.25-1.3.18-1.45-.08-.13-.28-.2-.58-.35z"/></svg>;
const KEY = 'ucbar-chat';

export default function ChatWidget() {
  const { site } = useSite();
  const s = site.settings, mode = s.chatMode || 'both';
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [cb, setCb] = useState(false);
  const [text, setText] = useState('');
  const [msgs, setMsgs] = useState(() => { try { return JSON.parse(sessionStorage.getItem(KEY)) || []; } catch { return []; } });
  const end = useRef(null);
  const wa = waLink(s);

  useEffect(() => { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-30))); end.current?.scrollIntoView({ block: 'end' }); }, [msgs, busy, open, cb]);

  if (mode === 'off') return null;
  const showAI = mode === 'ai' || mode === 'both', showWA = (mode === 'whatsapp' || mode === 'both') && wa;

  async function send(content) {
    content = content.trim(); if (!content || busy) return;
    const next = [...msgs, { role: 'user', content }];
    setMsgs(next); setText(''); setBusy(true);
    try {
      const r = await api('/api/chat', { method: 'POST', body: { messages: next.slice(-12) } });
      setMsgs([...next, { role: 'assistant', content: r.reply || 'Sorry, I could not answer that.' }]);
    } catch (e) {
      setMsgs([...next, { role: 'assistant', content: e.status === 429 ? 'You are sending messages very quickly — please wait a moment, or reach us on WhatsApp.' : 'Sorry, something went wrong. Please try again or contact us on WhatsApp.' }]);
    } finally { setBusy(false); }
  }
  const quick = ['Find a barcode printer', 'Barcode scanner for retail', 'Labels & ribbons', 'Custom software'];
  const lastMsg = msgs.filter(m => m.role === 'user').slice(-1)[0]?.content || '';

  return (
    <>
      {open && showAI && (
        <section className="chat" aria-label="Chat assistant">
          <header><div><b>{s.chatName || 'Assistant'}</b><small>Ask about products, software & support</small></div><button onClick={() => setOpen(false)} aria-label="Close chat">✕</button></header>
          <div className="msgs">
            <div className="m bot">{s.chatWelcome || 'Hi! How can I help you?'}</div>
            {msgs.length === 0 && <div className="quick">{quick.map(q => <button key={q} onClick={() => send(q)}>{q}</button>)}</div>}
            {msgs.map((m, i) => <div key={i} className={'m ' + (m.role === 'user' ? 'me' : 'bot')}>{m.content}</div>)}
            {busy && <div className="m bot typing"><i /><i /><i /></div>}
            <div ref={end} />
          </div>
          {cb && <div className="cb"><b style={{ fontSize: '.9rem' }}>Request a callback</b><LeadForm compact source="chat" transcript={msgs} submitLabel="Call me back" onDone={() => setTimeout(() => setCb(false), 2500)} /></div>}
          <div className="foot">
            <form className="in" onSubmit={e => { e.preventDefault(); send(text); }}>
              <input value={text} onChange={e => setText(e.target.value)} placeholder="Type your question…" maxLength={500} aria-label="Message" />
              <button disabled={busy || !text.trim()}>Send</button>
            </form>
            <div className="links">
              <button onClick={() => setCb(c => !c)}>📞 {cb ? 'Hide form' : 'Request a callback'}</button>
              {wa && <a href={waLink(s, lastMsg ? `Hello, I was chatting on your website: "${lastMsg}"` : undefined)} target="_blank" rel="noopener noreferrer">Continue on WhatsApp →</a>}
            </div>
          </div>
        </section>
      )}
      <div className="float">
        {showWA && <a className="fab wa" href={wa} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" title="Chat on WhatsApp">{WA_ICON}</a>}
        {showAI && <button className="fab ai" onClick={() => setOpen(o => !o)} aria-label={open ? 'Close chat' : 'Open chat'} title="Ask our assistant">{open ? '✕' : '💬'}</button>}
      </div>
    </>
  );
}
