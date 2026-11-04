import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'vite'

// What the loading screen downloads before the title screen (in public/): the 3D models,
// the surface textures, the pictures, the fonts and the texture decoder. (The music is
// fetched later, room by room.) Its total size is worked out here, when the site is built,
// so the loading screen can show "12.3 / 25.1 MB".
const STARTUP_FOLDERS = ['models', 'textures', 'pictures', 'fonts', 'basis']
function folderBytes(dir: string): number {
  return readdirSync(dir, { withFileTypes: true }).reduce((sum, entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sum + folderBytes(path)
    return entry.name.endsWith('.txt') ? sum : sum + statSync(path).size
  }, 0)
}
const startupBytes = STARTUP_FOLDERS.reduce((sum, folder) => sum + folderBytes(join('public', folder)), 0)

// A fingerprint of every asset's contents (src/asset-url.ts): the first 10 characters of its
// SHA-1, by address. A changed file gets a new fingerprint, so browsers fetch it again.
const VERSIONED_FOLDERS = ['models', 'textures', 'pictures', 'sounds', 'fonts']
function fingerprints(dir: string, into: Record<string, string>) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) fingerprints(path, into)
    else into['/' + path.slice('public'.length + 1).replaceAll('\\', '/')] = createHash('sha1').update(readFileSync(path)).digest('hex').slice(0, 10)
  }
  return into
}
const assetVersions = VERSIONED_FOLDERS.reduce((map, folder) => fingerprints(join('public', folder), map), {} as Record<string, string>)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __STARTUP_BYTES__: JSON.stringify(startupBytes),
    __STARTUP_FOLDERS__: JSON.stringify(STARTUP_FOLDERS),
    __ASSET_VERSIONS__: JSON.stringify(assetVersions),
  },
})
