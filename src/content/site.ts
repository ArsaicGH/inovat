import type { Language } from './language'

// All visible website text lives in src/content/, in both languages (see CLAUDE.md).
const vi = {
  name: 'INOVAT',
  subtitle: 'Bảo tàng Cách mạng Công nghiệp',
  tagline: 'Bảo tàng 3D về bốn cuộc Cách mạng Công nghiệp, sắp ra mắt.',
  // Browser tab title.
  pageTitle: 'INOVAT - Bảo tàng Cách mạng Công nghiệp',
}

const en: typeof vi = {
  name: 'INOVAT',
  subtitle: 'Museum of the Industrial Revolutions',
  tagline: 'A 3D museum of the four Industrial Revolutions, coming soon.',
  pageTitle: 'INOVAT - Museum of the Industrial Revolutions',
}

export const siteText: Record<Language, typeof vi> = { vi, en }
