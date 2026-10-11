import { useState } from 'react';
import { useSite, waLink } from '../site.jsx';
import LeadForm from './LeadForm.jsx';
import { Modal } from './ProductCard.jsx';

// Home section: the label-printing machine (specification) + "we print barcode labels to order" service.
// Everything shown here is editable in Admin → Settings → "Label printing machine & service".
export default function MachineryService() {
  const { site } = useSite();
  const s = site.settings;
  const [ask, setAsk] = useState(null);                       // { title, interest }
  const specs = String(s.machineSpecs || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  if (!s.machineTitle && !s.serviceTitle) return null;
  const waMachine = waLink(s, `Hello, I'd like details about the ${s.machineTitle}.`);
  const waPrint = waLink(s, 'Hello, I would like to place a barcode label printing order.');

  return (
    <section className="section" id="label-machinery"><div className="wrap">
      <div className="sec-head"><div>
        <h2>Label printing — machinery &amp; service</h2>
        <p>Our auto sticker label printing machinery, and barcode label printing to order.</p>
      </div></div>
      <div className="grid g2">
        {s.machineTitle && (
          <article className="card mach">
            <span className="badge">Machinery</span>
            <h3>{s.machineTitle}</h3>
            {specs.length > 0 && <ul className="ticks">{specs.map((t, i) => <li key={i}>{t}</li>)}</ul>}
            <div className="acts">
              <button className="btn primary" onClick={() => setAsk({ title: `Enquire about ${s.machineTitle}`, interest: s.machineTitle })}>Enquire about this machine</button>
              {waMachine && <a className="btn wa" href={waMachine} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
            </div>
          </article>
        )}
        {s.serviceTitle && (
          <article className="mach svc">
            <span className="badge">Printing service</span>
            <h3>{s.serviceTitle}</h3>
            <p>{s.serviceText}</p>
            <div className="acts">
              <button className="btn" onClick={() => setAsk({ title: 'Request a printing quote', interest: 'Barcode label printing order' })}>Request a printing quote</button>
              {waPrint && <a className="btn wa" href={waPrint} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
            </div>
          </article>
        )}
      </div>
      {ask && (
        <Modal onClose={() => setAsk(null)}>
          <div style={{ padding: 28, maxWidth: 560, margin: '0 auto' }}>
            <h2 style={{ marginTop: 0 }}>{ask.title}</h2>
            <LeadForm interest={ask.interest} source="machinery" compact submitLabel="Send request" />
          </div>
        </Modal>
      )}
    </div></section>
  );
}
