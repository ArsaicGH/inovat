// The museum is bilingual: every visible text exists in Vietnamese and English (CLAUDE.md).
// Vietnamese is the default; the visitor switches on the start screen or in the pause menu.
export type Language = 'vi' | 'en'

export const LANGUAGES: Language[] = ['vi', 'en']

// Each language's own name, shown on the language switch (the same in both languages).
export const languageNames: Record<Language, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
}
