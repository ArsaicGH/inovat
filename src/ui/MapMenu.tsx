import { useEffect } from 'react'
import { ui } from '../content/ui'
import { roomNames } from '../content/rooms'
import { useMuseumStore, isQuizUnlocked } from '../state/useMuseumStore'
import { resumeWalking } from '../world/pointer-lock'
import type { RoomId } from '../types'

// The map follows the museum's shape: the rotunda in the middle, the rooms around it
// (north at the top). Each name is the CSS grid area it sits in.
const MAP_ROOMS: RoomId[] = ['ir2', 'quiz', 'ir3', 'rotunda', 'ir1', 'hall', 'ir4']

// Map of the museum. The current room is highlighted; clicking a room teleports there.
export default function MapMenu() {
  const currentRoom = useMuseumStore((state) => state.currentRoom)
  const visited = useMuseumStore((state) => state.visitedRooms)
  const requestTeleport = useMuseumStore((state) => state.requestTeleport)
  const quizOpen = isQuizUnlocked(visited)

  // M or Esc closes the map and returns to walking.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat) return
      if (event.code === 'KeyM' || event.code === 'Escape') resumeWalking()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function goTo(room: RoomId) {
    requestTeleport(room)
    resumeWalking()
  }

  return (
    <div className="overlay">
      <div className="overlay-card map-card">
        <h2>{ui.map.title}</h2>
        <p className="overlay-tip">{ui.map.hint}</p>
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
                style={{ gridArea: room }}
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
        <button type="button" className="secondary-button" onClick={resumeWalking}>
          {ui.map.close}
        </button>
        <p className="overlay-tip">{ui.map.closeHint}</p>
      </div>
    </div>
  )
}
