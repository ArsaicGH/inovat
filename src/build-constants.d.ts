// Worked out when the site is built (vite.config.ts): the total size of the files the loading
// screen downloads, and the folders they are in.
declare const __STARTUP_BYTES__: number
declare const __STARTUP_FOLDERS__: string[]
// Each asset's fingerprint, by address (src/asset-url.ts).
declare const __ASSET_VERSIONS__: Record<string, string>
