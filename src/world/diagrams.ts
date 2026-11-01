// DIAGRAMS drawn by the museum itself (no file to download): explanations that a photo cannot
// give, painted with the museum's font in the colours of the board they are on. The same
// painter fills the 3D boards (PanelBoard.tsx) and the enlarged boards (InfoPanel.tsx).
// Their labels are content (content/pictures.ts), in both languages.
//   eras   = the four revolutions on one time line (intro hall's route board)
//   iiot   = sensors on machines -> network -> data analysis -> maintenance in time
//   neural = an artificial neural network: input, hidden layers, output
//   twin   = a real machine and its digital twin, linked both ways

export type DiagramId = 'eras' | 'iiot' | 'neural' | 'twin'

// Width / height of each diagram.
export const DIAGRAM_ASPECT: Record<DiagramId, number> = { eras: 2.3, iiot: 2.1, neural: 1.9, twin: 2.1 }

export interface DiagramColours {
  ink: string // labels and outlines
  accent: string // highlighted parts
  muted: string // connecting lines, secondary parts
}

// Darker era colours, readable on cream paper (the walls' era numbers are lighter).
const ERA_INK = ['#b5763a', '#b8892a', '#3f9a5c', '#2a9fb0']

// Splits text into lines no wider than maxWidth (in the current font).
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

// Centred, wrapped label; returns the y below it.
function label(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, maxWidth: number, size: number, weight: number, colour: string, font: string): number {
  ctx.font = `${weight} ${size}px ${font}`
  ctx.fillStyle = colour
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  for (const line of wrap(ctx, text, maxWidth)) {
    ctx.fillText(line, cx, y)
    y += size * 1.22
  }
  return y
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, head: number) {
  const angle = Math.atan2(y2 - y1, x2 - x1)
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - head * Math.cos(angle - 0.45), y2 - head * Math.sin(angle - 0.45))
  ctx.lineTo(x2 - head * Math.cos(angle + 0.45), y2 - head * Math.sin(angle + 0.45))
  ctx.closePath()
  ctx.fill()
}

// ---- Small icons, each drawn in a square of side s centred on (cx, cy) ----

function gear(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  const r = s * 0.3
  ctx.beginPath()
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    const rr = i % 2 === 0 ? r * 1.32 : r
    const a2 = a + Math.PI / 16
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)
    ctx.lineTo(cx + Math.cos(a2) * rr, cy + Math.sin(a2) * rr)
  }
  ctx.closePath()
  ctx.fill()
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function bulb(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.beginPath()
  ctx.arc(cx, cy - s * 0.08, s * 0.26, Math.PI * 0.8, Math.PI * 2.2)
  ctx.lineTo(cx + s * 0.11, cy + s * 0.24)
  ctx.lineTo(cx - s * 0.11, cy + s * 0.24)
  ctx.closePath()
  ctx.stroke()
  ctx.fillRect(cx - s * 0.12, cy + s * 0.27, s * 0.24, s * 0.06)
  ctx.fillRect(cx - s * 0.09, cy + s * 0.35, s * 0.18, s * 0.06)
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.08, cy + s * 0.2)
  ctx.lineTo(cx - s * 0.06, cy - s * 0.06)
  ctx.lineTo(cx, cy + s * 0.02)
  ctx.lineTo(cx + s * 0.06, cy - s * 0.06)
  ctx.lineTo(cx + s * 0.08, cy + s * 0.2)
  ctx.stroke()
}

function chip(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  const r = s * 0.24
  ctx.strokeRect(cx - r, cy - r, r * 2, r * 2)
  ctx.fillRect(cx - r * 0.45, cy - r * 0.45, r * 0.9, r * 0.9)
  for (let i = -2; i <= 2; i++) {
    const o = i * r * 0.4
    for (const [x1, y1, x2, y2] of [
      [cx + o, cy - r, cx + o, cy - r * 1.4],
      [cx + o, cy + r, cx + o, cy + r * 1.4],
      [cx - r, cy + o, cx - r * 1.4, cy + o],
      [cx + r, cy + o, cx + r * 1.4, cy + o],
    ]) {
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
  }
}

function network(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  const nodes: [number, number][] = [
    [0, 0],
    [-0.3, -0.22],
    [0.3, -0.24],
    [-0.28, 0.26],
    [0.3, 0.24],
    [0, -0.4],
  ]
  ctx.beginPath()
  for (const [x, y] of nodes.slice(1)) {
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + x * s, cy + y * s)
  }
  ctx.moveTo(cx - 0.3 * s, cy - 0.22 * s)
  ctx.lineTo(cx, cy - 0.4 * s)
  ctx.lineTo(cx + 0.3 * s, cy - 0.24 * s)
  ctx.stroke()
  for (const [x, y] of nodes) {
    ctx.beginPath()
    ctx.arc(cx + x * s, cy + y * s, s * (x === 0 && y === 0 ? 0.09 : 0.06), 0, Math.PI * 2)
    ctx.fill()
  }
}

// A machine (body, a turning wheel) with sensors sending out waves.
function machine(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, accent: string) {
  ctx.strokeRect(cx - s * 0.38, cy - s * 0.12, s * 0.76, s * 0.4)
  ctx.beginPath()
  ctx.arc(cx - s * 0.12, cy + s * 0.08, s * 0.13, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillRect(cx + s * 0.08, cy - s * 0.02, s * 0.2, s * 0.06)
  ctx.fillRect(cx + s * 0.08, cy + s * 0.1, s * 0.2, s * 0.06)
  ctx.save()
  ctx.fillStyle = accent
  ctx.strokeStyle = accent
  for (const x of [-0.26, 0, 0.26]) {
    ctx.beginPath()
    ctx.arc(cx + x * s, cy - s * 0.12, s * 0.035, 0, Math.PI * 2)
    ctx.fill()
    for (const r of [0.08, 0.14]) {
      ctx.beginPath()
      ctx.arc(cx + x * s, cy - s * 0.12, s * r, Math.PI * 1.2, Math.PI * 1.8)
      ctx.stroke()
    }
  }
  ctx.restore()
}

function cloud(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.beginPath()
  ctx.arc(cx - s * 0.17, cy + s * 0.04, s * 0.15, Math.PI * 0.5, Math.PI * 1.5)
  ctx.arc(cx - s * 0.02, cy - s * 0.1, s * 0.19, Math.PI * 1.05, Math.PI * 1.85)
  ctx.arc(cx + s * 0.19, cy + s * 0.02, s * 0.15, Math.PI * 1.4, Math.PI * 0.5)
  ctx.closePath()
  ctx.stroke()
  network(ctx, cx, cy + s * 0.05, s * 0.32)
}

// A line chart creeping up to a warning line: the fault is seen coming.
function chart(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, accent: string) {
  const l = cx - s * 0.36
  const r = cx + s * 0.36
  const t = cy - s * 0.3
  const b = cy + s * 0.3
  ctx.beginPath()
  ctx.moveTo(l, t)
  ctx.lineTo(l, b)
  ctx.lineTo(r, b)
  ctx.stroke()
  ctx.save()
  ctx.setLineDash([s * 0.04, s * 0.03])
  ctx.strokeStyle = accent
  ctx.beginPath()
  ctx.moveTo(l, t + s * 0.14)
  ctx.lineTo(r, t + s * 0.14)
  ctx.stroke()
  ctx.restore()
  const points = [0.05, 0.08, 0.06, 0.11, 0.1, 0.17, 0.27, 0.42]
  ctx.beginPath()
  points.forEach((p, i) => {
    const x = l + s * 0.04 + (i / (points.length - 1)) * (r - l - s * 0.08)
    const y = b - s * 0.04 - p * (b - t - s * 0.06)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()
  // Warning triangle where the line nears the limit.
  ctx.save()
  ctx.fillStyle = accent
  const wx = r - s * 0.06
  const wy = t - s * 0.02
  ctx.beginPath()
  ctx.moveTo(wx, wy - s * 0.1)
  ctx.lineTo(wx + s * 0.1, wy + s * 0.07)
  ctx.lineTo(wx - s * 0.1, wy + s * 0.07)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function wrench(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(-Math.PI / 4)
  ctx.fillRect(-s * 0.05, -s * 0.08, s * 0.1, s * 0.42)
  ctx.beginPath()
  ctx.arc(0, -s * 0.2, s * 0.14, Math.PI * 0.32, Math.PI * 2.68)
  ctx.lineTo(s * 0.04, -s * 0.3)
  ctx.lineTo(-s * 0.04, -s * 0.3)
  ctx.closePath()
  ctx.lineWidth = s * 0.07
  ctx.stroke()
  ctx.restore()
}

// A robot arm: base, two segments and a gripper. dashed = drawn as the virtual copy.
function robotArm(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, dashed: boolean) {
  const joints: [number, number][] = [
    [cx - s * 0.18, cy + s * 0.3],
    [cx - s * 0.18, cy - s * 0.02],
    [cx + s * 0.18, cy - s * 0.24],
    [cx + s * 0.3, cy + s * 0.02],
  ]
  ctx.save()
  if (dashed) ctx.setLineDash([s * 0.035, s * 0.025])
  ctx.lineCap = 'round'
  ctx.strokeRect(cx - s * 0.34, cy + s * 0.3, s * 0.34, s * 0.08)
  ctx.lineWidth *= 2.2
  ctx.beginPath()
  joints.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
  ctx.stroke()
  ctx.lineWidth /= 2.2
  for (const [x, y] of joints.slice(0, 3)) {
    ctx.beginPath()
    ctx.arc(x, y, s * 0.05, 0, Math.PI * 2)
    if (dashed) ctx.stroke()
    else ctx.fill()
  }
  const [gx, gy] = joints[3]
  ctx.beginPath()
  ctx.moveTo(gx - s * 0.07, gy + s * 0.1)
  ctx.lineTo(gx - s * 0.07, gy)
  ctx.lineTo(gx + s * 0.07, gy)
  ctx.lineTo(gx + s * 0.07, gy + s * 0.1)
  ctx.stroke()
  ctx.restore()
}

// ---- The diagrams ----

export function paintDiagram(
  ctx: CanvasRenderingContext2D,
  id: DiagramId,
  x: number,
  y: number,
  w: number,
  h: number,
  labels: readonly string[],
  font: string,
  colours: DiagramColours,
) {
  ctx.save()
  ctx.translate(x, y)
  const line = Math.max(1, h * 0.012)
  ctx.lineWidth = line
  ctx.strokeStyle = colours.ink
  ctx.fillStyle = colours.ink
  const text = h * 0.068

  if (id === 'eras') {
    // A time line with the four revolutions, each with its icon, period and theme.
    const axis = h * 0.36
    ctx.strokeStyle = colours.muted
    ctx.fillStyle = colours.muted
    ctx.lineWidth = line * 1.4
    arrow(ctx, w * 0.02, axis, w * 0.99, axis, h * 0.05)
    const icons = [gear, bulb, chip, network]
    for (let i = 0; i < 4; i++) {
      const cx = w * (0.125 + i * 0.25)
      ctx.fillStyle = ERA_INK[i]
      ctx.strokeStyle = ERA_INK[i]
      ctx.lineWidth = line
      icons[i](ctx, cx, h * 0.13, h * 0.24)
      ctx.beginPath()
      ctx.arc(cx, axis, h * 0.075, 0, Math.PI * 2)
      ctx.fill()
      label(ctx, ['I', 'II', 'III', 'IV'][i], cx, axis - text * 0.62, w, text * 1.1, 700, '#fffaf0', font)
      let below = label(ctx, labels[i * 3] ?? '', cx, axis + h * 0.11, w * 0.23, text * 1.05, 700, ERA_INK[i], font)
      below = label(ctx, labels[i * 3 + 1] ?? '', cx, below + text * 0.15, w * 0.23, text * 0.85, 500, colours.muted, font)
      label(ctx, labels[i * 3 + 2] ?? '', cx, below + text * 0.25, w * 0.23, text * 0.9, 600, colours.ink, font)
    }
  } else if (id === 'iiot') {
    // Four steps from sensor to repair, joined by arrows.
    const s = Math.min(w * 0.17, h * 0.52)
    const cy = h * 0.32
    const steps = [0.12, 0.373, 0.627, 0.88].map((f) => w * f)
    machine(ctx, steps[0], cy, s, colours.accent)
    cloud(ctx, steps[1], cy, s)
    chart(ctx, steps[2], cy, s, colours.accent)
    wrench(ctx, steps[3], cy, s)
    ctx.strokeStyle = colours.muted
    ctx.fillStyle = colours.muted
    for (let i = 0; i < 3; i++) arrow(ctx, steps[i] + s * 0.5, cy, steps[i + 1] - s * 0.5, cy, h * 0.045)
    steps.forEach((cx, i) => label(ctx, labels[i] ?? '', cx, cy + s * 0.55, w * 0.23, text, 600, colours.ink, font))
  } else if (id === 'neural') {
    // Layers of connected nodes; data flows from left to right.
    const layers = [3, 5, 5, 2]
    const xs = [0.2, 0.4, 0.6, 0.8].map((f) => w * f)
    const top = h * 0.08
    const bottom = h * 0.68
    const nodeY = (count: number, i: number) => top + ((i + 0.5) / count) * (bottom - top)
    ctx.strokeStyle = colours.muted
    ctx.globalAlpha = 0.55
    for (let l = 0; l < layers.length - 1; l++)
      for (let a = 0; a < layers[l]; a++)
        for (let b = 0; b < layers[l + 1]; b++) {
          ctx.beginPath()
          ctx.moveTo(xs[l], nodeY(layers[l], a))
          ctx.lineTo(xs[l + 1], nodeY(layers[l + 1], b))
          ctx.stroke()
        }
    ctx.globalAlpha = 1
    ctx.fillStyle = colours.muted
    for (let a = 0; a < layers[0]; a++) arrow(ctx, w * 0.06, nodeY(3, a), xs[0] - h * 0.07, nodeY(3, a), h * 0.035)
    for (let b = 0; b < layers[3]; b++) arrow(ctx, xs[3] + h * 0.07, nodeY(2, b), w * 0.94, nodeY(2, b), h * 0.035)
    layers.forEach((count, l) => {
      for (let i = 0; i < count; i++) {
        ctx.beginPath()
        ctx.arc(xs[l], nodeY(count, i), h * 0.042, 0, Math.PI * 2)
        ctx.fillStyle = l === 0 || l === 3 ? colours.accent : colours.ink
        ctx.fill()
      }
    })
    label(ctx, labels[0] ?? '', xs[0], bottom + h * 0.06, w * 0.24, text, 600, colours.ink, font)
    label(ctx, labels[1] ?? '', w * 0.5, bottom + h * 0.06, w * 0.3, text, 600, colours.ink, font)
    label(ctx, labels[2] ?? '', xs[3], bottom + h * 0.06, w * 0.24, text, 600, colours.ink, font)
  } else if (id === 'twin') {
    // The real machine and its virtual copy, with data going one way and tests the other.
    const s = Math.min(w * 0.3, h * 0.62)
    const cy = h * 0.4
    const left = w * 0.2
    const right = w * 0.8
    robotArm(ctx, left, cy, s, false)
    ctx.strokeStyle = colours.accent
    ctx.fillStyle = colours.accent
    // A faint grid behind the virtual copy: it lives in the computer.
    ctx.save()
    ctx.globalAlpha = 0.35
    for (let gx = -2; gx <= 2; gx++)
      for (let gy = -2; gy <= 2; gy++) {
        ctx.beginPath()
        ctx.arc(right + gx * s * 0.17, cy + gy * s * 0.17, line * 0.9, 0, Math.PI * 2)
        ctx.fill()
      }
    ctx.restore()
    robotArm(ctx, right, cy, s, true)
    ctx.strokeStyle = colours.muted
    ctx.fillStyle = colours.muted
    ctx.lineWidth = line * 1.2
    // Upper arc: live data from the machine to the twin; lower arc: tested changes back.
    for (const [from, to, yArc, text0] of [
      [left + s * 0.42, right - s * 0.42, cy - s * 0.42, labels[2]],
      [right - s * 0.42, left + s * 0.42, cy + s * 0.5, labels[3]],
    ] as [number, number, number, string][]) {
      ctx.beginPath()
      ctx.moveTo(from, cy + (yArc < cy ? -s * 0.15 : s * 0.2))
      ctx.quadraticCurveTo(w * 0.5, yArc + (yArc < cy ? -s * 0.08 : s * 0.08), to, cy + (yArc < cy ? -s * 0.15 : s * 0.2))
      ctx.stroke()
      const endY = cy + (yArc < cy ? -s * 0.15 : s * 0.2)
      arrow(ctx, to + (from < to ? -1 : 1) * h * 0.02, endY + (yArc < cy ? -h * 0.02 : h * 0.02), to, endY, h * 0.04)
      label(ctx, text0 ?? '', w * 0.5, yArc < cy ? yArc - s * 0.05 - text * 1.1 : yArc + s * 0.06, w * 0.34, text * 0.9, 600, colours.muted, font)
    }
    label(ctx, labels[0] ?? '', left, cy + s * 0.5 + text * 0.2, w * 0.3, text, 700, colours.ink, font)
    label(ctx, labels[1] ?? '', right, cy + s * 0.5 + text * 0.2, w * 0.3, text, 700, colours.accent, font)
  }
  ctx.restore()
}
