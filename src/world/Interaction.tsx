import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Raycaster, Vector2 } from 'three'
import { useMuseumStore } from '../state/useMuseumStore'
import { aimTargets, exhibitIdOf } from './aim-targets'
import { releasePointer } from './pointer-lock'

// How close you must be to open an exhibit (metres from your eyes).
const AIM_DISTANCE = 3

// Keys by PHYSICAL position (event.code), like the movement keys.
const OPEN_KEY = 'KeyE'
const MAP_KEY = 'KeyM'

// Aiming and opening: shoots an invisible line ("ray") from the centre of the screen
// every frame. If it hits an exhibit within reach (and no wall is in front of it), that
// exhibit is "aimed at": the prompt shows, and E or a left click opens its panel.
export default function Interaction() {
  const raycaster = useMemo(() => {
    const ray = new Raycaster()
    ray.far = AIM_DISTANCE
    return ray
  }, [])
  const screenCentre = useMemo(() => new Vector2(0, 0), [])

  useFrame(({ camera }) => {
    const store = useMuseumStore.getState()
    let aimed: string | null = null
    if (store.mode === 'exploring') {
      raycaster.setFromCamera(screenCentre, camera)
      // The nearest hit wins, so a wall in front of an exhibit blocks it.
      const nearest = raycaster.intersectObjects(aimTargets, true)[0]
      aimed = nearest ? exhibitIdOf(nearest.object) : null
    }
    // Only tell the store when the answer changes (avoids re-drawing the interface 100x/s).
    if (aimed !== store.aimedExhibitId) store.setAimedExhibit(aimed)
  })

  useEffect(() => {
    function openAimedExhibit() {
      const store = useMuseumStore.getState()
      if (store.mode !== 'exploring' || !store.aimedExhibitId) return
      store.openExhibit(store.aimedExhibitId) // sets mode "reading" first...
      releasePointer() // ...so releasing the mouse is not taken as a pause
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat) return // holding a key must not open/close things repeatedly
      const store = useMuseumStore.getState()
      if (event.code === OPEN_KEY) openAimedExhibit()
      if (event.code === MAP_KEY && store.mode === 'exploring') {
        store.setMode('map')
        releasePointer()
      }
    }

    // Left click is a backup for E (in case a typing tool interferes with the key).
    function onMouseDown(event: MouseEvent) {
      if (event.button === 0) openAimedExhibit()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('mousedown', onMouseDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('mousedown', onMouseDown)
    }
  }, [])

  return null
}
