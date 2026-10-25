import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { useMuseumStore } from '../state/useMuseumStore'
import { PART_COUNT } from '../world/layout'
import { useFontsReady } from '../world/fonts'

// LOADING SCREEN: a single gold progress bar on black. It waits for everything that would
// otherwise make the first seconds stutter: the pictures (textures), the museum font,
// each part of the museum being prepared for the graphics card, and one hidden drawing of
// the whole museum (Museum.tsx). Then it
// fades away and the title screen appears.

// If something never reports back, go on anyway after this long (milliseconds).
const GIVE_UP_AFTER = 30000

export default function LoadingScreen() {
  const { progress, active, total } = useProgress() // pictures being downloaded (0-100)
  const parts = useMuseumStore((state) => state.partsPrepared)
  const warmedUp = useMuseumStore((state) => state.warmedUp)
  const worldReady = useMuseumStore((state) => state.worldReady)
  const setWorldReady = useMuseumStore((state) => state.setWorldReady)
  const fontsReady = useFontsReady()
  const [gone, setGone] = useState(false)

  // Pictures count for most of the bar, preparing the parts for the rest. The bar never
  // moves backwards (new downloads can briefly lower the picture percentage).
  const [shown, setShown] = useState(0)
  // (Before the first download has even started, total is 0: count that as nothing yet.)
  const textures = total === 0 ? 0 : active ? progress : 100
  const target = textures * 0.7 + Math.min(parts / PART_COUNT, 1) * 30
  if (target > shown) setShown(target)
  const done = parts >= PART_COUNT && warmedUp && fontsReady && !active

  useEffect(() => {
    if (!done || worldReady) return
    // A short pause so the bar visibly reaches the end and the first frames are drawn.
    const timer = setTimeout(setWorldReady, 350)
    return () => clearTimeout(timer)
  }, [done, worldReady, setWorldReady])

  useEffect(() => {
    const timer = setTimeout(setWorldReady, GIVE_UP_AFTER)
    return () => clearTimeout(timer)
  }, [setWorldReady])

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
