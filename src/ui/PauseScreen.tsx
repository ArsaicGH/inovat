import { ui } from '../content/ui'
import { useMuseumStore } from '../state/useMuseumStore'
import LockButton from './LockButton'
import SensitivitySlider from './SensitivitySlider'

// Shown after Esc (or whenever the mouse is released while walking).
export default function PauseScreen() {
  const setMode = useMuseumStore((state) => state.setMode)

  return (
    <div className="overlay">
      <div className="overlay-card">
        <h2>{ui.pause.title}</h2>
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
