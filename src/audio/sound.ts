import type { RoomId } from '../types'
import { AUDIO_ENABLED } from '../features'

// SOUND ENGINE (M8b), using the browser's built-in Web Audio (no extra package).
// - Effects: short sounds played once (clicks, footsteps, doors, quiz).
// - Ambience: one loop per area, cross-faded when you move between areas: a welcoming
//   binaural tone in the intro hall, quiet room tone in the central hall and the Game Room,
//   era music in the four era rooms.
// Volumes: master x (effects or ambience), plus an on/off switch; all set from the
// settings (useMuseumStore) through setVolumes().
// Browsers only allow sound after the visitor's first click or key press, so nothing
// plays before that (unlockAudio is called on the first interaction).
// Every sound file is listed in src/content/credits.ts.

const EFFECTS = {
  click: '/sounds/ui/click.ogg',
  open: '/sounds/ui/open.ogg',
  close: '/sounds/ui/close.ogg',
  mapOpen: '/sounds/ui/map-open.ogg',
  mapClose: '/sounds/ui/map-close.ogg',
  teleport: '/sounds/ui/teleport.ogg',
  stepDone: '/sounds/ui/step-done.ogg',
  select: '/sounds/ui/select.ogg',
  correct: '/sounds/ui/correct.ogg',
  wrong: '/sounds/ui/wrong.ogg',
  results: '/sounds/ui/results.ogg',
  newRoom: '/sounds/world/new-room.ogg',
  doorOpen: '/sounds/world/door-open.ogg',
  doorClose: '/sounds/world/door-close.ogg',
  locked: '/sounds/world/locked.ogg',
} as const
export type EffectName = keyof typeof EFFECTS

// Interface sounds are played slower than recorded, which also lowers their pitch: calmer
// and more mature than bright game blips. (open/close/map are already prepared that way.)
const PITCH: Partial<Record<EffectName, number>> = {
  click: 0.8,
  teleport: 0.7,
  select: 0.8,
  newRoom: 0.85,
  correct: 0.9,
  wrong: 0.85,
}

// Footsteps: two soft takes (left foot, right foot) played in turn, the same everywhere,
// for a calm, even rhythm.
const STEP_FILES = ['/sounds/steps/step-0.ogg', '/sounds/steps/step-1.ogg']
let nextFoot = 0

const AMBIENCE: Record<RoomId, string> = {
  rotunda: '/sounds/ambience/rotunda.ogg',
  hall: '/sounds/ambience/hall.ogg',
  // Era music: Verdi's "Anvil Chorus" (hammers on anvils, like a forge), Joplin's ragtime
  // (1906 recording), an 8-bit "Korobeiniki" (the Tetris tune), futuristic sci-fi ambient.
  ir1: '/sounds/music/ir1.ogg',
  ir2: '/sounds/music/ir2.ogg',
  ir3: '/sounds/music/ir3.ogg',
  ir4: '/sounds/music/ir4.ogg',
  quiz: '/sounds/ambience/quiz.ogg',
}
// How loud each area's loop is (they were recorded at very different levels).
const AMBIENCE_LEVEL: Record<RoomId, number> = {
  rotunda: 0.55,
  hall: 0.4,
  ir1: 0.42, // the same level as CMCN 2 (both recordings are about equally loud)
  ir2: 0.42,
  ir3: 0.32,
  ir4: 0.55, // a soft ambient track, mastered quieter than the old placeholder
  quiz: 0.35,
}
const AMBIENCE_FADE = 1.5 // seconds to cross-fade between areas

let context: AudioContext | null = null
let master: GainNode | null = null
let effectsBus: GainNode | null = null
let ambienceBus: GainNode | null = null
const buffers = new Map<string, AudioBuffer>()
let loading: Promise<void> | null = null

function setUp(): AudioContext | null {
  if (!AUDIO_ENABLED) return null // sound switched off (src/features.ts)
  if (context) return context
  try {
    context = new AudioContext()
  } catch {
    return null // no Web Audio: the game simply stays silent
  }
  master = context.createGain()
  effectsBus = context.createGain()
  ambienceBus = context.createGain()
  effectsBus.connect(master)
  ambienceBus.connect(master)
  master.connect(context.destination)
  return context
}

async function load(url: string) {
  const ctx = setUp()
  if (!ctx || buffers.has(url)) return
  try {
    const data = await (await fetch(url)).arrayBuffer()
    buffers.set(url, await ctx.decodeAudioData(data))
  } catch {
    // A missing or unreadable file is skipped (no sound), never a crash.
  }
}

// Download and decode every sound (about 0.7 MB in total), in the background.
export function loadSounds(): Promise<void> {
  if (!loading) {
    const urls = [
      ...Object.values(EFFECTS),
      ...STEP_FILES,
      ...Object.values(AMBIENCE),
    ]
    loading = Promise.all(urls.map(load)).then(() => undefined)
  }
  return loading
}

// Called on the first click or key press: browsers start sound only after one.
export function unlockAudio() {
  const ctx = setUp()
  if (ctx && ctx.state === 'suspended') void ctx.resume()
}

// Settings: on/off and the three volumes (0-1).
export function setVolumes(on: boolean, volumes: { master: number; effects: number; ambience: number }) {
  if (!setUp() || !context || !master || !effectsBus || !ambienceBus) return
  const now = context.currentTime
  master.gain.setTargetAtTime(on ? volumes.master : 0, now, 0.05)
  effectsBus.gain.setTargetAtTime(volumes.effects, now, 0.05)
  ambienceBus.gain.setTargetAtTime(volumes.ambience, now, 0.05)
}

function playBuffer(url: string, volume: number, rate = 1) {
  if (!context || context.state !== 'running' || !effectsBus) return
  const buffer = buffers.get(url)
  if (!buffer) return
  const source = context.createBufferSource()
  source.buffer = buffer
  source.playbackRate.value = rate
  const gain = context.createGain()
  gain.gain.value = volume
  source.connect(gain).connect(effectsBus)
  source.start()
}

export function playEffect(name: EffectName, volume = 0.6) {
  playBuffer(EFFECTS[name], volume, PITCH[name] ?? 1)
}

export function playStep(volume = 0.3) {
  playBuffer(STEP_FILES[nextFoot], volume)
  nextFoot = 1 - nextFoot
}

// ---- Ambience ----
let ambienceRoom: RoomId | null = null
let ambienceSource: AudioBufferSourceNode | null = null
let ambienceGain: GainNode | null = null
let ambienceDucked = false

// Play the loop of `room` (cross-fading from the previous one).
export function setAmbience(room: RoomId) {
  if (!context || !ambienceBus || room === ambienceRoom) return
  const buffer = buffers.get(AMBIENCE[room])
  if (!buffer) return // not loaded yet: tried again on the next change
  const now = context.currentTime
  // Fade the old loop out and stop it afterwards.
  if (ambienceSource && ambienceGain) {
    const oldSource = ambienceSource
    ambienceGain.gain.setTargetAtTime(0, now, AMBIENCE_FADE / 3)
    oldSource.stop(now + AMBIENCE_FADE * 2)
  }
  const source = context.createBufferSource()
  source.buffer = buffer
  source.loop = true
  const gain = context.createGain()
  gain.gain.value = 0
  gain.gain.setTargetAtTime(ambienceDucked ? 0 : AMBIENCE_LEVEL[room], now, AMBIENCE_FADE / 3)
  source.connect(gain).connect(ambienceBus)
  source.start()
  ambienceRoom = room
  ambienceSource = source
  ambienceGain = gain
}

// While paused or in a menu, the ambience fades away; it comes back when walking again.
export function duckAmbience(ducked: boolean) {
  ambienceDucked = ducked
  if (!context || !ambienceGain || !ambienceRoom) return
  ambienceGain.gain.setTargetAtTime(ducked ? 0 : AMBIENCE_LEVEL[ambienceRoom], context.currentTime, 0.4)
}

// When the tab is hidden, all sound stops; it resumes when the visitor comes back.
document.addEventListener('visibilitychange', () => {
  if (!context) return
  if (document.hidden) void context.suspend()
  else void context.resume()
})
