import { useEffect, useState, type CSSProperties } from 'react'
import { useContent } from '../content/use-content'
import { gameText } from '../content/game'
import { useMuseumStore } from '../state/useMuseumStore'
import { playEndingMusic, setEndingMusicPaused, unlockAudio } from '../audio/sound'
import { FLASHES, GAME_SHOTS, GAME_SHOT_LENGTH, MUSIC_START, TITLES, TRAILER_FROM, segmentAt, trailerClock } from '../world/trailer-script'

// THE TRAILER'S SCREEN (?trailer, trailer-script.ts): first a quiet "click to play" (so the
// team can start their screen recorder), then everything drawn over the camera's flight:
// cinema bars edged in gold, a fine film grain, flashes of light on the cuts, black beats,
// and the gold titles, ending on the closing title.
export default function TrailerScreen() {
  const { ui, site, language } = useContent()
  const mode = useMuseumStore((state) => state.mode)
  const [t, setT] = useState(-1)

  // Follow the trailer's clock (kept by TrailerCamera).
  useEffect(() => {
    if (mode === 'start') return
    let frame = 0
    const tick = () => {
      setT(trailerClock.t)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [mode])

  // Space holds the trailer (picture and music) for screenshots, and lets it go on.
  useEffect(() => {
    if (mode === 'start') return
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return
      event.preventDefault()
      trailerClock.paused = !trailerClock.paused
      setEndingMusicPaused(trailerClock.paused)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode])

  if (mode === 'start') {
    return (
      <button
        type="button"
        className="trailer-start"
        onClick={() => {
          unlockAudio()
          document.documentElement.classList.add('trailer-on')
          // Everything open and lit for the camera: all four cores, the portal.
          useMuseumStore.setState({ quizPassed: true, gameCores: 4, coreStars: [3, 3, 3, 3] })
          trailerClock.t = TRAILER_FROM
          useMuseumStore.getState().setMode('trailer')
          playEndingMusic(MUSIC_START + TRAILER_FROM)
          // The 3D model views of the board and the game, fetched now so they appear at once.
          void import('../world/ModelViewer')
        }}
      >
        {ui.trailer.start}
      </button>
    )
  }

  const now = t < 0 ? null : segmentAt(t)
  const black = !now || now.segment.kind === 'black'
  const gameShot = now?.segment.kind === 'game' ? Math.min(GAME_SHOTS.length - 1, Math.floor(now.into / GAME_SHOT_LENGTH)) : null
  const titles = TITLES.filter((title) => t >= title.from && t < title.to)
  const flash = FLASHES.find((f) => t >= f.at - f.length * 0.4 && t < f.at + f.length)
  return (
    <div className="trailer" aria-live="polite">
      <div className={black ? 'trailer-black is-on' : 'trailer-black'} />
      {flash && <div key={flash.at} className="trailer-flash" style={{ '--flash': flash.colour, '--length': `${flash.length * 1.4}s` } as CSSProperties} />}
      {/* The Time Machine's shots: a sweep of gold light across the window in each. */}
      {gameShot !== null && <div key={gameShot} className="trailer-sheen" />}
      {gameShot !== null && (
        <div key={`tag-${gameShot}`} className="trailer-core-tag">
          <span>{['I', 'II', 'III', 'IV'][GAME_SHOTS[gameShot].round]}</span>
          <span className="trailer-core-text">
            <small>{gameText[language].rounds[GAME_SHOTS[gameShot].round].name}</small>
            {ui.trailer.gameShots[gameShot]}
          </span>
        </div>
      )}
      <div className="trailer-grain" />
      <div className="trailer-vignette" />
      {titles.map((title) => {
        const text = ui.trailer.titles[title.text]
        const style = { '--length': `${Math.min(title.to - title.from, 60)}s` } as CSSProperties
        if (title.place === 'final') {
          return (
            <div key={title.text} className="trailer-final" style={style}>
              <div className="trailer-final-shade" />
              <div className="trailer-final-text">
                <p className="trailer-kicker">{text.kicker}</p>
                <h1 className="trailer-logo">{site.name}</h1>
                <p className="trailer-subtitle">{site.subtitle}</p>
                <div className="trailer-rule" aria-hidden="true">
                  <span />
                  <i />
                  <span />
                </div>
                <p className="trailer-url">{ui.trailer.url}</p>
              </div>
            </div>
          )
        }
        return (
          <div key={title.text} className={`trailer-title is-${title.place}`} style={style}>
            <p className="trailer-kicker">
              <span />
              {text.kicker}
              <span />
            </p>
            <p className="trailer-heading">{text.title}</p>
          </div>
        )
      })}
      {/* Cinema bars (2.39:1) with a fine gold line on their inner edge. */}
      <div className="trailer-bar is-top" />
      <div className="trailer-bar is-bottom" />
    </div>
  )
}
