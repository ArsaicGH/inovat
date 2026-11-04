import { useState } from 'react'
import { useContent } from '../content/use-content'
import { useMuseumStore, hasSavedProgress } from '../state/useMuseumStore'
import LockButton from './LockButton'
import LanguageSwitch from './LanguageSwitch'
import VolumeSlider from './VolumeSlider'
import SensitivitySlider from './SensitivitySlider'
import GraphicsSlider from './GraphicsSlider'

// First screen: the decorated INOVAT title and a start button. On a first visit "Bắt đầu"
// starts the guided tutorial at once; after an earlier visit, "new journey" asks whether to
// take it; either choice captures the mouse and the
// Player then switches to "exploring".
export default function StartScreen() {
  const { ui, site } = useContent()
  const [asking, setAsking] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const setTutorial = useMuseumStore((state) => state.setTutorial)
  const continueSavedVisit = useMuseumStore((state) => state.continueSavedVisit)

  return (
    <div className="overlay title-overlay">
      <div className="title-block">
        <div className="title-ornament" aria-hidden="true">
          <span />
          <i />
          <span />
        </div>
        <h1 className="game-title">{site.name}</h1>
        <p className="game-subtitle">{site.subtitle}</p>
        <div className="title-ornament" aria-hidden="true">
          <span />
          <i />
          <span />
        </div>

        {!asking ? (
          <div className="start-buttons">
            {/* Continuing comes first when this tab holds an earlier visit (e.g. after a reload);
                both buttons look the same, so neither choice is pushed. */}
            {hasSavedProgress() && <LockButton label={ui.start.continue} className="start-button" onBeforeLock={continueSavedVisit} />}
            {/* A first visit starts straight into the tutorial; a new journey after an earlier
                visit asks first (the visitor may already know the controls). */}
            {hasSavedProgress() ? (
              <button type="button" className="start-button" onClick={() => setAsking(true)}>
                {ui.start.newJourney}
              </button>
            ) : (
              <LockButton label={ui.start.button} className="start-button" onBeforeLock={() => setTutorial('intro')} />
            )}
          </div>
        ) : (
          <div className="tutorial-question">
            <p>{ui.start.tutorialQuestion}</p>
            <div className="button-row">
              <LockButton label={ui.start.tutorialYes} className="start-button" onBeforeLock={() => setTutorial('intro')} />
              <LockButton label={ui.start.tutorialNo} className="start-button start-button-quiet" onBeforeLock={() => setTutorial(null)} />
            </div>
          </div>
        )}
      </div>
      {/* Near the bottom of the screen, out of the way of the title. */}
      <div className="language-bottom">
        <VolumeSlider />
        <LanguageSwitch />
        {/* A gilded gear to the right: the settings, without the pause menu's buttons. */}
        <button type="button" className="title-settings" aria-label={ui.settings.open} title={ui.settings.open} onClick={() => setSettingsOpen(true)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M10.3 2h3.4l.5 2.6a7.6 7.6 0 0 1 1.9 1.1l2.5-.9 1.7 2.9-2 1.7a7.7 7.7 0 0 1 0 2.2l2 1.7-1.7 2.9-2.5-.9a7.6 7.6 0 0 1-1.9 1.1l-.5 2.6h-3.4l-.5-2.6a7.6 7.6 0 0 1-1.9-1.1l-2.5.9-1.7-2.9 2-1.7a7.7 7.7 0 0 1 0-2.2l-2-1.7 1.7-2.9 2.5.9a7.6 7.6 0 0 1 1.9-1.1Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      </div>
      {settingsOpen && (
        // Like the pause menu's card; a click on the dark area around it closes it too.
        <div className="overlay title-overlay pause-overlay" onClick={(event) => event.target === event.currentTarget && setSettingsOpen(false)}>
          <div className="pause-card">
            <h2 className="map-title">{ui.settings.title}</h2>
            <div className="title-ornament map-ornament" aria-hidden="true">
              <span />
              <i />
              <span />
            </div>
            <SensitivitySlider />
            <VolumeSlider />
            <GraphicsSlider />
            <LanguageSwitch label={ui.language.label} />
            <div className="button-row">
              <button type="button" className="start-button" onClick={() => setSettingsOpen(false)}>
                {ui.settings.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
