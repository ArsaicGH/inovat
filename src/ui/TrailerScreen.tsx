import { useEffect, useState, type CSSProperties } from 'react'
import { useContent } from '../content/use-content'
import { gameText } from '../content/game'
import { useMuseumStore } from '../state/useMuseumStore'
import { playEndingMusic, setEndingMusicPaused } from '../audio/sound'
import { FLASHES, GAME_SHOTS, GAME_SHOT_LENGTH, MUSIC_START, TITLES, TRAILER_FROM, TRAILER_LENGTH, TRAILER_PAGE, segmentAt, trailerClock } from '../world/trailer-script'
import { closeTrailer, leaveTrailer, startTrailer, trailerFromMenu } from './trailer-run'

// From the title screen: how long the closing title holds before the way back: a short fade
// to black (title and all), then the title screen fades in from black.
const HOLD = 3.6
const DARKEN_MS = 700
const REVEAL_MS = 600

// THE TRAILER'S SCREEN (?trailer, trailer-script.ts): first a quiet "click to play" (so the
// team can start their screen recorder), then everything drawn over the camera's flight:
// cinema bars edged in gold, a fine film grain, flashes of light on the cuts, black beats,
// and the gold titles, ending on the closing title.
export default function TrailerScreen() {
  const { ui, site, language } = useContent()
  const mode = useMuseumStore((state) => state.mode)
  const [t, setT] = useState(-1)
  // The way back to the title screen (from the title screen only): darken, then reveal.
  const [leaving, setLeaving] = useState<'darken' | 'reveal' | null>(null)

  // Follow the trailer's clock (kept by TrailerCamera); held still on the way back.
  useEffect(() => {
    if (mode === 'start' || leaving) return
    let frame = 0
    const tick = () => {
      setT(trailerClock.t)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [mode, leaving])

  // From the title screen: after the closing title has held, back to the title screen (Esc
  // goes back at once).
  useEffect(() => {
    if (trailerFromMenu && !leaving && t >= TRAILER_LENGTH + HOLD) setLeaving('darken')
  }, [t, leaving])
  useEffect(() => {
    if (!trailerFromMenu || leaving) return
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'Escape') setLeaving('darken')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [leaving])
  useEffect(() => {
    if (leaving === 'darken') {
      const timer = window.setTimeout(() => {
        leaveTrailer()
        setLeaving('reveal')
      }, DARKEN_MS)
      return () => window.clearTimeout(timer)
    }
    if (leaving === 'reveal') {
      const timer = window.setTimeout(closeTrailer, REVEAL_MS)
      return () => window.clearTimeout(timer)
    }
  }, [leaving])

  // R (hidden): play the trailer again from the start, after a 3-2-1 countdown on black, for
  // another take of the screen recording. (A second take is also the smoothest: by then every
  // room and the ending film have been drawn once, so nothing is prepared mid-shot.)
  const [countdown, setCountdown] = useState<number | null>(null)
  useEffect(() => {
    if (countdown === null) return
    const timer = window.setTimeout(() => {
      if (countdown > 1) return setCountdown(countdown - 1)
      setCountdown(null)
      trailerClock.t = 0
      trailerClock.paused = false
      playEndingMusic(MUSIC_START)
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [countdown])

  // Space holds the trailer (picture and music) for screenshots, and lets it go on.
  useEffect(() => {
    if (mode === 'start') return
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'KeyR' && !event.repeat && !trailerFromMenu) {
        setEndingMusicPaused(true)
        trailerClock.t = -1 // (black, and the camera waits)
        trailerClock.paused = true
        setCountdown(3)
        return
      }
      if (event.code !== 'Space' || trailerClock.t < 0) return
      event.preventDefault()
      trailerClock.paused = !trailerClock.paused
      setEndingMusicPaused(trailerClock.paused)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode])

  if (mode === 'start' && !leaving) {
    if (!TRAILER_PAGE) return null
    return (
      <button type="button" className="trailer-start" onClick={() => startTrailer(TRAILER_FROM, false)}>
        {ui.trailer.start}
      </button>
    )
  }

  const now = t < 0 ? null : segmentAt(t)
  const black = !now || now.segment.kind === 'black' || leaving !== null
  const gameShot = now?.segment.kind === 'game' ? Math.min(GAME_SHOTS.length - 1, Math.floor(now.into / GAME_SHOT_LENGTH)) : null
  const titles = TITLES.filter((title) => t >= title.from && t < title.to)
  const flash = FLASHES.find((f) => t >= f.at - f.length * 0.4 && t < f.at + f.length)
  return (
    <div className={leaving ? `trailer is-${leaving}` : 'trailer'} aria-live="polite">
      <div className={black ? 'trailer-black is-on' : 'trailer-black'} />
      {countdown !== null && (
        <div key={countdown} className="trailer-countdown">
          {countdown}
        </div>
      )}
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
      {/* The way back to the title screen: black over everything. */}
      <div className="trailer-fade" />
      {/* Cinema bars (2.39:1) with a fine gold line on their inner edge. */}
      <div className="trailer-bar is-top" />
      <div className="trailer-bar is-bottom" />
    </div>
  )
}
