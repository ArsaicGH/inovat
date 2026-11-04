import { useContent } from '../content/use-content'
import { useMuseumStore } from '../state/useMuseumStore'
import { filmVeil } from '../world/ending-shots'
import { useScrollFades } from './scroll-fades'

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
  // (On very short windows the closing title and its buttons scroll: scroll-fades.ts.)
  const titleScroll = useScrollFades<HTMLDivElement>(stage)

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
        </>
      ) : (
        <div ref={titleScroll} className="ending-title scroll-fade">
          <h1 className="game-title ending-brand">{ui.ending.brand}</h1>
          <div className="title-ornament" aria-hidden="true">
            <span />
            <i />
            <span />
          </div>
          <p className="ending-tagline">{ui.ending.tagline}</p>
          <div className="ending-after">
            <h2>{ui.ending.title}</h2>
            <p>{ui.ending.text}</p>
            <div className="button-row">
              {/* The visit is saved as completed: "Continue" on the title screen brings the
                  visitor back in front of the portal with the map open. */}
              <button className="start-button start-button-quiet" onClick={() => useMuseumStore.getState().startEnding()}>
                {ui.ending.replay}
              </button>
              <button className="start-button" onClick={() => useMuseumStore.getState().finishVisit()}>
                {ui.ending.toTitle}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
