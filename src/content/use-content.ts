import type { Language } from './language'
import { siteText } from './site'
import { uiText } from './ui'
import { roomNamesText } from './rooms'
import { getExhibitText } from './exhibits'
import { useMuseumStore } from '../state/useMuseumStore'

// All text in the visitor's chosen language. Components call useContent(); when the
// language changes, every component (and every painted 3D sign and board) redraws.
export function getContent(language: Language) {
  return {
    language,
    site: siteText[language],
    ui: uiText[language],
    roomNames: roomNamesText[language],
    exhibit: (id: string) => getExhibitText(id, language),
  }
}

// One ready-made bundle per language, so the same objects are reused (no needless redraws).
const CONTENT = { vi: getContent('vi'), en: getContent('en') }

export type Content = ReturnType<typeof getContent>

export function useContent(): Content {
  const language = useMuseumStore((state) => state.language)
  return CONTENT[language]
}
