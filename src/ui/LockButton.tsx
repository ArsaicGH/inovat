import { useState } from 'react'
import { ui } from '../content/ui'
import { requestPointerLock } from '../world/pointer-lock'

// Button that captures the mouse (used by the start and pause screens).
// If the browser refuses, we tell the visitor instead of silently doing nothing.
export default function LockButton({ label }: { label: string }) {
  const [refused, setRefused] = useState(false)

  async function handleClick() {
    const ok = await requestPointerLock()
    setRefused(!ok)
  }

  return (
    <>
      <button type="button" onClick={handleClick}>
        {label}
      </button>
      {refused && <p className="overlay-error">{ui.lockRefused}</p>}
    </>
  )
}
