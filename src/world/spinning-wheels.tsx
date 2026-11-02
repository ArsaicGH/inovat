import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, Group, Mesh, Vector3 } from 'three'

// SPINNING WHEELS for a downloaded model that is one solid piece (the Rocket in the ending
// film): its wheels cannot turn on their own. Each wheel is a separate piece of the shape,
// though (its rim, spokes and hub are not joined to the frame), so the pieces that lie
// wholly inside a wheel's circle, on the outside of the frame, are lifted out into their
// own part that turns about the axle. The rest stays as it was. Only for copies of a model
// (the shapes' data is shared, not changed, but the copy's mesh is given a new shape).

// One axle, in the model's own units: the axle's height (y) and place along the model (z),
// and the wheels' radius. The wheels turn about the model's x axis.
export interface Axle {
  y: number
  z: number
  r: number
}

// How far out from the middle a wheel piece starts (the frame and the firebox, nearer the
// middle, stay put).
const OUTSIDE = 0.19

export function splitWheels(mesh: Mesh, axles: Axle[], outside = OUTSIDE): Group[] {
  const geometry = mesh.geometry
  const position = geometry.getAttribute('position') as BufferAttribute
  const index = geometry.index
  if (!index) return []
  const count = position.count

  // Points at the same place are the same point (the file repeats them for each face).
  const same = new Int32Array(count)
  const seen = new Map<string, number>()
  for (let i = 0; i < count; i++) {
    const key = `${position.getX(i).toFixed(4)},${position.getY(i).toFixed(4)},${position.getZ(i).toFixed(4)}`
    const first = seen.get(key)
    same[i] = first ?? i
    if (first === undefined) seen.set(key, i)
  }
  // Pieces: groups of triangles joined to each other.
  const parent = new Int32Array(count).map((_, i) => i)
  const find = (a: number): number => {
    while (parent[a] !== a) a = parent[a] = parent[parent[a]]
    return a
  }
  for (let t = 0; t < index.count; t += 3) {
    const a = find(same[index.getX(t)])
    for (let k = 1; k < 3; k++) {
      const b = find(same[index.getX(t + k)])
      if (a !== b) parent[b] = a
    }
  }
  // Each piece's extent.
  const box = new Map<number, number[]>() // [min x, max x, min y, max y, min z, max z]
  for (let i = 0; i < count; i++) {
    const piece = find(same[i])
    const b = box.get(piece) ?? [Infinity, -Infinity, Infinity, -Infinity, Infinity, -Infinity]
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i)
    b[0] = Math.min(b[0], x); b[1] = Math.max(b[1], x)
    b[2] = Math.min(b[2], y); b[3] = Math.max(b[3], y)
    b[4] = Math.min(b[4], z); b[5] = Math.max(b[5], z)
    box.set(piece, b)
  }
  // Which axle a piece turns with (-1: none).
  const axleOf = new Map<number, number>()
  for (const [piece, b] of box) {
    let found = -1
    if (Math.min(Math.abs(b[0]), Math.abs(b[1])) >= outside && Math.sign(b[0]) === Math.sign(b[1]))
      axles.forEach((axle, n) => {
        const inside = [b[2], b[3]].every((y) => [b[4], b[5]].every((z) => Math.hypot(y - axle.y, z - axle.z) <= axle.r + 0.01))
        if (inside) found = n
      })
    axleOf.set(piece, found)
  }

  // New lists of triangles: the rest, and one per axle.
  const lists: number[][] = [[], ...axles.map(() => [])]
  for (let t = 0; t < index.count; t += 3) {
    const n = axleOf.get(find(same[index.getX(t)])) ?? -1
    lists[n + 1].push(index.getX(t), index.getX(t + 1), index.getX(t + 2))
  }
  const shape = (triangles: number[]) => {
    const part = new BufferGeometry()
    for (const name of Object.keys(geometry.attributes)) part.setAttribute(name, geometry.getAttribute(name))
    part.setIndex(triangles)
    return part
  }
  mesh.geometry = shape(lists[0])

  return axles.map((axle, n) => {
    // A turning point on the axle, holding the wheels placed back where they were.
    const pivot = new Group()
    pivot.position.set(0, axle.y, axle.z)
    pivot.userData.keepSeparate = true // (never joined with the rest: MergeStatic)
    pivot.userData.radius = axle.r
    const wheels = new Mesh(shape(lists[n + 1]), mesh.material)
    wheels.position.set(0, -axle.y, -axle.z)
    wheels.raycast = mesh.raycast
    pivot.add(wheels)
    mesh.add(pivot)
    return pivot
  })
}

// Turns the wheels as far as the model has rolled since the last frame (forward along the
// model's own z: a turn of the radius for every radius travelled).
const moved = new Vector3()
const now = new Vector3()
const forward = new Vector3()
const scale = new Vector3()
export function WheelSpin({ pivots }: { pivots: Group[] }) {
  const last = useRef<Vector3 | null>(null)
  useFrame(() => {
    const body = pivots[0]?.parent
    if (!body) return
    now.setFromMatrixPosition(body.matrixWorld)
    if (last.current) {
      forward.setFromMatrixColumn(body.matrixWorld, 2).normalize()
      scale.setFromMatrixScale(body.matrixWorld)
      const rolled = moved.subVectors(now, last.current).dot(forward)
      for (const pivot of pivots) pivot.rotation.x += rolled / (pivot.userData.radius * scale.x)
    } else last.current = new Vector3()
    last.current.copy(now)
  })
  return null
}
