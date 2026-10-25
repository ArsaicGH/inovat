import { useEffect } from 'react'
import { useContent } from '../content/use-content'
import { useMuseumStore, isQuizUnlocked } from '../state/useMuseumStore'
import { resumeWalking } from '../world/pointer-lock'
import type { RoomId } from '../types'

// The map follows the museum's shape: the rotunda in the middle, the rooms on a circle
// around it (north at the top). Each room's place is set in index.css (.map-<room>).
const MAP_ROOMS: RoomId[] = ['ir2', 'quiz', 'ir3', 'rotunda', 'ir1', 'hall', 'ir4']

// Map of the museum. The current room is highlighted; clicking a room teleports there.
export default function MapMenu() {
  const { ui, roomNames } = useContent()
  const currentRoom = useMuseumStore((state) => state.currentRoom)
  const visited = useMuseumStore((state) => state.visitedRooms)
  const requestTeleport = useMuseumStore((state) => state.requestTeleport)
  const quizOpen = isQuizUnlocked(visited)

  // Q closes the map and returns to walking (Esc is kept for the pause menu).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat) return
      if (event.code === 'KeyQ') resumeWalking()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function goTo(room: RoomId) {
    requestTeleport(room)
    resumeWalking()
  }

  return (
    // Same look as the title screen: dark glass, gold lines and lettering.
    // A click on blank space (not on a room or button) closes the map, like the pause menu.
    <div
      className="overlay title-overlay map-overlay"
      onClick={(event) => {
        const target = event.target as HTMLElement
        if (target === event.currentTarget || target.classList.contains('map-card') || target.classList.contains('map-plan')) {
          void resumeWalking()
        }
      }}
    >
      <div className="map-card">
        <h2 className="map-title">{ui.map.title}</h2>
        <div className="title-ornament map-ornament" aria-hidden="true">
          <span />
          <i />
          <span />
        </div>
        <p className="map-hint">{ui.map.hint}</p>
        <div className="map-plan">
          {MAP_ROOMS.map((room) => {
            const locked = room === 'quiz' && !quizOpen
            const classes = ['map-room', `map-${room}`]
            if (room === currentRoom) classes.push('map-room-current')
            return (
              <button
                key={room}
                type="button"
                className={classes.join(' ')}
                disabled={locked}
                onClick={() => goTo(room)}
              >
                <span className="map-room-short">{roomNames[room].short}</span>
                {roomNames[room].short !== roomNames[room].name && (
                  <span className="map-room-name">{roomNames[room].name}</span>
                )}
                {room === currentRoom && <span className="map-here">{ui.map.youAreHere}</span>}
                {locked && <span className="map-here">{ui.map.locked}</span>}
                {room !== currentRoom && visited.includes(room) && <span className="map-visited">{ui.map.visited}</span>}
              </button>
            )
          })}
        </div>
        <button type="button" className="start-button map-close" onClick={resumeWalking}>
          {ui.map.close}
        </button>
        <p className="map-hint">{ui.map.closeHint}</p>
      </div>
    </div>
  )
}
