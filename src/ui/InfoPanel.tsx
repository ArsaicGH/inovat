import { Suspense, lazy, useEffect, useRef, useState, type CSSProperties } from 'react'
import { useContent } from '../content/use-content'
import { useMuseumStore } from '../state/useMuseumStore'
import { useScrollFades } from './scroll-fades'
import { resumeWalking } from '../world/pointer-lock'
import { EXHIBIT_SPOTS } from '../world/layout'
import { BOARD_FRAME, BOARD_SIZE, BOARD_THEMES, type BoardTheme } from '../world/style'
import { PICTURES, isWallPicture, type Picture } from '../content/pictures'
import type { Language } from '../content/language'
import { paintDiagram } from '../world/diagrams'
import { paintFont, useFontsReady } from '../world/fonts'
import type { RoomId } from '../types'

// The turning 3D model beside invention boards (part of the 3D download, so loaded on first use).
const ModelViewer = lazy(() => import('../world/ModelViewer'))

// Era colour of the model viewer's background gradient (like the era numbers on the walls).
const ERA_GLOW: Record<string, string> = { ir1: '#e0a050', ir2: '#ffd36a', ir3: '#6be08b', ir4: '#3fd0e0' }

// How long the shrink-away animation plays after closing (must match index.css).
const CLOSE_ANIMATION_MS = 220

// A diagram drawn by the museum (world/diagrams.ts), sharp at the screen's own resolution.
function DiagramCanvas({ picture, language, theme }: { picture: Picture; language: Language; theme: BoardTheme }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const fontsReady = useFontsReady()
  useEffect(() => {
    const canvas = ref.current
    const diagram = picture.diagram
    if (!canvas || !diagram) return
    const draw = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 2)
      // (Its laid-out width, not its size on screen: the panel opens with a zoom animation,
      // and measured mid-zoom the drawing came out small and blurry.)
      const style = getComputedStyle(canvas)
      const width = Math.round((canvas.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)) * scale)
      if (width === 0) return
      canvas.width = width
      canvas.height = Math.round(width / picture.aspect)
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const accent = theme.look === 'screen' || theme.look === 'hologram' ? theme.title : theme.rule
      paintDiagram(ctx, diagram, 0, 0, canvas.width, canvas.height, picture.labels?.[language] ?? [], paintFont(fontsReady), { ink: theme.ink, accent, muted: theme.muted }, picture.era)
    }
    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [picture, language, theme, fontsReady])
  return <canvas ref={ref} className="board-diagram" style={{ aspectRatio: picture.aspect }} />
}

// The picture with its caption and credit (who made it, its licence, a link to its page).
function PictureFigure({ picture, language, theme, credit, className }: { picture: Picture; language: Language; theme: BoardTheme; credit: { picture: string; diagram: string }; className: string }) {
  return (
    <figure className={className}>
      {picture.file ? (
        <img src={`/${picture.file}`} alt={picture.caption[language]} style={{ aspectRatio: picture.aspect }} />
      ) : (
        <DiagramCanvas picture={picture} language={language} theme={theme} />
      )}
      <figcaption>
        {picture.caption[language]}
        <small>
          {picture.file && picture.author && picture.licence ? (
            <>
              {credit.picture}:{' '}
              <a href={picture.source} target="_blank" rel="noreferrer">
                {picture.author[language]}
              </a>
              , {picture.licence[language]}
            </>
          ) : (
            credit.diagram
          )}
        </small>
      </figcaption>
    </figure>
  )
}

// The enlarged version of an exhibit's text board: the same wooden frame, cream paper,
// proportions and layout as the board in the 3D world (PanelBoard.tsx), but with the full
// text (it scrolls if long). It zooms out of the board (which sits
// under the crosshair, i.e. in the middle of the screen) and shrinks back when closed.
// It stays mounted for a moment after closing so the shrink animation can play.
export default function InfoPanel() {
  const { ui, exhibit, language } = useContent()
  const openId = useMuseumStore((state) => state.openExhibitId)
  // The exhibit currently on screen: follows openId, but lingers while shrinking away.
  const [shownId, setShownId] = useState<string | null>(openId)
  if (openId && openId !== shownId) setShownId(openId) // a new panel opened: show it now
  const closing = !openId && shownId !== null
  const openedAt = useRef(0)
  useEffect(() => {
    if (openId) openedAt.current = performance.now()
  }, [openId])
  // The 3D model view starts once the board has finished zooming in: a 3D view measures
  // its size when it starts, and would otherwise keep the small size of the first frames.
  const [modelReady, setModelReady] = useState(false)
  useEffect(() => {
    setModelReady(false)
  }, [openId])
  // The board's text scrolls on short windows (scroll-fades.ts).
  const scroll = useScrollFades<HTMLDivElement>(shownId)

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
  // A picture from a wall gallery ('wall-ir1-2'): shown large on its own, in its room's colours.
  const wallPicture = isWallPicture(shownId) ? PICTURES[shownId] : undefined
  const room = (spot?.room ?? (wallPicture ? shownId.split('-')[1] : 'hall')) as RoomId
  const picture = PICTURES[shownId] as Picture | undefined
  const [width, height] =
    spot?.kind === 'wall' ? BOARD_SIZE.wall : spot?.kind === 'overview' ? BOARD_SIZE.overview : BOARD_SIZE.stand
  // The same look as the board in the room (style.ts board themes).
  const theme = BOARD_THEMES[room]
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
    '--era-glow': ERA_GLOW[room] ?? '#c9a25a',
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
      <div className="info-panel" onAnimationEnd={(event) => event.target === event.currentTarget && !closing && setModelReady(true)}>
        {wallPicture ? (
          <div className="picture-row" style={look}>
            <PictureFigure picture={wallPicture} language={language} theme={theme} credit={{ picture: ui.infoPanel.pictureCredit, diagram: ui.infoPanel.diagramCredit }} className={`picture-zoom board-look-${theme.look}`} />
          </div>
        ) : (
        <div className="board-row" style={look}>
          {spot?.kind === 'corner' && (
            <div className="model-viewer">
              <Suspense fallback={null}>
                {modelReady && <ModelViewer id={shownId} />}
              </Suspense>
            </div>
          )}
        <article className={`board-zoom board-look-${theme.look}`} style={look}>
          <div className="board-frame">
            <div className="board-paper">
              <div ref={scroll} className="board-scroll scroll-fade">
                <div className="board-text">
                  <h2>{text.title}</h2>
                  <div className="board-rule" />
                  {text.facts.length > 0 && (
                    <ul className="board-facts">
                      {text.facts.map((fact) => (
                        <li key={fact}>{fact}</li>
                      ))}
                    </ul>
                  )}
                  {picture && (
                    <PictureFigure picture={picture} language={language} theme={theme} credit={{ picture: ui.infoPanel.pictureCredit, diagram: ui.infoPanel.diagramCredit }} className="board-figure" />
                  )}
                    <p className="board-body" style={shownId === 'hall-credits' ? { order: 2 } : undefined}>
                      {text.body}
                    </p>
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
            </div>
          </div>
        </article>
        </div>
        )}
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
