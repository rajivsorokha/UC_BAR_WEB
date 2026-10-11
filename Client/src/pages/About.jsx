import { fmtMonth, useSEO, useSite } from '../site.jsx';
import { CtaBand, Logos, PageHero } from '../components/common.jsx';

export default function About() {
  const { site } = useSite(); useSEO('About us');
  const s = site.settings;
  return (
    <>
      <PageHero title={`About ${s.companyName || 'us'}`} subtitle={s.tagline} />
      <section className="section"><div className="wrap about-grid">
        <div>{(s.aboutText || '').split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}</div>
        <div className="mission"><h3>{s.aboutTitle || 'Our mission'}</h3><p>{s.mission}</p></div>
      </div></section>
      {site.events.length > 0 && (
        <section className="section alt"><div className="wrap">
          <div className="sec-head"><h2>Events & assets</h2></div>
          <div className="grid g2">
            {site.events.map(e => (
              <div className="card ev" key={e.id}>
                <div className="ph">{e.image && <img src={e.image} alt="" loading="lazy" />}</div>
                <div className="t"><small>{e.type === 'event' ? 'Event' : 'New asset'}{e.date ? ' · ' + fmtMonth(e.date) : ''}</small><h3>{e.title}</h3><p>{e.description}</p></div>
              </div>
            ))}
          </div>
        </div></section>
      )}
      {site.partners.some(p => p.kind === 'certificate') && <section className="section"><div className="wrap"><div className="sec-head"><h2>Certifications</h2></div><Logos items={site.partners.filter(p => p.kind === 'certificate')} /></div></section>}
      {site.partners.some(p => p.kind === 'client') && <section className="section alt"><div className="wrap"><div className="sec-head"><h2>Our clients</h2></div><Logos items={site.partners.filter(p => p.kind === 'client')} /></div></section>}
      <CtaBand />
    </>
  );
}
