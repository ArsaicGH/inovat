import { useEffect } from 'react'
import { useContent } from '../content/use-content'
import { useMuseumStore, isQuizUnlocked } from '../state/useMuseumStore'
import { resumeWalking } from '../world/pointer-lock'
import { ERA_ROOMS, type RoomId } from '../types'

// The map follows the museum's shape: the rotunda in the middle, the rooms on a circle
// around it (north at the top), listed in visiting order (clockwise from the intro hall).
// Each room's place is set in index.css (.map-<room>).
const MAP_ROOMS: RoomId[] = ['hall', 'ir1', 'ir2', 'ir3', 'ir4', 'quiz', 'rotunda']

// THE WAY ROUND: a gold arrow along the map's ring, clockwise in visiting order, from the
// intro hall (bottom) past CMCN 1 to 4 to the Game Room. It is drawn only in the gaps
// between the rooms, with a chevron in each pointing the way; the gap between
// the Game Room and the intro hall stays empty (the end and the start).
// Drawn in a 100 x 100 box; bearings are clockwise from the top, as on the museum plan.
const ROUTE_RADIUS = 38 // the ring the rooms sit on (index.css)
const CHEVRONS = [210, 270, 330, 390, 450] // the middle of each gap between two rooms
const GAP_HALF = 13 // degrees of line drawn either side of each chevron (the rest is under the rooms)

function routePoint(bearing: number, radius = ROUTE_RADIUS): [number, number] {
  const angle = (bearing * Math.PI) / 180
  return [50 + radius * Math.sin(angle), 50 - radius * Math.cos(angle)]
}

function MapRoute() {
  // One short clockwise arc in each gap between two rooms (the boxes are see-through, so a
  // line running under them would show).
  const arc = CHEVRONS.map((mid) => {
    const [x0, y0] = routePoint(mid - GAP_HALF)
    const [x1, y1] = routePoint(mid + GAP_HALF)
    return `M ${x0} ${y0} A ${ROUTE_RADIUS} ${ROUTE_RADIUS} 0 0 1 ${x1} ${y1}`
  }).join(' ')
  return (
    <svg className="map-route" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="map-route-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3dc9a" />
          <stop offset="0.5" stopColor="#c9a25a" />
          <stop offset="1" stopColor="#8f6a2c" />
        </linearGradient>
      </defs>
      {/* A soft glow under a gold line. */}
      <path d={arc} className="map-route-glow" />
      <path d={arc} className="map-route-line" stroke="url(#map-route-gold)" />
      {CHEVRONS.map((bearing) => {
        const [x, y] = routePoint(bearing)
        return (
          <g key={bearing} transform={`translate(${x} ${y}) rotate(${bearing})`}>
            <polygon className="map-route-chevron" points="-0.8,-1.3 0.8,0 -0.8,1.3 -0.35,0" fill="url(#map-route-gold)" />
          </g>
        )
      })}
    </svg>
  )
}

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
          <MapRoute />
          {MAP_ROOMS.map((room) => {
            // Only rooms already visited can be travelled to: the era rooms and the Central
            // Hall once walked into (the intro hall, where the visit starts, is always open;
            // the Game Room opens once all four era rooms are visited, and can be travelled to once
            // walked into, like the others).
            const unvisited = (ERA_ROOMS.includes(room) || room === 'rotunda' || room === 'quiz') && !visited.includes(room) && room !== currentRoom
            const locked = (room === 'quiz' && !quizOpen) || unvisited
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
                {room === 'quiz' && !quizOpen && <span className="map-visited">{ui.map.locked}</span>}
                {unvisited && (room !== 'quiz' || quizOpen) && <span className="map-visited">{ui.map.notVisited}</span>}
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
