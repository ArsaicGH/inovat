// FILE ADDRESSES WITH A FINGERPRINT. When the site is built, each model, texture, picture,
// sound and font gets a short fingerprint of its contents (vite.config.ts). Every file is
// asked for with it, e.g. /models/ir1/watt-steam-engine.glb?v=3f9a12c0b4, and the browser
// keeps such addresses for good (vercel.json). A file that changes gets a new fingerprint,
// so a new address: visitors download the new version at once, and only that file.
// A file missing from the list keeps its plain address (and the server's normal checking).
export function assetUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  const version = __ASSET_VERSIONS__[clean]
  return version ? `${clean}?v=${version}` : clean
}
