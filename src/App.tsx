import Hud from './ui/Hud'
import StartScreen from './ui/StartScreen'
import PauseScreen from './ui/PauseScreen'
import InfoPanel from './ui/InfoPanel'
import MapMenu from './ui/MapMenu'
import EndingScreen from './ui/EndingScreen'
import TimeMachineGame from './ui/TimeMachineGame'
import TouchControls from './ui/TouchControls'
import { IS_TOUCH } from './ui/touch'
import LoadingScreen from './ui/LoadingScreen'
import SoundDirector from './audio/SoundDirector'
import TrailerScreen from './ui/TrailerScreen'
import { TRAILER_PAGE } from './world/trailer-script'
import { Suspense, lazy, useEffect } from 'react'
import { useMuseumStore } from './state/useMuseumStore'
import { useContent } from './content/use-content'

// Phones and tablets get on-screen controls (the page is marked, so the layout can adapt).
// (For now every touch device is allowed; later only tablets, with DeviceMessage on phones.)
if (IS_TOUCH) document.documentElement.classList.add('touch')

// The 3D world (three.js and the effects, most of the download) arrives as a separate
// file, so the loading screen shows at once instead of after the whole script.
const Museum = lazy(() => import('./world/Museum'))

// Two layers: the 3D world underneath, the HTML interface on top.
// Which screen is shown depends only on the current mode.
function App() {
  const mode = useMuseumStore((state) => state.mode)
  const trailer = useMuseumStore((state) => state.trailerActive)
  const worldReady = useMuseumStore((state) => state.worldReady)
  const { language, site, ui } = useContent()

  // Keep the page's language and tab title in step with the chosen language.
  useEffect(() => {
    document.documentElement.lang = language
    document.title = site.pageTitle
  }, [language, site])

  return (
    <>
      <Suspense fallback={null}>
        <Museum />
      </Suspense>
      {/* Black cover over the 3D world until it has loaded, then a fade into view. */}
      <div className={worldReady ? 'world-cover world-cover-gone' : 'world-cover'} aria-hidden="true" />
      {mode === 'exploring' && IS_TOUCH && <TouchControls />}
      {mode === 'exploring' && <Hud />}
      {/* The title screen waits until everything has loaded (LoadingScreen). */}
      {/* (With ?trailer: the trailer instead of the title screen.) */}
      {mode === 'start' && worldReady && !TRAILER_PAGE && <StartScreen />}
      {trailer && worldReady && <TrailerScreen />}
      {mode === 'paused' && <PauseScreen />}
      {/* Always mounted: it animates in when an exhibit opens and out when it closes. */}
      <InfoPanel />
      {mode === 'map' && <MapMenu />}
      {mode === 'ending' && !trailer && <EndingScreen />}
      {/* (In the trailer it stays open, unseen between its shots: TrailerCamera.tsx.) */}
      {(mode === 'game' || (trailer && mode !== 'start')) && <TimeMachineGame />}
      <LoadingScreen />
      <SoundDirector />
      {/* Touch devices held upright: ask to turn them sideways (shown by index.css). */}
      {IS_TOUCH && (
        <div className="rotate-hint">
          <p>{ui.touch.rotate}</p>
        </div>
      )}
    </>
  )
}

export default App
