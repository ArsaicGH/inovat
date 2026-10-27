import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Raycaster, Vector2, type Camera, type Intersection, type Object3D } from 'three'
import { useMuseumStore, canUse } from '../state/useMuseumStore'
import { aimTargets, exhibitIdOf, isQuizTarget } from './aim-targets'
import { releasePointer, requestPointerLock } from './pointer-lock'
import { IS_TOUCH, touchInput } from '../ui/touch'

// How close you must be to open an exhibit (metres from your eyes). The quiz wall is big
// and read from the middle of the room, so its tiles can be chosen from further away.
const AIM_DISTANCE = 3
const QUIZ_AIM_DISTANCE = 6

// Keys by PHYSICAL position (event.code), like the movement keys.
const OPEN_KEY = 'KeyE'
const ANSWER_KEYS = [
  ['Digit1', 'Numpad1'],
  ['Digit2', 'Numpad2'],
  ['Digit3', 'Numpad3'],
  ['Digit4', 'Numpad4'],
]
const MAP_KEY = 'KeyQ' // Q: easy to reach next to W A S D
const SPACE = 'Space' // starts the tutorial; later shows / hides the key list

// Reused every frame (no new lists, so no garbage to clean up, which causes pauses).
const shownTargets: Object3D[] = []
const hits: Intersection[] = []

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
  for (const target of aimTargets) if (isShown(target)) shownTargets.push(target)
  hits.length = 0
  raycaster.intersectObjects(shownTargets, true, hits)
  const nearest = hits[0]
  const id = nearest ? exhibitIdOf(nearest.object) : null
  if (id && !isQuizTarget(id) && nearest.distance > AIM_DISTANCE) return null
  return id
}

// Open an exhibit, or press a quiz tile (answer, next, start, play again).
function activate(id: string) {
  const store = useMuseumStore.getState()
  if (store.mode !== 'exploring') return
  if (isQuizTarget(id)) {
    if (id === 'quiz-start' || id === 'quiz-retry') store.startQuiz()
    else if (id === 'quiz-next') store.nextQuizQuestion()
    else store.answerQuiz(Number(id.slice('quiz-answer-'.length)))
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

  useFrame(({ camera }) => {
    const store = useMuseumStore.getState()
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

  useEffect(() => {
    function openAimedExhibit() {
      const id = useMuseumStore.getState().aimedExhibitId
      if (id) activate(id)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat) return // holding a key must not open/close things repeatedly
      const store = useMuseumStore.getState()
      if (event.code === OPEN_KEY) {
        // In the Game Room, after answering, E simply goes to the next question (no need
        // to aim at the button).
        const answered = store.quizStage === 'question' && store.quizAnswers[store.quizIndex] !== null
        if (answered && store.mode === 'exploring' && store.currentRoom === 'quiz') store.nextQuizQuestion()
        else openAimedExhibit()
      }
      // In the Game Room, 1-4 choose answer A-D without aiming (top row or number pad).
      const answerKey = ANSWER_KEYS.findIndex((codes) => codes.includes(event.code))
      if (answerKey >= 0 && store.mode === 'exploring' && store.currentRoom === 'quiz' && store.quizStage === 'question') {
        store.answerQuiz(answerKey) // ignored once this question is answered
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
