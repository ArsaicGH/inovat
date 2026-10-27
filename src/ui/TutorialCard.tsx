import { useEffect } from 'react'
import { useMuseumStore, TUTORIAL_STEPS } from '../state/useMuseumStore'
import { useContent } from '../content/use-content'

// The last card ("have fun") needs nothing done: it closes by itself after this long.
const ENJOY_SECONDS = 5

// The current tutorial instruction, at the top of the screen while walking. The first card
// (the welcome) sits in the middle of the screen, so it is noticed at once. The step is
// completed by doing it (Player.tsx / Interaction.tsx notice and move on).
export default function TutorialCard() {
  const { ui } = useContent()
  const step = useMuseumStore((state) => state.tutorial)
  useEffect(() => {
    if (step !== 'enjoy') return
    const timer = window.setTimeout(() => useMuseumStore.getState().advanceTutorial('enjoy'), ENJOY_SECONDS * 1000)
    return () => window.clearTimeout(timer)
  }, [step])
  if (!step || step === 'done') return null

  const total = TUTORIAL_STEPS.length - 1 // "done" is not a step to do
  const progress = ui.tutorial.progress
    .replace('{n}', String(TUTORIAL_STEPS.indexOf(step) + 1))
    .replace('{total}', String(total))
  const current = ui.tutorial.steps[step]
  const { title, text } = current
  // Only some steps have an extra tip (the first one recommends full screen).
  const tip = 'tip' in current ? current.tip : null

  return (
    // key={step}: a new card (with its fade-in) for every step.
    <div key={step} className={step === TUTORIAL_STEPS[0] ? 'tutorial-card tutorial-card-centre' : 'tutorial-card'}>
      <div className="tutorial-progress">{progress}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {tip && <p className="tutorial-tip">{tip}</p>}
    </div>
  )
}
