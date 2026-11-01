import { useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { AdditiveBlending, BufferGeometry, CanvasTexture, Float32BufferAttribute, MeshBasicMaterial, SRGBColorSpace, type Group, type Texture } from 'three'
import { useContent } from '../content/use-content'
import { PICTURES, WALL_GALLERY, type Picture } from '../content/pictures'
import type { Language } from '../content/language'
import { useMuseumStore } from '../state/useMuseumStore'
import { addAimTarget, removeAimTarget } from './aim-targets'
import { paintFont, useFontsReady } from './fonts'
import { ANTE_DEPTH, ANTE_WIDTH, INNER_DOOR, WALL_THICKNESS, roomById, toWorld } from './layout'
import { usePicture } from './picture-images'
import { paintDiagram, type DiagramColours } from './diagrams'
import { BOARD_THEMES, GOLD } from './style'
import MergeStatic from './MergeStatic'

// THE WALL GALLERIES: historical pictures and the museum's own diagrams (content/pictures.ts,
// WALL_GALLERY) on the walls of each era room. Like an exhibit, each can be aimed at and
// opened (E) to see it large with its caption and credit (InfoPanel.tsx).
// - In the hall: one large picture in the middle of each side wall, between the two corner
//   exhibits (it is seen behind them), and two on each side of the doorway back to the
//   entrance room.
// - In the entrance room, the first stage of each era (the era as a whole, before its
//   inventions): a picture on each side of the doorway into the hall, a timeline of the
//   room's inventions on the left wall and a diagram of what the era changed on the right.
// Frames follow the era: gilt (CMCN 1), black lacquer (CMCN 2), brushed aluminium
// (CMCN 3) and glowing glass edges (CMCN 4). In CMCN 1 and 2 a brass picture lamp hangs
// over each one, like in an old gallery (its glow is the picture's own slight light).

type EraRoom = 'ir1' | 'ir2' | 'ir3' | 'ir4'

const FRAMES: Record<EraRoom, { colour: string; border: number; depth: number; metalness: number; roughness: number }> = {
  ir1: { colour: '#b8893d', border: 0.09, depth: 0.07, metalness: 0.85, roughness: 0.35 },
  ir2: { colour: '#1d1b19', border: 0.06, depth: 0.05, metalness: 0.2, roughness: 0.4 },
  ir3: { colour: '#b9bec4', border: 0.035, depth: 0.04, metalness: 0.8, roughness: 0.35 },
  ir4: { colour: '#3fd0e0', border: 0.012, depth: 0.02, metalness: 0, roughness: 0.3 },
}

// How much the picture lights itself, so it reads in the dim rooms (CMCN 1, the darkest
// room, a little more: under its picture lamps).
const PICTURE_GLOW: Record<EraRoom, number> = { ir1: 0.55, ir2: 0.45, ir3: 0.42, ir4: 0.42 }

const TEXTURE_MAX = 640 // pixels: sharp enough on the wall (the enlarged view shows the full file)
const DIAGRAM_WIDTH = 1280 // pixels across a wall diagram (about 4.4 m wide: readable up close)
const PLAQUE = [0.72, 0.18] as const

// The picture, made smaller for the graphics card (it is seen from a few metres away).
function useWallTexture(file: string | undefined): Texture | null {
  const gl = useThree((state) => state.gl)
  const image = usePicture(file)
  const texture = useMemo(() => {
    if (!image) return null
    const scale = Math.min(1, TEXTURE_MAX / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(image.width * scale)
    canvas.height = Math.round(image.height * scale)
    const ctx = canvas.getContext('2d')
    if (ctx) {
      // (White behind the picture: a drawing with a see-through background would show black.)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    }
    const tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    tex.anisotropy = 4 // stays sharp when seen along the wall
    return tex
  }, [image])
  // (Sent to the graphics card as soon as it is made, not when its room is first seen.)
  useEffect(() => {
    if (!texture) return
    gl.initTexture(texture)
    return () => texture.dispose()
  }, [gl, texture])
  return texture
}

// The background of a wall diagram and of a caption plaque: the room's board paper (CMCN 4's
// see-through glass becomes a solid dark glass on the wall).
const wallPaper = (room: EraRoom) => (room === 'ir4' ? '#061f2a' : BOARD_THEMES[room].paper)

// The wall diagrams of CMCN 1 and 2 are dark with light letters, like CMCN 3's and 4's: a
// bright cream panel looked like a projector screen on the dark brick and navy walls
// (leader). CMCN 1: brass letters on dark oak; CMCN 2: cream letters on navy enamel, like an
// old enamel sign. (Their enlarged view keeps the boards' cream paper.)
const WALL_DIAGRAM: Partial<Record<EraRoom, Required<DiagramColours>>> = {
  ir1: { paper: '#2a1c12', ink: '#ead6ad', accent: '#e2ac5e', muted: '#b8935f' },
  ir2: { paper: '#17223b', ink: '#efe5d0', accent: '#f0b663', muted: '#9fb1cf' },
}

// A museum diagram painted in the room's board colours (painted again with the font, or in
// the other language).
function useDiagramTexture(picture: Picture | undefined, room: EraRoom, language: Language): Texture | null {
  const gl = useThree((state) => state.gl)
  const fontsReady = useFontsReady()
  const texture = useMemo(() => {
    if (!picture?.diagram) return null
    const theme = BOARD_THEMES[room]
    const canvas = document.createElement('canvas')
    canvas.width = DIAGRAM_WIDTH
    canvas.height = Math.round(DIAGRAM_WIDTH / picture.aspect)
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const accent = theme.look === 'screen' || theme.look === 'hologram' ? theme.title : theme.rule
      const colours = WALL_DIAGRAM[room] ?? { paper: wallPaper(room), ink: theme.ink, accent, muted: theme.muted }
      ctx.fillStyle = colours.paper
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const pad = canvas.height * 0.06
      paintDiagram(ctx, picture.diagram, pad, pad, canvas.width - pad * 2, canvas.height - pad * 2, picture.labels?.[language] ?? [], paintFont(fontsReady), colours, picture.era)
    }
    const tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    tex.anisotropy = 4
    return tex
  }, [picture, room, language, fontsReady])
  useEffect(() => {
    if (!texture) return
    gl.initTexture(texture)
    return () => texture.dispose()
  }, [gl, texture])
  return texture
}

// The caption plaque, in the room's board colours.
function usePlaqueTexture(caption: string, room: EraRoom): Texture {
  const gl = useThree((state) => state.gl)
  const fontsReady = useFontsReady()
  const texture = useMemo(() => {
    const theme = BOARD_THEMES[room]
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = wallPaper(room)
      ctx.fillRect(0, 0, 512, 128)
      ctx.strokeStyle = theme.rule
      ctx.lineWidth = 4
      ctx.strokeRect(6, 6, 500, 116)
      ctx.fillStyle = room === 'ir4' ? theme.ink : theme.title
      ctx.font = `600 25px ${paintFont(fontsReady)}`
      ctx.textBaseline = 'top'
      ctx.textAlign = 'left'
      // Up to three lines, ending with "…" if longer (the enlarged view has the whole caption).
      const lines: string[] = []
      for (const word of caption.split(' ')) {
        const last = lines.length - 1
        if (last >= 0 && ctx.measureText(`${lines[last]} ${word}`).width <= 468) lines[last] += ` ${word}`
        else lines.push(word)
      }
      if (lines.length > 3) {
        lines.length = 3
        while (ctx.measureText(`${lines[2]}…`).width > 468) lines[2] = lines[2].slice(0, lines[2].lastIndexOf(' '))
        lines[2] += '…'
      }
      const top = 64 - (lines.length * 31) / 2 + 2
      lines.forEach((line, i) => ctx.fillText(line, 22, top + i * 31))
    }
    const tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    return tex
  }, [caption, room, fontsReady])
  useEffect(() => {
    gl.initTexture(texture)
    return () => texture.dispose()
  }, [gl, texture])
  return texture
}

// One place on a wall: position in the room (x across, z towards the entrance), the turn
// that faces it into the room, the height of its centre and the largest size it may take.
interface Hanging {
  id: string
  x: number
  z: number
  yaw: number
  y: number
  maxW: number
  maxH: number
}

// As large as the space allows, keeping the picture's shape.
function fit(picture: Picture, maxW: number, maxH: number): [number, number] {
  const w = picture.aspect >= maxW / maxH ? maxW : maxH * picture.aspect
  return [w, w / picture.aspect]
}

function WallPicture({ room, hanging }: { room: EraRoom; hanging: Hanging }) {
  const { language } = useContent()
  const { id } = hanging
  const picture = PICTURES[id]
  const group = useRef<Group>(null)
  const aimed = useMuseumStore((state) => state.aimedExhibitId === id)
  const photo = useWallTexture(picture?.file)
  const diagram = useDiagramTexture(picture, room, language)
  const plaque = usePlaqueTexture(picture?.file ? picture.caption[language] : '', room)
  const image = photo ?? diagram

  useEffect(() => {
    const target = group.current
    if (!target) return
    addAimTarget(target)
    return () => removeAimTarget(target)
  }, [])

  if (!picture) return null
  const [w, h] = fit(picture, hanging.maxW, hanging.maxH)
  const frame = FRAMES[room]
  const glass = room === 'ir4'
  return (
    // (Left out of the merging around it: its frame lights up when aimed at.)
    <group ref={group} position={[hanging.x, 0, hanging.z]} rotation={[0, hanging.yaw, 0]} userData={{ exhibitId: id, keepSeparate: true }}>
      <group position={[0, hanging.y, frame.depth / 2]}>
        {/* The frame (a box behind the picture); it glows faintly while aimed at. */}
        <mesh>
          <boxGeometry args={[w + frame.border * 2, h + frame.border * 2, frame.depth]} />
          {glass ? (
            <meshStandardMaterial color="#04161d" emissive={frame.colour} emissiveIntensity={aimed ? 0.5 : 0.18} roughness={0.3} />
          ) : (
            <meshStandardMaterial color={frame.colour} metalness={frame.metalness} roughness={frame.roughness} emissive={frame.colour} emissiveIntensity={aimed ? 0.35 : 0} />
          )}
        </mesh>
        {/* The picture, 3 mm in front of the frame; slightly self-lit, like the text boards,
            so it reads in the dim rooms. (The glass of CMCN 4 is a lit screen.) */}
        <mesh position={[0, 0, frame.depth / 2 + 0.003]}>
          <planeGeometry args={[w, h]} />
          {image ? (
            glass ? (
              <meshBasicMaterial map={image} color={picture.diagram ? '#ffffff' : '#d8f4f8'} />
            ) : (
              <meshStandardMaterial map={image} roughness={0.75} emissive="#ffffff" emissiveMap={image} emissiveIntensity={PICTURE_GLOW[room]} />
            )
          ) : (
            <meshStandardMaterial color="#2a2622" roughness={0.9} />
          )}
        </mesh>
        {/* CMCN 4: thin glowing edges, top and bottom. */}
        {glass &&
          [-1, 1].map((s) => (
            <mesh key={s} position={[0, (s * (h + frame.border * 2)) / 2, frame.depth / 2]}>
              <boxGeometry args={[w + frame.border * 2, 0.012, 0.012]} />
              <meshStandardMaterial color={frame.colour} emissive={frame.colour} emissiveIntensity={aimed ? 2.6 : 1.4} toneMapped={false} />
            </mesh>
          ))}
        {/* The caption plaque under a picture (a diagram carries its own title). */}
        {picture.file && (
          <mesh position={[0, -h / 2 - frame.border - 0.06 - PLAQUE[1] / 2, frame.depth / 2 - 0.01]}>
            <planeGeometry args={PLAQUE as unknown as [number, number]} />
            <meshStandardMaterial map={plaque} roughness={0.7} emissive="#ffffff" emissiveMap={plaque} emissiveIntensity={0.3} />
          </mesh>
        )}
      </group>
    </group>
  )
}

// A brass picture lamp over a frame (CMCN 1 and 2): a wall plate, an arm reaching out and a
// bar with a warm glowing slot underneath. Never changes, so it is merged with the others.
const BRASS = <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
function PictureLamp({ room, hanging }: { room: EraRoom; hanging: Hanging }) {
  const picture = PICTURES[hanging.id]
  if (!picture) return null
  const [w, h] = fit(picture, hanging.maxW, hanging.maxH)
  const top = hanging.y + h / 2 + FRAMES[room].border
  const length = Math.min(w * 0.6, 0.9)
  const y = top + 0.14
  return (
    <group position={[hanging.x, 0, hanging.z]} rotation={[0, hanging.yaw, 0]}>
      <mesh position={[0, y, 0.012]}>
        <boxGeometry args={[0.1, 0.07, 0.024]} />
        {BRASS}
      </mesh>
      <mesh position={[0, y + 0.02, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.009, 0.009, 0.22, 6]} />
        {BRASS}
      </mesh>
      <mesh position={[0, y, 0.23]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.026, 0.026, length, 12]} />
        {BRASS}
      </mesh>
      <mesh position={[0, y - 0.024, 0.23]}>
        <boxGeometry args={[length * 0.94, 0.006, 0.024]} />
        <meshStandardMaterial color="#ffd9a0" emissive="#ffd9a0" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
    </group>
  )
}

// THE ERA NUMBER on the hall's back wall (RoomDecor.tsx), at the height its spotlight aims
// at (spot-plan.ts), smaller than it was so that four pictures fit around it.
export const ERA_NUMBER_SCALE = 0.66
export const eraNumberY = (roomHeight: number) => roomHeight / 2 + 0.2
const ERA_WALL_X = 2.7 // the middle of each column of pictures beside the number

// A SOFT BACKLIGHT behind every picture: a dim glow on the wall around its frame, like a
// hidden light strip behind a floating frame, so it stands out from the coloured wall. One
// shared fading texture, added onto the wall (it only brightens); the glows are merged into
// one mesh per room. The edge keeps the same width whatever the picture's size: the texture
// is stretched only across its middle ("nine-slice").
const BACKLIGHT: Record<EraRoom, { colour: string; strength: number }> = {
  ir1: { colour: '#ffae6a', strength: 0.32 },
  ir2: { colour: '#ffdcae', strength: 0.26 },
  ir3: { colour: '#9fe8c8', strength: 0.24 },
  ir4: { colour: '#7fe9ff', strength: 0.28 },
}
const GLOW_MARGIN = 0.32 // metres of glow beyond the frame
const GLOW_EDGE = 0.25 // the share of the texture on each side that holds the fading edge
let glowTexture: CanvasTexture | null = null
function backlightTexture(): CanvasTexture {
  if (glowTexture) return glowTexture
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    // A white rectangle filling the middle, blurred outwards into the edges.
    ctx.shadowColor = '#ffffff'
    ctx.shadowBlur = 22
    ctx.fillStyle = '#ffffff'
    const inset = 128 * GLOW_EDGE
    ctx.fillRect(inset, inset, 128 - inset * 2, 128 - inset * 2)
  }
  glowTexture = new CanvasTexture(canvas)
  return glowTexture
}
const glowMaterials = new Map<EraRoom, MeshBasicMaterial>()
function backlightMaterial(room: EraRoom): MeshBasicMaterial {
  let material = glowMaterials.get(room)
  if (!material) {
    material = new MeshBasicMaterial({ map: backlightTexture(), color: BACKLIGHT[room].colour, transparent: true, opacity: BACKLIGHT[room].strength, blending: AdditiveBlending, depthWrite: false })
    glowMaterials.set(room, material)
  }
  return material
}
// A flat glow of w x h (the frame) plus the margin: 4 x 4 corners, the middle stretched.
function backlightGeometry(w: number, h: number): BufferGeometry {
  const xs = [-w / 2 - GLOW_MARGIN, -w / 2, w / 2, w / 2 + GLOW_MARGIN]
  const ys = [-h / 2 - GLOW_MARGIN, -h / 2, h / 2, h / 2 + GLOW_MARGIN]
  const uv = [0, GLOW_EDGE, 1 - GLOW_EDGE, 1]
  const position: number[] = []
  const normal: number[] = []
  const uvs: number[] = []
  for (let j = 0; j < 4; j++)
    for (let i = 0; i < 4; i++) {
      position.push(xs[i], ys[j], 0)
      normal.push(0, 0, 1)
      uvs.push(uv[i], uv[j])
    }
  const index: number[] = []
  for (let j = 0; j < 3; j++)
    for (let i = 0; i < 3; i++) {
      const a = j * 4 + i
      index.push(a, a + 1, a + 5, a, a + 5, a + 4)
    }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(normal, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(index)
  return geometry
}
function Backlight({ room, hanging }: { room: EraRoom; hanging: Hanging }) {
  const picture = PICTURES[hanging.id]
  const [w, h] = picture ? fit(picture, hanging.maxW, hanging.maxH) : [0, 0]
  const border = FRAMES[room].border
  const geometry = useMemo(() => backlightGeometry(w + border * 2, h + border * 2), [w, h, border])
  if (!picture) return null
  return (
    <group position={[hanging.x, 0, hanging.z]} rotation={[0, hanging.yaw, 0]}>
      {/* (5 mm off the wall, behind the frame.) */}
      <mesh geometry={geometry} material={backlightMaterial(room)} position={[0, hanging.y, 0.005]} />
    </group>
  )
}

// Every place on the walls of one era room, in the room's own coordinates (as in
// RoomDecor.tsx: x across the room, z towards the entrance, 0 = the middle of the room).
function hangings(room: EraRoom): Hanging[] {
  const layout = roomById(room)
  if (!layout) return []
  const gallery = WALL_GALLERY[room]
  const w = layout.width
  const d = layout.depth
  const front = d / 2 // the entrance wall
  const anteFace = front - ANTE_DEPTH // the entrance room's side of the wall to the hall
  const hallFace = anteFace - WALL_THICKNESS // the hall's side of that wall
  const hallMiddle = (hallFace - d / 2) / 2
  const anteMiddle = front - ANTE_DEPTH / 2
  const door = INNER_DOOR / 2
  const off = 0.01 // off the wall surface
  const list: Hanging[] = []
  // Hall side walls: one large picture in the middle of each, between its two corner exhibits.
  gallery.sides.forEach((id, i) => {
    const side = i === 0 ? -1 : 1
    list.push({ id, x: side * (w / 2 - off), z: hallMiddle, yaw: -side * (Math.PI / 2), y: 2.3, maxW: 3.0, maxH: 2.3 })
  })
  // Hall side of the doorway wall (facing the back of the hall): one picture on each side,
  // near the doorway's edge, a little higher so the front exhibits do not hide it.
  const slot = 2.0
  // (Seen from inside the hall, facing the entrance, "left" is +x.)
  gallery.doorway.forEach((id, i) => {
    const side = i === 0 ? 1 : -1
    list.push({ id, x: side * (door + 0.6 + slot / 2), z: hallFace - off, yaw: Math.PI, y: 2.55, maxW: slot, maxH: 1.55 })
  })
  // The hall's back wall: four pictures around the era number, two on each side of it.
  const numberY = eraNumberY(layout.height)
  gallery.eraWall.forEach((id, i) => {
    const side = i < 2 ? -1 : 1
    const top = i % 2 === 0
    // (A very narrow picture, like an upright phone, may grow taller to stay readable; the
    // bottom row keeps its top edge level, so it grows downwards.)
    const picture = PICTURES[id]
    // (The group is kept compact, with a clear margin of wall above and below it.)
    const maxH = picture && picture.aspect < 0.6 ? 1.6 : 1.3
    const [, h] = picture ? fit(picture, 2.2, maxH) : [0, 1.3]
    const y = top ? numberY + 1.0 : numberY - 1.0 + 0.65 - h / 2
    list.push({ id, x: side * ERA_WALL_X, z: -d / 2 + off, yaw: 0, y, maxW: 2.2, maxH })
  })
  // Entrance room, facing the visitor coming in: one picture on each side of the doorway,
  // high enough that its caption plaque stays clear above the dado rail (at 0.96-1.02 m:
  // ante-decor.tsx; the plaque once ran through it and flickered).
  const anteSlot = ANTE_WIDTH / 2 - door
  gallery.ante.forEach((id, i) => {
    const side = i === 0 ? -1 : 1
    list.push({ id, x: side * (door + anteSlot / 2), z: anteFace + off, yaw: 0, y: 2.2, maxW: anteSlot - 0.9, maxH: 1.5 })
  })
  // Entrance room side walls: the timeline (left) and what the era changed (right).
  ;[gallery.timeline, gallery.change].forEach((id, i) => {
    const side = i === 0 ? -1 : 1
    list.push({ id, x: side * (ANTE_WIDTH / 2 - off), z: anteMiddle, yaw: -side * (Math.PI / 2), y: 2.1, maxW: 4.6, maxH: 2.2 })
  })
  return list
}

// The gallery of one era room, placed and turned like the room's decoration.
export default function WallPictures({ room }: { room: EraRoom }) {
  const layout = roomById(room)
  const places = useMemo(() => hangings(room), [room])
  if (!layout) return null
  const [x, z] = toWorld(layout.frame, 0, (layout.vFront + layout.vBack) / 2)
  const lamps = room === 'ir1' || room === 'ir2'
  return (
    <group position={[x, 0, z]} rotation={[0, layout.frame.angle, 0]}>
      {places.map((hanging) => (
        <WallPicture key={hanging.id} room={room} hanging={hanging} />
      ))}
      {/* The parts that never change, merged: backlights (one mesh) and picture lamps. */}
      <MergeStatic>
        {places.map((hanging) => (
          <Backlight key={`glow-${hanging.id}`} room={room} hanging={hanging} />
        ))}
        {lamps &&
          places.map((hanging) => (
            <PictureLamp key={hanging.id} room={room} hanging={hanging} />
          ))}
      </MergeStatic>
    </group>
  )
}
