import type { Era } from '../content/game'
import type { Look } from '../content/game-cards'

// THE VISITORS of the Time Machine game's fourth core, drawn in SVG: a backdrop for their era
// (brick and smoke, iron and lamps, an office, a data grid) and a simple figure in the clothes
// of their time (a top hat, a flat cap, a shirt and tie, a hoodie), who nods when pleased and
// tilts their head when puzzled.

export function SceneBackdrop({ era }: { era: Era }) {
  return (
    <svg className="scene-backdrop" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {era === 1 && (
        <>
          <rect width="160" height="90" fill="#8a6a4a" />
          <rect y="66" width="160" height="24" fill="#5a4030" />
          {Array.from({ length: 13 }, (_, r) => (
            <line key={r} x1="0" x2="160" y1={r * 5} y2={r * 5} stroke="#7a5a3c" strokeWidth="0.4" />
          ))}
          <rect x="128" y="8" width="9" height="30" fill="#5a4030" />
          <circle cx="133" cy="6" r="6" fill="#b0a898" opacity="0.6" />
        </>
      )}
      {era === 2 && (
        <>
          <rect width="160" height="90" fill="#5a5f66" />
          <rect y="66" width="160" height="24" fill="#3a3c40" />
          {[20, 60, 100, 140].map((x) => (
            <rect key={x} x={x - 1.5} y="0" width="3" height="66" fill="#2e3034" />
          ))}
          <rect y="8" width="160" height="3" fill="#2e3034" />
          {[40, 80, 120].map((x) => (
            <circle key={x} cx={x} cy="16" r="2.5" fill="#ffd36a" />
          ))}
        </>
      )}
      {era === 3 && (
        <>
          <rect width="160" height="90" fill="#cfd6d2" />
          <rect y="66" width="160" height="24" fill="#8a9690" />
          {[10, 50, 90, 130].map((x) => (
            <rect key={x} x={x} y="10" width="24" height="30" fill="#b6c0bb" stroke="#97a39d" strokeWidth="0.6" />
          ))}
          <rect x="112" y="48" width="22" height="16" fill="#3a4448" />
          <rect x="114" y="50" width="18" height="11" fill="#6be08b" opacity="0.6" />
        </>
      )}
      {era === 4 && (
        <>
          <rect width="160" height="90" fill="#0e2630" />
          <rect y="66" width="160" height="24" fill="#0a1a20" />
          {Array.from({ length: 9 }, (_, k) => (
            <line key={`v${k}`} x1={k * 20} x2={k * 20} y1="0" y2="66" stroke="#1f6f80" strokeWidth="0.3" />
          ))}
          {Array.from({ length: 5 }, (_, k) => (
            <line key={`h${k}`} x1="0" x2="160" y1={k * 16} y2={k * 16} stroke="#1f6f80" strokeWidth="0.3" />
          ))}
        </>
      )}
    </svg>
  )
}

const CLOTHES: Record<Look, { coat: string; trousers: string }> = {
  tophat: { coat: '#2a2a34', trousers: '#4a4038' },
  cap: { coat: '#5a4a3a', trousers: '#3a3a40' },
  tie: { coat: '#e8e8e4', trousers: '#3a4250' },
  hoodie: { coat: '#2f6f8a', trousers: '#2a2e38' },
}

export default function VisitorFigure({ look, mood }: { look: Look; mood: 'asking' | 'happy' | 'puzzled' }) {
  const c = CLOTHES[look]
  return (
    <svg className={`visitor-figure is-${mood}`} viewBox="0 0 80 160" aria-hidden="true">
      {/* legs and body */}
      <rect x="28" y="100" width="10" height="50" rx="3" fill={c.trousers} />
      <rect x="42" y="100" width="10" height="50" rx="3" fill={c.trousers} />
      <rect x="22" y="54" width="36" height="52" rx="8" fill={c.coat} />
      {look === 'tie' && <path d="M40 56 L37 70 L40 90 L43 70Z" fill="#a8332e" />}
      {look === 'hoodie' && <rect x="50" y="76" width="6" height="11" rx="1" fill="#111" />}
      {/* arms */}
      <rect x="14" y="58" width="9" height="40" rx="4" fill={c.coat} />
      <rect x="57" y="58" width="9" height="40" rx="4" fill={c.coat} />
      {/* head (it tilts with the mood) */}
      <g className="visitor-head">
        <circle cx="40" cy="38" r="15" fill="#e8c4a0" />
        <circle cx="34" cy="36" r="1.8" fill="#2a1d14" />
        <circle cx="46" cy="36" r="1.8" fill="#2a1d14" />
        {mood === 'happy' ? (
          <path d="M33 44 Q40 51 47 44" stroke="#2a1d14" strokeWidth="1.8" fill="none" />
        ) : mood === 'puzzled' ? (
          <path d="M34 47 Q40 43 46 47" stroke="#2a1d14" strokeWidth="1.8" fill="none" />
        ) : (
          <path d="M35 46 H45" stroke="#2a1d14" strokeWidth="1.8" />
        )}
        {look === 'tophat' && (
          <>
            <rect x="24" y="24" width="32" height="4" fill="#1a1a20" />
            <rect x="29" y="4" width="22" height="21" fill="#1a1a20" />
          </>
        )}
        {look === 'cap' && <path d="M25 30 Q40 14 55 30 L60 31 Z" fill="#4a3e30" />}
        {look === 'tie' && <path d="M25 32 Q40 16 55 32 Q48 24 40 24 Q32 24 25 32Z" fill="#3a2a1a" />}
        {look === 'hoodie' && <path d="M22 44 Q20 18 40 18 Q60 18 58 44 Q56 26 40 25 Q24 26 22 44Z" fill="#2f6f8a" />}
        {mood === 'puzzled' && (
          <text x="60" y="20" fontSize="18" fontWeight="700" fill="#ffd36a">
            ?
          </text>
        )}
      </g>
    </svg>
  )
}
