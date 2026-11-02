import { useEffect, useState } from 'react'
import { useLoadProgress } from './load-progress'
import { useMuseumStore } from '../state/useMuseumStore'
import { PART_COUNT } from '../world/layout'
import { useFontsReady } from '../world/fonts'

// LOADING SCREEN: a single gold progress bar on black. It waits for everything that would
// otherwise make the first seconds stutter: the pictures (textures), the museum font,
// each part of the museum being prepared for the graphics card, and one hidden drawing of
// the whole museum (Museum.tsx). Then it
// fades away and the title screen appears.

// If something never reports back, go on anyway: after this long (milliseconds) with no
// progress at all. Only time while the page is really drawing counts (a tab in the
// background, or a window out of sight, draws nothing, so nothing could progress), and any
// step forward starts the count again. (It used to give up after 30 s in any case: on slow
// computers and tablets the visit then began while the museum was still being prepared,
// and the automatic graphics choice ran during the visit, freezing it for many seconds.)
const GIVE_UP_AFTER = 20000

export default function LoadingScreen() {
  const { progress, active, total } = useLoadProgress() // pictures being downloaded (0-100)
  const parts = useMuseumStore((state) => state.partsPrepared)
  const warmedUp = useMuseumStore((state) => state.warmedUp)
  const qualityChosen = useMuseumStore((state) => state.qualityChosen)
  const endingPrepared = useMuseumStore((state) => state.endingPrepared)
  const worldReady = useMuseumStore((state) => state.worldReady)
  const setWorldReady = useMuseumStore((state) => state.setWorldReady)
  const fontsReady = useFontsReady()
  const [gone, setGone] = useState(false)

  // Pictures count for most of the bar, preparing the parts for the rest. The bar never
  // moves backwards (new downloads can briefly lower the picture percentage).
  const [shown, setShown] = useState(0)
  // (Before the first download has even started, total is 0: count that as nothing yet.)
  const textures = total === 0 ? 0 : active ? progress : 100
  // (The last steps, the warm-up drawing, the graphics measurement and preparing the ending
  // film's world, fill the last eighth.)
  const target = textures * 0.55 + Math.min(parts / PART_COUNT, 1) * 30 + (warmedUp ? 4 : 0) + (qualityChosen ? 5 : 0) + (endingPrepared ? 6 : 0)
  if (target > shown) setShown(target)
  const done = parts >= PART_COUNT && warmedUp && qualityChosen && endingPrepared && fontsReady && !active
  // Anything that moves the loading forward (the next picture, part or step).
  const step = `${Math.round(target)}|${fontsReady}|${active}`

  useEffect(() => {
    if (!done || worldReady) return
    // A short pause so the bar visibly reaches the end, and any rebuild after the quality
    // choice is finished behind the loading screen.
    const timer = setTimeout(setWorldReady, 600)
    return () => clearTimeout(timer)
  }, [done, worldReady, setWorldReady])

  // The give-up count: time spent drawing frames since the last step forward.
  useEffect(() => {
    if (worldReady) return
    let waited = 0
    let last = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      // (A long gap between frames means the page was not being drawn: not counted.)
      waited += Math.min(now - last, 100)
      last = now
      if (waited >= GIVE_UP_AFTER) setWorldReady()
      else frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [step, worldReady, setWorldReady])

  // After fading out, remove the screen completely.
  useEffect(() => {
    if (!worldReady) return
    const timer = setTimeout(() => setGone(true), 600)
    return () => clearTimeout(timer)
  }, [worldReady])

  if (gone) return null
  return (
    <div className={worldReady ? 'loading-screen loading-done' : 'loading-screen'} aria-busy={!worldReady}>
      <div className="loading-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(shown)}>
        <span style={{ width: `${worldReady ? 100 : shown}%` }} />
      </div>
    </div>
  )
}
