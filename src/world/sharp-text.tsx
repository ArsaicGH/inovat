import { useEffect, useMemo, useRef } from 'react'
import {
  AgXToneMapping,
  Color,
  LinearSRGBColorSpace,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NoToneMapping,
  Vector2,
  type Camera,
  type DepthTexture,
  type Group,
  type Material,
  type PerspectiveCamera,
  type Scene,
  type WebGLRenderer,
  type WebGLRenderTarget,
} from 'three'
import { CopyMaterial, Pass } from 'postprocessing'
import { BatchedText, Text } from 'troika-three-text'

// SHARP TEXT. The lower graphics levels draw the 3D picture with fewer pixels and stretch
// it to the screen, so text painted into the boards' pictures came out blurry. Now the
// letters are not painted: while a board (or caption, sign...) is painted, each line of its
// text is noted instead, with its exact place, font and colour (recordText), and drawn as
// real text, made of shapes, in a last step at the screen's full sharpness (SharpTextPass,
// at the end of the effects in Museum.tsx). The picture itself is painted exactly as
// before, so the layout does not change.
// The text is lit like the painted letters were (same lamps, same slight glow of the
// paper), goes through the same film-like colours and darker corners, and is hidden
// pixel by pixel wherever the 3D scene is in front of it (it is compared with the scene's
// depth picture, so an exhibit in front covers exactly the part of the text behind it).
// Each board's lines are drawn together, one step per font weight (BatchedText), so many
// boards cost almost nothing.

// The layer only this last step draws (the camera draws layer 0, the shadow light layer 1).
export const TEXT_LAYER = 2

// The museum font's files, by weight (public/fonts).
const FONT_FILES: Record<number, string> = {
  400: 'be-vietnam-pro-regular.ttf',
  500: 'be-vietnam-pro-medium.ttf',
  600: 'be-vietnam-pro-semibold.ttf',
  700: 'be-vietnam-pro-bold.ttf',
}
const fontUrl = (weight: number) => `${import.meta.env.BASE_URL}fonts/${FONT_FILES[weight] ?? FONT_FILES[500]}`

// One line of text, as it would have been painted: x and the baseline y in the picture's
// pixels, the font's size in pixels and weight, its colour, how it is aligned, and a
// squeeze if it was painted narrower than its natural width.
export interface TextRun {
  text: string
  x: number
  y: number
  size: number
  weight: number
  colour: string
  anchor: 'left' | 'center' | 'right'
  squeeze: number
}

// Makes a canvas note its text instead of painting it (everything else is painted as usual).
// alsoPaint: paint it too (the hologram glass: the painted letters give the glow around them).
export function recordText(ctx: CanvasRenderingContext2D, runs: TextRun[], alsoPaint = false) {
  const paint = ctx.fillText.bind(ctx)
  ctx.fillText = (text: string, x: number, y: number, maxWidth?: number) => {
    if (alsoPaint) paint(text, x, y, maxWidth)
    if (!text) return
    // (The browser rewrites the font: weight 700 as "bold", and 400 left out.)
    const named = /\b(bold|[1-9]00)\b/.exec(ctx.font)?.[1]
    const weight = named === 'bold' ? 700 : named ? Number(named) : 400
    const size = Number(/([\d.]+)px/.exec(ctx.font)?.[1] ?? 16)
    // The board places text by the top or middle of its letters, the text by its baseline:
    // the distance between them, measured in the same font.
    const baseline = ctx.textBaseline
    ctx.textBaseline = 'alphabetic'
    const metrics = ctx.measureText(text)
    ctx.textBaseline = baseline
    const ascent = metrics.emHeightAscent ?? metrics.fontBoundingBoxAscent ?? size * 0.8
    const descent = metrics.emHeightDescent ?? metrics.fontBoundingBoxDescent ?? size * 0.2
    const shift = baseline === 'top' || baseline === 'hanging' ? ascent : baseline === 'middle' ? (ascent - descent) / 2 : baseline === 'bottom' ? -descent : 0
    const align = ctx.textAlign
    runs.push({
      text,
      x,
      y: y + shift,
      size,
      weight,
      colour: typeof ctx.fillStyle === 'string' ? ctx.fillStyle : '#000000',
      anchor: align === 'center' ? 'center' : align === 'right' || align === 'end' ? 'right' : 'left',
      squeeze: maxWidth !== undefined && metrics.width > maxWidth ? maxWidth / metrics.width : 1,
    })
  }
}

// How the text is lit, like the surface it was painted on.
export interface TextShading {
  lit: boolean // lit by the lamps (false: unlit, like the hologram glass)
  glow: number // self-lit share of its colour (the paper's slight glow), or brightness if unlit
  roughness?: number
}

// Shared by every text material, set by SharpTextPass each frame.
const shared = {
  sharpDepth: { value: null as DepthTexture | null },
  sharpScreen: { value: [1, 1] },
  sharpNear: { value: 0.1 },
  sharpFar: { value: 100 },
}

const PREAMBLE = /* glsl */ `
uniform sampler2D sharpDepth;
uniform vec2 sharpScreen;
uniform float sharpNear;
uniform float sharpFar;
uniform float sharpGlow;
float sharpViewZ(const in float depth) { return (sharpNear * sharpFar) / ((sharpFar - sharpNear) * depth - sharpFar); }
`
// Hidden where the scene is in front (with 4 cm to spare: the text lies just on its board,
// and the depth picture has fewer pixels, so a board leaning away is slightly off).
const DEPTH_TEST = /* glsl */ `
  vec2 sharpUv = gl_FragCoord.xy / sharpScreen;
  if (sharpViewZ(gl_FragCoord.z) < sharpViewZ(texture2D(sharpDepth, sharpUv).r) - 0.04) discard;
`
// The darker corners (Museum.tsx: Vignette, offset 0.3, darkness 0.55), as the effects do.
const VIGNETTE = /* glsl */ `
  gl_FragColor.rgb *= smoothstep(0.8, 0.3 * 0.799, distance(sharpUv, vec2(0.5)) * (0.55 + 0.3));
`

function patch(material: Material, lit: boolean, glow: number) {
  const glowUniform = { value: glow }
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, shared, { sharpGlow: glowUniform })
    let fragment = shader.fragmentShader.replace('void main() {', `${PREAMBLE}\nvoid main() {\n${DEPTH_TEST}`)
    if (lit) fragment = fragment.replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = diffuseColor.rgb * sharpGlow;')
    else fragment = fragment.replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse * sharpGlow, opacity );')
    shader.fragmentShader = fragment.replace('#include <tonemapping_fragment>', `#include <tonemapping_fragment>\n${VIGNETTE}`)
  }
  material.customProgramCacheKey = () => `sharp-text-${lit ? 'lit' : 'unlit'}`
  return glowUniform
}

// One material per kind of shading (all lit text shares one drawing program).
const materials = new Map<string, { material: Material; glow: { value: number } }>()
function textMaterial(shading: TextShading) {
  const key = `${shading.lit}|${shading.glow}|${shading.roughness ?? 0.9}`
  let entry = materials.get(key)
  if (!entry) {
    const material = shading.lit
      ? new MeshStandardMaterial({ roughness: shading.roughness ?? 0.9, transparent: true, depthWrite: false, depthTest: false })
      : new MeshBasicMaterial({ transparent: true, depthWrite: false, depthTest: false })
    const glow = patch(material, shading.lit, shading.glow)
    entry = { material, glow }
    materials.set(key, entry)
  }
  return entry
}

const tempColour = new Color()

// A picture's recorded text, drawn sharp over it: `pixels` is the picture's size in pixels,
// `face` the size in metres of the surface it is shown on, `z` how far in front of the
// group's centre that surface is.
export function SharpText({ runs, pixels, face, z, shading }: { runs: TextRun[]; pixels: readonly [number, number]; face: readonly [number, number]; z: number; shading: TextShading }) {
  const group = useRef<Group>(null)
  // One batch per font weight (a batch can only use one font file's letters).
  const batches = useMemo(() => {
    const byWeight = new Map<number, BatchedText>()
    const metre = face[0] / pixels[0] // the picture's pixels are square
    for (const run of runs) {
      let batched = byWeight.get(run.weight)
      if (!batched) {
        batched = new BatchedText()
        batched.material = textMaterial(shading).material
        batched.layers.set(TEXT_LAYER)
        batched.userData.keepSeparate = true // (never merged with the decoration around it)
        batched.castShadow = false
        batched.receiveShadow = false
        byWeight.set(run.weight, batched)
      }
      const text = new Text()
      text.text = run.text
      text.font = fontUrl(run.weight)
      text.fontSize = run.size * metre
      // (A batch stores each colour as it is given and its drawing code uses it without the
      // usual conversion from screen colours, so it is given already converted: otherwise
      // dark letters come out too light.)
      text.color = tempColour.set(run.colour).getHex(LinearSRGBColorSpace)
      text.anchorX = run.anchor
      text.anchorY = 'top-baseline'
      text.whiteSpace = 'nowrap'
      text.position.set(run.x * metre - face[0] / 2, face[1] / 2 - run.y * metre, 0)
      text.scale.x = run.squeeze
      text.layers.set(TEXT_LAYER)
      batched.add(text)
      text.sync()
    }
    return [...byWeight.values()]
    // (Built again only when the text or its surface really changes, not when the same
    // sizes arrive in a new list.)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runs, pixels[0], pixels[1], face[0], face[1], shading.lit, shading.glow, shading.roughness])

  useEffect(() => {
    const parent = group.current
    if (!parent) return
    parent.add(...batches)
    return () => {
      for (const batched of batches) {
        parent.remove(batched)
        batched.dispose()
      }
    }
  }, [batches])

  return <group ref={group} position={[0, 0, z]} userData={{ keepSeparate: true }} />
}

// THE LAST STEP of every frame: the finished picture (drawn with the graphics level's
// number of pixels) is stretched onto the screen, then the text is drawn over it at the
// screen's full sharpness, lit by the same lamps, with the scene's depth picture deciding
// what covers it.
export class SharpTextPass extends Pass {
  private copy = new CopyMaterial()
  private frames = 0
  private textScene: Scene
  private textCamera: Camera
  constructor(scene: Scene, camera: Camera) {
    super('SharpTextPass')
    this.textScene = scene
    this.textCamera = camera
    this.fullscreenMaterial = this.copy
    this.needsSwap = false
    this.needsDepthTexture = true
  }

  setDepthTexture(depthTexture: DepthTexture) {
    shared.sharpDepth.value = depthTexture
  }

  render(renderer: WebGLRenderer, inputBuffer: WebGLRenderTarget) {
    // 1. The picture, stretched to the screen (smoothly, as the browser did before).
    this.copy.inputBuffer = inputBuffer.texture
    renderer.setRenderTarget(this.renderToScreen ? null : inputBuffer)
    renderer.render(this.scene, this.camera)
    if (!this.renderToScreen) return

    // 2. The text, over it. The lamps must be seen by this step too (they are found again
    // now and then, as the ending brings its own).
    const scene = this.textScene
    const camera = this.textCamera
    if (this.frames++ % 120 === 0) scene.traverse((object) => (object as { isLight?: boolean }).isLight && object.layers.enable(TEXT_LAYER))
    const size = renderer.getDrawingBufferSize(screenSize)
    shared.sharpScreen.value = [size.x, size.y]
    shared.sharpNear.value = (camera as PerspectiveCamera).near
    shared.sharpFar.value = (camera as PerspectiveCamera).far
    const mask = camera.layers.mask
    const background = scene.background
    const autoClear = renderer.autoClear
    const toneMapping = renderer.toneMapping
    camera.layers.set(TEXT_LAYER)
    scene.background = null // (a background colour would clear the picture)
    renderer.autoClear = false
    renderer.toneMapping = AgXToneMapping // the same film-like colours as the effects
    renderer.render(scene, camera)
    renderer.toneMapping = toneMapping ?? NoToneMapping
    renderer.autoClear = autoClear
    scene.background = background
    camera.layers.mask = mask
  }
}
const screenSize = new Vector2()
