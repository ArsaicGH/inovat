import { SENSITIVITY_MAX, SENSITIVITY_MIN, useMuseumStore } from '../state/useMuseumStore'
import { useContent } from '../content/use-content'

// Lets each visitor adjust look speed for their own mouse or touchpad.
// The choice is remembered in this browser (see useMuseumStore).
export default function SensitivitySlider() {
  const { ui } = useContent()
  const value = useMuseumStore((state) => state.mouseSensitivity)
  const setValue = useMuseumStore((state) => state.setMouseSensitivity)

  return (
    <label className="sensitivity">
      <span>
        {ui.sensitivity.label}: {value.toFixed(1)}×
      </span>
      <input
        type="range"
        min={SENSITIVITY_MIN}
        max={SENSITIVITY_MAX}
        step={0.1}
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
      />
    </label>
  )
}
