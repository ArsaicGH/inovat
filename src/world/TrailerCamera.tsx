import { useFrame } from '@react-three/fiber'
import type { PerspectiveCamera } from 'three'
import { endingMusicTime } from '../audio/sound'
import { useMuseumStore, type Mode } from '../state/useMuseumStore'
import { film, mixPose, smooth } from './ending-shots'
import { MUSIC_START, segmentAt, trailerClock } from './trailer-script'

// THE TRAILER'S CAMERA (trailer-script.ts): while the trailer plays, it places the camera
// segment by segment, and switches the game into the ending film (for its glimpse) or the
// Time Machine's window when the script asks. Its clock follows the music, so the cuts and
// the closing title land on the beat; without sound it keeps its own time.
// (Only mounted with ?trailer.)
const NORMAL_FOV = 70
const TRAILER_MODES: Mode[] = ['trailer', 'game', 'ending']

export default function TrailerCamera() {
  useFrame(({ camera }, delta) => {
    const store = useMuseumStore.getState()
    if (!TRAILER_MODES.includes(store.mode) || trailerClock.t < 0) return
    const music = endingMusicTime()
    if (!trailerClock.paused) trailerClock.t = music !== null ? Math.max(music - MUSIC_START, trailerClock.t) : trailerClock.t + Math.min(delta, 0.1)
    const { segment, into } = segmentAt(trailerClock.t)

    // The ending film draws itself; the trailer only chooses its moment.
    // (A black beat keeps whatever is behind it, so the film is not stopped and restarted.)
    const wanted: Mode = segment.kind === 'film' ? 'ending' : segment.kind === 'game' ? 'game' : segment.kind === 'black' ? store.mode : 'trailer'
    if (store.mode !== wanted) store.setMode(wanted)
    film.override = segment.kind === 'film' ? segment.at + into * (segment.speed ?? 1) : null
    if (segment.kind === 'film' || segment.kind === 'black') return

    const lens = camera as PerspectiveCamera
    const fov = segment.kind === 'museum' ? (segment.fov ?? NORMAL_FOV) : lens.fov
    if (lens.fov !== fov) {
      lens.fov = fov
      lens.updateProjectionMatrix()
    }
    const [position, target] =
      segment.kind === 'game'
        ? segment.pose
        : mixPose(segment.from, segment.to, segment.linear ? into / segment.duration : smooth(0, segment.duration, into))
    camera.position.set(position[0], position[1], position[2])
    camera.lookAt(target[0], target[1], target[2])
  })
  return null
}
