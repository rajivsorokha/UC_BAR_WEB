import { Link } from 'react-router-dom';
import { fmtMonth, useSEO, useSite, waLink } from '../site.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { CtaBand, Logos } from '../components/common.jsx';
import HeroMachine from '../components/HeroMachine.jsx';
import MachineryService from '../components/MachineryService.jsx';
import HeroSlider from '../components/HeroSlider.jsx';

export default function Home() {
  const { site } = useSite(); useSEO();
  const s = site.settings, wa = waLink(s);
  const featured = site.products.filter(p => p.featured).slice(0, 8);
  const n = Math.max(1, parseInt(s.eventsShown, 10) || 3);
  const events = site.events.filter(e => e.type === 'event').slice(0, n), assets = site.events.filter(e => e.type === 'asset').slice(0, n);
  const catCount = id => site.products.filter(p => p.category === id).length;
  const about = (s.aboutText || '').split(/\n\s*\n/)[0];
  const useSlider = s.heroStyle !== 'image' && (site.slides || []).length > 0;

  return (
    <>
      {useSlider ? <HeroSlider /> : (
      <section className="hero"><div className="wrap">
        <div>
          {s.heroKicker && <span className="kicker">{s.heroKicker}</span>}
          <h1>{s.heroTitle}</h1>
          {s.heroSubtitle && <p className="sub">{s.heroSubtitle}</p>}
          <div className="actions">
            <Link to="/products" className="btn primary">Explore products</Link>
            <Link to="/contact" className="btn ghost">Get a quote</Link>
            {wa && <a className="btn wa" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp us</a>}
          </div>
          <div className="stats"><span><b>{site.products.length}+</b>products</span><span><b>{site.categories.length}</b>categories</span><span><b>Online & offline</b>support</span></div>
        </div>
        {s.heroStyle === 'image'
          ? <div className="art">{s.heroImage && <img src={s.heroImage} alt="" />}</div>
          : <div className="art machine-art"><HeroMachine caption={{ title: s.machineTitle, text: s.machineCaption }} /></div>}
      </div></section>
      )}

      <MachineryService />

      {site.sectors.length > 0 && (
        <section className="section"><div className="wrap">
          <div className="sec-head"><div><h2>Solutions for every industry</h2><p>Barcodes and RFID that keep your operations accurate and traceable.</p></div></div>
          <div className="grid g4">{site.sectors.map(z => <div className="card sector" key={z.id}>{z.image && <img src={z.image} alt="" loading="lazy" />}<h3>{z.title}</h3><p>{z.text}</p></div>)}</div>
        </div></section>
      )}

      <section className="section alt"><div className="wrap">
        <div className="sec-head"><div><h2>Our product range</h2><p>Top-brand scanners, printers, labels and RFID — with bulk-order pricing.</p></div><Link className="btn" to="/products">View all products →</Link></div>
        <div className="grid g4">
          {site.categories.map(c => (
            <Link to={`/products/${c.id}`} className="card cat-card" key={c.id}>
              <div className="img">{c.image && <img src={c.image} alt="" loading="lazy" />}</div>
              <div className="body"><h3>{c.name}</h3><p>{c.description}</p><span className="more">{catCount(c.id)} products →</span></div>
            </Link>
          ))}
        </div>
      </div></section>

      {featured.length > 0 && (
        <section className="section"><div className="wrap">
          <div className="sec-head"><div><h2>Best selling products</h2><p>Popular picks from Honeywell, Zebra, TSC, SATO, Datalogic and more.</p></div></div>
          <div className="grid g4">{featured.map(p => <ProductCard key={p.id} p={p} />)}</div>
        </div></section>
      )}

      <section className="section alt"><div className="wrap about-grid">
        <div><h2>{s.companyName}</h2><p>{about}</p><Link className="btn" to="/about">Learn more about us</Link></div>
        <div className="mission"><h3>{s.aboutTitle || 'Our mission'}</h3><p>{s.mission}</p></div>
      </div></section>

      {(events.length > 0 || assets.length > 0) && (
        <section className="section"><div className="wrap">
          <div className="sec-head"><h2>Events & new machinery</h2></div>
          <div className="grid g2">
            {[...events, ...assets].map(e => (
              <div className="card ev" key={e.id}>
                <div className="ph">{e.image && <img src={e.image} alt="" loading="lazy" />}</div>
                <div className="t"><small>{e.type === 'event' ? 'Event' : 'New asset'}{e.date ? ' · ' + fmtMonth(e.date) : ''}</small><h3>{e.title}</h3><p>{e.description}</p></div>
              </div>
            ))}
          </div>
        </div></section>
      )}

      {site.partners.some(p => p.kind === 'client') && (
        <section className="section alt"><div className="wrap">
          <div className="sec-head"><h2>Trusted by</h2></div>
          <Logos items={site.partners.filter(p => p.kind === 'client')} />
        </div></section>
      )}
      <CtaBand />
    </>
  );
}
