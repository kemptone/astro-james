export type SoundLevel = {
  name: string
  range: {
    min: number
    max: number
  }
  symbol: string
  css: string
}

export const soundLevels: SoundLevel[] = [
  {
    name: 'Silent',
    range: {
      min: 0,
      max: 10,
    },
    symbol: '🎧',
    css: 'silent'
  },
  {
    name: 'Very Quiet',
    range: {
      min: 10,
      max: 20,
    },
    symbol: '🐟',
    css: 'quiet'
  },
  {
    name: 'Quiet Room',
    range: {
      min: 20,
      max: 30,
    },
    symbol: '🎼',
    css: 'quiet-room'
  },
  {
    name: 'Conversation',
    range: {
      min: 30,
      max: 40,
    },
    symbol: '🐸',
    css: 'conversation'
  },
  {
    name: 'Background Noise',
    range: {
      min: 40,
      max: 50,
    },
    symbol: '🐈',
    css: 'background'
  },
  {
    name: 'Busy Street',
    range: {
      min: 50,
      max: 60,
    },
    symbol: '🐕',
    css: 'busy-street'
  },
  {
    name: 'Loud Music',
    range: {
      min: 60,
      max: 70,
    },
    symbol: '🐘',
    css: 'loud-music'
  },
  {
    name: 'Noisy Workplace',
    range: {
      min: 70,
      max: 80,
    },
    symbol: '🐉',
    css: 'noisy-workplace'
  },
  {
    name: 'Very Noisy',
    range: {
      min: 80,
      max: 90,
    },
    symbol: '👹',
    css: 'very-noisy'
  },
  {
    name: 'Extremely Loud',
    range: {
      min: 90,
      max: 10000,
    },
    symbol: '🎆',
    css: 'extremely-loud'
  },
]
