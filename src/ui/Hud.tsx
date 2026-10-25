import { site } from '../content/site'
import { ui } from '../content/ui'
import { useMuseumStore } from '../state/useMuseumStore'

// On-screen text drawn on top of the 3D view while walking. Text comes from src/content/.
export default function Hud() {
  // Player.tsx turns this on when Unikey/EVKey interferes, and off once keys are normal again.
  const showWarning = useMuseumStore((state) => state.typingToolWarning)

  return (
    <>
      {showWarning && <p className="hud-warning">{ui.typingToolWarning}</p>}
      <header className="hud-title">
        <h1>{site.name}</h1>
        <p>{site.subtitle}</p>
      </header>
    </>
  )
}
