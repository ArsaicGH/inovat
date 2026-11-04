import { useFrame } from '@react-three/fiber'
import type { PerspectiveCamera } from 'three'
import { endingMusicTime } from '../audio/sound'
import { useMuseumStore, type Mode } from '../state/useMuseumStore'
import { film, mixPose, smooth } from './ending-shots'
import { startRun } from '../ui/game-run'
import { GAME_FRAMES, MUSIC_START, segmentAt, trailerClock } from './trailer-script'

// THE TRAILER'S CAMERA (trailer-script.ts): while the trailer plays, it places the camera
// segment by segment, and switches the game into the ending film (for its glimpse) or the
// Time Machine's window when the script asks. Its clock follows the music, so the cuts and
// the closing title land on the beat; without sound it keeps its own time.
// (Only mounted with ?trailer.)
const NORMAL_FOV = 70
const TRAILER_MODES: Mode[] = ['trailer', 'game', 'ending', 'reading']
let gameFrame = -1 // the Time Machine moment on screen (GAME_FRAMES)

export default function TrailerCamera() {
  useFrame(({ camera }, delta) => {
    const store = useMuseumStore.getState()
    if (!TRAILER_MODES.includes(store.mode) || trailerClock.t < 0) return
    const music = endingMusicTime()
    if (!trailerClock.paused) trailerClock.t = music !== null ? Math.max(music - MUSIC_START, trailerClock.t) : trailerClock.t + Math.min(delta, 0.1)
    const { segment, into } = segmentAt(trailerClock.t)

    // The ending film draws itself; the trailer only chooses its moment.
    // (A black beat keeps whatever is behind it, so the film is not stopped and restarted.)
    const wanted: Mode =
      segment.kind === 'film' ? 'ending' : segment.kind === 'game' ? 'game' : segment.kind === 'reading' ? 'reading' : segment.kind === 'black' ? store.mode : 'trailer'
    if (store.mode !== wanted) {
      if (segment.kind === 'reading') store.openExhibit(segment.exhibit)
      else {
        // (Leaving the enlarged board closes it: it shrinks away as the next shot starts.)
        if (store.openExhibitId) useMuseumStore.setState({ openExhibitId: null })
        store.setMode(wanted)
      }
    }
    // The Time Machine: quick moments from the middle of its cores, one per beat.
    if (segment.kind === 'game') {
      const frame = Math.min(GAME_FRAMES.length - 1, Math.floor(into / 0.4))
      if (frame !== gameFrame) {
        gameFrame = frame
        const [round, solved] = GAME_FRAMES[frame]
        startRun(round)
        if (solved) store.patchGameRun({ solved: true, points: 2, clues: 3 })
        else if (round === 2) store.patchGameRun({ clues: 2 })
      }
    } else gameFrame = -1
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
