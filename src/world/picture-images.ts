import { useEffect, useState } from 'react'

// PICTURES (photos, paintings and engravings in public/pictures/, listed with their captions
// and credits in content/pictures.ts): each file is loaded once and shared by the 3D boards,
// the wall gallery and the enlarged boards.

const cache = new Map<string, Promise<HTMLImageElement>>()

export function loadPicture(file: string): Promise<HTMLImageElement> {
  let promise = cache.get(file)
  if (!promise) {
    promise = new Promise((resolve, reject) => {
      const image = new Image()
      image.decoding = 'async'
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = `/${file}`
    })
    cache.set(file, promise)
  }
  return promise
}

// The loaded picture, or null while it loads (whatever shows it is painted again once it
// arrives).
export function usePicture(file: string | undefined): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    setImage(null)
    if (!file) return
    let live = true
    loadPicture(file).then(
      (loaded) => live && setImage(loaded),
      () => {}, // (a missing picture leaves its space empty)
    )
    return () => {
      live = false
    }
  }, [file])
  return image
}
