import { useFrame } from '@react-three/fiber'
import type { PerspectiveCamera } from 'three'
import { endingMusicTime } from '../audio/sound'
import { useMuseumStore } from '../state/useMuseumStore'
import { mixPose, smooth } from './ending-shots'
import { MUSIC_START, shotAt, trailerClock } from './trailer-script'

// THE TRAILER'S CAMERA (trailer-script.ts): while the trailer plays, it places the camera
// shot by shot. Its clock follows the music, so the closing card lands on the music's
// climax; without sound it keeps its own time. (Only mounted with ?trailer.)
const NORMAL_FOV = 70

export default function TrailerCamera() {
  useFrame(({ camera }, delta) => {
    if (useMuseumStore.getState().mode !== 'trailer') return
    const music = endingMusicTime()
    if (!trailerClock.paused)
      trailerClock.t = music !== null ? Math.max(music - MUSIC_START, trailerClock.t) : trailerClock.t + Math.min(delta, 0.1)
    const { shot, progress } = shotAt(Math.max(0, trailerClock.t))
    // Eased, so each shot glides rather than starting and stopping hard.
    const [position, target] = mixPose(shot.from, shot.to, smooth(0, 1, progress))
    camera.position.set(position[0], position[1], position[2])
    camera.lookAt(target[0], target[1], target[2])
    const lens = camera as PerspectiveCamera
    const fov = shot.fov ?? NORMAL_FOV
    if (lens.fov !== fov) {
      lens.fov = fov
      lens.updateProjectionMatrix()
    }
  })
  return null
}
