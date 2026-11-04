import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { skipWhileHidden } from './skip-while-hidden'
import { HalfFloatType, Texture, WebGLRenderTarget, type Mesh, type Object3D } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, Fog, Vector3, type Camera, type Group, type PerspectiveCamera, type Scene, type WebGLRenderer } from 'three'
import { useMuseumStore } from '../state/useMuseumStore'
import { endingMusicTime, playEndingMusic } from '../audio/sound'
import { ORIGIN, RIGS, SET_X, SHOTS, START, TITLE_AT, borrowedLights, film, filmVeil, mixPose, shotIndexAt, type PlacedLight, type StageLight } from './ending-shots'
import { FinaleLands, disposePalette } from './ending-sets'
import { ActConnected, ActDigital, ActElectric, ActSteam } from './ending-acts'

// THE ENDING: after the Game Room's portal, a short film through the four Industrial
// Revolutions, shot by shot (the script is in ending-shots.ts, the four acts in
// ending-acts.tsx, the finale's columns in ending-sets.tsx),
// ending on all four eras side by side and the closing title (EndingScreen.tsx).
//
// It is built far from the museum (beyond the camera's view distance, so none of the
// museum is drawn meanwhile). BUILT AHEAD: as soon as the visitor is in the Game Room with
// the portal open (Museum.tsx), hidden and still, and prepared for the graphics card there:
// its drawing code built, its pictures and shapes sent over by drawing it once out of sight.
// Built at the moment the visitor stepped into the portal, it froze the first seconds of the
// film, and the finale (all four eras at once) stuttered as its pieces were first sent. It adds no lights: the
// museum's own are lent to it shot by shot (Lighting in Museum.tsx), since a change in the
// number of lights would make the graphics card rebuild every material in the museum.

const MUSEUM_SKY = '#1b1d24' // the museum's own background (Museum.tsx)
const VIEW_DISTANCE = 420 // the camera sees further during the film (the museum's is 120 m)
const FOV = 45 // a narrower, more cinematic lens than the museum's 70 degrees
const DIP = 0.45 // seconds of each half of a dip to black
const FLASH_IN = 0.6 // seconds a flash of light builds before a cut...
const FLASH_OUT = 1.0 // ...and fades after it

// Camera moves start and end gently (no jolt at either end).
const ease = (u: number) => u * u * u * (u * (u * 6 - 15) + 10)

export default function EndingScene({ running }: { running: boolean }) {
  const run = useMuseumStore((state) => state.endingRun)
  const warm = useRef({ frames: 0, compiled: false, done: false, pieces: -1, settled: 0 })
  const warmTarget = useMemo(() => new WebGLRenderTarget(64, 64, { type: HalfFloatType }), [])
  useEffect(() => () => warmTarget.dispose(), [warmTarget])
  // (While hidden, its objects' places are not worked out every frame: skip-while-hidden.ts.)
  useLayoutEffect(() => {
    if (group.current) skipWhileHidden(group.current)
  }, [])
  // (Its shared materials are freed only when the ending's world is removed: it stays built
  // after a first run, ready for "Replay".)
  useEffect(() => () => disposePalette(), [])
  const get = useThree((state) => state.get)
  const group = useRef<Group>(null)
  const sets = useRef<(Group | null)[]>([])
  const playing = useRef({ ready: false, shot: -1, act: 0 })
  const haze = useMemo(() => new Fog('#000000', 10, 60), [])
  const temp = useMemo(
    () => ({
      look: new Vector3(),
      background: new Color(),
      lights: Array.from({ length: 7 }, (): PlacedLight => ({ from: new Vector3(), to: new Vector3(), colour: new Color(), intensity: 0, angle: 0.6 })),
    }),
    [],
  )

  // Every new run (and "Replay the journey") starts the film from the beginning.
  useEffect(() => {
    film.t = 0
    playing.current.shot = -1
    playing.current.act = 0
  }, [run])

  // Starting: a longer view, the haze, the borrowed lights, and every material of the film
  // prepared before it starts (behind the portal's flash and a moment of black), so the
  // first shots do not stutter. Ending: everything put back and freed.
  useEffect(() => {
    film.running = running
    if (!running) return
    const { gl, scene, camera } = get()
    const lens = camera as PerspectiveCamera
    const saved = { far: lens.far, fov: lens.fov, fog: scene.fog }
    lens.far = VIEW_DISTANCE
    lens.updateProjectionMatrix()
    scene.fog = haze
    borrowedLights.active = true
    let alive = true
    const ready = () => {
      if (alive) playing.current.ready = true
    }
    const timer = window.setTimeout(ready, 3000) // never wait longer than this
    // (Already prepared in the Game Room: it starts at once.)
    if (warm.current.done) ready()
    else if (group.current) gl.compileAsync(group.current, lens, scene).then(ready, ready)
    else ready()
    return () => {
      alive = false
      film.running = false
      playing.current.ready = false
      film.ready = false
      window.clearTimeout(timer)
      borrowedLights.active = false
      scene.fog = saved.fog
      lens.far = saved.far
      lens.fov = saved.fov
      lens.updateProjectionMatrix()
      if (scene.background instanceof Color) scene.background.set(MUSEUM_SKY)
      if (filmVeil.element) filmVeil.element.style.opacity = '0'
    }
  }, [get, haze, running])

  // PREPARING IT AHEAD (while hidden): once its pieces exist, its drawing code is built
  // (with the film's haze, which the drawing code depends on), then a moment later it is
  // drawn once, all of it, into a tiny picture out of sight, which sends every picture and
  // shape to the graphics card. Then it waits, hidden, for the visitor to step in.
  // Its downloaded models arrive a little later than the rest, and a third of its pieces
  // were then never prepared (the first run stuttered as they were): so it is counted twice
  // a second, and prepared again whenever new pieces have appeared.
  function prepare(gl: WebGLRenderer, scene: Scene, camera: Camera) {
    const root = group.current
    if (!root) return
    const state = warm.current
    state.frames += 1
    // (Once prepared and unchanged for a few counts, no longer counted.)
    if (state.frames % 30 === 0 && state.settled < 3 && (state.done || state.frames < 1000)) {
      let pieces = 0
      root.traverse(() => void (pieces += 1))
      if (pieces === state.pieces && state.done) state.settled += 1
      // Prepared, and nothing new arrived since: the loading screen may go. (Not after the
      // first preparing: the downloaded models arrive a little later, and preparing again
      // for them froze the title screen for seconds.)
      if (state.settled >= 2 && !useMuseumStore.getState().endingPrepared) useMuseumStore.getState().setEndingPrepared()
      if (pieces !== state.pieces) {
        state.pieces = pieces
        state.frames = 0
        state.settled = 0
        state.compiled = false
        state.done = false
      }
    }
    const compileNow = state.frames === 20 && !state.compiled
    const drawNow = state.frames >= 1000 && !state.done
    if (!compileNow && !drawNow) return
    // Everything shown for this moment (each shot's scene hides itself while not playing),
    // with the film's haze.
    const fog = scene.fog
    scene.fog = haze
    const changed: [Object3D, boolean, boolean][] = []
    root.traverse((object) => {
      changed.push([object, object.visible, object.frustumCulled])
      object.visible = true
      object.frustumCulled = false
    })
    if (compileNow) {
      state.compiled = true
      // (The drawing code is built in the background where the browser can; then, a frame
      // later, the drawing below.)
      gl.compileAsync(root, camera, scene).then(
        () => (state.frames = 1000),
        () => (state.frames = 1000),
      )
    } else {
      state.done = true
      root.traverse((object) => {
        const material = (object as Mesh).material
        if (material)
          for (const m of Array.isArray(material) ? material : [material])
            for (const value of Object.values(m)) if (value instanceof Texture) gl.initTexture(value)
      })
      gl.setRenderTarget(warmTarget)
      gl.render(scene, camera)
      gl.setRenderTarget(null)
    }
    for (const [object, visible, culled] of changed) {
      object.visible = visible
      object.frustumCulled = culled
    }
    scene.fog = fog
  }

  // Place one of the film's lights, in the ending's own space.
  function place(out: PlacedLight, light: StageLight, ox: number) {
    const from = typeof light.from === 'function' ? light.from() : light.from
    const to = typeof light.to === 'function' ? light.to() : light.to
    out.from.set(ORIGIN[0] + ox + from[0], ORIGIN[1] + from[1], ORIGIN[2] + from[2])
    out.to.set(ORIGIN[0] + ox + to[0], ORIGIN[1] + to[1], ORIGIN[2] + to[2])
    out.colour.set(light.colour)
    // Light fades with the square of the distance, so the lamp's power is what gives the
    // wanted brightness where it lands.
    out.intensity = light.lux * out.from.distanceToSquared(out.to) * (light.gate ? light.gate() : 1)
    out.angle = light.angle ?? 0.6
    return out
  }

  // (Runs before the museum's own frame code, so the lights move in the same frame as the
  // camera cuts.)
  useFrame(({ camera, scene, gl }, delta) => {
    if (!running) {
      prepare(gl, scene, camera)
      return
    }
    if (group.current) group.current.visible = true
    const store = useMuseumStore.getState()
    const state = playing.current
    const veil = filmVeil.element
    const lens = camera as PerspectiveCamera

    // Black until everything is prepared.
    if (state.ready) {
      // "Skip" (EndingScreen) jumps to the closing title, and the music with it.
      if (store.endingStage === 6 && film.t < TITLE_AT) {
        film.t = TITLE_AT
        playEndingMusic(TITLE_AT)
      }
      // The film follows the music's clock, so the title lands on its climax. (Without
      // sound, or while it is still loading, the film keeps its own time.)
      const music = endingMusicTime()
      if (film.override !== null) film.t = film.override
      else film.t = music !== null ? Math.max(music, film.t) : film.t + Math.min(delta, 0.1)
    }
    film.ready = state.ready
    const index = shotIndexAt(film.t)
    const shot = SHOTS[index]
    const s = film.t - START[shot.id]
    const cut = index !== state.shot
    if (cut) {
      state.shot = index
      lens.fov = shot.fov ?? FOV
      lens.updateProjectionMatrix()
    }

    // The camera.
    const [at, look] = shot.path ? shot.path(s) : mixPose(shot.from!, shot.to ?? shot.from!, ease(Math.min(1, s / shot.duration)))
    const ox = shot.set >= 0 ? SET_X[shot.set] : 0
    // (A very slight breathing, as with a camera held on a crane, never a shake.)
    camera.position.set(ORIGIN[0] + ox + at[0], ORIGIN[1] + at[1] + Math.sin(film.t * 0.8) * 0.01, ORIGIN[2] + at[2])
    camera.lookAt(temp.look.set(ORIGIN[0] + ox + look[0], ORIGIN[1] + look[1], ORIGIN[2] + look[2]))

    // The lights, the sky and the haze of this shot.
    const rig = RIGS[shot.rig]
    const lightsAt = shot.set >= 0 ? ox : 0
    borrowedLights.key = place(temp.lights[0], rig.key, lightsAt)
    borrowedLights.spots = rig.spots.slice(0, 6).map((light, i) => place(temp.lights[i + 1], light, lightsAt))
    borrowedLights.sky.set(rig.sky)
    borrowedLights.ground.set(rig.ground)
    borrowedLights.fill = rig.fill
    borrowedLights.environment = rig.environment
    if (scene.background instanceof Color) scene.background.set(rig.background)
    haze.color.set(rig.background)
    haze.near = rig.haze[0]
    haze.far = rig.haze[1]

    // The veil: dips to black and flashes of light between shots.
    if (veil) {
      let opacity = state.ready ? 0 : 1
      let colour = '#000000'
      const next = SHOTS[index + 1]
      const left = shot.duration - s
      if (shot.into === 'dip') opacity = Math.max(opacity, 1 - s / DIP)
      if (next?.into === 'dip') opacity = Math.max(opacity, 1 - left / DIP)
      const flashIn = shot.into === 'flash' ? 1 - s / FLASH_OUT : 0
      const flashOut = next?.into === 'flash' ? 1 - left / FLASH_IN : 0
      const flash = Math.max(flashIn, flashOut)
      if (state.ready && flash > opacity) {
        opacity = flash
        colour = (flashIn > flashOut ? shot.veil : next?.veil) ?? '#ffffff'
      }
      veil.style.background = colour
      veil.style.opacity = String(Math.min(1, Math.max(0, opacity)))
    }

    if (!state.ready) return
    // The captions follow the acts; the closing title comes as the last shot settles.
    const stage = film.t >= TITLE_AT ? 6 : shot.act
    if (stage !== store.endingStage) store.setEndingStage(stage)
  }, -1)

  return (
    <group ref={group} position={ORIGIN} visible={running}>
      <Suspense fallback={null}>
        {/* (Each act's scenes are drawn only during their own shots; the finale shows only its columns.) */}
        {[ActSteam, ActElectric, ActDigital, ActConnected].map((Set, i) => (
          <group key={i} position={[SET_X[i], 0, 0]} ref={(g) => void (sets.current[i] = g)}>
            <Set />
          </group>
        ))}
        <FinaleLands />
      </Suspense>
    </group>
  )
}
