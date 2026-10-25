// IS THIS A COMPUTER? The museum needs a keyboard and a mouse or touchpad, so phones and
// tablets get a message instead (on-screen controls may come later). Checked once at start.
export function isComputer(): boolean {
  const nav = navigator as Navigator & { userAgentData?: { mobile: boolean } }
  // Newer Chrome/Edge say directly whether the device is a phone.
  if (nav.userAgentData?.mobile) return false
  const agent = navigator.userAgent
  if (/Android|iPhone|iPad|iPod|Mobile|Tablet|Silk|Kindle|BlackBerry|Opera Mini|IEMobile/i.test(agent)) return false
  // iPads pretend to be Macs; real Macs have no touch screen.
  if (/Macintosh/.test(agent) && navigator.maxTouchPoints > 1) return false
  // Touch-only devices have no precise pointer (mouse or touchpad) at all.
  if (!window.matchMedia('(any-pointer: fine)').matches) return false
  return true
}
