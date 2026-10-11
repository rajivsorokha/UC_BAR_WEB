import { useEffect, useState } from 'react';

// Animated hero: the Flexomaster label-printing machine. All overlay coordinates are in the pixel space of
// the cut-out photo (1140 × 702), so they stay aligned at any size. Respects "reduce motion".
const W = 1140, H = 702;
const PITCH = 38, TYPES = 3, LOOP = PITCH * TYPES;        // seamless loop = 3 label designs
const STATIONS = Array.from({ length: 8 }, (_, i) => ({ x: 62 + i * 28, y: 368 + i * 2.3 }));
const INKS = ['#00b7ff', '#ff2d95', '#ffd400', '#e5e7eb'];  // C M Y K(white on dark)

function usePrefersReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)');
    setR(q.matches); const f = e => setR(e.matches); q.addEventListener('change', f); return () => q.removeEventListener('change', f);
  }, []);
  return r;
}

// one label on the web, drawn in the web's own (across, along) coordinates
function Label({ k, printed }) {
  const y = k * PITCH + 3, t = ((k % TYPES) + TYPES) % TYPES;
  if (!printed) return <rect x="6" y={y} width="112" height="32" rx="4" fill="#e9edf3" stroke="#cdd5e1" strokeWidth="1" />;
  const fills = ['#10b981', '#60a5fa', '#f59e0b'];
  return (
    <g>
      <rect x="6" y={y} width="112" height="32" rx="4" fill={fills[t]} />
      <rect x="6" y={y} width="112" height="32" rx="4" fill="url(#pm-sheen)" />
      <circle cx="24" cy={y + 16} r="8" fill="#fff" opacity=".92" />
      <text x="24" y={y + 19.5} fontSize="9" fontWeight="800" textAnchor="middle" fill="#c52d2f" fontFamily="system-ui,sans-serif">UC</text>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => <rect key={i} x={46 + i * 5.2} y={y + 7} width={i % 3 === 0 ? 3 : 1.6} height="18" fill="#fff" opacity=".9" />)}
    </g>
  );
}

export default function HeroMachine({ caption }) {
  const reduced = usePrefersReducedMotion();
  const labels = [-1, 0, 1, 2, 3, 4, 5, 6];               // enough rows that the loop never shows a gap
  return (
    <div className={'machine' + (reduced ? ' still' : '')}>
      <div className="machine-stage">
        <img src="/images/hero/flexomaster.webp" width={W} height={H} alt="Flexo label printing machine" fetchPriority="high" />
        <svg className="machine-fx" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
          <defs>
            <clipPath id="pm-web"><polygon points="570,335 678,336 753,443 637,446" /></clipPath>
            <clipPath id="pm-cap"><ellipse cx="835" cy="517" rx="52" ry="84" /></clipPath>
            <clipPath id="pm-roll"><polygon points="884,440 1010,452 1016,584 884,602" /></clipPath>
            <linearGradient id="pm-sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity=".28" /><stop offset=".5" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".18" /></linearGradient>
            {/* blank → printed as the label passes the print line */}
            <linearGradient id="pm-reveal" gradientUnits="userSpaceOnUse" x1="0" y1="26" x2="0" y2="52"><stop offset="0" stopColor="#000" /><stop offset="1" stopColor="#fff" /></linearGradient>
            <mask id="pm-printmask" maskUnits="userSpaceOnUse" x="-20" y="-60" width="200" height="420"><rect x="-20" y="-60" width="200" height="420" fill="url(#pm-reveal)" /></mask>
            <linearGradient id="pm-cmyk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#00b7ff" /><stop offset=".33" stopColor="#ff2d95" /><stop offset=".66" stopColor="#ffd400" /><stop offset="1" stopColor="#fff" /></linearGradient>
            <linearGradient id="pm-band" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".45" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
            <linearGradient id="pm-glint" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".7" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
            {INKS.map((c, i) => <radialGradient key={i} id={`pm-led${i}`}><stop offset="0" stopColor={c} stopOpacity="1" /><stop offset=".35" stopColor={c} stopOpacity=".7" /><stop offset="1" stopColor={c} stopOpacity="0" /></radialGradient>)}
          </defs>

          {/* 1 ─ the web of labels feeding through the machine, printing as it goes */}
          <g className="pm-web" clipPath="url(#pm-web)">
            <g transform="matrix(1 0.009 0.6036 1 570 335)">
              <rect x="-10" y="-10" width="150" height="330" fill="#cfd6e2" />
              <g className="pm-feed">{labels.map(k => <Label key={k} k={k} printed={false} />)}</g>
              <g mask="url(#pm-printmask)"><g className="pm-feed">{labels.map(k => <Label key={k} k={k} printed />)}</g></g>
              <rect className="pm-flash" x="0" y="31" width="140" height="5" fill="url(#pm-cmyk)" />
              <rect className="pm-flash" x="0" y="26" width="140" height="15" fill="url(#pm-cmyk)" opacity=".25" />
            </g>
          </g>
          <polygon points="570,335 678,336 753,443 637,446" fill="none" stroke="#f1f5f9" strokeWidth="2.2" opacity=".75" />

          {/* 2 ─ ink stations pulsing C → M → Y → K down the line */}
          {STATIONS.map((s, i) => (
            <g key={i} className="pm-led" style={{ animationDelay: `${i * 0.2}s` }}>
              <circle cx={s.x} cy={s.y} r="13" fill={`url(#pm-led${i % 4})`} />
              <circle cx={s.x} cy={s.y} r="3.2" fill={INKS[i % 4]} />
            </g>
          ))}

          {/* 3 ─ rewind roll: glint sweeping the core, bands rolling over the printed labels */}
          <g clipPath="url(#pm-cap)">
            <g transform="translate(835 517) scale(.62 1)">
              <g>
                {!reduced && <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2.2s" repeatCount="indefinite" />}
                <rect x="-9" y="-130" width="18" height="260" fill="url(#pm-glint)" />
                <rect x="-9" y="-130" width="18" height="260" fill="url(#pm-glint)" transform="rotate(90)" opacity=".6" />
              </g>
            </g>
          </g>
          <g clipPath="url(#pm-roll)">
            <rect className="pm-roll" x="880" y="410" width="140" height="70" fill="url(#pm-band)" />
            <rect className="pm-roll" x="880" y="410" width="140" height="70" fill="url(#pm-band)" style={{ animationDelay: '-.8s' }} />
          </g>
        </svg>
      </div>
      {caption?.title && (
        <a className="machine-caption" href="#label-machinery">
          <b>{caption.title}</b>{caption.text && <span>{caption.text} →</span>}
        </a>
      )}
      <div className="machine-sweep" aria-hidden="true" />
    </div>
  );
}
