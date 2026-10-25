import { ui } from '../content/ui'
import { useMuseumStore } from '../state/useMuseumStore'
import LockButton from './LockButton'
import SensitivitySlider from './SensitivitySlider'

// Shown after Esc (or whenever the mouse is released while walking).
export default function PauseScreen() {
  const setMode = useMuseumStore((state) => state.setMode)
  const tutorialDone = useMuseumStore((state) => state.tutorial === 'done')

  return (
    <div className="overlay">
      <div className="overlay-card">
        <h2>{ui.pause.title}</h2>
        {tutorialDone && <p className="tutorial-done">{ui.tutorial.done}</p>}
        {/* Settings live here (more can be added as the game grows). */}
        <SensitivitySlider />
        <div className="button-row">
          <LockButton label={ui.pause.resume} />
          <button type="button" className="secondary-button" onClick={() => setMode('map')}>
            {ui.pause.map}
          </button>
        </div>
      </div>
    </div>
  )
}
