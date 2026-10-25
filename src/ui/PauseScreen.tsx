import { useEffect } from 'react'
import { ui } from '../content/ui'
import { useMuseumStore } from '../state/useMuseumStore'
import { resumeFromKeyboard } from '../world/pointer-lock'
import LockButton from './LockButton'
import SensitivitySlider from './SensitivitySlider'

// Shown after Esc (or whenever the mouse is released while walking).
export default function PauseScreen() {
  const setMode = useMuseumStore((state) => state.setMode)
  // During the tutorial's last steps the menu explains itself.
  const tutorialHere = useMuseumStore((state) => state.tutorial === 'keys')

  // Esc continues the visit (like the button). Ignored for a moment after opening, so
  // the same Esc press that paused cannot also un-pause.
  useEffect(() => {
    const openedAt = performance.now()
    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== 'Escape' || event.repeat || performance.now() - openedAt < 300) return
      void resumeFromKeyboard()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="overlay">
      <div className="overlay-card">
        <h2>{ui.pause.title}</h2>
        {tutorialHere && <p className="tutorial-done">{ui.tutorial.pauseIntro}</p>}
        {/* Settings live here (more can be added as the game grows). */}
        <SensitivitySlider />
        <div className="button-row">
          <LockButton label={ui.pause.resume} />
          <button type="button" className="secondary-button" onClick={() => setMode('map')}>
            {ui.pause.map}
          </button>
        </div>
        <p className="overlay-tip">{ui.pause.resumeHint}</p>
      </div>
    </div>
  )
}
