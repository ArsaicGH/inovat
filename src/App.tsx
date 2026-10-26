import Hud from './ui/Hud'
import StartScreen from './ui/StartScreen'
import PauseScreen from './ui/PauseScreen'
import InfoPanel from './ui/InfoPanel'
import MapMenu from './ui/MapMenu'
import DeviceMessage from './ui/DeviceMessage'
import LoadingScreen from './ui/LoadingScreen'
import SoundDirector from './audio/SoundDirector'
import { Suspense, lazy, useEffect } from 'react'
import { useMuseumStore } from './state/useMuseumStore'
import { useContent } from './content/use-content'
import { isComputer } from './ui/device'

const ON_COMPUTER = isComputer()

// The 3D world (three.js and the effects, most of the download) arrives as a separate
// file, so the loading screen shows at once instead of after the whole script.
const Museum = lazy(() => import('./world/Museum'))

// Two layers: the 3D world underneath, the HTML interface on top.
// Which screen is shown depends only on the current mode.
function App() {
  const mode = useMuseumStore((state) => state.mode)
  const worldReady = useMuseumStore((state) => state.worldReady)
  const { language, site } = useContent()

  // Keep the page's language and tab title in step with the chosen language.
  useEffect(() => {
    document.documentElement.lang = language
    document.title = site.pageTitle
  }, [language, site])

  // Phones and tablets: a message instead of the museum.
  if (!ON_COMPUTER) return <DeviceMessage />

  return (
    <>
      <Suspense fallback={null}>
        <Museum />
      </Suspense>
      {/* Black cover over the 3D world until it has loaded, then a fade into view. */}
      <div className={worldReady ? 'world-cover world-cover-gone' : 'world-cover'} aria-hidden="true" />
      {mode === 'exploring' && <Hud />}
      {/* The title screen waits until everything has loaded (LoadingScreen). */}
      {mode === 'start' && worldReady && <StartScreen />}
      {mode === 'paused' && <PauseScreen />}
      {/* Always mounted: it animates in when an exhibit opens and out when it closes. */}
      <InfoPanel />
      {mode === 'map' && <MapMenu />}
      <LoadingScreen />
      <SoundDirector />
    </>
  )
}

export default App
