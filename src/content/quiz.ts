import type { Language } from './language'

// QUIZ QUESTIONS for the Game Room, in both languages. PLACEHOLDERS ONLY: clearly fake
// questions until the group's content document is ready (PLAN.md Phase D). Real questions
// replace these, in BOTH languages at once, and each needs a real source.
//
// The correct answer (`answer`, 0-3 = A-D) is shared by both languages, so the two
// versions can never disagree.

export interface QuizText {
  question: string
  options: [string, string, string, string]
  explanation: string // shown right after answering
}

export interface QuizQuestion {
  id: string
  era: 1 | 2 | 3 | 4 // which revolution it is about
  answer: 0 | 1 | 2 | 3
  text: Record<Language, QuizText>
  sources: string[] // required for real questions (empty while a placeholder)
  placeholder: boolean
}

const NOTE: Record<Language, string> = { vi: '[CẦN KIỂM TRA]', en: '[NEEDS CHECKING]' }
const LETTERS = ['A', 'B', 'C', 'D']

function placeholder(n: number, era: 1 | 2 | 3 | 4, answer: 0 | 1 | 2 | 3): QuizQuestion {
  const letter = LETTERS[answer]
  return {
    id: `q${n}`,
    era,
    answer,
    text: {
      vi: {
        question: `Câu hỏi mẫu số ${n} về Cách mạng Công nghiệp lần thứ ${['nhất', 'hai', 'ba', 'tư'][era - 1]}. ${NOTE.vi}`,
        options: ['Đáp án mẫu A', 'Đáp án mẫu B', 'Đáp án mẫu C', 'Đáp án mẫu D'],
        explanation: `Đây là câu hỏi mẫu, đáp án đúng được đặt là ${letter}. Câu hỏi thật sẽ được bổ sung sau. ${NOTE.vi}`,
      },
      en: {
        question: `Sample question no. ${n} about the ${['First', 'Second', 'Third', 'Fourth'][era - 1]} Industrial Revolution. ${NOTE.en}`,
        options: ['Sample answer A', 'Sample answer B', 'Sample answer C', 'Sample answer D'],
        explanation: `This is a sample question; its correct answer is set to ${letter}. Real questions will be added later. ${NOTE.en}`,
      },
    },
    sources: [],
    placeholder: true,
  }
}

// Two per revolution, in visiting order. Correct answers are spread over A-D.
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  placeholder(1, 1, 0),
  placeholder(2, 1, 2),
  placeholder(3, 2, 1),
  placeholder(4, 2, 3),
  placeholder(5, 3, 2),
  placeholder(6, 3, 0),
  placeholder(7, 4, 3),
  placeholder(8, 4, 1),
]
