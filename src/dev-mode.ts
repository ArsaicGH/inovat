// DEVELOPER MODE: everything unlocked from the start (all rooms visited, the quiz passed,
// every control allowed without the tutorial) plus the test switches and the timing
// readout. Always on while developing (localhost); on the live site only with the secret
// ?devmode in the address, so the team can test any part without playing through.
export const DEV_MODE = import.meta.env.DEV || new URLSearchParams(window.location.search).has('devmode')
