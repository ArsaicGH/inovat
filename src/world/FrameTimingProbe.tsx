import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { debugStats } from './debug-stats'
import { useMuseumStore } from '../state/useMuseumStore'

const QUALITY_NAMES = ['low (no ambient occlusion, fewer shadow redraws)', 'medium (no ambient occlusion)', 'full']

// DEVELOPMENT-ONLY diagnostic (never shown on the live site, so English is fine).
// The FPS counter only shows an average; jitter comes from frames that take UNEVEN
// time. This records every frame time and shows, every 2 seconds:
//   avg   = average frame time (and FPS)
//   p95   = 95% of frames were faster than this
//   max   = the slowest frame
//   uneven = share of frames that took 1.5x longer than usual (each one is a visible hitch)
// It also shows which graphics chip the browser uses and how many pixels are drawn.

const REPORT_EVERY_SECONDS = 2

// The graphics chip name, if the browser shares it (most desktop browsers do).
function gpuName(gl: WebGLRenderingContext | WebGL2RenderingContext): string {
  const info = gl.getExtension('WEBGL_debug_renderer_info')
  return info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : 'unknown'
}

export default function FrameTimingProbe() {
  const renderer = useThree((state) => state.gl)
  const times = useRef<number[]>([])
  const elapsed = useRef(0)
  const box = useRef<HTMLDivElement | null>(null)

  // A plain HTML box in the bottom-right corner, updated directly (no React re-render).
  useEffect(() => {
    const div = document.createElement('div')
    div.style.cssText =
      'position:fixed;right:8px;bottom:8px;padding:6px 10px;background:rgba(0,0,0,.7);' +
      'color:#7fd;font:12px/1.4 monospace;white-space:pre;pointer-events:none;z-index:10'
    div.textContent = 'frame timing: measuring...'
    document.body.appendChild(div)
    box.current = div
    return () => div.remove()
  }, [])

  useFrame((_, delta) => {
    times.current.push(delta * 1000)
    elapsed.current += delta
    if (elapsed.current < REPORT_EVERY_SECONDS || !box.current) return

    const sorted = [...times.current].sort((a, b) => a - b)
    const avg = sorted.reduce((sum, t) => sum + t, 0) / sorted.length
    const median = sorted[Math.floor(sorted.length / 2)]
    const p95 = sorted[Math.floor(sorted.length * 0.95)]
    const max = sorted[sorted.length - 1]
    const uneven = sorted.filter((t) => t > median * 1.5).length / sorted.length

    const canvas = renderer.domElement
    box.current.textContent =
      `avg ${avg.toFixed(1)} ms (${(1000 / avg).toFixed(0)} fps)\n` +
      `p95 ${p95.toFixed(1)} ms   max ${max.toFixed(1)} ms\n` +
      `uneven ${(uneven * 100).toFixed(1)}% of frames\n` +
      `keys held: ${[...debugStats.held].join(' ') || '-'}\n` +
      `key events (2 s): ${debugStats.keyDowns} pressed, ${debugStats.keyUps} released\n` +
      `mouse signals: ${Math.round(debugStats.mouseMoves / elapsed.current)} per second\n` +
      `key chatter ${debugStats.keyChatter} (fake key releases so far)\n` +
      `pixels ${canvas.width}x${canvas.height} (ratio ${renderer.getPixelRatio()})\n` +
      // The quality chosen during loading (Museum.tsx AdaptiveQuality).
      `quality: ${QUALITY_NAMES[useMuseumStore.getState().graphicsLevel]}\n` +
      // Shortened: the full name is very long and would cover the view on small windows.
      `gpu ${gpuName(renderer.getContext()).slice(0, 40)}`
    debugStats.keyDowns = 0
    debugStats.keyUps = 0
    debugStats.mouseMoves = 0
    times.current = []
    elapsed.current = 0
  })

  return null
}
