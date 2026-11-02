import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box3, Raycaster, Vector2, Vector3, type Camera, type Intersection, type Object3D } from 'three'
import { useMuseumStore, canUse } from '../state/useMuseumStore'
import { isWallPicture } from '../content/pictures'
import { aimTargets, exhibitIdOf, isQuizTarget } from './aim-targets'
import { releasePointer, requestPointerLock } from './pointer-lock'
import { IS_TOUCH, touchInput } from '../ui/touch'

// How close you must be to open an exhibit (metres from your eyes). The quiz wall is big
// and read from the middle of the room, so its tiles can be chosen from further away.
const AIM_DISTANCE = 3
const QUIZ_AIM_DISTANCE = 6
// Wall pictures are looked at from a few steps back (the top ones around the era number
// above all), so they can be opened from as far as the quiz wall.
const PICTURE_AIM_DISTANCE = 6

// Keys by PHYSICAL position (event.code), like the movement keys.
const OPEN_KEY = 'KeyE'
const MAP_KEY = 'KeyQ' // Q: easy to reach next to W A S D
const SPACE = 'Space' // starts the tutorial; later shows / hides the key list

// Reused every frame (no new lists, so no garbage to clean up, which causes pauses).
const shownTargets: Object3D[] = []
const hits: Intersection[] = []

// Each target's outer box in the world, measured once everything has loaded (with room to
// spare for the turning prototypes). A target whose box the aiming line cannot reach within its length is
// skipped without testing its pieces one by one (that took about 0.65 ms every frame).
const outerBoxes = new WeakMap<Object3D, Box3>()
const boxHit = new Vector3()
function outerBox(target: Object3D): Box3 {
  let box = outerBoxes.get(target)
  if (!box) {
    box = new Box3().setFromObject(target).expandByScalar(0.5)
    // (Before then a model may still be on its way: measured again next time.)
    if (useMuseumStore.getState().warmedUp) outerBoxes.set(target, box)
  }
  return box
}
function inReach(raycaster: Raycaster, target: Object3D): boolean {
  const box = outerBox(target)
  if (box.containsPoint(raycaster.ray.origin)) return true
  return raycaster.ray.intersectBox(box, boxHit) !== null && boxHit.distanceTo(raycaster.ray.origin) <= raycaster.far
}

// Is this object drawn (it and every group around it visible)?
function isShown(object: Object3D): boolean {
  for (let o: Object3D | null = object; o; o = o.parent) if (!o.visible) return false
  return true
}

// What is under the screen point `at` (-1..1 each way) and within reach, or null.
function targetAt(raycaster: Raycaster, at: Vector2, camera: Camera): string | null {
  raycaster.setFromCamera(at, camera)
  // Only things that are drawn can be aimed at (hidden rooms are skipped, which saves
  // testing the whole museum every frame). The nearest hit wins, so a wall in front
  // of an exhibit blocks it.
  shownTargets.length = 0
  for (const target of aimTargets) if (isShown(target) && inReach(raycaster, target)) shownTargets.push(target)
  hits.length = 0
  raycaster.intersectObjects(shownTargets, true, hits)
  const nearest = hits[0]
  const id = nearest ? exhibitIdOf(nearest.object) : null
  if (id && !isQuizTarget(id) && nearest.distance > (isWallPicture(id) ? PICTURE_AIM_DISTANCE : AIM_DISTANCE)) return null
  return id
}

// Open an exhibit, or press a quiz tile (answer, next, start, play again).
function activate(id: string) {
  const store = useMuseumStore.getState()
  if (store.mode !== 'exploring') return
  if (isQuizTarget(id)) {
    // The Time Machine console's button opens the game (TimeMachineGame.tsx).
    store.openGame() // the mode changes first...
    releasePointer() // ...so releasing the mouse is not taken as a pause
    return
  }
  store.openExhibit(id) // sets mode "reading" first...
  releasePointer() // ...so releasing the mouse is not taken as a pause
  store.advanceTutorial('interact')
}

// Aiming and opening: shoots an invisible line ("ray") from the centre of the screen
// every frame. If it hits an exhibit within reach (and no wall is in front of it), that
// exhibit is "aimed at": the prompt shows, and E or a left click opens its panel.
export default function Interaction() {
  const raycaster = useMemo(() => {
    const ray = new Raycaster()
    ray.far = QUIZ_AIM_DISTANCE
    return ray
  }, [])
  const screenCentre = useMemo(() => new Vector2(0, 0), [])
  const tapPoint = useMemo(() => new Vector2(0, 0), [])

  // Every target's outer box measured in one go once loading is over (behind the title
  // screen, after the quality measurement), instead of the first time each room is
  // entered: that cost about 30 ms there, a visible hitch on stepping into a room.
  const measured = useRef(false)
  useFrame(({ camera }) => {
    const store = useMuseumStore.getState()
    if (!measured.current && store.qualityChosen) {
      measured.current = true
      for (const target of aimTargets) outerBox(target)
    }
    let aimed: string | null = null
    // (In the tutorial, aiming only starts at the "interact" step.)
    if (store.mode === 'exploring' && canUse(store.tutorial, 'interact')) {
      aimed = targetAt(raycaster, screenCentre, camera)
      // Touch screens: a tap opens whatever was tapped (not only what is in the middle).
      const tap = touchInput.tap
      if (tap) {
        touchInput.tap = null
        tapPoint.set(tap.x, tap.y)
        const tapped = targetAt(raycaster, tapPoint, camera)
        if (tapped) activate(tapped)
      }
    } else {
      touchInput.tap = null
    }
    // Only tell the store when the answer changes (avoids re-drawing the interface 100x/s).
    if (aimed !== store.aimedExhibitId) store.setAimedExhibit(aimed)
  })

  // A completed visit continued from the title screen: once walking, the map opens to invite
  // another tour of any room (useMuseumStore, finishVisit).
  useEffect(
    () =>
      useMuseumStore.subscribe((state) => {
        if (!state.mapOnContinue || state.mode !== 'exploring') return
        useMuseumStore.setState({ mapOnContinue: false })
        window.setTimeout(() => {
          if (useMuseumStore.getState().mode !== 'exploring') return
          useMuseumStore.getState().setMode('map')
          releasePointer()
        }, 400)
      }),
    [],
  )

  useEffect(() => {
    function openAimedExhibit() {
      const id = useMuseumStore.getState().aimedExhibitId
      if (id) activate(id)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat) return // holding a key must not open/close things repeatedly
      const store = useMuseumStore.getState()
      if (event.code === OPEN_KEY) {
        openAimedExhibit()
      }
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
      // Touch screens send a pretend mouse click after each tap: taps are handled above.
      if (event.button !== 0 || IS_TOUCH) return
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
