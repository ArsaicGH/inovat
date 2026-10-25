import { site } from '../content/site'
import { ui } from '../content/ui'
import LockButton from './LockButton'
import SensitivitySlider from './SensitivitySlider'

// First screen. Clicking the button captures the mouse; the Player then switches to "exploring".
export default function StartScreen() {
  return (
    <div className="overlay">
      <div className="overlay-card">
        <h1>{site.name}</h1>
        <h2>{site.subtitle}</h2>

        <h3>{ui.start.controlsTitle}</h3>
        <ul>
          {ui.start.controls.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="overlay-tip">{ui.start.keyboardTip}</p>
        <SensitivitySlider />

        <LockButton label={ui.start.button} />
      </div>
    </div>
  )
}
