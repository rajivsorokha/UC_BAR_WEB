import { telLink, useSEO, useSite, waLink } from '../site.jsx';
import LeadForm from '../components/LeadForm.jsx';
import { PageHero } from '../components/common.jsx';

export default function Contact() {
  const { site } = useSite(); useSEO('Contact us', 'Contact UC Bar Infotech for quotes, product advice and support.');
  const s = site.settings, wa = waLink(s);
  return (
    <>
      <PageHero title="Contact us" subtitle="Request a quote, ask about a product, or talk to our team." />
      <section className="section"><div className="wrap contact-grid">
        <div className="card" style={{ padding: 26 }}>
          <h2 style={{ fontSize: '1.4rem' }}>Send us your requirement</h2>
          <LeadForm />
        </div>
        <div>
          <div className="card office" style={{ marginBottom: 20 }}>
            <h3>Talk to us now</h3>
            {s.phones && <p>📞 {telLink(s.phones) ? <a href={telLink(s.phones)}>{s.phones}</a> : s.phones}</p>}
            {s.email && <p>✉ <a href={`mailto:${s.email}`}>{s.email}</a></p>}
            {wa && <p style={{ marginTop: 12 }}><a className="btn wa sm" href={wa} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a></p>}
          </div>
          {site.offices.map(o => (
            <div className="card office" key={o.id} style={{ marginBottom: 20 }}>
              <h3>{o.name}</h3>
              {o.address?.length > 0 && <p>📍 {o.address.join(', ')}</p>}
              {o.phone && <p>📞 {o.phone}</p>}
              {o.whatsapp && <p>💬 WhatsApp: <a href={`https://wa.me/${o.whatsapp.replace(/\D/g, '').replace(/^(\d{10})$/, '91$1')}`} target="_blank" rel="noopener noreferrer">{o.whatsapp}</a></p>}
              {o.email && <p>✉ <a href={`mailto:${o.email}`}>{o.email}</a></p>}
            </div>
          ))}
        </div>
      </div></section>
    </>
  );
}
