import { useEffect } from 'react'
import { ui } from '../content/ui'
import { getExhibitText } from '../content/exhibits'
import { useMuseumStore } from '../state/useMuseumStore'
import { resumeWalking } from '../world/pointer-lock'

// The exhibit's full text, shown with a visible cursor while walking is switched off.
// Closing captures the mouse again (or shows the pause screen if the browser refuses).
export default function InfoPanel() {
  const exhibitId = useMuseumStore((state) => state.openExhibitId)

  // E or Esc closes the panel. (A key press counts as a user action, which the browser
  // requires before it lets the page capture the mouse again.)
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat) return
      if (event.code === 'KeyE' || event.code === 'Escape') resumeWalking()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  if (!exhibitId) return null
  const text = getExhibitText(exhibitId)

  return (
    <div className="overlay">
      <article className="overlay-card info-panel">
        <h2>{text.title}</h2>
        <div className="info-image">{ui.infoPanel.imagePlaceholder}</div>
        <p className="info-summary">{text.summary}</p>
        <p className="info-body">{text.body}</p>
        <p className="info-sources">
          <strong>{ui.infoPanel.sourcesLabel}:</strong> {ui.infoPanel.sourcesPlaceholder}
        </p>
        <button type="button" onClick={resumeWalking}>
          {ui.infoPanel.close}
        </button>
        <p className="overlay-tip">{ui.infoPanel.closeHint}</p>
      </article>
    </div>
  )
}
