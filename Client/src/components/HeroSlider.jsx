import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSite, waLink } from '../site.jsx';
import HeroMachine from './HeroMachine.jsx';

// Sliding home banner: products and work. Slides come from Admin → Banner Slides.
// Autoplay is driven by the progress bar's CSS animation (one source of truth: pause the animation = pause the slider).
const DUR = 7000, DUR_MACHINE = 9500;
const MACHINE_THUMB = '/images/hero/flexomaster.webp';
const hex = c => (/^#[0-9a-f]{6}$/i.test(c || '') ? c : '#c52d2f');
const pad = n => String(n).padStart(2, '0');

function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)');
    setR(q.matches); const f = e => setR(e.matches); q.addEventListener('change', f); return () => q.removeEventListener('change', f);
  }, []);
  return r;
}

function Cta({ to, className, children }) {
  if (!to) return null;
  return /^\/(?!\/)/.test(to) ? <Link to={to} className={className}>{children}</Link> : <a href={to} className={className} {...(/^https?:/.test(to) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>;
}

export default function HeroSlider() {
  const { site } = useSite();
  const s = site.settings, slides = site.slides, n = slides.length;
  const reduced = useReducedMotion();
  const [i, setI] = useState(0), [dir, setDir] = useState(1), [userPaused, setUserPaused] = useState(false);
  const [hover, setHover] = useState(false), [focusKb, setFocusKb] = useState(false), [touching, setTouching] = useState(false); // mouse / keyboard focus / finger: tracked separately
  const [machineKey, setMachineKey] = useState(0);
  const cards = useRef(null), touch = useRef(null);
  const wa = waLink(s);

  const go = useCallback((to, d) => { const t = ((to % n) + n) % n; setDir(d ?? (t > i ? 1 : -1)); setI(t); }, [i, n]);
  const next = useCallback(() => go(i + 1, 1), [go, i]);
  const prev = useCallback(() => go(i - 1, -1), [go, i]);

  useEffect(() => { if (slides[i]?.kind === 'machine') setMachineKey(k => k + 1); }, [i]); // replay the "print-in" each time
  useEffect(() => {                                                                          // keep the active preview card visible
    const el = cards.current?.children[i]; if (el) cards.current.scrollTo({ left: el.offsetLeft - 16, behavior: reduced ? 'auto' : 'smooth' });
  }, [i, reduced]);

  const paused = hover || focusKb || touching || userPaused;
  const autoplay = !reduced && n > 1;
  const dur = slides[i]?.kind === 'machine' ? DUR_MACHINE : DUR;
  const stats = [[`${site.products.length}+`, 'products'], [site.categories.length, 'categories'], ['Online & offline', 'support']];

  return (
    <section
      className={'hslider' + (paused ? ' paused' : '') + (reduced ? ' calm' : '')}
      style={{ '--dir': dir }}
      role="region" aria-roledescription="carousel" aria-label="Featured products and work" tabIndex={0}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onFocus={e => { if (e.target.matches?.(':focus-visible')) setFocusKb(true); }} onBlur={() => setFocusKb(false)} // keyboard users only: a mouse click must not leave it paused
      onKeyDown={e => { if (e.key === 'ArrowRight') { e.preventDefault(); next(); } if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); } }}
      onTouchStart={e => { touch.current = e.touches[0].clientX; setTouching(true); }}
      onTouchEnd={e => { const d = e.changedTouches[0].clientX - (touch.current ?? 0); if (Math.abs(d) > 50) (d < 0 ? next() : prev()); touch.current = null; setTouching(false); }}
    >
      {slides.map((sl, k) => {
        const on = k === i, ac = hex(sl.accent), H = k === 0 ? 'h1' : 'h2';
        return (
          <article key={sl.id} className={`hs hk-${sl.kind}${on ? ' on' : ''}`} style={{ '--ac': ac, '--ac-soft': ac + '40', '--ac-glow': ac + '77' }}
            role="group" aria-roledescription="slide" aria-label={`${k + 1} of ${n}`} aria-hidden={!on}>
            <div className="hs-bg">{sl.kind === 'photo' && sl.image && <div className="hs-photo" style={{ backgroundImage: `url(${sl.image})` }} />}</div>
            <div className="hs-in">
              <div className="hs-txt">
                {sl.kicker && <span className="hs-k">{sl.kicker}</span>}
                <H className="hs-t">{sl.title.split(/\s+/).map((w, wi) => <span className="w" key={wi}><span className="wi" style={{ '--i': wi }}>{w}</span></span>)}</H>
                {sl.subtitle && <p className="hs-s">{sl.subtitle}</p>}
                <div className="hs-a">
                  <Cta to={sl.ctaLink} className="btn primary">{sl.ctaLabel || 'Learn more'}</Cta>
                  <Link to="/contact" className="btn ghost">Get a quote</Link>
                  {wa && <a className="btn wa" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp us</a>}
                </div>
                {sl.kind === 'machine' && <div className="stats">{stats.map(([b, t]) => <span key={t}><b>{b}</b>{t}</span>)}</div>}
              </div>
              <div className="hs-vis">
                {sl.kind === 'machine' && <HeroMachine key={machineKey} caption={{ title: s.machineTitle, text: s.machineCaption }} />}
                {sl.kind === 'product' && sl.image && (
                  <div className="hs-stage"><i className="hs-ring" /><i className="hs-ring r2" /><img className="hs-prod" src={sl.image} alt={sl.title} loading={k < 2 ? 'eager' : 'lazy'} /></div>
                )}
              </div>
            </div>
          </article>
        );
      })}

      {n > 1 && (
        <div className="hs-nav">
          <div className="hs-nav-in">
            <div className="hs-ctl">
              <span className="hs-count" aria-live="off"><b>{pad(i + 1)}</b><em>/ {pad(n)}</em></span>
              <button onClick={prev} aria-label="Previous slide">‹</button>
              <button onClick={next} aria-label="Next slide">›</button>
              {autoplay && <button onClick={() => setUserPaused(p => !p)} aria-label={userPaused ? 'Play slideshow' : 'Pause slideshow'}>{userPaused ? '▶' : '❚❚'}</button>}
            </div>
            <div className="hs-cards" ref={cards} role="tablist" aria-label="Choose slide">
              {slides.map((sl, k) => (
                <button key={sl.id} role="tab" aria-selected={k === i} className={'hs-card' + (k === i ? ' on' : '')} style={{ '--ac': hex(sl.accent) }} onClick={() => go(k)} title={sl.title}>
                  <span className={'hs-ci' + (sl.kind === 'photo' ? ' cover' : '')} style={{ backgroundImage: `url(${sl.kind === 'machine' ? MACHINE_THUMB : sl.image})` }} />
                  <span className="hs-cl"><small>{sl.kicker || (sl.kind === 'machine' ? 'Machinery' : '')}</small><b>{sl.title}</b></span>
                </button>
              ))}
            </div>
            <div className="hs-dots" role="tablist" aria-label="Choose slide">
              {slides.map((sl, k) => <button key={sl.id} role="tab" aria-selected={k === i} className={k === i ? 'on' : ''} onClick={() => go(k)} aria-label={`Slide ${k + 1}: ${sl.title}`} />)}
            </div>
          </div>
          <div className="hs-bar" aria-hidden="true">
            {autoplay && <i key={i + '-' + machineKey} className="hs-prog" style={{ animationDuration: dur + 'ms', '--ac': hex(slides[i]?.accent) }} onAnimationEnd={next} />}
          </div>
        </div>
      )}
    </section>
  );
}
