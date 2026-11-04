import { useFrame } from '@react-three/fiber'
import type { PerspectiveCamera } from 'three'
import { endingMusicTime } from '../audio/sound'
import { useMuseumStore, type Mode } from '../state/useMuseumStore'
import { film, mixPose, smooth } from './ending-shots'
import { startRun } from '../ui/game-run'
import { GAME_SHOTS, GAME_SHOT_LENGTH, GAME_START, MUSIC_START, SEGMENTS, segmentAt, trailerClock } from './trailer-script'

// The exhibit whose enlarged board the trailer shows.
const BOARD = SEGMENTS.find((segment) => segment.kind === 'reading')?.exhibit ?? null

// THE TRAILER'S CAMERA (trailer-script.ts): while the trailer plays, it places the camera
// segment by segment, and switches the game into the ending film (for its glimpse) or the
// Time Machine's window when the script asks. Its clock follows the music, so the cuts and
// the closing title land on the beat; without sound it keeps its own time.
// (Only mounted with ?trailer.)
const NORMAL_FOV = 70
const TRAILER_MODES: Mode[] = ['trailer', 'game', 'ending', 'reading']
let gameShot = -1 // the Time Machine shot on screen (GAME_SHOTS)
let gameStep = 0 // how far it has been played

export default function TrailerCamera() {
  useFrame(({ camera }, delta) => {
    const store = useMuseumStore.getState()
    if (!TRAILER_MODES.includes(store.mode) || trailerClock.t < 0) return
    const music = endingMusicTime()
    if (!trailerClock.paused) trailerClock.t = music !== null ? Math.max(music - MUSIC_START, trailerClock.t) : trailerClock.t + Math.min(delta, 0.1)
    const { segment, into } = segmentAt(trailerClock.t)

    // The ending film draws itself; the trailer only chooses its moment.
    // (A black beat keeps whatever is behind it, so the film is not stopped and restarted.)
    // SMOOTHNESS: the enlarged board and the Time Machine's window (each with its own small
    // 3D view) are opened once, unseen, at the very start, and stay open all through the
    // trailer; their shots only reveal them (html.trailer-reading / .trailer-game, index.css).
    // Opening one mid-trailer (a new 3D view, its drawing code built) or closing it (the 3D
    // view torn down) stalled the picture for a moment.
    const root = document.documentElement.classList
    root.toggle('trailer-reading', segment.kind === 'reading')
    root.toggle('trailer-game', segment.kind === 'game')
    if (store.openExhibitId !== BOARD) useMuseumStore.setState({ openExhibitId: BOARD })
    const wanted: Mode = segment.kind === 'film' ? 'ending' : segment.kind === 'game' ? 'game' : segment.kind === 'reading' ? 'reading' : segment.kind === 'black' ? store.mode : 'trailer'
    if (store.mode !== wanted) store.setMode(wanted)
    // The Time Machine: two shots, each a core played live (GAME_SHOTS). Before them, the first
    // core is already dealt (its 3D model turning, unseen).
    if (segment.kind === 'game' || trailerClock.t < GAME_START) {
      const playing = segment.kind === 'game'
      const index = playing ? Math.min(GAME_SHOTS.length - 1, Math.floor(into / GAME_SHOT_LENGTH)) : 0
      const shot = GAME_SHOTS[index]
      const at = playing ? into - index * GAME_SHOT_LENGTH : 0
      if (index !== gameShot || !store.gameRun) {
        gameShot = index
        gameStep = 0
        startRun(shot.round)
        if (shot.card) {
          const run = useMuseumStore.getState().gameRun!
          store.patchGameRun({ deck: [shot.card, ...run.deck.filter((id) => id !== shot.card)] })
        }
      }
      // The window's framing for this moment of the shot (eased like a camera move).
      const panel = document.querySelector<HTMLElement>('.game-panel')
      if (panel) {
        const k = smooth(0, GAME_SHOT_LENGTH, at)
        const f = (key: keyof (typeof shot)['from']) => shot.from[key] + (shot.to[key] - shot.from[key]) * k
        panel.style.transformOrigin = shot.origin
        panel.style.transform = `translate(${f('x')}%, ${f('y')}%) rotateX(${f('turnX')}deg) rotateY(${f('turnY')}deg) scale(${f('scale')})`
      }
      if (shot.solveAt !== undefined && gameStep === 0 && at >= shot.solveAt) {
        gameStep = 1
        store.patchGameRun({ solved: true, points: 2, combo: 1 })
      }
      const clues = (shot.cluesAt ?? []).filter((time) => at >= time).length
      if (shot.cluesAt && clues > gameStep) {
        gameStep = clues
        store.patchGameRun({ clues: 1 + clues })
      }
    }
    // The enlarged board: its text scrolls down to the sources at the end.
    if (segment.kind === 'reading') {
      const scroller = document.querySelector('.info-panel .board-scroll')
      if (scroller) scroller.scrollTop = smooth(0.5, segment.duration - 0.2, into) * (scroller.scrollHeight - scroller.clientHeight)
    }
    film.override = segment.kind === 'film' ? segment.at + into * (segment.speed ?? 1) : null
    if (segment.kind === 'film' || segment.kind === 'black') return

    const lens = camera as PerspectiveCamera
    const fov = segment.kind === 'museum' ? (segment.fov ?? NORMAL_FOV) : lens.fov
    if (lens.fov !== fov) {
      lens.fov = fov
      lens.updateProjectionMatrix()
    }
    const [position, target] =
      segment.kind === 'game' || segment.kind === 'reading'
        ? segment.pose
        : mixPose(segment.from, segment.to, segment.linear ? into / segment.duration : smooth(0, segment.duration, into))
    camera.position.set(position[0], position[1], position[2])
    camera.lookAt(target[0], target[1], target[2])
  })
  return null
}
