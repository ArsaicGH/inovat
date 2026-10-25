import { useState } from 'react'
import { ui } from '../content/ui'
import { requestPointerLock } from '../world/pointer-lock'

interface LockButtonProps {
  label: string
  className?: string
  onBeforeLock?: () => void // e.g. switch the tutorial on or off
}

// Button that captures the mouse (start and pause screens). The click itself is the user
// action the browser requires. If the browser refuses, we say so instead of doing nothing.
export default function LockButton({ label, className, onBeforeLock }: LockButtonProps) {
  const [refused, setRefused] = useState(false)

  async function handleClick() {
    onBeforeLock?.()
    const ok = await requestPointerLock()
    setRefused(!ok)
  }

  return (
    <>
      <button type="button" className={className} onClick={handleClick}>
        {label}
      </button>
      {refused && <p className="overlay-error">{ui.lockRefused}</p>}
    </>
  )
}
