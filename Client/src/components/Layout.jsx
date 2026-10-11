import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSite, waLink, telLink } from '../site.jsx';
import ChatWidget from './ChatWidget.jsx';

export default function Layout() {
  const { site, error } = useSite();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [pathname]);

  if (error) return <div className="center-msg">Sorry, the site could not be loaded. Please refresh.</div>;
  if (!site) return <div className="center-msg">Loading…</div>;
  const s = site.settings, wa = waLink(s);
  const year = new Date().getFullYear();

  return (
    <>
      <div className="topbar"><div className="wrap">
        <span>{s.tagline}</span>
        <span>{telLink(s.phones) ? <a href={telLink(s.phones)}>📞 {s.phones}</a> : s.phones}{s.email && <> · <a href={`mailto:${s.email}`}>✉ {s.email}</a></>}</span>
      </div></div>
      <header className="header"><div className="wrap">
        <Link to="/" className="brand"><img src={s.logo || '/images/logo.png'} alt={s.companyName} /></Link>
        <button className="burger" aria-label="Menu" onClick={() => setOpen(o => !o)}>{open ? '✕' : '☰'}</button>
        <nav className={'nav' + (open ? ' open' : '')}>
          <NavLink to="/" end>Home</NavLink>
          <div className="dd">
            <NavLink to="/products">Products ▾</NavLink>
            <div className="dd-menu">
              {site.categories.map(c => <NavLink key={c.id} to={`/products/${c.id}`}>{c.name}</NavLink>)}
            </div>
          </div>
          <NavLink to="/software">Software</NavLink>
          <NavLink to="/support">Support</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>
        <Link to="/contact" className="btn primary sm cta">Get a quote</Link>
      </div></header>

      <main><Outlet /></main>

      <footer className="footer">
        <div className="wrap">
          <div className="cols">
            <div>
              <img src={s.logo || '/images/logo.png'} alt="" />
              <p>{s.companyName}<br />{s.tagline}</p>
              {wa && <a className="btn wa sm" href={wa} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex' }}>Chat on WhatsApp</a>}
            </div>
            <div>
              <h4>Products</h4>
              {site.categories.map(c => <Link key={c.id} to={`/products/${c.id}`}>{c.name}</Link>)}
              <Link to="/software">Software solutions</Link>
            </div>
            <div>
              <h4>Contact</h4>
              {s.phones && <div>📞 {s.phones}</div>}
              {s.email && <a href={`mailto:${s.email}`}>✉ {s.email}</a>}
              {site.offices[0] && <div style={{ marginTop: 8 }}>📍 {site.offices[0].address?.join(', ')}</div>}
            </div>
          </div>
          <div className="copy">© {s.footerSince ? `${s.footerSince}–` : ''}{year} {s.footerText}</div>
        </div>
      </footer>
      <ChatWidget />
    </>
  );
}
