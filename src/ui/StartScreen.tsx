import { useEffect, useState } from 'react'
import { useContent } from '../content/use-content'
import { useMuseumStore, hasSavedProgress } from '../state/useMuseumStore'
import LockButton from './LockButton'
import LanguageSwitch from './LanguageSwitch'
import VolumeSlider from './VolumeSlider'
import SensitivitySlider from './SensitivitySlider'
import GraphicsSlider from './GraphicsSlider'
import { startTrailer } from './trailer-run'
import { preloadTrailerMusic } from '../audio/sound'

// First screen: the decorated INOVAT title and a start button, which starts the guided
// tutorial (every new game) and captures the mouse; the Player then switches to "exploring".
export default function StartScreen() {
  const { ui, site } = useContent()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const setTutorial = useMuseumStore((state) => state.setTutorial)
  const continueSavedVisit = useMuseumStore((state) => state.continueSavedVisit)

  // (The trailer's music, fetched while the title screen shows.)
  useEffect(() => preloadTrailerMusic(), [])

  return (
    <div className="overlay title-overlay">
      {/* At the top: play the trailer, which then returns to this screen. */}
      <button type="button" className="title-trailer" onClick={() => startTrailer(0, true)}>
        <svg viewBox="0 0 12 14" aria-hidden="true">
          <path d="M1 1 L11 7 L1 13 Z" />
        </svg>
        {ui.start.trailer}
      </button>
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

        <div className="start-buttons">
          {/* Continuing comes first when this tab holds an earlier visit (e.g. after a reload),
              and stands out; starting afresh is the quieter choice beside it. */}
          {hasSavedProgress() && <LockButton label={ui.start.continue} className="start-button" onBeforeLock={continueSavedVisit} />}
          {/* Every new game starts with the tutorial (leader: not optional). */}
          <LockButton
            label={hasSavedProgress() ? ui.start.newJourney : ui.start.button}
            className={hasSavedProgress() ? 'start-button start-button-quiet' : 'start-button'}
            onBeforeLock={() => setTutorial('intro')}
          />
        </div>
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
