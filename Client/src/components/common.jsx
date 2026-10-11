import { Link } from 'react-router-dom';
import { fmtDate, useSite, waLink } from '../site.jsx';

export const PageHero = ({ title, subtitle }) => (
  <div className="page-hero"><div className="wrap"><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div></div>
);

export const Logos = ({ items }) => items.length ? (
  <div className="logos">{items.map(p => <div className="logo" key={p.id} title={p.name}><img src={p.image} alt={p.name} loading="lazy" /></div>)}</div>
) : null;

export function Updates({ kind, title }) {
  const { site } = useSite();
  const list = site.updates.filter(u => u.kind === kind).slice(0, 10);
  if (!list.length) return null;
  return (
    <section className="section alt"><div className="wrap">
      <div className="sec-head"><h2>{title}</h2></div>
      {list.map(u => (
        <div className="card upd" key={u.id}>
          <div><h3>{u.title}{u.version && <span className="v">v{u.version.replace(/^v/i, '')}</span>}</h3>{u.body && <p>{u.body}</p>}</div>
          <div style={{ textAlign: 'right' }}><small>{fmtDate(u.date)}</small>{u.file && <div style={{ marginTop: 8 }}><a className="btn sm primary" href={u.file} download>⬇ Download</a></div>}</div>
        </div>
      ))}
    </div></section>
  );
}

export function CtaBand({ title = 'Need a quote or advice?', text = 'Tell us your requirement and our team will get back to you quickly.' }) {
  const { site } = useSite(); const wa = waLink(site.settings);
  return (
    <section className="cta"><div className="wrap">
      <h2>{title}</h2><p>{text}</p>
      <div className="actions"><Link to="/contact" className="btn">Request a quote</Link>{wa && <a className="btn wa" href={wa} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>}</div>
    </div></section>
  );
}
