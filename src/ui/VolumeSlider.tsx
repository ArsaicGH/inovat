import { useContent } from '../content/use-content'
import { useMuseumStore } from '../state/useMuseumStore'
import { AUDIO_ENABLED } from '../features'

// The one volume slider: in the pause menu under camera sensitivity, and on the start
// screen above the language pill (remembered in this browser). 0 = silent.
export default function VolumeSlider() {
  const { ui } = useContent()
  const value = useMuseumStore((state) => state.volumes.master)
  const setVolume = useMuseumStore((state) => state.setVolume)
  if (!AUDIO_ENABLED) return null
  return (
    <label className="sensitivity">
      <span>
        {ui.sound.volume}: {Math.round(value * 100)}%
      </span>
      <input type="range" min={0} max={1} step={0.05} value={value} onChange={(event) => setVolume('master', Number(event.target.value))} />
    </label>
  )
}
