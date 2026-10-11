import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSEO, useSite } from '../site.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { CtaBand, PageHero } from '../components/common.jsx';
import NotFound from './NotFound.jsx';

export default function Products() {
  const { slug } = useParams();
  const { site } = useSite();
  const [q, setQ] = useState('');
  const cat = slug ? site.categories.find(c => c.id === slug) : null;
  useSEO(cat ? cat.name : 'Products', cat?.description);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return site.products.filter(p => (!cat || p.category === cat.id) && (!t || (p.name + ' ' + (p.specs || []).join(' ')).toLowerCase().includes(t)));
  }, [site, cat, q]);

  if (slug && !cat) return <NotFound />;
  return (
    <>
      <PageHero title={cat ? cat.name : 'Products'} subtitle={cat ? cat.description : 'Barcode scanners, printers, ID card printers, mobile terminals, labels and ribbons.'} />
      <section className="section"><div className="wrap">
        <div className="chips">
          <Link to="/products" className={'chip' + (!cat ? ' on' : '')}>All</Link>
          {site.categories.map(c => <Link key={c.id} to={`/products/${c.id}`} className={'chip' + (cat?.id === c.id ? ' on' : '')}>{c.name}</Link>)}
        </div>
        <input className="search" placeholder="Search products…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search products" style={{ marginBottom: 24 }} />
        {list.length ? <div className="grid g4">{list.map(p => <ProductCard key={p.id} p={p} />)}</div> : <p style={{ color: 'var(--muted)' }}>No products found. Try a different search, or <Link to="/contact" style={{ color: 'var(--red)' }}>ask our team</Link>.</p>}
      </div></section>
      <CtaBand title="Can't find what you need?" text="We stock all major brands and can source specific models — tell us what you're looking for." />
    </>
  );
}
