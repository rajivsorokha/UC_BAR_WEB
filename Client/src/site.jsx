import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const Ctx = createContext(null);
export const useSite = () => useContext(Ctx);

export function SiteProvider({ children }) {
  const [state, setState] = useState({ site: null, error: null });
  useEffect(() => { api('/api/public/site').then(site => setState({ site, error: null })).catch(e => setState({ site: null, error: e.message })); }, []);
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export const waLink = (settings, text) => {
  const n = String(settings?.whatsappNumber || '').replace(/\D/g, '');
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text || settings.whatsappMessage || '')}` : '';
};
export const telLink = phones => { const m = String(phones || '').match(/\+?[\d][\d\s-]{6,}/); return m ? 'tel:' + m[0].replace(/[\s-]/g, '') : ''; };
export const fmtDate = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; };
export const fmtMonth = iso => { const m = /^(\d{4})-(\d{2})/.exec(iso || ''); return m ? new Date(+m[1], +m[2] - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''; };

export function useSEO(title, description) {
  const { site } = useSite() || {};
  useEffect(() => {
    if (!site) return;
    const s = site.settings;
    document.title = title ? `${title} | ${s.companyName || ''}`.replace(/ \| $/, '') : (s.siteTitle || s.companyName || '');
    const meta = document.querySelector('meta[name=description]');
    if (meta) meta.content = description || s.siteDescription || '';
  }, [site, title, description]);
}
