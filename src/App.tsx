import Museum from './world/Museum'
import Hud from './ui/Hud'
import StartScreen from './ui/StartScreen'
import PauseScreen from './ui/PauseScreen'
import InfoPanel from './ui/InfoPanel'
import MapMenu from './ui/MapMenu'
import { useMuseumStore } from './state/useMuseumStore'

// Two layers: the 3D world underneath, the HTML interface on top.
// Which screen is shown depends only on the current mode.
function App() {
  const mode = useMuseumStore((state) => state.mode)
  const worldReady = useMuseumStore((state) => state.worldReady)

  return (
    <>
      <Museum />
      {/* Black cover over the 3D world until it has loaded, then a quick fade into view. */}
      <div className={worldReady ? 'world-cover world-cover-gone' : 'world-cover'} aria-hidden="true" />
      {mode === 'exploring' && <Hud />}
      {mode === 'start' && <StartScreen />}
      {mode === 'paused' && <PauseScreen />}
      {/* Always mounted: it animates in when an exhibit opens and out when it closes. */}
      <InfoPanel />
      {mode === 'map' && <MapMenu />}
    </>
  )
}

export default App
