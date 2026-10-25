import type { Object3D } from 'three'

// Objects the crosshair can hit: exhibits (which carry `userData.exhibitId`) and walls
// (which block aiming, so you cannot open an exhibit through a wall).
export const aimTargets: Object3D[] = []

export function addAimTarget(object: Object3D) {
  aimTargets.push(object)
}

export function removeAimTarget(object: Object3D) {
  const index = aimTargets.indexOf(object)
  if (index >= 0) aimTargets.splice(index, 1)
}

// Walk up from a hit mesh to the exhibit group it belongs to (if any).
export function exhibitIdOf(object: Object3D | null): string | null {
  for (let o = object; o; o = o.parent) {
    if (typeof o.userData.exhibitId === 'string') return o.userData.exhibitId
  }
  return null
}
