import { useEffect, useState } from 'react'
import { useLoadProgress } from './load-progress'
import { useMuseumStore } from '../state/useMuseumStore'
import { PART_COUNT } from '../world/layout'
import { useFontsReady } from '../world/fonts'
import { useContent } from '../content/use-content'

// LOADING SCREEN: a gold progress bar on black, with what is happening (in general terms) and
// how many megabytes have arrived under it, and two tips at the bottom. It waits for everything that would
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

// Megabytes downloaded so far of the files the loading screen waits for (their total is
// worked out when the site is built: vite.config.ts). Counted from the browser's own list of
// finished downloads; a file the browser already kept from an earlier visit counts too.
const STARTUP_PATHS = __STARTUP_FOLDERS__.map((folder) => `/${folder}/`)
function useDownloadedBytes() {
  const [bytes, setBytes] = useState(0)
  useEffect(() => {
    // (The browser keeps only 250 entries in that list by default.)
    performance.setResourceTimingBufferSize?.(2000)
    const counted = new Set<string>()
    let sum = 0
    const add = (entries: PerformanceEntryList) => {
      let changed = false
      for (const entry of entries as PerformanceResourceTiming[]) {
        const path = new URL(entry.name).pathname
        if (counted.has(path) || !STARTUP_PATHS.some((start) => path.startsWith(start))) continue
        counted.add(path)
        sum += entry.decodedBodySize || entry.encodedBodySize || entry.transferSize || 0
        changed = true
      }
      if (changed) setBytes(Math.min(sum, __STARTUP_BYTES__))
    }
    add(performance.getEntriesByType('resource'))
    const observer = new PerformanceObserver((list) => add(list.getEntries()))
    observer.observe({ type: 'resource', buffered: true })
    return () => observer.disconnect()
  }, [])
  return bytes
}

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
  const { ui, language } = useContent()
  const text = ui.loading
  const bytes = useDownloadedBytes()

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
  // What is happening now, in the order the loading goes through it. Like the bar, it only
  // moves forward (the closing film fetches a few last files after the graphics measurement).
  const rawStage =
    done || worldReady ? 5 : qualityChosen ? 4 : warmedUp ? 3 : parts >= PART_COUNT ? 2 : parts > 0 ? 1 : 0
  const [stage, setStage] = useState(0)
  if (rawStage > stage) setStage(rawStage)
  const megabytes = (n: number) => {
    const value = (n / 1048576).toFixed(1)
    return language === 'vi' ? value.replace('.', ',') : value
  }
  // (Once the rooms are prepared, every file is in: the count shows the whole, as some files
  // may have been counted short. It never goes down.)
  const [loadedBytes, setLoadedBytes] = useState(0)
  const nowBytes = stage >= 2 ? __STARTUP_BYTES__ : bytes
  if (nowBytes > loadedBytes) setLoadedBytes(nowBytes)

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
      {/* The download count; once everything is in (the museum is then still being prepared
          for the graphics card), a short gold "preparing". */}
      {loadedBytes < __STARTUP_BYTES__ ? (
        <p className="loading-bytes">{text.downloaded.replace('{loaded}', megabytes(loadedBytes)).replace('{total}', megabytes(__STARTUP_BYTES__))}</p>
      ) : (
        <p className="loading-preparing">
          {text.preparing}
          <span aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </p>
      )}
      <div className="loading-tips">
        <p className="loading-tips-list">
          {text.tips.map((tip, i) => (
            <span key={tip}>
              {i > 0 && <i aria-hidden="true">◆</i>}
              {tip}
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}
