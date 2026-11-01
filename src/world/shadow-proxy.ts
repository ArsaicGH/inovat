import { useEffect, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, Matrix4, Mesh, MeshBasicMaterial, type Group, type Material, type Object3D } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useMuseumStore } from '../state/useMuseumStore'
import { SHADOW_LAYER } from './shadow-layer'

// ONE SHADOW SHAPE PER EXHIBIT. The shadow picture is drawn piece by piece, and an exhibit
// is made of many pieces (one downloaded model alone has 52): in the first era room about
// 94 separate steps every time the shadows were redrawn, about 3 ms of the processor's time
// on the leader's laptop, on every 3rd frame at "high" (an uneven rhythm of heavy frames).
// So once the museum is loaded, every piece of an exhibit that casts a shadow and does not
// move on its own is copied into ONE shape (only its outline: no colours or pictures), seen
// only by the shadow light, and the pieces themselves stop casting. Same shadow, one step.
// Pieces that move by themselves (turning wheels, arms, animated models: userData.moves)
// and see-through cut-outs keep casting their own shadow.

const PROXY_MATERIAL = new MeshBasicMaterial()

function cutOut(material: Material | Material[]): boolean {
  const m = (Array.isArray(material) ? material[0] : material) as Material & { alphaMap?: unknown }
  return m.alphaTest > 0 || Boolean(m.alphaMap)
}

// The pieces that go into the shape (also those already in it: userData.inShadowProxy).
function collect(root: Object3D, proxy: Mesh | null): Mesh[] {
  const found: Mesh[] = []
  const walk = (object: Object3D) => {
    // (Hidden pieces are left out: among them the originals of merged decoration,
    // MergeStatic.tsx, already drawn as part of the merged copy.)
    if (object === proxy || !object.visible || (object !== root && object.userData.moves)) return
    const mesh = object as Mesh & { isInstancedMesh?: boolean; isSkinnedMesh?: boolean }
    if (mesh.isMesh && !mesh.isInstancedMesh && !mesh.isSkinnedMesh && (mesh.castShadow || mesh.userData.inShadowProxy) && !cutOut(mesh.material))
      found.push(mesh)
    object.children.forEach(walk)
  }
  walk(root)
  return found
}

function signature(meshes: Mesh[]): string {
  return `${meshes.length}:${meshes.reduce((sum, m) => sum + m.geometry.attributes.position.count, 0)}`
}

function buildShape(root: Group, meshes: Mesh[]): BufferGeometry | null {
  root.updateWorldMatrix(true, true)
  const toRoot = new Matrix4().copy(root.matrixWorld).invert()
  const parts = meshes.map((mesh) => {
    // Only the outline, placed where the piece is relative to the exhibit. (In ordinary
    // decimals: the simplified shadow models store compact whole numbers, which cannot be
    // joined with the others.)
    const source = mesh.geometry.attributes.position
    const position = new Float32Array(source.count * 3)
    for (let i = 0; i < source.count; i++) {
      position[i * 3] = source.getX(i)
      position[i * 3 + 1] = source.getY(i)
      position[i * 3 + 2] = source.getZ(i)
    }
    const part = new BufferGeometry()
    part.setAttribute('position', new BufferAttribute(position, 3))
    const index = mesh.geometry.index
    if (index) part.setIndex(new BufferAttribute(Uint32Array.from(index.array), 1))
    else part.setIndex(new BufferAttribute(Uint32Array.from({ length: mesh.geometry.attributes.position.count }, (_, i) => i), 1))
    part.applyMatrix4(new Matrix4().multiplyMatrices(toRoot, mesh.matrixWorld))
    return part
  })
  const shape = parts.length ? mergeGeometries(parts) : null
  parts.forEach((part) => part.dispose())
  return shape
}

export function useShadowProxy(root: RefObject<Group | null>) {
  const proxy = useRef<Mesh | null>(null)
  const state = useRef({ frames: 0, seen: '', built: '' })

  useFrame(() => {
    const group = root.current
    // (After the museum has loaded and been drawn once: every model and every merging done.)
    if (!group || !useMuseumStore.getState().warmedUp) return
    // Checked twice a second: a model that arrives or changes later gets a new shape.
    if (++state.current.frames % 30 !== 0) return
    const meshes = collect(group, proxy.current)
    const now = signature(meshes)
    const stable = now === state.current.seen
    state.current.seen = now
    if (!stable || now === state.current.built) return
    state.current.built = now
    const shape = buildShape(group, meshes)
    if (proxy.current) {
      proxy.current.geometry.dispose()
      proxy.current.removeFromParent()
      proxy.current = null
    }
    if (!shape) return
    const mesh = new Mesh(shape, PROXY_MATERIAL)
    mesh.layers.set(SHADOW_LAYER)
    mesh.castShadow = true
    mesh.receiveShadow = false
    mesh.userData.keepSeparate = true
    group.add(mesh)
    proxy.current = mesh
    for (const piece of meshes) {
      piece.castShadow = false
      piece.userData.inShadowProxy = true
    }
  })

  useEffect(
    () => () => {
      proxy.current?.geometry.dispose()
      proxy.current?.removeFromParent()
    },
    [],
  )
}
