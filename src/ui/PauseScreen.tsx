import { useContent } from '../content/use-content'
import { useMuseumStore } from '../state/useMuseumStore'
import { requestPointerLock } from '../world/pointer-lock'
import LockButton from './LockButton'
import SensitivitySlider from './SensitivitySlider'
import LanguageSwitch from './LanguageSwitch'

// Shown after Esc (or whenever the mouse is released while walking).
export default function PauseScreen() {
  const { ui } = useContent()
  const setMode = useMuseumStore((state) => state.setMode)
  // During the tutorial's last steps the menu explains itself.
  const tutorialHere = useMuseumStore((state) => state.tutorial === 'keys')

  return (
    // A click on the dark area around the card also continues (a click is the only way
    // the browser lets the game capture the mouse again).
    <div
      className="overlay pause-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) void requestPointerLock()
      }}
    >
      <div className="overlay-card">
        <h2>{ui.pause.title}</h2>
        {tutorialHere && <p className="tutorial-done">{ui.tutorial.pauseIntro}</p>}
        {/* Settings live here (more can be added as the game grows). */}
        <SensitivitySlider />
        <LanguageSwitch label={ui.language.label} variant="menu" />
        <div className="button-row">
          <LockButton label={ui.pause.resume} />
          <button type="button" className="secondary-button" onClick={() => setMode('map')}>
            {ui.pause.map}
          </button>
        </div>
        <p className="overlay-tip">{ui.pause.clickHint}</p>
      </div>
    </div>
  )
}
