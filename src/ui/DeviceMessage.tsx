import { useContent } from '../content/use-content'
import LanguageSwitch from './LanguageSwitch'

// Shown instead of the museum on phones and tablets (see device.ts). The 3D museum is not
// loaded at all there, so no data is wasted.
export default function DeviceMessage() {
  const { ui, site } = useContent()
  return (
    <div className="overlay title-overlay">
      <div className="title-block device-message">
        <h1 className="game-title">{site.name}</h1>
        <p className="game-subtitle">{site.subtitle}</p>
        <h2>{ui.device.title}</h2>
        <p>{ui.device.text}</p>
        <LanguageSwitch />
      </div>
    </div>
  )
}
