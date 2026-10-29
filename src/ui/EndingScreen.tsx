import { useContent } from '../content/use-content'
import { useMuseumStore } from '../state/useMuseumStore'
import { resumeWalking } from '../world/pointer-lock'
import { filmVeil } from '../world/ending-shots'

// THE ENDING's interface, over the film through time (EndingScene.tsx): a white flash as
// the visitor steps through the portal, cinema bars, the veil for the film's dips and
// flashes, the name of each era as its act begins, a "Skip" button, and at the end the
// closing title, then the thank-you panel.

const ERAS = ['ir1', 'ir2', 'ir3', 'ir4'] as const

export default function EndingScreen() {
  const { ui, roomNames, exhibit } = useContent()
  const stage = useMuseumStore((state) => state.endingStage)
  const run = useMuseumStore((state) => state.endingRun)
  const era = stage >= 1 && stage <= 4 ? roomNames[ERAS[stage - 1]] : null

  function backToHall() {
    const store = useMuseumStore.getState()
    // The ending closes first (it would otherwise keep holding the camera far outside the
    // museum: a grey screen), then the visitor goes to the hall.
    store.setMode('paused')
    store.requestTeleport('hall')
    void resumeWalking() // the click lets the browser capture the mouse again
  }

  return (
    <div className="ending ending-bars">
      {/* The film's dips to black and flashes of light (set by EndingScene every frame). */}
      <div
        ref={(element) => {
          filmVeil.element = element
        }}
        className="ending-veil"
        aria-hidden="true"
      />
      {/* key: a new run restarts the flash. */}
      <div key={run} className="ending-flash" aria-hidden="true" />
      {stage < 6 ? (
        <>
          <p className="ending-journey">{ui.ending.journey}</p>
          {era && (
            // key: each era's caption fades in on its own.
            <div key={stage} className="ending-caption">
              <span>{era.short}</span>
              <strong>{era.name}</strong>
              {/* The period (from the room's overview board) and the era's narration line. */}
              <em>{exhibit(`${ERAS[stage - 1]}-overview`).facts[0]?.split(': ').slice(1).join(': ')}</em>
              <p>{ui.ending.moods[stage - 1]}</p>
            </div>
          )}
          <button className="ending-skip" onClick={() => useMuseumStore.getState().setEndingStage(6)}>
            {ui.ending.skip}
          </button>
        </>
      ) : (
        <div className="ending-title">
          <h1>{ui.ending.brand}</h1>
          <div className="title-ornament" aria-hidden="true">
            <span />
            <i />
            <span />
          </div>
          <p className="ending-tagline">{ui.ending.tagline}</p>
          <p className="ending-subtitle">{ui.ending.subtitle}</p>
          <div className="ending-after">
            <h2>{ui.ending.title}</h2>
            <p>{ui.ending.text}</p>
            <div className="button-row">
              <button className="start-button" onClick={backToHall}>
                {ui.ending.backToHall}
              </button>
              <button className="start-button start-button-quiet" onClick={() => useMuseumStore.getState().startEnding()}>
                {ui.ending.replay}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
