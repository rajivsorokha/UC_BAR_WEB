import { Link } from 'react-router-dom';
import { useSEO, useSite } from '../site.jsx';
import { CtaBand, PageHero, Updates } from '../components/common.jsx';

export default function Software() {
  const { site } = useSite(); useSEO('Software Solutions', 'Custom barcode, tracking and mobile terminal software for manufacturing, logistics, warehouse and retail.');
  return (
    <>
      <PageHero title="Software Solutions" subtitle={site.settings.softwareIntro} />
      {site.software.length > 0 && (
        <section className="section"><div className="wrap">
          <div className="sec-head"><div><h2>Recently developed</h2><p>A selection of applications we have built and supported for clients.</p></div></div>
          <div className="grid g4">
            {site.software.map(w => (
              <div className="card sw" key={w.id}>
                <div className="img">{w.image && <img src={w.image} alt={w.name} loading="lazy" />}</div>
                <div className="body"><h3>{w.name}</h3><p>{w.description}</p>{w.url && <a href={w.url} target="_blank" rel="noopener noreferrer" className="btn sm">Visit website ↗</a>}</div>
              </div>
            ))}
          </div>
        </div></section>
      )}
      <Updates kind="software" title="Latest software updates" />
      <CtaBand title="Need custom software?" text="From visitor tracking to PLC integration and mobile terminal apps — tell us what you need to automate." />
    </>
  );
}
