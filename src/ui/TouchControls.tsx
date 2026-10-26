import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useContent } from '../content/use-content'
import { useMuseumStore, canUse } from '../state/useMuseumStore'
import { touchInput } from './touch'

// ON-SCREEN CONTROLS for phones and tablets (touch.ts), shown while walking:
// - a joystick in the bottom-left corner: walk (pushed all the way: sprint);
// - dragging a finger anywhere else: look around;
// - a quick tap: open what was tapped, or choose a quiz answer (Interaction.tsx);
// - buttons in the top-right corner: map, pause, and "?" for the controls list.
// Several fingers work at once (walk with one thumb, look with the other).

const STICK_REACH = 52 // pixels the joystick knob can move from its centre
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

export default function TouchControls() {
  const { ui } = useContent()
  const tutorial = useMuseumStore((state) => state.tutorial)
  const stick = useRef<HTMLDivElement>(null)
  const fingers = useRef(new Map<number, Finger>())
  const [knob, setKnob] = useState({ x: 0, y: 0 })

  // When a menu or panel opens, these controls disappear mid-touch: stop walking.
  useEffect(
    () => () => {
      touchInput.moveX = 0
      touchInput.moveY = 0
      touchInput.lookX = 0
      touchInput.lookY = 0
    },
    [],
  )

  function stickCentre() {
    const rect = stick.current?.getBoundingClientRect()
    return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, r: rect.width / 2 } : null
  }

  function onDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    const centre = stickCentre()
    // A touch on or near the joystick drives it; any other touch looks around.
    const nearStick = centre && Math.hypot(event.clientX - centre.x, event.clientY - centre.y) < centre.r * 1.6
    const usedStick = [...fingers.current.values()].some((f) => f.kind === 'stick')
    fingers.current.set(event.pointerId, {
      kind: nearStick && !usedStick ? 'stick' : 'look',
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      startTime: performance.now(),
      moved: 0,
    })
    if (nearStick && !usedStick) onMove(event)
  }

  function onMove(event: ReactPointerEvent<HTMLDivElement>) {
    const finger = fingers.current.get(event.pointerId)
    if (!finger) return
    if (finger.kind === 'stick') {
      const centre = stickCentre()
      if (!centre) return
      let dx = event.clientX - centre.x
      let dy = event.clientY - centre.y
      const length = Math.hypot(dx, dy)
      if (length > STICK_REACH) {
        dx = (dx / length) * STICK_REACH
        dy = (dy / length) * STICK_REACH
      }
      touchInput.moveX = dx / STICK_REACH
      touchInput.moveY = dy / STICK_REACH
      setKnob({ x: dx, y: dy })
      return
    }
    const dx = event.clientX - finger.lastX
    const dy = event.clientY - finger.lastY
    finger.lastX = event.clientX
    finger.lastY = event.clientY
    finger.moved += Math.hypot(dx, dy)
    touchInput.lookX += dx
    touchInput.lookY += dy
  }

  function onUp(event: ReactPointerEvent<HTMLDivElement>) {
    const finger = fingers.current.get(event.pointerId)
    fingers.current.delete(event.pointerId)
    if (!finger) return
    if (finger.kind === 'stick') {
      touchInput.moveX = 0
      touchInput.moveY = 0
      setKnob({ x: 0, y: 0 })
      return
    }
    // A short touch that hardly moved is a tap.
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

  return (
    <>
      <div
        className="touch-layer"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div ref={stick} className={canUse(tutorial, 'move') ? 'touch-stick' : 'touch-stick touch-stick-off'} aria-label={ui.touch.joystick}>
          <div className="touch-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
        </div>
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
