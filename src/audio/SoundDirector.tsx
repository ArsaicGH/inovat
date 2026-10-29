import { useEffect } from 'react'
import { AUDIO_ENABLED } from '../features'
import { useMuseumStore } from '../state/useMuseumStore'
import { ERA_ROOMS } from '../types'
import { duckAmbience, loadSounds, playEffect, playWelcome, setAmbience, setVolumes, stopWelcome, unlockAudio } from './sound'

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
        // (Only when the visit starts in the intro hall.)
        if (before.mode === 'start' && state.currentRoom === 'hall') playWelcome()
        if (state.mode === 'reading') playEffect('open')
        if (before.mode === 'reading') playEffect('close')
        if (state.mode === 'map') playEffect('mapOpen')
        if (before.mode === 'map') playEffect('mapClose')
        if (state.mode === 'ending') playEffect('teleport')
        // The room sound fades away in menus and comes back when walking.
        // (Softer, not silent, while playing the Time Machine game.)
        duckAmbience(state.mode === 'exploring' || state.mode === 'ending' ? 1 : state.mode === 'game' ? 0.45 : 0)
      }
      if (state.teleport.count !== before.teleport.count && before.teleport.count > 0) playEffect('teleport')

      // Ambience of the area you are in (also starts it once the world is ready).
      if (state.currentRoom !== before.currentRoom || (state.worldReady && !before.worldReady)) setAmbience(state.currentRoom)
      if (state.currentRoom !== before.currentRoom && state.currentRoom !== 'hall' && state.currentRoom !== 'rotunda') stopWelcome()

      // Tutorial: each step completed.
      if (state.tutorial !== before.tutorial && before.tutorial && state.tutorial) playEffect('stepDone', 0.5)

      // A new era room visited: a soft chime.
      const newEra = state.visitedRooms.find((room) => !before.visitedRooms.includes(room) && ERA_ROOMS.includes(room))
      if (newEra) playEffect('newRoom', 0.5)

      // The locked Game Room door, when you walk up to it.
      if (state.nearLockedDoor && !before.nearLockedDoor) playEffect('locked', 0.6)

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
