import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useMuseumStore, canUse, saveProgress } from '../state/useMuseumStore'
import { moveWithCollision, type Box } from './collision'
import { getCanvas } from './pointer-lock'
import { regionAt, spawnOf } from './layout'
import { closedDoorBlockers } from './door-state'
import { ERA_ROOMS, type RoomId } from '../types'
import { debugStats } from './debug-stats'

const WALK_SPEED = 3 // metres per second
const SPRINT_SPEED = 5.5 // while Shift is held (crossing the rotunda faster)
const TURN_SPEED = 2 // radians per second when turning with ← / → (~115°/s)
const TILT_SPEED = 1.5 // radians per second when looking up/down with ↑ / ↓
const EYE_HEIGHT = 1.6 // metres, roughly a standing visitor
// Radians per pixel of mouse movement at sensitivity 1. The visitor's own OS mouse and
// touchpad settings still apply on top, and the slider multiplies this.
const BASE_MOUSE_SENSITIVITY = 0.0015
// Stop just short of straight up/down, so the camera can never flip upside-down.
const MAX_PITCH = Math.PI / 2 - 0.05

// Smoothing (higher = snappier). The mouse and the screen update at different rates,
// so applying each mouse event instantly looks stair-stepped; the camera instead glides
// to where the mouse points within a few hundredths of a second.
const LOOK_SMOOTHING = 25
// Walking reaches full speed (and stops) in about a tenth of a second.
const WALK_ACCELERATION = 12

// Keys are matched by PHYSICAL position (event.code), not by the typed letter.
// W A S D walk. The arrow keys move the camera, like the mouse, so touchpad users can
// look around while walking (laptops often switch the touchpad off while keys are held).
const FORWARD = ['KeyW']
const BACKWARD = ['KeyS']
const STEP_LEFT = ['KeyA']
const STEP_RIGHT = ['KeyD']
const TURN_LEFT = ['ArrowLeft']
const TURN_RIGHT = ['ArrowRight']
const LOOK_UP = ['ArrowUp']
const LOOK_DOWN = ['ArrowDown']
const WALK_KEYS = [...FORWARD, ...BACKWARD, ...STEP_LEFT, ...STEP_RIGHT]
const SPRINT = ['ShiftLeft', 'ShiftRight']

// A released key must stay released this long before walking stops (see onKeyUp).
const KEY_RELEASE_GRACE_MS = 60

// Tutorial: the "look" step is done after this much time spent turning the camera (time,
// not angle, so it feels the same at any sensitivity), the "move" step after walking this far.
const TUTORIAL_LOOK_TIME = 1 // seconds
const TUTORIAL_WALK = 3 // metres
const TUTORIAL_SPRINT = 4 // metres run with Shift to finish the "sprint" step

// After this many normal W/A/S/D presses in a row, we trust the typing tool is off.
const NORMAL_PRESSES_TO_CLEAR_WARNING = 4

// Chrome/Edge sometimes report a fake mouse jump of about half the window while the
// mouse is captured (when the hidden cursor is re-centred), making the view snap.
// A real hand never moves that far in one event, so ignore anything above a quarter window.
function isFakeMouseJump(event: MouseEvent): boolean {
  const limit = Math.max(window.innerWidth, window.innerHeight) / 4
  return Math.abs(event.movementX) > limit || Math.abs(event.movementY) > limit
}

// Unikey/EVKey in Vietnamese mode swallow Telex keys (a, s, d, w...) and send
// Backspace + accented letters instead. Seeing those while walking means a typing tool is on.
function looksLikeTypingTool(event: KeyboardEvent): boolean {
  const accentedLetter = event.key.length === 1 && event.key.charCodeAt(0) > 127
  return event.key === 'Backspace' || accentedLetter
}

// A normal press: W/A/S/D arriving as its own plain letter (e.g. code "KeyW", key "w").
function isNormalWalkPress(event: KeyboardEvent): boolean {
  return WALK_KEYS.includes(event.code) && event.key.toLowerCase() === event.code.slice(3).toLowerCase()
}

// Move `current` towards `target`; `rate` is how fast, `dt` the frame time in seconds.
// Using exp() makes the result the same at any frame rate.
function approach(current: number, target: number, rate: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-rate * dt))
}

interface PlayerProps {
  walls: Box[] // fixed walls; closed doors are added every frame
}

export default function Player({ walls }: PlayerProps) {
  // `get()` returns the current 3D state; we read the camera from it at the moment we
  // move it (moving the camera is exactly what this component is for).
  const get = useThree((state) => state.get)
  // The same Set is shown live in the development readout.
  const pressed = useRef(debugStats.held)
  // Where the visitor wants to look (set by mouse/arrows) and where the camera looks now.
  const targetYaw = useRef(0) // turning left/right
  const targetPitch = useRef(0) // looking up/down
  const yaw = useRef(0)
  const pitch = useRef(0)
  const velocity = useRef({ x: 0, z: 0 }) // metres per second
  const normalPresses = useRef(0)
  const tutorialProgress = useRef(0) // turned (radians) or walked (metres) in the current step
  // -1 = nothing handled yet, so the very first frame "teleports" us to the store's
  // starting room (the hall). Map teleports later reuse the same code.
  const handledTeleports = useRef(-1)

  const lastSave = useRef(0)

  // Stand at a room's spawn point (start of the visit, map teleport), or at a saved spot.
  function placeAt(room: RoomId, saved: { x: number; z: number; yaw: number } | null = null) {
    const camera = get().camera
    const spawn = saved ?? spawnOf(room)
    camera.position.set(spawn.x, EYE_HEIGHT, spawn.z)
    yaw.current = targetYaw.current = spawn.yaw
    pitch.current = targetPitch.current = 0
    velocity.current = { x: 0, z: 0 }
    // "YXZ" = turn left/right first, then tilt up/down, like a person's head.
    camera.rotation.order = 'YXZ'
    camera.rotation.set(0, spawn.yaw, 0)
  }

  useEffect(() => {
    const store = useMuseumStore.getState
    // Keys waiting to be counted as released (see onKeyUp).
    const releaseTimers = new Map<string, number>()

    // Forget all held keys at once (pause, panel, window loses focus...).
    function releaseAllKeys() {
      releaseTimers.forEach((timer) => clearTimeout(timer))
      releaseTimers.clear()
      pressed.current.clear()
    }

    // The browser tells us whenever the mouse is captured or released.
    // Captured = exploring. Released (Esc, Alt+Tab...) while exploring = paused.
    function onLockChange() {
      const captured = document.pointerLockElement === getCanvas()
      store().setMouseCaptured(captured)
      if (captured) {
        store().startExploring()
      } else {
        releaseAllKeys() // forget held keys, so we do not keep walking
        velocity.current = { x: 0, z: 0 }
        store().setTypingToolWarning(false)
        // Released on purpose for a panel or the map: those modes are already set.
        if (store().mode === 'exploring') {
          store().setMode('paused')
          store().advanceTutorial('pause') // last tutorial step: open the pause menu
        }
      }
    }

    // Chrome/Edge also send smaller fake jumps now and then (a single event much bigger
    // than the ones around it), which jerk the camera up or down. A real hand speeds up
    // gradually, so an event far bigger than the recent average is ignored.
    let recentMove = 0 // average size of recent mouse events (pixels)
    function isMouseSpike(event: MouseEvent): boolean {
      const size = Math.hypot(event.movementX, event.movementY)
      const spike = size > 60 && size > recentMove * 6 + 20
      // A spike still raises the average a lot, so a real fast flick (many big events in
      // a row) gets through from its second event on; only a lone jump is dropped.
      recentMove = spike ? recentMove * 0.5 + size * 0.5 : recentMove * 0.8 + size * 0.2
      return spike
    }

    function onMouseMove(event: MouseEvent) {
      debugStats.mouseMoves += 1
      if (store().mode !== 'exploring' || isFakeMouseJump(event) || isMouseSpike(event)) return
      if (!store().mouseCaptured) return // free mouse: only a click captures it again
      if (!canUse(store().tutorial, 'look')) return // tutorial: camera still frozen
      const sensitivity = BASE_MOUSE_SENSITIVITY * store().mouseSensitivity
      targetYaw.current -= event.movementX * sensitivity
      targetPitch.current -= event.movementY * sensitivity
      targetPitch.current = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, targetPitch.current))
    }

    function onKeyDown(event: KeyboardEvent) {
      debugStats.keyDowns += 1
      // Pressed again before its release was confirmed: it was a fake release.
      const pendingRelease = releaseTimers.get(event.code)
      if (pendingRelease !== undefined) {
        clearTimeout(pendingRelease)
        releaseTimers.delete(event.code)
        debugStats.keyChatter += 1
      }
      pressed.current.add(event.code)
      if (store().mode !== 'exploring') return

      // Esc while walking without the mouse captured: the browser has nothing to release,
      // so pause here ourselves.
      if (event.code === 'Escape' && !store().mouseCaptured) {
        releaseAllKeys()
        velocity.current = { x: 0, z: 0 }
        store().setMode('paused')
        store().advanceTutorial('pause')
        return
      }

      // Show the typing-tool warning as soon as it interferes, and hide it as soon as
      // a few normal presses in a row show the visitor has switched to English mode.
      if (looksLikeTypingTool(event)) {
        normalPresses.current = 0
        store().setTypingToolWarning(true)
      } else if (isNormalWalkPress(event)) {
        normalPresses.current += 1
        if (normalPresses.current >= NORMAL_PRESSES_TO_CLEAR_WARNING && store().typingToolWarning) {
          store().setTypingToolWarning(false)
        }
      }
    }
    // Keyboard hooks such as Unikey can send a fake "released" between the repeats of a
    // held key, which made walking go move-stop-move-stop. So a key only counts as
    // released if it STAYS released for a moment; a quick re-press cancels the release.
    function onKeyUp(event: KeyboardEvent) {
      debugStats.keyUps += 1
      const code = event.code
      clearTimeout(releaseTimers.get(code))
      releaseTimers.set(
        code,
        window.setTimeout(() => {
          releaseTimers.delete(code)
          pressed.current.delete(code)
        }, KEY_RELEASE_GRACE_MS),
      )
    }
    function onBlur() {
      releaseAllKeys()
    }

    document.addEventListener('pointerlockchange', onLockChange)
    document.addEventListener('mousemove', onMouseMove)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      releaseAllKeys()
      document.removeEventListener('pointerlockchange', onLockChange)
      document.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [get])

  useFrame(({ camera }, delta) => {
    const store = useMuseumStore.getState()

    // A new map teleport request? (Checked in every mode: the map is open when it is made.)
    if (store.teleport.count !== handledTeleports.current) {
      handledTeleports.current = store.teleport.count
      placeAt(store.teleport.roomId, store.teleport.pose ?? null)
    }

    // Save progress about once a second once the visit has started.
    const now = performance.now()
    if (store.mode !== 'start' && now - lastSave.current > 1000) {
      lastSave.current = now
      saveProgress({ x: camera.position.x, z: camera.position.z, yaw: yaw.current })
    }

    // Keep "which room am I in" up to date (on-screen name, map, hiding unseen rooms).
    // Stepping inside an era room counts as visiting it (all four unlock the quiz room).
    const region = regionAt(camera.position.x, camera.position.z)
    if (region) {
      if (region.room !== store.currentRoom) store.setCurrentRoom(region.room)
      if (region.inside && ERA_ROOMS.includes(region.room) && !store.visitedRooms.includes(region.room)) {
        store.markVisited(region.room)
      }
    }

    if (store.mode !== 'exploring') return

    // Use the REAL time since the last frame, so each step matches what is on screen even
    // when frames arrive unevenly. (An averaged time made such moments look worse.)
    // Capped, so a long hitch cannot carry us through a wall.
    const dt = Math.min(delta, 0.1)
    const isDown = (codes: string[]) => codes.some((code) => pressed.current.has(code))

    // In the tutorial, controls unlock one at a time.
    const canLook = canUse(store.tutorial, 'look')
    const canMove = canUse(store.tutorial, 'move')
    const sprinting = canUse(store.tutorial, 'sprint') && isDown(SPRINT)

    // Camera: arrow keys change the target, then the camera glides towards it.
    const turn = canLook ? (isDown(TURN_RIGHT) ? 1 : 0) - (isDown(TURN_LEFT) ? 1 : 0) : 0
    const tilt = canLook ? (isDown(LOOK_UP) ? 1 : 0) - (isDown(LOOK_DOWN) ? 1 : 0) : 0
    targetYaw.current -= turn * TURN_SPEED * dt
    targetPitch.current += tilt * TILT_SPEED * dt
    targetPitch.current = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, targetPitch.current))
    const oldYaw = yaw.current
    const oldPitch = pitch.current
    yaw.current = approach(yaw.current, targetYaw.current, LOOK_SMOOTHING, dt)
    pitch.current = approach(pitch.current, targetPitch.current, LOOK_SMOOTHING, dt)
    camera.rotation.set(pitch.current, yaw.current, 0)

    // Tutorial "look" step: done after turning about 70 degrees in total.
    if (store.tutorial === 'look') {
      const turning = Math.abs(yaw.current - oldYaw) + Math.abs(pitch.current - oldPitch) > 0.0005
      if (turning) tutorialProgress.current += dt
      if (tutorialProgress.current > TUTORIAL_LOOK_TIME) {
        tutorialProgress.current = 0
        store.advanceTutorial('look')
      }
    }

    // Walking: work out the wanted direction on the floor, based on where we face.
    const forward = canMove ? (isDown(FORWARD) ? 1 : 0) - (isDown(BACKWARD) ? 1 : 0) : 0
    const strafe = canMove ? (isDown(STEP_RIGHT) ? 1 : 0) - (isDown(STEP_LEFT) ? 1 : 0) : 0
    const sin = Math.sin(yaw.current)
    const cos = Math.cos(yaw.current)
    let wantX = -sin * forward + cos * strafe
    let wantZ = -cos * forward - sin * strafe
    // Diagonal keys should not be faster than straight ones.
    const length = Math.hypot(wantX, wantZ)
    if (length > 0) {
      const speed = sprinting ? SPRINT_SPEED : WALK_SPEED
      wantX = (wantX / length) * speed
      wantZ = (wantZ / length) * speed
    }

    // Speed up / slow down smoothly instead of starting and stopping instantly.
    const v = velocity.current
    v.x = approach(v.x, wantX, WALK_ACCELERATION, dt)
    v.z = approach(v.z, wantZ, WALK_ACCELERATION, dt)
    if (Math.abs(v.x) < 0.001 && Math.abs(v.z) < 0.001) return

    // Distance = speed x time, so the speed is the same on fast and slow computers.
    const next = moveWithCollision(camera.position.x, camera.position.z, v.x * dt, v.z * dt, [walls, closedDoorBlockers()])
    // If a wall stopped us in one direction, drop that part of the speed too.
    if (next.x === camera.position.x) v.x = 0
    if (next.z === camera.position.z) v.z = 0
    // Tutorial "move" step: done after walking about 3 metres.
    if (store.tutorial === 'move') {
      tutorialProgress.current += Math.hypot(next.x - camera.position.x, next.z - camera.position.z)
      if (tutorialProgress.current > TUTORIAL_WALK) {
        tutorialProgress.current = 0
        store.advanceTutorial('move')
      }
    }
    // Tutorial "sprint" step: done after running about 4 metres with Shift held.
    if (store.tutorial === 'sprint' && sprinting) {
      tutorialProgress.current += Math.hypot(next.x - camera.position.x, next.z - camera.position.z)
      if (tutorialProgress.current > TUTORIAL_SPRINT) {
        tutorialProgress.current = 0
        store.advanceTutorial('sprint')
      }
    }
    camera.position.x = next.x
    camera.position.z = next.z
  })

  return null
}
