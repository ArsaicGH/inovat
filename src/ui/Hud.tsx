import { useMuseumStore, eraRoomsVisited } from '../state/useMuseumStore'
import { useContent } from '../content/use-content'
import TutorialCard from './TutorialCard'
import { isQuizTarget } from '../world/aim-targets'
import { gameText } from '../content/game'
import { PICTURES, isWallPicture } from '../content/pictures'
import { useEffect } from 'react'
import { returnToGame } from './game-run'
import { IS_TOUCH } from './touch'

// On-screen layer while walking: crosshair, exhibit prompt, room name, warnings.
// Text comes from src/content/.
export default function Hud() {
  const { ui, site, roomNames, exhibit, language } = useContent()
  // Player.tsx turns this on when Unikey/EVKey interferes, and off once keys are normal again.
  const showWarning = useMuseumStore((state) => state.typingToolWarning)
  const aimedId = useMuseumStore((state) => state.aimedExhibitId)
  const room = useMuseumStore((state) => state.currentRoom)
  const nearLockedDoor = useMuseumStore((state) => state.nearLockedDoor)
  const visitedCount = useMuseumStore((state) => eraRoomsVisited(state.visitedRooms))
  const mouseCaptured = useMuseumStore((state) => state.mouseCaptured)
  const showKeyList = useMuseumStore((state) => state.showKeyList)
  const cores = useMuseumStore((state) => state.gameCores)
  // Left the Time Machine game to look around the rooms: a way back (R, or the button).
  const awayFromGame = useMuseumStore((state) => state.awayFromGame)
  useEffect(() => {
    if (!awayFromGame) return
    function onKey(event: KeyboardEvent) {
      if (event.code === 'KeyR' && !event.repeat) returnToGame()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [awayFromGame])

  return (
    <>
      <TutorialCard />
      {showWarning && <p className="hud-warning">{ui.typingToolWarning}</p>}
      {!mouseCaptured && <p className="hud-notice hud-notice-low">{ui.clickToLook}</p>}

      {/* Space: every key at a glance. Walking goes on underneath. */}
      {showKeyList && (
        <aside className="key-list">
          <h3>{ui.keyList.title}</h3>
          <dl>
            {ui.keyList.keys.map(({ keys, action }) => (
              <div key={keys}>
                <dt>{keys}</dt>
                <dd>{action}</dd>
              </div>
            ))}
          </dl>
          <p className="overlay-tip">{ui.keyList.hint}</p>
        </aside>
      )}
      {nearLockedDoor && (
        <p className="hud-notice">{ui.quizLocked.replace('{count}', String(visitedCount))}</p>
      )}

      {/* A small dot in the middle of the screen: what you aim at with the mouse. */}
      <div className={aimedId ? 'crosshair crosshair-active' : 'crosshair'} />
      {aimedId && (
        <div className="hud-prompt">
          <strong>{isQuizTarget(aimedId) ? (cores >= 4 ? gameText[language].consoleReplay : cores > 0 ? gameText[language].consoleContinue : gameText[language].consoleStart) : isWallPicture(aimedId) ? PICTURES[aimedId]?.caption[language] : exhibit(aimedId).title}</strong>
          <span>{isQuizTarget(aimedId) ? ui.quiz.prompt : ui.prompt}</span>
        </div>
      )}

      {awayFromGame && (
        <button type="button" className="hud-return" onClick={returnToGame}>
          {gameText[language].returnToGame}
          {!IS_TOUCH && <kbd>{gameText[language].returnKey}</kbd>}
        </button>
      )}

      <header className="hud-title">
        <h1>{site.name}</h1>
        <p>{roomNames[room].name}</p>
      </header>
    </>
  )
}
