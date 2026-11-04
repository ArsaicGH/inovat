import { useEffect, useState } from 'react'
import { useContent } from '../content/use-content'
import { useMuseumStore } from '../state/useMuseumStore'
import { playEndingMusic, setEndingMusicPaused, unlockAudio } from '../audio/sound'
import { MUSIC_START, SHOTS_END, TRAILER_LENGTH, shotAt, trailerClock } from '../world/trailer-script'

// A brief dip to black around each cut: it hides the instant a new room's lights come on.
const DIP = 0.12 // seconds on each side of the cut

// THE TRAILER'S SCREEN (?trailer, trailer-script.ts): first a quiet "click to play" (so the
// team can start their screen recorder), then the captions over the camera's flight, a fade
// to black, and the closing card on the music's climax.
export default function TrailerScreen() {
  const { ui, site } = useContent()
  const mode = useMuseumStore((state) => state.mode)
  const [caption, setCaption] = useState(-1)
  const [phase, setPhase] = useState<'shots' | 'fade' | 'card'>('shots')
  const [cut, setCut] = useState(false)

  // Space holds the trailer (picture and music) for screenshots, and lets it go on.
  useEffect(() => {
    if (mode !== 'trailer') return
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return
      event.preventDefault()
      trailerClock.paused = !trailerClock.paused
      setEndingMusicPaused(trailerClock.paused)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode])

  // Follow the trailer's clock (kept by TrailerCamera) for the captions.
  useEffect(() => {
    if (mode !== 'trailer') return
    let frame = 0
    const tick = () => {
      const t = trailerClock.t
      if (t >= TRAILER_LENGTH) setPhase('card')
      else if (t >= SHOTS_END) setPhase('fade')
      else setPhase('shots')
      const now = shotAt(Math.max(0, t))
      const into = now.progress * now.shot.duration
      setCut(t > DIP && (into < DIP || now.shot.duration - into < DIP) && t < SHOTS_END - DIP)
      setCaption(t < 0 ? -1 : now.shot.caption)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [mode])

  if (mode !== 'trailer') {
    return (
      <button
        type="button"
        className="trailer-start"
        onClick={() => {
          unlockAudio()
          trailerClock.t = 0
          useMuseumStore.getState().setMode('trailer')
          playEndingMusic(MUSIC_START)
        }}
      >
        {ui.trailer.start}
      </button>
    )
  }

  return (
    <div className={`trailer is-${phase}${cut ? ' is-cut' : ''}`} aria-live="polite">
      {phase === 'shots' && caption >= 0 && (
        <p key={caption} className="trailer-caption">
          {ui.trailer.captions[caption]}
        </p>
      )}
      <div className="trailer-veil" />
      {phase === 'card' && (
        <div className="trailer-card">
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
          <p className="trailer-url">{ui.trailer.url}</p>
          </div>
        </div>
      )}
    </div>
  )
}
