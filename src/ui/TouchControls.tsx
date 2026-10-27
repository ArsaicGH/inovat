import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { useContent } from '../content/use-content'
import { useMuseumStore, canUse } from '../state/useMuseumStore'
import { touchInput } from './touch'

// ON-SCREEN CONTROLS for phones and tablets (touch.ts), shown while walking:
// - a DYNAMIC THUMBSTICK, like Roblox's: put a thumb down anywhere on the left side of the
//   screen and the stick appears under it. A short drag walks (the further, the faster, up
//   to the walking ring); pulling past the dashed sprint ring further out runs, and the
//   ring lights up gold. Pulled further still, the stick follows the thumb, so it never
//   runs out of room. A faint ring in the bottom-left corner shows where it is at rest;
// - dragging a finger on the right side: look around;
// - a quick tap anywhere: open what was tapped, or choose a quiz answer (Interaction.tsx);
// - buttons in the top-right corner: map, pause, and "?" for the controls list.
// Several fingers work at once (walk with one thumb, look with the other).

const STICK_SIDE = 0.45 // touches starting in this share of the screen's width (from the left) walk
const WALK_RADIUS = 56 // pixels: dragging this far = full walking speed
const DEAD_ZONE = 8 // pixels: smaller drags do nothing (a resting thumb wobbles)
const SPRINT_RADIUS = 104 // pixels: dragging further than this runs
const MAX_RADIUS = 124 // pixels: beyond this, the stick's centre follows the thumb
const DOTS = 4 // small dots between the stick's centre and the thumb
const TAP_MS = 300 // a touch shorter than this...
const TAP_SLOP = 10 // ...that moved less than this many pixels is a tap, not a drag

interface Finger {
  kind: 'stick' | 'look'
  startX: number
  startY: number
  lastX: number
  lastY: number
  startTime: number
  moved: number
}

// What the thumbstick shows: its centre and the thumb (screen pixels), and whether it runs.
interface Stick {
  baseX: number
  baseY: number
  x: number
  y: number
  sprint: boolean
}

// Style that centres a part of the stick on a screen point.
const at = (x: number, y: number, extra?: Record<string, string | number>) =>
  ({ '--x': `${x}px`, '--y': `${y}px`, ...extra }) as CSSProperties

export default function TouchControls() {
  const { ui } = useContent()
  const tutorial = useMuseumStore((state) => state.tutorial)
  const fingers = useRef(new Map<number, Finger>())
  const [stick, setStick] = useState<Stick | null>(null)
  const stickRef = useRef<Stick | null>(null)

  // When a menu or panel opens, these controls disappear mid-touch: stop walking.
  useEffect(
    () => () => {
      touchInput.moveX = 0
      touchInput.moveY = 0
      touchInput.sprint = false
      touchInput.lookX = 0
      touchInput.lookY = 0
    },
    [],
  )

  function updateStick(next: Stick | null) {
    stickRef.current = next
    setStick(next)
    if (!next) {
      touchInput.moveX = 0
      touchInput.moveY = 0
      touchInput.sprint = false
      return
    }
    const dx = next.x - next.baseX
    const dy = next.y - next.baseY
    const distance = Math.hypot(dx, dy)
    // Walking speed grows from the dead zone to the walking ring, then stays full.
    const speed = distance <= DEAD_ZONE ? 0 : Math.min(1, (distance - DEAD_ZONE) / (WALK_RADIUS - DEAD_ZONE))
    touchInput.moveX = distance ? (dx / distance) * speed : 0
    touchInput.moveY = distance ? (dy / distance) * speed : 0
    touchInput.sprint = next.sprint
  }

  function onDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    // A touch on the left side drives the stick (one thumb at a time), unless the tutorial
    // has not reached walking yet; any other touch looks around.
    const usedStick = [...fingers.current.values()].some((f) => f.kind === 'stick')
    const isStick = !usedStick && event.clientX < window.innerWidth * STICK_SIDE && canUse(useMuseumStore.getState().tutorial, 'move')
    fingers.current.set(event.pointerId, {
      kind: isStick ? 'stick' : 'look',
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      startTime: performance.now(),
      moved: 0,
    })
    if (isStick) updateStick({ baseX: event.clientX, baseY: event.clientY, x: event.clientX, y: event.clientY, sprint: false })
  }

  function onMove(event: ReactPointerEvent<HTMLDivElement>) {
    const finger = fingers.current.get(event.pointerId)
    if (!finger) return
    const dx = event.clientX - finger.lastX
    const dy = event.clientY - finger.lastY
    finger.lastX = event.clientX
    finger.lastY = event.clientY
    finger.moved += Math.hypot(dx, dy)
    if (finger.kind === 'stick') {
      const current = stickRef.current
      if (!current) return
      let { baseX, baseY } = current
      // Pulled beyond the outer limit: the centre is dragged along behind the thumb.
      const fromBase = Math.hypot(event.clientX - baseX, event.clientY - baseY)
      if (fromBase > MAX_RADIUS) {
        const pull = (fromBase - MAX_RADIUS) / fromBase
        baseX += (event.clientX - baseX) * pull
        baseY += (event.clientY - baseY) * pull
      }
      const distance = Math.hypot(event.clientX - baseX, event.clientY - baseY)
      updateStick({ baseX, baseY, x: event.clientX, y: event.clientY, sprint: distance > SPRINT_RADIUS })
      return
    }
    touchInput.lookX += dx
    touchInput.lookY += dy
  }

  function onUp(event: ReactPointerEvent<HTMLDivElement>) {
    const finger = fingers.current.get(event.pointerId)
    fingers.current.delete(event.pointerId)
    if (!finger) return
    if (finger.kind === 'stick') updateStick(null)
    // A short touch that hardly moved is a tap (on either side of the screen).
    if (event.type === 'pointerup' && finger.moved < TAP_SLOP && performance.now() - finger.startTime < TAP_MS) {
      const store = useMuseumStore.getState()
      // The tutorial's welcome card: a tap starts the guide (Space on a computer).
      if (store.tutorial === 'intro') {
        store.advanceTutorial('intro')
        return
      }
      touchInput.tap = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      }
    }
  }

  const store = useMuseumStore.getState
  function openMap() {
    if (!canUse(store().tutorial, 'map')) return
    store().setMode('map')
    store().advanceTutorial('map')
  }
  function pause() {
    store().setMode('paused')
    store().advanceTutorial('pause')
  }
  function toggleHelp() {
    if (!canUse(store().tutorial, 'keys')) return
    store().toggleKeyList()
    store().advanceTutorial('keys')
  }

  // The knob under the thumb (the centre follows when the thumb goes further).
  let knobX = 0
  let knobY = 0
  if (stick) {
    const dx = stick.x - stick.baseX
    const dy = stick.y - stick.baseY
    const distance = Math.hypot(dx, dy)
    const scale = distance > MAX_RADIUS ? MAX_RADIUS / distance : 1
    knobX = stick.baseX + dx * scale
    knobY = stick.baseY + dy * scale
  }

  return (
    <>
      <div
        className="touch-layer"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onContextMenu={(event) => event.preventDefault()}
        aria-label={ui.touch.joystick}
      >
        {!stick ? (
          <div className={canUse(tutorial, 'move') ? 'stick-part stick-rest' : 'stick-part stick-rest stick-rest-off'} />
        ) : (
          <>
            <div
              className={stick.sprint ? 'stick-part stick-sprint stick-sprint-on' : 'stick-part stick-sprint'}
              style={at(stick.baseX, stick.baseY, { '--size': `${SPRINT_RADIUS * 2}px` })}
            />
            <div className="stick-part stick-base" style={at(stick.baseX, stick.baseY, { '--size': `${WALK_RADIUS * 2}px` })} />
            {Array.from({ length: DOTS }, (_, i) => {
              const t = (i + 1) / (DOTS + 1)
              return (
                <div
                  key={i}
                  className="stick-part stick-dot"
                  style={at(stick.baseX + (knobX - stick.baseX) * t, stick.baseY + (knobY - stick.baseY) * t, { '--alpha': 0.75 - t * 0.55 })}
                />
              )
            })}
            <div className={stick.sprint ? 'stick-part stick-knob stick-knob-sprint' : 'stick-part stick-knob'} style={at(knobX, knobY)} />
          </>
        )}
      </div>
      <div className="touch-buttons">
        <button type="button" className="touch-button" aria-label={ui.touch.help} onClick={toggleHelp} disabled={!canUse(tutorial, 'keys')}>
          ?
        </button>
        <button type="button" className="touch-button" aria-label={ui.touch.map} onClick={openMap} disabled={!canUse(tutorial, 'map')}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z M9 4v14 M15 6v14" />
          </svg>
        </button>
        <button type="button" className="touch-button" aria-label={ui.touch.pause} onClick={pause}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14 M16 5v14" />
          </svg>
        </button>
      </div>
    </>
  )
}
