// Counters for the development-only timing readout (FrameTimingProbe.tsx).
export const debugStats = {
  // How often a key was "released" and pressed again within the grace period.
  // Keyboard hooks (e.g. Unikey) can send such fake releases while a key is held.
  keyChatter: 0,
  // Raw keyboard signals since the readout last refreshed.
  keyDowns: 0,
  keyUps: 0,
  // Mouse movement signals since the readout last refreshed (gaming mice send 1000+/s).
  mouseMoves: 0,
  // The keys the game currently treats as held (filled in by Player.tsx).
  held: new Set<string>(),
}
