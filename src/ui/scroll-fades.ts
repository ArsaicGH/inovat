import { useEffect, useRef } from 'react'

// SCROLLING TEXT AREAS (enlarged boards, the Time Machine window, the ending's thank-you):
// on short windows (phones, or laptops with large display scaling) their text scrolls. It
// then fades out at the top or bottom edge, only where more text lies beyond that edge, so
// scrolled text never runs into the frame's margins. (The fades are the class "scroll-fade"
// in index.css.)

function updateFades(element: HTMLElement) {
  element.classList.toggle('fade-top', element.scrollTop > 1)
  element.classList.toggle('fade-bottom', element.scrollTop + element.clientHeight < element.scrollHeight - 1)
}

// Returns the ref for the scrolling element. key: when it changes (a new board, a new round),
// the text starts again at the top.
export function useScrollFades<T extends HTMLElement>(key: unknown) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    element.scrollTop = 0
    const update = () => updateFades(element)
    update()
    element.addEventListener('scroll', update, { passive: true })
    // (The text's length changes with the window's size, the language and the round.)
    const observer = new ResizeObserver(update)
    observer.observe(element)
    for (const child of element.children) observer.observe(child)
    return () => {
      element.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [key])
  return ref
}
