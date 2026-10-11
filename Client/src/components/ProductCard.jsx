import { useEffect, useState } from 'react';
import { useSite, waLink } from '../site.jsx';
import LeadForm from './LeadForm.jsx';

export function Modal({ onClose, children }) {
  useEffect(() => {
    const k = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="modal-bg" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true"><button className="x" onClick={onClose} aria-label="Close">×</button>{children}</div>
    </div>
  );
}

export default function ProductCard({ p }) {
  const { site } = useSite();
  const [open, setOpen] = useState(false), [quote, setQuote] = useState(false);
  const cat = site.categories.find(c => c.id === p.category);
  const wa = waLink(site.settings, `Hello, I'm interested in ${p.name}. Please share details and a quote.`);
  const specs = p.specs || [];
  return (
    <>
      <article className="card p-card">
        <div className="img" onClick={() => setOpen(true)}><img src={p.image} alt={p.name} loading="lazy" /></div>
        <div className="body">
          {cat && <span className="tag">{cat.name}</span>}
          <h3>{p.name}</h3>
          {specs.length > 0 && <ul>{specs.slice(0, 3).map((s, i) => <li key={i}>{s.replace(/<br\s*\/?>/gi, ' ').slice(0, 70)}</li>)}</ul>}
          <div className="row">
            <button className="btn sm" onClick={() => setOpen(true)}>Details</button>
            <button className="btn sm primary" onClick={() => { setOpen(true); setQuote(true); }}>Get quote</button>
          </div>
        </div>
      </article>
      {open && (
        <Modal onClose={() => { setOpen(false); setQuote(false); }}>
          <div className="pm">
            <div className="l"><img src={p.image} alt={p.name} /></div>
            <div className="r">
              {cat && <span className="tag" style={{ color: 'var(--red)', fontWeight: 700, fontSize: '.78rem', textTransform: 'uppercase' }}>{cat.name}</span>}
              <h2 style={{ margin: '.2em 0 .4em' }}>{p.name}</h2>
              {p.description && <p>{p.description}</p>}
              {quote ? <LeadForm interest={p.name} source="product" compact submitLabel="Request quote" /> : (
                <>
                  {specs.length > 0 && <ul>{specs.map((s, i) => <li key={i} dangerouslySetInnerHTML={{ __html: s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/&lt;br\s*\/?&gt;/gi, '<br/>') }} />)}</ul>}
                  <div className="acts">
                    <button className="btn primary" onClick={() => setQuote(true)}>Request a quote</button>
                    {wa && <a className="btn wa" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp us</a>}
                  </div>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
