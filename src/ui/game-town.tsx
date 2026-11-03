import type { ReactNode } from 'react'
import type { Spot } from '../content/game-cards'
import type { GameRun } from '../state/useMuseumStore'
import { PER_ERA, townProblem } from './game-run'

// THE GROWING TOWN of the Time Machine game's second core: one small picture drawn in SVG,
// with six places (power, workshop, messages, homes, the big building, and the road along the
// bottom). Each place is drawn at one of five stages: 0 = the town of 1760, 1-4 = after each
// revolution. Solving a problem moves its place to the era at once; finishing an era moves
// the whole town on. Simple shapes only, so it costs nothing to draw.

export type Stages = Record<Spot, number>
const SPOTS: Spot[] = ['power', 'making', 'transport', 'message', 'home', 'office']

// Where each place stands, from what the visitor has solved so far.
export function townStages(run: GameRun): Stages {
  const eraIndex = Math.floor(run.index / PER_ERA)
  const stages = Object.fromEntries(SPOTS.map((spot) => [spot, eraIndex])) as Stages
  const solvedHere = run.deck.slice(eraIndex * PER_ERA, run.index + (run.solved ? 1 : 0))
  for (const id of solvedHere) stages[townProblem(id).spot] = eraIndex + 1
  // The last problem of an era solved: the whole town moves on.
  if (run.solved && run.index % PER_ERA === PER_ERA - 1) for (const spot of SPOTS) stages[spot] = eraIndex + 1
  return stages
}

// Where a problem's marker floats over each place.
const MARK: Record<Spot, [number, number]> = {
  power: [60, 96],
  making: [172, 92],
  message: [268, 70],
  home: [362, 104],
  office: [508, 60],
  transport: [300, 214],
}
const SKY = ['#bcd3e0', '#c7bfae', '#38405e', '#a9cfe8', '#10303c']
const GROUND = ['#7a9a5a', '#6e7f50', '#4f5a44', '#7d9a6a', '#1d3a36']
const GROUND_Y = 200

const smoke = (x: number, y: number, k = 0) => (
  <g key={`s${x}${k}`} fill="#9a958c" opacity="0.6">
    <ellipse cx={x + 4} cy={y - 8} rx="9" ry="6" />
    <ellipse cx={x + 14} cy={y - 20} rx="12" ry="7" />
    <ellipse cx={x + 28} cy={y - 30} rx="14" ry="8" />
  </g>
)
const windows = (x: number, y: number, cols: number, rows: number, colour: string, w = 6, gap = 12) =>
  Array.from({ length: cols * rows }, (_, k) => (
    <rect key={`w${x}${y}${k}`} x={x + (k % cols) * gap} y={y + Math.floor(k / cols) * gap} width={w} height={w} fill={colour} />
  ))

function power(stage: number): ReactNode {
  switch (stage) {
    case 0: // a water mill on the river
      return (
        <>
          <rect x="30" y="150" width="56" height="50" fill="#8a6a4a" />
          <path d="M24 150 L58 126 L92 150Z" fill="#5a3e28" />
          <circle cx="96" cy="186" r="18" fill="none" stroke="#5a3e28" strokeWidth="4" />
          <path d="M96 168 V204 M78 186 H114" stroke="#5a3e28" strokeWidth="3" />
        </>
      )
    case 1: // a steam-powered mill: brick and a tall chimney
      return (
        <>
          <rect x="22" y="146" width="66" height="54" fill="#9a5a3a" />
          {windows(30, 156, 4, 3, '#3a2418')}
          <rect x="88" y="104" width="12" height="96" fill="#6a3a24" />
          {smoke(90, 104)}
        </>
      )
    case 2: // a power station with pylons
      return (
        <>
          <rect x="18" y="150" width="74" height="50" fill="#6a6e74" />
          <rect x="30" y="112" width="10" height="38" fill="#4a4e54" />
          <rect x="62" y="118" width="10" height="32" fill="#4a4e54" />
          {smoke(30, 112, 1)}
          <path d="M104 200 L110 140 L116 200 M106 160 H114 M100 146 H120" stroke="#2a2c30" strokeWidth="2" fill="none" />
          <path d="M120 146 Q170 160 230 150" stroke="#2a2c30" strokeWidth="1" fill="none" />
        </>
      )
    case 3: // an automated control building
      return (
        <>
          <rect x="18" y="140" width="84" height="60" fill="#c4c9c6" />
          <rect x="26" y="150" width="68" height="20" fill="#2a3438" />
          {windows(30, 155, 6, 1, '#6be08b', 4, 10)}
        </>
      )
    default: // a connected plant sending data
      return (
        <>
          <rect x="18" y="138" width="84" height="62" fill="#1f4a54" />
          {windows(26, 146, 6, 3, '#3fd0e0', 6, 12)}
          <path d="M84 138 V112" stroke="#9fe8f4" strokeWidth="2" />
          {[8, 16, 24].map((r) => (
            <path key={r} d={`M${84 - r} ${108 - r / 2} Q84 ${96 - r} ${84 + r} ${108 - r / 2}`} stroke="#3fd0e0" strokeWidth="1.5" fill="none" />
          ))}
        </>
      )
  }
}

function making(stage: number): ReactNode {
  switch (stage) {
    case 0: // a cottage, with a spinning wheel at the door
      return (
        <>
          <rect x="130" y="160" width="60" height="40" fill="#b09070" />
          <path d="M124 160 L160 136 L196 160Z" fill="#7a5a38" />
          <rect x="152" y="178" width="12" height="22" fill="#5a3e28" />
          <circle cx="208" cy="188" r="10" fill="none" stroke="#5a3e28" strokeWidth="2" />
        </>
      )
    case 1: // a long brick mill, rows of windows
      return (
        <>
          <rect x="118" y="130" width="108" height="70" fill="#a4603e" />
          {windows(126, 140, 8, 4, '#3a2418', 6, 12)}
          <rect x="210" y="104" width="10" height="26" fill="#6a3a24" />
          {smoke(212, 104, 2)}
        </>
      )
    case 2: // a factory with a saw-tooth roof
      return (
        <>
          <rect x="118" y="146" width="108" height="54" fill="#7c7f84" />
          <path d="M118 146 L136 126 L136 146 L154 126 L154 146 L172 126 L172 146 L190 126 L190 146 L208 126 L208 146 L226 126 L226 146Z" fill="#5a5d62" />
          {windows(126, 160, 8, 2, '#ffd36a', 6, 12)}
        </>
      )
    case 3: // a factory with a robot arm at work in the window
      return (
        <>
          <rect x="118" y="136" width="108" height="64" fill="#d2d6d3" />
          <rect x="128" y="150" width="88" height="40" fill="#2a3438" />
          <path d="M150 190 V172 L170 162 L186 170" stroke="#e0a050" strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle cx="170" cy="162" r="4" fill="#6be08b" />
        </>
      )
    default: // a smart factory dotted with sensors
      return (
        <>
          <rect x="118" y="134" width="108" height="66" fill="#163c46" />
          <rect x="128" y="146" width="88" height="40" fill="#0a2228" />
          <path d="M150 186 V170 L168 160 L184 168" stroke="#9fe8f4" strokeWidth="4" fill="none" strokeLinecap="round" />
          {[132, 152, 172, 192, 212].map((x) => (
            <circle key={x} cx={x} cy="140" r="2.5" fill="#3fd0e0" />
          ))}
        </>
      )
  }
}

function message(stage: number): ReactNode {
  switch (stage) {
    case 0: // a rider carrying the post
      return (
        <>
          <ellipse cx="266" cy="186" rx="16" ry="8" fill="#6a4a2a" />
          <path d="M254 192 V200 M278 192 V200" stroke="#6a4a2a" strokeWidth="3" />
          <path d="M280 182 L288 172" stroke="#6a4a2a" strokeWidth="5" strokeLinecap="round" />
          <rect x="262" y="166" width="7" height="14" fill="#3a3a5a" />
          <circle cx="265" cy="162" r="4" fill="#e0c0a0" />
        </>
      )
    case 1: // a telegraph pole
      return (
        <>
          <rect x="264" y="104" width="5" height="96" fill="#5a3e28" />
          <rect x="254" y="108" width="25" height="3" fill="#5a3e28" />
          <path d="M230 116 Q266 124 300 112 M230 112 Q266 120 300 108" stroke="#3a2a1a" strokeWidth="1" fill="none" />
        </>
      )
    case 2: // a telephone pole, crowded with wires
      return (
        <>
          <rect x="264" y="98" width="5" height="102" fill="#4a3a2a" />
          {[102, 110, 118].map((y) => (
            <rect key={y} x="250" y={y} width="33" height="3" fill="#4a3a2a" />
          ))}
          {[104, 112, 120].map((y) => (
            <path key={y} d={`M230 ${y + 6} Q266 ${y + 14} 300 ${y + 2}`} stroke="#222" strokeWidth="1" fill="none" />
          ))}
        </>
      )
    case 3: // a mobile-phone mast
      return (
        <>
          <path d="M256 200 L266 100 L276 200 M258 180 L274 160 M258 160 L274 180 M260 140 L272 124" stroke="#5a6266" strokeWidth="2" fill="none" />
          {[8, 15].map((r) => (
            <path key={r} d={`M${266 - r} ${96 - r / 3} Q266 ${86 - r} ${266 + r} ${96 - r / 3}`} stroke="#4a8a6a" strokeWidth="1.5" fill="none" />
          ))}
        </>
      )
    default: // glowing network nodes
      return (
        <>
          <path d="M248 170 L266 130 L286 166 L248 170 M266 130 L268 96" stroke="#3fd0e0" strokeWidth="1.5" fill="none" />
          {[
            [248, 170],
            [266, 130],
            [286, 166],
            [268, 96],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="5" fill="#9fe8f4" />
          ))}
        </>
      )
  }
}

function home(stage: number): ReactNode {
  const light = ['#3a2a1a', '#3a2a1a', '#ffd36a', '#d8ecf4', '#3fd0e0'][stage]
  if (stage === 3)
    return (
      <>
        <rect x="320" y="120" width="80" height="80" fill="#b8a890" />
        {windows(328, 128, 6, 5, light, 6, 12)}
        <path d="M340 120 V108 M334 110 H346 M380 120 V110 M374 112 H386" stroke="#444" strokeWidth="1.5" />
      </>
    )
  return (
    <>
      {[
        [312, 40, 34],
        [352, 44, 42],
        [396, 36, 30],
      ].map(([x, w, h], k) => {
        const roof = stage === 4 ? '#24525c' : stage === 1 ? '#5a3a2a' : '#6a4a32'
        const wall = stage === 4 ? '#e8f0f0' : stage === 1 ? '#8a6a5a' : '#c8b090'
        return (
          <g key={k}>
            <rect x={x} y={GROUND_Y - h} width={w} height={h} fill={wall} />
            <path d={`M${x - 4} ${GROUND_Y - h} L${x + w / 2} ${GROUND_Y - h - 16} L${x + w + 4} ${GROUND_Y - h}Z`} fill={roof} />
            <rect x={x + 8} y={GROUND_Y - h + 8} width="8" height="8" fill={light} />
            <rect x={x + w - 16} y={GROUND_Y - h + 8} width="8" height="8" fill={light} />
          </g>
        )
      })}
      {stage === 1 && smoke(340, 150, 3)}
      {stage === 2 && (
        <>
          <rect x="434" y="150" width="3" height="50" fill="#2a2a2a" />
          <circle cx="436" cy="148" r="5" fill="#ffd36a" />
          <circle cx="436" cy="148" r="14" fill="#ffd36a" opacity="0.25" />
        </>
      )}
    </>
  )
}

function office(stage: number): ReactNode {
  switch (stage) {
    case 0: // a field and a tree
      return (
        <>
          <rect x="500" y="170" width="6" height="30" fill="#5a3e28" />
          <circle cx="503" cy="160" r="20" fill="#4f7a3a" />
        </>
      )
    case 1: // a stone hall with columns
      return (
        <>
          <rect x="460" y="150" width="96" height="50" fill="#c8bca4" />
          <path d="M452 150 L508 124 L564 150Z" fill="#a89a80" />
          {[470, 488, 506, 524, 542].map((x) => (
            <rect key={x} x={x} y="154" width="6" height="44" fill="#ddd2bc" />
          ))}
        </>
      )
    case 2: // a tall steel-framed building
      return (
        <>
          <rect x="474" y="90" width="68" height="110" fill="#8a8478" />
          {windows(482, 98, 5, 8, '#ffd36a', 6, 12)}
          <path d="M556 200 V150 L590 150" stroke="#5a5650" strokeWidth="3" fill="none" />
        </>
      )
    case 3: // an office tower, every window lit by a screen
      return (
        <>
          <rect x="468" y="72" width="80" height="128" fill="#5d7f8a" />
          {windows(476, 80, 6, 10, '#b8e8ff', 6, 12)}
        </>
      )
    default: // a glass tower under a cloud of data
      return (
        <>
          <path d="M470 200 V82 L508 60 L546 82 V200Z" fill="#1f5a68" />
          {windows(478, 92, 6, 9, '#3fd0e0', 5, 11)}
          <path d="M488 44 a10 10 0 0 1 18 -8 a12 12 0 0 1 22 4 a8 8 0 0 1 2 16 h-40 a7 7 0 0 1 -2 -12z" fill="none" stroke="#9fe8f4" strokeWidth="2" />
        </>
      )
  }
}

function transport(stage: number): ReactNode {
  const road = (
    <rect x="0" y="212" width="600" height="28" fill={stage === 0 ? '#9a8460' : stage === 1 ? '#7a6a52' : '#4a4c50'} />
  )
  switch (stage) {
    case 0: // a horse and cart
      return (
        <>
          {road}
          <rect x="420" y="208" width="40" height="14" fill="#6a4a2a" />
          <circle cx="428" cy="226" r="6" fill="#3a2a1a" />
          <circle cx="452" cy="226" r="6" fill="#3a2a1a" />
          <ellipse cx="478" cy="210" rx="14" ry="7" fill="#5a3a20" />
          <path d="M470 216 V228 M486 216 V228 M490 206 L496 198" stroke="#5a3a20" strokeWidth="3" />
        </>
      )
    case 1: // rails and a steam train
      return (
        <>
          {road}
          <path d="M0 226 H600" stroke="#3a3a3a" strokeWidth="2" />
          <path d="M0 232 H600" stroke="#3a3a3a" strokeWidth="2" />
          <rect x="400" y="200" width="44" height="22" fill="#2c2c2c" />
          <rect x="440" y="190" width="20" height="32" fill="#5a2a1a" />
          <rect x="408" y="186" width="8" height="14" fill="#222" />
          {smoke(408, 186, 4)}
          <rect x="350" y="204" width="44" height="18" fill="#6a4a2a" />
        </>
      )
    case 2: // a road, an early car and a tram
      return (
        <>
          {road}
          <path d="M0 214 H600" stroke="#2a2a2a" strokeWidth="1" />
          <rect x="420" y="206" width="36" height="14" rx="3" fill="#1a1a1a" />
          <rect x="430" y="196" width="18" height="10" fill="#1a1a1a" />
          <circle cx="428" cy="224" r="5" fill="#111" />
          <circle cx="450" cy="224" r="5" fill="#111" />
          <rect x="300" y="196" width="60" height="22" fill="#8a2a2a" />
          <path d="M330 196 V182 H360" stroke="#222" strokeWidth="1.5" fill="none" />
        </>
      )
    case 3: // a busy road, someone calling on a mobile
      return (
        <>
          {road}
          <path d="M0 226 H600" stroke="#ddd" strokeWidth="1" strokeDasharray="10 8" />
          <rect x="420" y="210" width="44" height="14" rx="5" fill="#c8302a" />
          <rect x="330" y="214" width="40" height="12" rx="5" fill="#2a5aa8" />
          <rect x="230" y="186" width="6" height="16" fill="#3a3a5a" />
          <circle cx="233" cy="181" r="4" fill="#e0c0a0" />
          <rect x="236" y="180" width="3" height="6" fill="#222" />
        </>
      )
    default: // a self-driving car and a robot helper
      return (
        <>
          {road}
          <path d="M0 226 H600" stroke="#3fd0e0" strokeWidth="1" strokeDasharray="10 8" />
          <rect x="420" y="208" width="46" height="14" rx="6" fill="#e8f0f0" />
          <path d="M470 214 q20 -10 40 0" stroke="#3fd0e0" strokeWidth="1.5" fill="none" />
          <rect x="300" y="190" width="14" height="20" rx="3" fill="#9fe8f4" />
          <circle cx="307" cy="185" r="5" fill="#9fe8f4" />
          <rect x="280" y="198" width="14" height="12" fill="#c8a070" />
        </>
      )
  }
}

const DRAW: Record<Spot, (stage: number) => ReactNode> = { power, making, message, home, office, transport }

// The museum's look for the picture: every colour turned into a two-tone print, from deep
// walnut in the shadows to pale gold in the light, like a gilded engraving on display.
// (A filter on a still picture: worked out once when the town changes, not every frame.)
export function GildFilter({ id }: { id: string }) {
  return (
    <filter id={id} colorInterpolationFilters="sRGB">
      <feColorMatrix type="saturate" values="0" />
      <feComponentTransfer>
        <feFuncR type="table" tableValues="0.07 0.22 0.42 0.66 0.86" />
        <feFuncG type="table" tableValues="0.05 0.15 0.30 0.50 0.72" />
        <feFuncB type="table" tableValues="0.04 0.09 0.15 0.26 0.46" />
      </feComponentTransfer>
    </filter>
  )
}

export default function Town({ stages, era, current, pending }: { stages: Stages; era: number; current: Spot | null; pending: Spot[] }) {
  return (
    <svg className="town" viewBox="0 0 600 240" role="img" aria-hidden="true">
      <defs>
        <GildFilter id="town-gild" />
        <radialGradient id="town-vignette" cx="50%" cy="50%" r="75%">
          <stop offset="60%" stopColor="#140d07" stopOpacity="0" />
          <stop offset="100%" stopColor="#140d07" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <g filter="url(#town-gild)">
        <rect width="600" height={GROUND_Y} fill={SKY[era]} style={{ transition: 'fill 1s' }} />
        {era === 2 && [60, 180, 330, 470, 560].map((x, k) => <circle key={x} cx={x} cy={20 + (k % 2) * 18} r="1.5" fill="#fff" />)}
        <rect y={GROUND_Y} width="600" height="40" fill={GROUND[era]} />
        {/* The river, until the town no longer needs it. */}
        {stages.power === 0 && <path d="M0 206 C60 200 100 212 140 206 L140 212 L0 212Z" fill="#4a7aa8" />}
        {SPOTS.map((spot) => (
          <g key={`${spot}-${stages[spot]}`} className="town-spot">
            {DRAW[spot](stages[spot])}
          </g>
        ))}
      </g>
      {/* Darker edges, like an old print under gallery light. */}
      <rect width="600" height="240" fill="url(#town-vignette)" />
      {/* Markers in the museum's gold, outside the print: waiting problems faint, the
          current one pulsing. */}
      {pending.map((spot, k) => (
        <g key={`p${k}`} transform={`translate(${MARK[spot][0]} ${MARK[spot][1]})`} opacity="0.6">
          <circle r="10" fill="#1e1710" stroke="#c9a25a" strokeWidth="1.2" />
          <text y="4.5" textAnchor="middle" fontSize="13" fontWeight="700" fill="#c9a25a">
            !
          </text>
        </g>
      ))}
      {current && (
        <g transform={`translate(${MARK[current][0]} ${MARK[current][1]})`} className="town-mark">
          <circle r="16" fill="none" stroke="#ffe3a0" strokeWidth="1" opacity="0.7" />
          <circle r="12" fill="#1e1710" stroke="#ffd36a" strokeWidth="2" />
          <text y="5.5" textAnchor="middle" fontSize="15" fontWeight="700" fill="#ffd36a">
            !
          </text>
        </g>
      )}
    </svg>
  )
}
