import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Raycaster, Vector2 } from 'three'
import { useMuseumStore, canUse } from '../state/useMuseumStore'
import { aimTargets, exhibitIdOf } from './aim-targets'
import { releasePointer, requestPointerLock } from './pointer-lock'

// How close you must be to open an exhibit (metres from your eyes).
const AIM_DISTANCE = 3

// Keys by PHYSICAL position (event.code), like the movement keys.
const OPEN_KEY = 'KeyE'
const MAP_KEY = 'KeyM'
const SPACE = 'Space' // starts the tutorial; later shows / hides the key list

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
    // (In the tutorial, aiming only starts at the "interact" step.)
    if (store.mode === 'exploring' && canUse(store.tutorial, 'interact')) {
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
      store.advanceTutorial('interact')
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat) return // holding a key must not open/close things repeatedly
      const store = useMuseumStore.getState()
      if (event.code === OPEN_KEY) openAimedExhibit()
      if (event.code === MAP_KEY && store.mode === 'exploring' && canUse(store.tutorial, 'map')) {
        store.setMode('map')
        releasePointer()
        store.advanceTutorial('map')
      }
      if (event.code === SPACE && store.mode === 'exploring') {
        // Tutorial intro card: Space starts the tutorial. Afterwards it shows the key list.
        if (store.tutorial === 'intro') store.advanceTutorial('intro')
        else if (canUse(store.tutorial, 'keys')) {
          store.toggleKeyList()
          store.advanceTutorial('keys')
        }
      }
    }

    // Left click is a backup for E (in case a typing tool interferes with the key).
    function onMouseDown(event: MouseEvent) {
      if (event.button !== 0) return
      const store = useMuseumStore.getState()
      // Walking with a free mouse: the click captures it (instead of opening anything).
      if (store.mode === 'exploring' && !store.mouseCaptured) {
        void requestPointerLock()
        return
      }
      openAimedExhibit()
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
