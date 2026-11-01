import { useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { CanvasTexture, SRGBColorSpace, type Group, type Texture } from 'three'
import { useContent } from '../content/use-content'
import { PICTURES, WALL_PICTURES } from '../content/pictures'
import { useMuseumStore } from '../state/useMuseumStore'
import { addAimTarget, removeAimTarget } from './aim-targets'
import { paintFont, useFontsReady } from './fonts'
import { ANTE_DEPTH, WALL_THICKNESS, roomById, toWorld } from './layout'
import { usePicture } from './picture-images'
import { BOARD_THEMES } from './style'

// THE WALL GALLERIES: historical pictures (content/pictures.ts) on the side walls of each
// era room's hall, two on each wall, between the corner exhibits, each with a small caption
// plaque under it. Like an exhibit, a picture can be aimed at and opened (E) to see it
// large with its caption and credit (InfoPanel.tsx).
// Frames follow the era: gilt (CMCN 1), black lacquer (CMCN 2), brushed aluminium
// (CMCN 3) and glowing glass edges (CMCN 4).

type EraRoom = 'ir1' | 'ir2' | 'ir3' | 'ir4'

const FRAMES: Record<EraRoom, { colour: string; border: number; depth: number; metalness: number; roughness: number }> = {
  ir1: { colour: '#b8893d', border: 0.09, depth: 0.07, metalness: 0.85, roughness: 0.35 },
  ir2: { colour: '#1d1b19', border: 0.06, depth: 0.05, metalness: 0.2, roughness: 0.4 },
  ir3: { colour: '#b9bec4', border: 0.035, depth: 0.04, metalness: 0.8, roughness: 0.35 },
  ir4: { colour: '#3fd0e0', border: 0.012, depth: 0.02, metalness: 0, roughness: 0.3 },
}

const MAX_WIDTH = 2.0 // metres, the picture itself (without frame)
const MAX_HEIGHT = 1.5
const CENTRE_Y = 1.85 // a little above eye height
const TEXTURE_MAX = 640 // pixels: sharp enough on the wall (the enlarged view shows the full file)
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
    canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)
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
      ctx.fillStyle = room === 'ir4' ? '#061f2a' : theme.paper
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

function WallPicture({ id, room, position, yaw }: { id: string; room: EraRoom; position: [number, number, number]; yaw: number }) {
  const { language } = useContent()
  const picture = PICTURES[id]
  const group = useRef<Group>(null)
  const aimed = useMuseumStore((state) => state.aimedExhibitId === id)
  const image = useWallTexture(picture?.file)
  const plaque = usePlaqueTexture(picture?.caption[language] ?? '', room)

  useEffect(() => {
    const target = group.current
    if (!target) return
    addAimTarget(target)
    return () => removeAimTarget(target)
  }, [])

  if (!picture) return null
  // As large as the space allows, keeping the picture's shape.
  const w = picture.aspect >= MAX_WIDTH / MAX_HEIGHT ? MAX_WIDTH : MAX_HEIGHT * picture.aspect
  const h = w / picture.aspect
  const frame = FRAMES[room]
  const glass = room === 'ir4'
  return (
    <group ref={group} position={position} rotation={[0, yaw, 0]} userData={{ exhibitId: id }}>
      <group position={[0, CENTRE_Y, frame.depth / 2]}>
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
              <meshBasicMaterial map={image} color="#d8f4f8" />
            ) : (
              <meshStandardMaterial map={image} roughness={0.75} emissive="#ffffff" emissiveMap={image} emissiveIntensity={0.42} />
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
        {/* The caption plaque under the picture. */}
        <mesh position={[0, -h / 2 - frame.border - 0.06 - PLAQUE[1] / 2, frame.depth / 2 - 0.01]}>
          <planeGeometry args={PLAQUE as unknown as [number, number]} />
          <meshStandardMaterial map={plaque} roughness={0.7} emissive="#ffffff" emissiveMap={plaque} emissiveIntensity={0.3} />
        </mesh>
      </group>
    </group>
  )
}

// The gallery of one era room, placed and turned like the room's decoration (RoomDecor.tsx:
// x across the room, z towards the entrance).
export default function WallPictures({ room }: { room: EraRoom }) {
  const layout = roomById(room)
  if (!layout) return null
  const [x, z] = toWorld(layout.frame, 0, (layout.vFront + layout.vBack) / 2)
  const width = layout.width
  // The hall is the room minus its entrance room; the pictures hang halfway between the
  // middle of each side wall and the corner exhibits (4.2 m in from the walls).
  const hallDepth = layout.depth - ANTE_DEPTH - WALL_THICKNESS
  const hallZ = -(ANTE_DEPTH + WALL_THICKNESS) / 2
  const spacing = (hallDepth / 2 - 4.2) / 2
  // Left wall (seen from the entrance) front to back, then the right wall back to front.
  const places: [number, number, number][] = [
    [-1, hallZ + spacing, Math.PI / 2],
    [-1, hallZ - spacing, Math.PI / 2],
    [1, hallZ - spacing, -Math.PI / 2],
    [1, hallZ + spacing, -Math.PI / 2],
  ]
  return (
    <group position={[x, 0, z]} rotation={[0, layout.frame.angle, 0]}>
      {WALL_PICTURES[room].map((id, i) => {
        const [side, pz, yaw] = places[i]
        return <WallPicture key={id} id={id} room={room} position={[side * (width / 2 - 0.01), 0, pz]} yaw={yaw} />
      })}
    </group>
  )
}
