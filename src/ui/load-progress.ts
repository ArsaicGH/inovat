import { create } from 'zustand'

// Download progress of the 3D files (textures and models), for the loading screen. The 3D
// side reports into it (Museum.tsx, from three.js's loading manager); this file itself does
// not load three.js, so the loading screen can show before the 3D code has arrived.
interface LoadProgress {
  active: boolean // files are still downloading
  progress: number // 0-100
  total: number // files in the current batch (0 before the first one starts)
}

export const useLoadProgress = create<LoadProgress>(() => ({ active: false, progress: 0, total: 0 }))

let lastBatchEnd = 0 // files of earlier, finished batches (so each batch counts from 0)

export function reportFileProgress(loaded: number, total: number) {
  if (loaded === total) lastBatchEnd = total
  useLoadProgress.setState({ active: true, total, progress: ((loaded - lastBatchEnd) / (total - lastBatchEnd)) * 100 || 100 })
}

export function reportFilesDone() {
  useLoadProgress.setState({ active: false })
}
