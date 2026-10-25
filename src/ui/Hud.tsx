import { site } from '../content/site'

// On-screen text drawn on top of the 3D view. Text comes from src/content/.
export default function Hud() {
  return (
    <header className="hud-title">
      <h1>{site.name}</h1>
      <p>{site.subtitle}</p>
    </header>
  )
}
