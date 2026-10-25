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

  return (
    <>
      <Museum />
      {mode === 'exploring' && <Hud />}
      {mode === 'start' && <StartScreen />}
      {mode === 'paused' && <PauseScreen />}
      {mode === 'reading' && <InfoPanel />}
      {mode === 'map' && <MapMenu />}
    </>
  )
}

export default App
