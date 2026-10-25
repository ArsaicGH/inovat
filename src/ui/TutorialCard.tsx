import { ui } from '../content/ui'
import { useMuseumStore, TUTORIAL_STEPS } from '../state/useMuseumStore'

// The current tutorial instruction, at the top of the screen while walking. The step is
// completed by doing it (Player.tsx / Interaction.tsx notice and move on).
export default function TutorialCard() {
  const step = useMuseumStore((state) => state.tutorial)
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
    <div key={step} className="tutorial-card">
      <div className="tutorial-progress">{progress}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {tip && <p className="tutorial-tip">{tip}</p>}
    </div>
  )
}
