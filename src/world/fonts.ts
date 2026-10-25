import { useEffect, useState } from 'react'

// The museum font (declared in index.css, files in /public/fonts). Text painted onto 3D
// boards and signs uses it too, so it looks the same on every computer.
export const MUSEUM_FONT = "'Be Vietnam Pro', system-ui, 'Segoe UI', sans-serif"
const SYSTEM_FONT = "system-ui, 'Segoe UI', sans-serif"

// Font to paint with: the system font until the museum font has loaded.
export function paintFont(fontsReady: boolean): string {
  return fontsReady ? MUSEUM_FONT : SYSTEM_FONT
}

// Fonts load in the background; painting text before they arrive would use a fallback
// font. So we ask the browser to load all weights once, and boards repaint when ready.
const fontsLoaded: Promise<void> = Promise.all(
  [400, 500, 600, 700].map((weight) => document.fonts.load(`${weight} 32px 'Be Vietnam Pro'`)),
).then(
  () => undefined,
  () => undefined, // if loading fails, the fallback font is still readable
)

export function useFontsReady(): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    fontsLoaded.then(() => {
      if (alive) setReady(true)
    })
    return () => {
      alive = false
    }
  }, [])
  return ready
}

// Write `text` inside `maxWidth`, breaking lines between words. Returns the y below the
// last line, or -1 if the text did not fit above `maxY` (the rest is left out).
export function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxY: number,
): number {
  let line = ''
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      if (y + lineHeight > maxY) return -1
      ctx.fillText(line, x, y)
      y += lineHeight
      line = word
    } else {
      line = test
    }
  }
  if (line) {
    if (y + lineHeight > maxY) return -1
    ctx.fillText(line, x, y)
    y += lineHeight
  }
  return y
}
