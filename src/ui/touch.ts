import { DEV_MODE } from '../dev-mode'

// TOUCH DEVICES (phones and tablets): no mouse or keyboard, so the game uses on-screen
// controls instead (TouchControls.tsx) and touch wording in the texts (content/ui.ts).
// Checked once at start. A touch screen alone is not enough (some laptops have one, and
// keep their touchpad and keyboard), and "has a precise pointer" is not either (phones
// with a stylus, e.g. Samsung's S Pen, report one). So: a touch screen, plus any sign of
// a phone or tablet: the browser says it is mobile, the device name says so, the MAIN
// pointer is a finger, or an iPad pretending to be a Mac.
function isTouchDevice(): boolean {
  // (Developer test switch: ?touch forces the phone version, for browsers that only pretend
  // to be a phone, like the editor's preview.)
  if (DEV_MODE && new URLSearchParams(window.location.search).has('touch')) return true
  if (typeof window === 'undefined' || navigator.maxTouchPoints === 0) return false
  const nav = navigator as Navigator & { userAgentData?: { mobile: boolean } }
  if (nav.userAgentData?.mobile) return true
  const agent = navigator.userAgent
  if (/Android|iPhone|iPad|iPod|Mobile|Tablet|Silk|Kindle/i.test(agent)) return true
  if (/Macintosh/.test(agent)) return true // iPads say "Macintosh"; real Macs have no touch screen
  return window.matchMedia('(pointer: coarse)').matches
}
export const IS_TOUCH = isTouchDevice()

// What the on-screen controls ask for, read by the Player every frame.
export const touchInput = {
  // Joystick: -1..1 each way (x = right, y = down on screen, so pushing up = walk forward).
  moveX: 0,
  moveY: 0,
  // The thumbstick is pulled past its sprint ring (TouchControls.tsx): run.
  sprint: false,
  // Finger drags to look around, in screen pixels, added up since the last frame.
  lookX: 0,
  lookY: 0,
  // A quick tap on the 3D view, as screen position from -1 to 1 (Interaction.tsx uses it
  // to open what was tapped). null when there is no new tap.
  tap: null as { x: number; y: number } | null,
}
