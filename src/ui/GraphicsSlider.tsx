import { useEffect, useRef, useState } from 'react'
import { GRAPHICS_LEVEL_MAX, GRAPHICS_LEVEL_MIN, useMuseumStore, type GraphicsLevel } from '../state/useMuseumStore'
import { useContent } from '../content/use-content'

// One graphics slider in the pause menu, from "low" (fast on weak computers) to "high"
// (the best picture), with an "Automatic" switch.
// Automatic = the level measured while loading; the slider then shows that level. Moving
// the slider switches automatic off. Remembered in this browser (see useMuseumStore).
//
// A new level rebuilds parts of the effects, which can freeze the picture for a moment, so
// it is only applied once the slider has stopped moving (not at every step while dragging).
const APPLY_DELAY = 400 // ms

export default function GraphicsSlider() {
  const { ui } = useContent()
  const auto = useMuseumStore((state) => state.graphicsAuto)
  const autoLevel = useMuseumStore((state) => state.autoGraphics)
  const choice = useMuseumStore((state) => state.graphicsChoice)
  const setChoice = useMuseumStore((state) => state.setGraphicsChoice)
  const setAuto = useMuseumStore((state) => state.setGraphicsAuto)
  // The level under the slider while it is still moving (not applied yet).
  const [moving, setMoving] = useState<GraphicsLevel | null>(null)
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const shown = Math.min(GRAPHICS_LEVEL_MAX, Math.max(GRAPHICS_LEVEL_MIN, moving ?? (auto ? autoLevel : choice))) as GraphicsLevel

  function move(level: GraphicsLevel) {
    setMoving(level)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setChoice(level)
      setMoving(null)
    }, APPLY_DELAY)
  }

  function toggleAuto() {
    window.clearTimeout(timer.current)
    setMoving(null)
    // Switching automatic off keeps the level it had chosen, as the visitor's own.
    if (auto) setChoice(autoLevel)
    else setAuto(true)
  }

  return (
    <div className="sensitivity graphics-setting">
      <div className="graphics-head">
        <span>
          {ui.graphics.label}: {ui.graphics.levels[shown]}
        </span>
        <button type="button" role="switch" aria-checked={auto} className={auto ? 'graphics-auto graphics-auto-on' : 'graphics-auto'} onClick={toggleAuto}>
          <i aria-hidden="true" />
          {ui.graphics.auto}
        </button>
      </div>
      <input
        type="range"
        min={GRAPHICS_LEVEL_MIN}
        max={GRAPHICS_LEVEL_MAX}
        step={1}
        value={shown}
        aria-label={ui.graphics.label}
        aria-valuetext={ui.graphics.levels[shown]}
        onChange={(event) => move(Number(event.target.value) as GraphicsLevel)}
      />
    </div>
  )
}
