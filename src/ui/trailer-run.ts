import { useMuseumStore } from '../state/useMuseumStore'
import { playEndingMusic, setEndingMusicPaused, unlockAudio } from '../audio/sound'
import { film } from '../world/ending-shots'
import { MUSIC_START, setTrailer, trailerCamera, trailerClock } from '../world/trailer-script'

// STARTING AND ENDING THE TRAILER: on the ?trailer page (click to play), or from "Xem trailer"
// on the title screen, which plays the same trailer and then returns to the title screen
// (TrailerScreen.tsx fades one into the other). The trailer opens every room and lights all
// four cores for the camera; the visitor's own progress is put back afterwards.

type Saved = Pick<
  ReturnType<typeof useMuseumStore.getState>,
  'quizPassed' | 'gameCores' | 'coreStars' | 'gameRun' | 'openExhibitId' | 'aimedExhibitId' | 'currentRoom' | 'visitedRooms'
>
let saved: Saved | null = null
// Started from the title screen (and so returns to it).
export let trailerFromMenu = false

export function startTrailer(from: number, fromMenu: boolean) {
  unlockAudio()
  const s = useMuseumStore.getState()
  saved = {
    quizPassed: s.quizPassed,
    gameCores: s.gameCores,
    coreStars: s.coreStars,
    gameRun: s.gameRun,
    openExhibitId: s.openExhibitId,
    aimedExhibitId: s.aimedExhibitId,
    currentRoom: s.currentRoom,
    visitedRooms: s.visitedRooms,
  }
  trailerFromMenu = fromMenu
  setTrailer(true)
  document.documentElement.classList.add('trailer-on')
  // Everything open and lit for the camera: all four cores, the portal.
  useMuseumStore.setState({ trailerActive: true, quizPassed: true, gameCores: 4, coreStars: [3, 3, 3, 3] })
  trailerClock.t = from
  trailerClock.paused = false
  s.setMode('trailer')
  playEndingMusic(MUSIC_START + from)
  // The 3D model views of the board and the game, fetched now so they appear at once.
  void import('../world/ModelViewer')
}

// The way back to the title screen, while the screen is black: the visitor's own progress,
// the camera where it was, the title screen underneath.
export function leaveTrailer() {
  document.documentElement.classList.remove('trailer-on', 'trailer-reading', 'trailer-game')
  setEndingMusicPaused(true)
  trailerClock.t = -1
  trailerClock.paused = false
  trailerCamera.restore = true
  film.override = null
  useMuseumStore.setState({ ...(saved ?? {}), mode: 'start' })
  saved = null
}

// Once the title screen shows again: the trailer's screen goes.
export function closeTrailer() {
  setTrailer(false)
  trailerFromMenu = false
  useMuseumStore.setState({ trailerActive: false })
}
