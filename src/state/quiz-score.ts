import type { QuizQuestion } from '../content/quiz'

// QUIZ SCORING, kept separate (no React, no browser) so a plain test script can check it.
// answers[i] = the option chosen for question i (0-3), or null if not answered.

export function scoreQuiz(questions: QuizQuestion[], answers: (number | null)[]): number {
  return questions.reduce((score, question, i) => score + (answers[i] === question.answer ? 1 : 0), 0)
}

// Which results message to show: 'great' (80 % or more), 'good' (50 % or more), 'retry'.
export type ResultLevel = 'great' | 'good' | 'retry'

export function resultLevel(score: number, total: number): ResultLevel {
  if (total > 0 && score / total >= 0.8) return 'great'
  if (total > 0 && score / total >= 0.5) return 'good'
  return 'retry'
}
