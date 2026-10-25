import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useMuseumStore } from '../state/useMuseumStore'
import { moveWithCollision, type WallBox } from './collision'
import { getCanvas } from './pointer-lock'

const WALK_SPEED = 3 // metres per second
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
// The measured time between frames wobbles a little even on a steady screen, which makes
// each step a slightly different size. Averaging it over a few frames evens the steps out.
const FRAME_TIME_SMOOTHING = 0.15

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
  walls: WallBox[]
  spawn: [number, number] // x, z on the floor
  spawnYaw: number // which way to face at the start, in radians
}

export default function Player({ walls, spawn, spawnYaw }: PlayerProps) {
  // `get()` returns the current 3D state; we read the camera from it at the moment we
  // move it (moving the camera is exactly what this component is for).
  const get = useThree((state) => state.get)
  const pressed = useRef(new Set<string>())
  // Where the visitor wants to look (set by mouse/arrows) and where the camera looks now.
  const targetYaw = useRef(spawnYaw) // turning left/right
  const targetPitch = useRef(0) // looking up/down
  const yaw = useRef(spawnYaw)
  const pitch = useRef(0)
  const velocity = useRef({ x: 0, z: 0 }) // metres per second
  const smoothDt = useRef(1 / 60)
  const normalPresses = useRef(0)

  // Place the camera at the spawn point once.
  useEffect(() => {
    const camera = get().camera
    camera.position.set(spawn[0], EYE_HEIGHT, spawn[1])
    // "YXZ" = turn left/right first, then tilt up/down, like a person's head.
    camera.rotation.order = 'YXZ'
    camera.rotation.set(pitch.current, yaw.current, 0)
  }, [get, spawn])

  useEffect(() => {
    const store = useMuseumStore.getState

    // The browser tells us whenever the mouse is captured or released.
    // Captured = exploring. Released (Esc, Alt+Tab...) while exploring = paused.
    function onLockChange() {
      if (document.pointerLockElement === getCanvas()) {
        store().setMode('exploring')
      } else {
        pressed.current.clear() // forget held keys, so we do not keep walking
        velocity.current = { x: 0, z: 0 }
        store().setTypingToolWarning(false)
        if (store().mode === 'exploring') store().setMode('paused')
      }
    }

    function onMouseMove(event: MouseEvent) {
      if (store().mode !== 'exploring' || isFakeMouseJump(event)) return
      const sensitivity = BASE_MOUSE_SENSITIVITY * store().mouseSensitivity
      targetYaw.current -= event.movementX * sensitivity
      targetPitch.current -= event.movementY * sensitivity
      targetPitch.current = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, targetPitch.current))
    }

    function onKeyDown(event: KeyboardEvent) {
      pressed.current.add(event.code)
      if (store().mode !== 'exploring') return

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
    function onKeyUp(event: KeyboardEvent) {
      pressed.current.delete(event.code)
    }
    function onBlur() {
      pressed.current.clear()
    }

    document.addEventListener('pointerlockchange', onLockChange)
    document.addEventListener('mousemove', onMouseMove)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('pointerlockchange', onLockChange)
      document.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [get])

  useFrame(({ camera }, delta) => {
    if (useMuseumStore.getState().mode !== 'exploring') return

    // Cap the frame time so a stutter cannot teleport us through a wall, then smooth it:
    // each frame keeps 85% of the running average and adds 15% of the new measurement.
    const frameTime = Math.min(delta, 0.1)
    smoothDt.current += (frameTime - smoothDt.current) * FRAME_TIME_SMOOTHING
    const dt = smoothDt.current
    const isDown = (codes: string[]) => codes.some((code) => pressed.current.has(code))

    // Camera: arrow keys change the target, then the camera glides towards it.
    const turn = (isDown(TURN_RIGHT) ? 1 : 0) - (isDown(TURN_LEFT) ? 1 : 0)
    const tilt = (isDown(LOOK_UP) ? 1 : 0) - (isDown(LOOK_DOWN) ? 1 : 0)
    targetYaw.current -= turn * TURN_SPEED * dt
    targetPitch.current += tilt * TILT_SPEED * dt
    targetPitch.current = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, targetPitch.current))
    yaw.current = approach(yaw.current, targetYaw.current, LOOK_SMOOTHING, dt)
    pitch.current = approach(pitch.current, targetPitch.current, LOOK_SMOOTHING, dt)
    camera.rotation.set(pitch.current, yaw.current, 0)

    // Walking: work out the wanted direction on the floor, based on where we face.
    const forward = (isDown(FORWARD) ? 1 : 0) - (isDown(BACKWARD) ? 1 : 0)
    const strafe = (isDown(STEP_RIGHT) ? 1 : 0) - (isDown(STEP_LEFT) ? 1 : 0)
    const sin = Math.sin(yaw.current)
    const cos = Math.cos(yaw.current)
    let wantX = -sin * forward + cos * strafe
    let wantZ = -cos * forward - sin * strafe
    // Diagonal keys should not be faster than straight ones.
    const length = Math.hypot(wantX, wantZ)
    if (length > 0) {
      wantX = (wantX / length) * WALK_SPEED
      wantZ = (wantZ / length) * WALK_SPEED
    }

    // Speed up / slow down smoothly instead of starting and stopping instantly.
    const v = velocity.current
    v.x = approach(v.x, wantX, WALK_ACCELERATION, dt)
    v.z = approach(v.z, wantZ, WALK_ACCELERATION, dt)
    if (Math.abs(v.x) < 0.001 && Math.abs(v.z) < 0.001) return

    // Distance = speed x time, so the speed is the same on fast and slow computers.
    const next = moveWithCollision(camera.position.x, camera.position.z, v.x * dt, v.z * dt, walls)
    // If a wall stopped us in one direction, drop that part of the speed too.
    if (next.x === camera.position.x) v.x = 0
    if (next.z === camera.position.z) v.z = 0
    camera.position.x = next.x
    camera.position.z = next.z
  })

  return null
}
