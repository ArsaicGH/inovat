import { useState } from 'react'
import { site } from '../content/site'
import { ui } from '../content/ui'
import { useMuseumStore } from '../state/useMuseumStore'
import LockButton from './LockButton'

// First screen: the decorated INNOVA title and a start button. After "Bắt đầu" the visitor
// chooses whether to take the guided tutorial; either choice captures the mouse and the
// Player then switches to "exploring".
export default function StartScreen() {
  const [asking, setAsking] = useState(false)
  const setTutorial = useMuseumStore((state) => state.setTutorial)

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
          <button type="button" className="start-button" onClick={() => setAsking(true)}>
            {ui.start.button}
          </button>
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
    </div>
  )
}
