import { useContent } from '../content/use-content'
import { useMuseumStore, TUTORIAL_STEPS } from '../state/useMuseumStore'
import { requestPointerLock } from '../world/pointer-lock'
import LockButton from './LockButton'
import SensitivitySlider from './SensitivitySlider'
import LanguageSwitch from './LanguageSwitch'
import VolumeSlider from './VolumeSlider'
import GraphicsSlider from './GraphicsSlider'

// Shown after Esc (or whenever the mouse is released while walking).
export default function PauseScreen() {
  const { ui } = useContent()
  // During the tutorial's last steps the menu explains itself.
  // (The step after "pause", which the menu's opening completes.)
  const tutorialHere = useMuseumStore((state) => state.tutorial === TUTORIAL_STEPS[TUTORIAL_STEPS.indexOf('pause') + 1])

  return (
    // A click on the dark area around the card also continues (a click is the only way
    // the browser lets the game capture the mouse again).
    <div
      className="overlay title-overlay pause-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) void requestPointerLock()
      }}
    >
      {/* Gold and glass, like the title screen and the map. */}
      <div className="pause-card">
        <h2 className="map-title">{ui.pause.title}</h2>
        <div className="title-ornament map-ornament" aria-hidden="true">
          <span />
          <i />
          <span />
        </div>
        {tutorialHere && <p className="tutorial-done">{ui.tutorial.pauseIntro}</p>}
        {/* Settings live here (more can be added as the game grows). */}
        <SensitivitySlider />
        <VolumeSlider />
        <GraphicsSlider />
        <LanguageSwitch label={ui.language.label} />
        <div className="button-row">
          <LockButton label={ui.pause.resume} className="start-button" />
          <button type="button" className="start-button start-button-quiet" onClick={() => useMuseumStore.getState().backToTitle()}>
            {ui.pause.toTitle}
          </button>
        </div>
        <p className="map-hint pause-hint">{ui.pause.clickHint}</p>
      </div>
    </div>
  )
}
