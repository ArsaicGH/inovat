import { useEffect } from 'react'
import { AUDIO_ENABLED } from '../features'
import { useMuseumStore } from '../state/useMuseumStore'
import { QUIZ_QUESTIONS } from '../content/quiz'
import { ERA_ROOMS } from '../types'
import { duckAmbience, loadSounds, playEffect, playWelcome, setAmbience, setVolumes, unlockAudio } from './sound'

// Listens to what happens in the game (the shared store) and plays the matching sound.
// Footsteps and doors are played from Player.tsx and Doors.tsx, where they happen.
export default function SoundDirector() {
  useEffect(() => {
    if (!AUDIO_ENABLED) return
    void loadSounds()

    // Browsers allow sound only after the first click or key press.
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)

    // Every interface button clicks.
    const onClick = (event: MouseEvent) => {
      if ((event.target as HTMLElement | null)?.closest('button')) playEffect('click', 0.45)
    }
    document.addEventListener('click', onClick)

    const apply = () => setVolumes(true, useMuseumStore.getState().volumes)
    apply()

    const unsubscribe = useMuseumStore.subscribe((state, before) => {
      if (state.volumes !== before.volumes) apply()

      // Menus and panels.
      if (state.mode !== before.mode) {
        // Leaving the start screen (after the tutorial question): the welcome sound, once.
        if (before.mode === 'start') playWelcome()
        if (state.mode === 'reading') playEffect('open')
        if (before.mode === 'reading') playEffect('close')
        if (state.mode === 'map') playEffect('mapOpen')
        if (before.mode === 'map') playEffect('mapClose')
        // The room sound fades away in menus and comes back when walking.
        duckAmbience(state.mode !== 'exploring')
      }
      if (state.teleport.count !== before.teleport.count && before.teleport.count > 0) playEffect('teleport')

      // Ambience of the area you are in (also starts it once the world is ready).
      if (state.currentRoom !== before.currentRoom || (state.worldReady && !before.worldReady)) setAmbience(state.currentRoom)

      // Tutorial: each step completed.
      if (state.tutorial !== before.tutorial && before.tutorial && state.tutorial) playEffect('stepDone', 0.5)

      // A new era room visited: a soft chime.
      const newEra = state.visitedRooms.find((room) => !before.visitedRooms.includes(room) && ERA_ROOMS.includes(room))
      if (newEra) playEffect('newRoom', 0.5)

      // The locked Game Room door, when you walk up to it.
      if (state.nearLockedDoor && !before.nearLockedDoor) playEffect('locked', 0.6)

      // Quiz on the wall.
      const chosen = state.quizAnswers[state.quizIndex]
      if (state.quizStage === 'question' && chosen !== null && chosen !== undefined && before.quizAnswers[state.quizIndex] === null) {
        playEffect(chosen === QUIZ_QUESTIONS[state.quizIndex].answer ? 'correct' : 'wrong', 0.6)
      }
      if (state.quizStage === 'question' && (state.quizIndex !== before.quizIndex || before.quizStage !== 'question')) playEffect('select', 0.5)
      if (state.quizStage === 'results' && before.quizStage !== 'results') playEffect('results', 0.6)
    })

    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      document.removeEventListener('click', onClick)
      unsubscribe()
    }
  }, [])

  return null
}
