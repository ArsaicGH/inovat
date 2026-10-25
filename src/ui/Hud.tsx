import { site } from '../content/site'
import { ui } from '../content/ui'
import { roomNames } from '../content/rooms'
import { getExhibitText } from '../content/exhibits'
import { useMuseumStore, eraRoomsVisited } from '../state/useMuseumStore'

// On-screen layer while walking: crosshair, exhibit prompt, room name, warnings.
// Text comes from src/content/.
export default function Hud() {
  // Player.tsx turns this on when Unikey/EVKey interferes, and off once keys are normal again.
  const showWarning = useMuseumStore((state) => state.typingToolWarning)
  const aimedId = useMuseumStore((state) => state.aimedExhibitId)
  const room = useMuseumStore((state) => state.currentRoom)
  const nearLockedDoor = useMuseumStore((state) => state.nearLockedDoor)
  const visitedCount = useMuseumStore((state) => eraRoomsVisited(state.visitedRooms))

  return (
    <>
      {showWarning && <p className="hud-warning">{ui.typingToolWarning}</p>}
      {nearLockedDoor && (
        <p className="hud-notice">{ui.quizLocked.replace('{count}', String(visitedCount))}</p>
      )}

      {/* A small dot in the middle of the screen: what you aim at with the mouse. */}
      <div className={aimedId ? 'crosshair crosshair-active' : 'crosshair'} />
      {aimedId && (
        <div className="hud-prompt">
          <strong>{getExhibitText(aimedId).title}</strong>
          <span>{ui.prompt}</span>
        </div>
      )}

      <header className="hud-title">
        <h1>{site.name}</h1>
        <p>{roomNames[room].name}</p>
      </header>
    </>
  )
}
