import type { RoomId } from '../types'
import { AUDIO_ENABLED } from '../features'

// SOUND ENGINE (M8b), using the browser's built-in Web Audio (no extra package).
// - Effects: short sounds played once (clicks, footsteps, doors, quiz).
// - Ambience: one loop per area, cross-faded when you move between areas: quiet room tone
//   in the central hall, era music in the four era rooms, a calm prelude in the Game Room. The
//   intro hall has no loop: the opening of Vivaldi's "Spring" plays once when the start
//   screen closes.
// - Music (the long tracks) is STREAMED: played by the browser's own audio player, which
//   unpacks only the next moment of sound, and routed into the same volumes and fades.
//   Unpacking them in advance, like the short sounds, took about 650 MB of memory (the
//   laptop's sound runs at 96 kHz) and 4 seconds of processor time while loading.
// Volumes: master x (effects or ambience), plus an on/off switch; all set from the
// settings (useMuseumStore) through setVolumes().
// Browsers only allow sound after the visitor's first click or key press, so nothing
// plays before that (unlockAudio is called on the first interaction).
// Every sound file is listed in src/content/credits.ts.

// FILE FORMAT: every sound exists as .ogg (small, played by Chrome, Edge, Firefox) and as
// .m4a (played by Safari, which every browser on iPhones and iPads uses underneath, and
// which may not play .ogg). Each browser downloads only the one it can play. The paths
// below say .ogg; fileFor() swaps the ending where needed.
const PLAYS_OGG = typeof Audio !== 'undefined' && new Audio().canPlayType('audio/ogg; codecs="vorbis"') !== ''
const fileFor = (url: string) => (PLAYS_OGG ? url : url.replace(/\.ogg$/, '.m4a'))

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

// (No entry = no loop in that area.) Music tracks (in /music/) are streamed; the short
// central-hall loop is unpacked in advance, so it repeats without a gap.
const AMBIENCE: Partial<Record<RoomId, string>> = {
  // Central hall: Minuet in G major (Petzold, once attributed to Bach), streamed.
  rotunda: '/sounds/music/rotunda.ogg',
  // Era music: atmospheric ambient tracks, one per era (CC0 from OpenGameArt; CMCN 4 from
  // Pixabay), for now:
  // "Factory ambiance", "Life in corrupted binary", "Factorio Clone Music", "Space Ambient".
  ir1: '/sounds/music/ir1.ogg',
  ir2: '/sounds/music/ir2.ogg',
  ir3: '/sounds/music/ir3.ogg',
  ir4: '/sounds/music/ir4.ogg',
  // Game Room: "Prelude in F# Minor", calm and grand for the quiz.
  quiz: '/sounds/music/quiz.ogg',
}
// Played once, when the visitor leaves the start screen (after the tutorial question).
const WELCOME = '/sounds/music/welcome.ogg'
const WELCOME_LEVEL = 0.5
// How loud each area's music is. Every sound file is loudness-normalized (to -18 LUFS)
// when converted, so all the music shares one level.
const AMBIENCE_LEVEL: Record<RoomId, number> = {
  rotunda: 0.5,
  hall: 0,
  ir1: 0.5,
  ir2: 0.5,
  ir3: 0.5,
  ir4: 0.5,
  quiz: 0.5,
}
const AMBIENCE_FADE = 1.5 // seconds to cross-fade between areas

let context: AudioContext | null = null
let master: GainNode | null = null
let effectsBus: GainNode | null = null
let ambienceBus: GainNode | null = null
const buffers = new Map<string, AudioBuffer>()
let loading: Promise<void> | null = null

const isMusic = (url: string) => url.includes('/music/')

// A streamed track: the browser's audio player, routed through its own volume control.
interface Stream {
  element: HTMLAudioElement
  gain: GainNode
  stopTimer: number
}
const streams = new Map<string, Stream>()

function stream(url: string, loop: boolean): Stream | null {
  const existing = streams.get(url)
  if (existing) return existing
  if (!context || !ambienceBus) return null
  const element = new Audio(fileFor(url))
  element.loop = loop
  element.preload = 'auto' // fetch the (small) file early, so it can start at once
  const gain = context.createGain()
  gain.gain.value = 0
  context.createMediaElementSource(element).connect(gain).connect(ambienceBus)
  const created = { element, gain, stopTimer: 0 }
  streams.set(url, created)
  return created
}

// Start a stream; browsers refuse until the first click, so remember to retry then.
const waitingToPlay = new Set<HTMLAudioElement>()
function play(element: HTMLAudioElement) {
  element.play().then(
    () => waitingToPlay.delete(element),
    () => waitingToPlay.add(element),
  )
}

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
  if (isMusic(url)) {
    stream(url, url !== WELCOME) // streamed: only prepared here, never unpacked in full
    return
  }
  try {
    const data = await (await fetch(fileFor(url))).arrayBuffer()
    buffers.set(url, await ctx.decodeAudioData(data))
  } catch {
    // A missing or unreadable file is skipped (no sound), never a crash.
  }
}

// Download every sound in the background: the short ones are unpacked (about 8 MB in
// memory), the music only prepared for streaming.
export function loadSounds(): Promise<void> {
  if (!loading) {
    const urls = [
      ...Object.values(EFFECTS),
      ...STEP_FILES,
      ...Object.values(AMBIENCE),
      WELCOME,
    ]
    loading = Promise.all(urls.map(load)).then(() => undefined)
  }
  return loading
}

// Called on the first click or key press: browsers start sound only after one.
export function unlockAudio() {
  const ctx = setUp()
  if (ctx && ctx.state === 'suspended') void ctx.resume()
  for (const element of waitingToPlay) play(element)
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

// Silent while the game is still loading: the loading measures speed by moving the camera
// through the central hall and back, which would otherwise play its music and sounds.
let silenced = true
export function setSilenced(on: boolean) {
  silenced = on
}

export function playEffect(name: EffectName, volume = 0.6) {
  if (silenced) return
  playBuffer(EFFECTS[name], volume, PITCH[name] ?? 1)
}

export function playStep(volume = 0.3) {
  if (silenced) return
  playBuffer(STEP_FILES[nextFoot], volume)
  nextFoot = 1 - nextFoot
}

// ---- Ambience ----
let ambienceRoom: RoomId | null = null
let ambienceGain: GainNode | null = null // the volume of the area's current loop
let ambienceSource: AudioBufferSourceNode | null = null // set when that loop is unpacked
let ambienceStream: Stream | null = null // set when that loop is streamed
// How loud the room music plays: 1 = normal, 0 = silent (menus), in between (the game).
let ambienceDucked = 1

// Fade the current loop out and stop it once silent.
function fadeOutAmbience(now: number) {
  ambienceGain?.gain.setTargetAtTime(0, now, AMBIENCE_FADE / 3)
  if (ambienceSource) ambienceSource.stop(now + AMBIENCE_FADE * 2)
  const old = ambienceStream
  if (old) {
    window.clearTimeout(old.stopTimer)
    old.stopTimer = window.setTimeout(() => {
      old.element.pause()
      waitingToPlay.delete(old.element)
    }, AMBIENCE_FADE * 2000)
  }
  ambienceSource = null
  ambienceStream = null
  ambienceGain = null
}

// Play the loop of `room` (cross-fading from the previous one), or fade to silence in an
// area without a loop.
export function setAmbience(room: RoomId) {
  if (silenced) return
  if (!context || !ambienceBus || room === ambienceRoom) return
  const url = AMBIENCE[room]
  const buffer = url && !isMusic(url) ? buffers.get(url) : undefined
  const streamed = url && isMusic(url) ? stream(url, true) : null
  if (url && !buffer && !streamed) return // not loaded yet: tried again on the next change
  const now = context.currentTime
  fadeOutAmbience(now)
  ambienceRoom = room
  const level = AMBIENCE_LEVEL[room] * ambienceDucked
  if (streamed) {
    // Coming back while it was still fading out: just fade back in, without restarting.
    window.clearTimeout(streamed.stopTimer)
    if (streamed.element.paused) streamed.element.currentTime = 0
    play(streamed.element)
    streamed.gain.gain.setTargetAtTime(level, now, AMBIENCE_FADE / 3)
    ambienceStream = streamed
    ambienceGain = streamed.gain
    return
  }
  if (!buffer) return
  const source = context.createBufferSource()
  source.buffer = buffer
  source.loop = true
  const gain = context.createGain()
  gain.gain.value = 0
  gain.gain.setTargetAtTime(level, now, AMBIENCE_FADE / 3)
  source.connect(gain).connect(ambienceBus)
  source.start()
  ambienceSource = source
  ambienceGain = gain
}

// The welcome sound, once (on the ambience volume, like the music).
let welcomed = false
// Not only when the sound system is already running: on phones it is often still starting
// up (resume() takes a moment) at the tap that closes the start screen, and the welcome
// was then skipped for good. Now it starts anyway and is heard as soon as sound is on
// (or, if the browser refuses, on the next tap, like the music).
export function playWelcome() {
  if (welcomed || !context) return
  if (context.state === 'suspended') void context.resume()
  const welcome = stream(WELCOME, false)
  if (!welcome) return
  welcomed = true
  welcome.gain.gain.value = WELCOME_LEVEL
  welcomeGain = welcome.gain
  play(welcome.element)
}

// Walking into an exhibition room before the welcome music has ended: it fades out, so
// the room's own music plays alone.
let welcomeGain: GainNode | null = null
export function stopWelcome() {
  if (!welcomeGain || !context) return
  welcomeGain.gain.setTargetAtTime(0, context.currentTime, 0.5)
  welcomeGain = null
}

// While paused or in a menu, the ambience fades away; it comes back when walking again.
export function duckAmbience(share: number) {
  ambienceDucked = share
  if (!context || !ambienceGain || !ambienceRoom) return
  ambienceGain.gain.setTargetAtTime(AMBIENCE_LEVEL[ambienceRoom] * share, context.currentTime, 0.4)
}

// When the tab is hidden, all sound stops; it resumes when the visitor comes back.
document.addEventListener('visibilitychange', () => {
  if (!context) return
  // Streamed music is paused too, so it continues where it was, not further on.
  const current = ambienceStream?.element
  if (document.hidden) {
    void context.suspend()
    current?.pause()
  } else {
    void context.resume()
    if (current) play(current)
  }
})
