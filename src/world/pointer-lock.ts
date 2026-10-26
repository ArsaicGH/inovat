import { useMuseumStore } from '../state/useMuseumStore'
import { IS_TOUCH } from '../ui/touch'

// Pointer lock = the browser hides the cursor and sends mouse movement to the 3D view.
// Browsers only allow it right after a click or key press (never Esc), and Esc always
// releases it, after which only a click may capture it again. So Esc pauses and a click
// continues, the same in a window and in full screen.

// The 3D canvas lives inside this wrapper (see Museum.tsx).
export const CANVAS_WRAPPER_ID = 'museum-canvas'

export function getCanvas(): HTMLCanvasElement | null {
  return document.querySelector(`#${CANVAS_WRAPPER_ID} canvas`)
}

// Returns true if the mouse was captured, false if the browser refused.
// Common refusals: clicking again within ~1 second after Esc (Chrome's cooldown), or the
// page is shown inside another app/frame instead of a normal browser tab.
export async function requestPointerLock(): Promise<boolean> {
  // Touch devices have no mouse to capture: walking starts straight away (the on-screen
  // controls take over). Phones that allow it also switch to full screen, which the tap
  // that got us here permits. (iPhones do not allow it for web pages; nothing happens.)
  if (IS_TOUCH) {
    if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.().catch(() => {})
    useMuseumStore.getState().setMouseCaptured(true)
    useMuseumStore.getState().startExploring()
    return true
  }
  const canvas = getCanvas()
  if (!canvas) return false
  try {
    // Normal (not raw) input on purpose: it keeps each visitor's own Windows/macOS
    // mouse and touchpad speed settings, which already suit their device.
    await canvas.requestPointerLock()
    return true
  } catch (error) {
    // A warning (not an error): the visitor sees a message and can simply try again.
    console.warn('Pointer lock refused by the browser:', error)
    return false
  }
}

// Release the mouse (to show a panel or the map). The mode must already be set,
// so the Player does not mistake this for a pause.
export function releasePointer() {
  if (document.pointerLockElement) document.exitPointerLock()
}

// Go back to walking from a panel or the map. If the browser refuses to capture the
// mouse, show the pause screen (its "Tiếp tục" button tries again) instead of getting stuck.
export async function resumeWalking() {
  const ok = await requestPointerLock()
  // Also forget the open panel, so nothing is left half-open behind the pause screen.
  if (!ok) useMuseumStore.setState({ mode: 'paused', openExhibitId: null })
}
