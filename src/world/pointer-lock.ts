// Pointer lock = the browser hides the cursor and sends mouse movement to the 3D view.
// Browsers only allow it right after a click, and Esc always releases it.

// The 3D canvas lives inside this wrapper (see Museum.tsx).
export const CANVAS_WRAPPER_ID = 'museum-canvas'

export function getCanvas(): HTMLCanvasElement | null {
  return document.querySelector(`#${CANVAS_WRAPPER_ID} canvas`)
}

// Returns true if the mouse was captured, false if the browser refused.
// Common refusals: clicking again within ~1 second after Esc (Chrome's cooldown), or the
// page is shown inside another app/frame instead of a normal browser tab.
export async function requestPointerLock(): Promise<boolean> {
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
