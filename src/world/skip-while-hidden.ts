import { Object3D } from 'three'

// A hidden group skips the position update of everything inside it. Three.js otherwise
// works out every object's place again on every frame, seen or not: for the museum's hidden
// rooms (500 to 750 objects each) and the ending's world (about 2,500), built ahead and
// hidden, about 1.5 ms of the processor's time per frame on the leader's laptop, for nothing.
// When the group is shown again, all of it is brought up to date at once.
export function skipWhileHidden(group: Object3D) {
  let stale = false
  group.updateMatrixWorld = function (force?: boolean) {
    if (!this.visible) {
      stale = true
      return
    }
    Object3D.prototype.updateMatrixWorld.call(this, force || stale)
    stale = false
  }
}
