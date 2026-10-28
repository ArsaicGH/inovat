import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useContent } from '../content/use-content'
import { useMuseumStore } from '../state/useMuseumStore'
import { resumeWalking } from '../world/pointer-lock'
import { EXHIBIT_SPOTS } from '../world/layout'
import { BOARD_FRAME, BOARD_SIZE, BOARD_THEMES } from '../world/style'

// How long the shrink-away animation plays after closing (must match index.css).
const CLOSE_ANIMATION_MS = 220

// The enlarged version of an exhibit's text board: the same wooden frame, cream paper,
// proportions and layout as the board in the 3D world (PanelBoard.tsx), but with the full
// text (it scrolls if long). It zooms out of the board (which sits
// under the crosshair, i.e. in the middle of the screen) and shrinks back when closed.
// It stays mounted for a moment after closing so the shrink animation can play.
export default function InfoPanel() {
  const { ui, exhibit } = useContent()
  const openId = useMuseumStore((state) => state.openExhibitId)
  // The exhibit currently on screen: follows openId, but lingers while shrinking away.
  const [shownId, setShownId] = useState<string | null>(openId)
  if (openId && openId !== shownId) setShownId(openId) // a new panel opened: show it now
  const closing = !openId && shownId !== null
  const openedAt = useRef(0)
  useEffect(() => {
    if (openId) openedAt.current = performance.now()
  }, [openId])

  // After closing, remove the panel once the shrink animation has finished.
  useEffect(() => {
    if (!closing) return
    const timer = setTimeout(() => setShownId(null), CLOSE_ANIMATION_MS)
    return () => clearTimeout(timer)
  }, [closing])

  // E closes the panel (Esc is kept for the pause menu). (A key press counts as a user action, which the browser
  // requires before it lets the page capture the mouse again.)
  useEffect(() => {
    if (!openId) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat) return
      if (event.code === 'KeyE') resumeWalking()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openId])

  if (!shownId) return null
  const text = exhibit(shownId)
  const spot = EXHIBIT_SPOTS.find((s) => s.id === shownId)
  const [width, height] =
    spot?.kind === 'wall' ? BOARD_SIZE.wall : spot?.kind === 'overview' ? BOARD_SIZE.overview : BOARD_SIZE.stand
  // The same look as the board in the room (style.ts board themes).
  const theme = BOARD_THEMES[spot?.room ?? 'hall']
  // Passed to index.css: the board's shape, frame width (as a share of its width) and colours.
  const look = {
    '--ratio': width / height,
    '--frame': `${(BOARD_FRAME / width) * 100}cqw`,
    '--paper': theme.paper,
    '--title': theme.title,
    '--ink': theme.ink,
    '--muted': theme.muted,
    '--rule': theme.rule,
    '--frame-colour': theme.frame,
  } as CSSProperties

  return (
    // A click on blank space around the board closes it, like the pause menu.
    <div
      className={closing ? 'overlay info-overlay info-closing' : 'overlay info-overlay'}
      onClick={(event) => {
        const target = event.target as HTMLElement
        // (Ignored just after opening: the click that opened the board must not close it.)
        if (closing || performance.now() - openedAt.current < 400) return
        if (target === event.currentTarget || target.classList.contains('info-panel')) void resumeWalking()
      }}
    >
      <div className="info-panel">
        <article className={`board-zoom board-look-${theme.look}`} style={look}>
          <div className="board-frame">
            <div className="board-paper">
              <h2>{text.title}</h2>
              <div className="board-rule" />
              {text.facts.length > 0 && (
                <ul className="board-facts">
                  {text.facts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
              )}
              <p className="board-body">{text.body}</p>
              {text.sources.length > 0 ? (
                <div className="board-sources">
                  {ui.infoPanel.sourcesLabel}:
                  <ul>
                    {text.sources.map((source) => (
                      <li key={source.url}>
                        {/* Opens in a new tab, so the museum stays where it was. */}
                        <a href={source.url} target="_blank" rel="noreferrer">
                          {source.name}, “{source.title}”
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                text.placeholder && (
                  <p className="board-sources">
                    {ui.infoPanel.sourcesLabel}: {ui.infoPanel.sourcesPlaceholder}
                  </p>
                )
              )}
            </div>
          </div>
        </article>
        <div className="board-actions">
          <button type="button" className="board-close" onClick={resumeWalking}>
            {ui.infoPanel.close}
          </button>
          <span className="overlay-tip">{ui.infoPanel.closeHint}</span>
        </div>
      </div>
    </div>
  )
}
