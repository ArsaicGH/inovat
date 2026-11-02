import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { Matrix4, Mesh, type BufferGeometry, type Group, type Material, type Object3D } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// MERGE STATIC DECORATION: the graphics card draws every separate mesh as its own step,
// and the rotunda alone has about 300 small ones (columns, rails, bulbs...). This wraps
// decoration that never moves and, once it is built, joins all meshes that look the same
// (same material settings) into one big mesh each. Same picture, a fraction of the steps.
// Only for things that never move or change: the merged copy does not follow changes.
// A part that moves or changes inside a merged group is marked
// userData={{ keepSeparate: true }} and left out, with everything inside it.

// Material settings that must match for two meshes to be joined.
function materialKey(material: Material): string {
  const m = material as Material & Record<string, unknown>
  const colour = (value: unknown) => (value && typeof value === 'object' && 'getHexString' in value ? (value as { getHexString: () => string }).getHexString() : '')
  const texture = (value: unknown) => (value && typeof value === 'object' && 'uuid' in value ? (value as { uuid: string }).uuid : '')
  return [
    m.type,
    colour(m.color),
    colour(m.emissive),
    m.emissiveIntensity,
    m.metalness,
    m.roughness,
    texture(m.map),
    texture(m.normalMap),
    texture(m.emissiveMap),
    m.toneMapped,
    m.transparent,
    m.opacity,
    m.side,
    m.flatShading,
    m.polygonOffset,
    m.polygonOffsetFactor,
    m.wireframe,
  ].join('|')
}

export default function MergeStatic({ children }: { children: ReactNode }) {
  const group = useRef<Group>(null)

  useLayoutEffect(() => {
    const root = group.current
    if (!root) return
    root.updateWorldMatrix(true, true)
    const toRoot = new Matrix4().copy(root.matrixWorld).invert()

    // Collect meshes by look (and by shadow settings, which are per mesh).
    const buckets = new Map<string, { material: Material; meshes: Mesh[] }>()
    const collect = (object: Object3D) => {
      if (object.userData.keepSeparate) return
      const mesh = object as Mesh
      if (mesh.isMesh && !Array.isArray(mesh.material) && !(mesh as { isInstancedMesh?: boolean }).isInstancedMesh) {
        const key = `${materialKey(mesh.material)}|${mesh.castShadow}|${mesh.receiveShadow}|${mesh.geometry.index ? 'i' : 'n'}`
        const bucket = buckets.get(key) ?? { material: mesh.material, meshes: [] }
        bucket.meshes.push(mesh)
        buckets.set(key, bucket)
      }
      object.children.forEach(collect)
    }
    collect(root)

    const merged: Mesh[] = []
    const hidden: Mesh[] = []
    for (const { material, meshes } of buckets.values()) {
      if (meshes.length < 2) continue
      const geometries: BufferGeometry[] = meshes.map((mesh) =>
        mesh.geometry.clone().applyMatrix4(new Matrix4().multiplyMatrices(toRoot, mesh.matrixWorld)),
      )
      const joined = mergeGeometries(geometries)
      geometries.forEach((geometry) => geometry.dispose())
      if (!joined) continue // shapes with different data: leave them as they are
      const mesh = new Mesh(joined, material)
      mesh.castShadow = meshes[0].castShadow
      mesh.receiveShadow = meshes[0].receiveShadow
      // Keep a cheaper aiming test if the parts had one (downloaded models, inventions.tsx).
      mesh.raycast = meshes[0].raycast
      root.add(mesh)
      merged.push(mesh)
      meshes.forEach((original) => {
        original.visible = false
        original.userData.mergedAway = true // (a copy of the model shows it again: inventions.tsx)
        // (Hidden for good: not even its place is worked out any more.)
        original.matrixWorldAutoUpdate = false
        hidden.push(original)
      })
    }

    // Nothing here moves, so every object's place is worked out now, once, instead of on
    // every frame (three.js otherwise does it for every object, every frame: together with
    // the hidden rooms, about 2 ms of the processor's time per frame on the leader's
    // laptop). Its place in the world still follows a group around it that moves.
    const frozen: Object3D[] = []
    const freeze = (object: Object3D) => {
      if (object.userData.keepSeparate) return
      object.updateMatrix()
      object.matrixAutoUpdate = false
      frozen.push(object)
      object.children.forEach(freeze)
    }
    freeze(root)

    return () => {
      for (const mesh of merged) {
        root.remove(mesh)
        mesh.geometry.dispose()
      }
      hidden.forEach((mesh) => {
        mesh.visible = true
        mesh.matrixWorldAutoUpdate = true
        delete mesh.userData.mergedAway
      })
      frozen.forEach((object) => (object.matrixAutoUpdate = true))
    }
  }, [])

  return <group ref={group}>{children}</group>
}
