import { ShaderChunk } from 'three'

// SKIPPING LIGHT THAT DOES NOT ARRIVE. For every pixel, three.js works out the light of
// every lamp: the museum has nine (the key light, six spotlights, two lamps), and each one
// costs a full lighting formula. Most pixels are outside most spotlights' cones, where the
// lamp's light is zero and the formula's result is multiplied by zero. Three.js already
// knows this ("visible" is false outside the cone, or when the lamp is off), so the formula
// is now skipped there: exactly the same picture, about a fifth less drawing work for the
// lit rooms on the leader's laptop. Applied once, before anything is drawn (Museum.tsx).

const DIRECT_LIGHT = 'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );'

const parts = ShaderChunk.lights_fragment_begin.split(DIRECT_LIGHT)
// The first two uses are the lamps (point lights) and the spotlights; the sun and
// directional lights after them (the museum has none) are left as they are.
if (parts.length >= 3) {
  ShaderChunk.lights_fragment_begin = parts
    .map((part, i) => (i === 0 ? part : (i <= 2 ? `if ( directLight.visible ) ${DIRECT_LIGHT}` : DIRECT_LIGHT) + part))
    .join('')
}
