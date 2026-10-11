import { Link } from 'react-router-dom';
import { useSEO, useSite } from '../site.jsx';
import { CtaBand, PageHero, Updates } from '../components/common.jsx';

export default function Support() {
  const { site } = useSite(); useSEO('Support', 'Hardware and software support, online and offline, for barcode scanners, printers, RFID and labels.');
  return (
    <>
      <PageHero title="Support" subtitle="We provide software and hardware support online as well as offline." />
      <section className="section"><div className="wrap">
        <div className="grid g3">
          {site.support.map(c => {
            const inner = <><div className="ic">{c.icon}</div><h3>{c.title}</h3><p>{c.description}</p></>;
            return c.link ? <Link key={c.id} to={c.link} className="card feat">{inner}</Link> : <div key={c.id} className="card feat">{inner}</div>;
          })}
        </div>
      </div></section>
      <Updates kind="support" title="Latest support updates & downloads" />
      {site.faqs.length > 0 && (
        <section className="section"><div className="wrap" style={{ maxWidth: 820 }}>
          <div className="sec-head"><h2>Frequently asked questions</h2></div>
          {site.faqs.map(f => <details className="faq" key={f.id}><summary>{f.question}</summary><p>{f.answer}</p></details>)}
        </div></section>
      )}
      <CtaBand title="Still need help?" text="Chat with our assistant, message us on WhatsApp, or request a callback." />
    </>
  );
}
