import { ui } from '../content/ui'
import LockButton from './LockButton'
import SensitivitySlider from './SensitivitySlider'

// Shown after Esc (or whenever the mouse is released while walking).
export default function PauseScreen() {
  return (
    <div className="overlay">
      <div className="overlay-card">
        <h2>{ui.pause.title}</h2>
        <SensitivitySlider />
        <LockButton label={ui.pause.resume} />
      </div>
    </div>
  )
}
