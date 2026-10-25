import { LANGUAGES, languageNames } from '../content/language'
import { useMuseumStore } from '../state/useMuseumStore'

// Pill-shaped switch between Tiếng Việt and English (start screen and pause menu).
// Changing it switches every text in the game at once, including the 3D signs and boards.
export default function LanguageSwitch({ label }: { label?: string }) {
  const language = useMuseumStore((state) => state.language)
  const setLanguage = useMuseumStore((state) => state.setLanguage)

  return (
    <div className="language-setting language-title">
      {label && <span>{label}</span>}
      <div className="language-switch" role="radiogroup" aria-label={label ?? 'Language'}>
        {LANGUAGES.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={language === option}
            className={language === option ? 'language-option language-option-on' : 'language-option'}
            onClick={() => setLanguage(option)}
          >
            {languageNames[option]}
          </button>
        ))}
      </div>
    </div>
  )
}
