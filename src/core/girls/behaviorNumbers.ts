export const extendedBehaviorNumberMin = 0
export const extendedBehaviorNumberMax = 500
export const extendedBehaviorNumberNeutral = 100

export function createExtendedBehaviorNumberOptions() {
  return Array.from(
    {length: extendedBehaviorNumberMax - extendedBehaviorNumberMin + 1},
    (_, index) => String(extendedBehaviorNumberMin + index)
  )
}

export function normalizeExtendedBehaviorNumber(
  value: unknown,
  fallback: string = String(extendedBehaviorNumberNeutral)
) {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return fallback
  }

  const numericValue = Number(trimmed)

  if (
    Number.isInteger(numericValue) &&
    numericValue >= extendedBehaviorNumberMin &&
    numericValue <= extendedBehaviorNumberMax
  ) {
    return String(numericValue)
  }

  return fallback
}

type ExtendedBehaviorNumberTone = {
  label: string
  sentenceOne: string
  sentenceThree: string
  sentenceFive: string
}

type PhraseSets = {
  first: string[]
  second: string[]
  third: string[]
}

type ToneBand = {
  label: string
  sentenceOne: PhraseSets
  sentenceThree: PhraseSets
  sentenceFive: PhraseSets
}

const toneBands: Array<{
  min: number
  max: number
  buildTone: (score: number) => ExtendedBehaviorNumberTone
}> = [
  {
    min: 0,
    max: 50,
    buildTone: score => buildBandTone(score, 0, {
      label: 'Good',
      sentenceOne: {
        first: ['clear', 'fresh', 'bright', 'easy', 'healthy'],
        second: ['good-range', 'clean-air', 'steady', 'sunlit', 'balanced'],
        third: ['confidence', 'rhythm', 'spark', 'flow', 'lift'],
      },
      sentenceThree: {
        first: ['clean', 'steady', 'light', 'kind', 'managed'],
        second: ['hallway', 'classroom', 'moment', 'choice', 'scene'],
        third: ['energy', 'balance', 'glow', 'ease', 'calm'],
      },
      sentenceFive: {
        first: ['good', 'healthy', 'easygoing', 'steady', 'clean'],
        second: ['and', 'yet', 'while', 'and', 'while'],
        third: [
          'easy to take in',
          'simple to read',
          'free of heavy pressure',
          'bright to everyone nearby',
          'calm in the room',
        ],
      },
    }),
  },
  {
    min: 51,
    max: 100,
    buildTone: score => {
      if (score === extendedBehaviorNumberNeutral) {
        return {
          label: 'Statisfactory',
          sentenceOne: 'in a plain and neutral way',
          sentenceThree: 'while the moment stayed plain, balanced, and ordinary',
          sentenceFive: 'plain and neutral',
        }
      }

      return buildBandTone(score, 51, {
        label: 'Statisfactory',
        sentenceOne: {
          first: ['settled', 'plain', 'workable', 'middle', 'acceptable'],
          second: ['Statisfactory', 'steady', 'ordinary', 'even', 'okay'],
          third: ['tone', 'rhythm', 'balance', 'shape', 'flow'],
        },
        sentenceThree: {
          first: ['ordinary', 'middle', 'plain', 'calm', 'steady'],
          second: ['classroom', 'moment', 'scene', 'choice', 'room'],
          third: ['balance', 'pattern', 'rhythm', 'shape', 'settling'],
        },
        sentenceFive: {
          first: ['acceptable', 'settled', 'plainly okay', 'ordinary', 'even'],
          second: ['and', 'while', 'yet', 'and', 'while'],
          third: [
            'easy to follow',
            'without extra shine',
            'steady enough to pass',
            'quiet in the middle',
            'calm enough for the room',
          ],
        },
      })
    },
  },
  {
    min: 101,
    max: 200,
    buildTone: score => buildBandTone(score, 101, {
      label: 'Moderately Weak',
      sentenceOne: {
        first: ['slipping', 'shaky', 'weaker', 'uncertain', 'dipping'],
        second: ['middle-range', 'moderate-weak', 'uneasy', 'off-center', 'strained'],
        third: ['tone', 'rhythm', 'pressure', 'drift', 'pull'],
      },
      sentenceThree: {
        first: ['uneasy', 'weaker', 'off-balance', 'strained', 'slipping'],
        second: ['scene', 'room', 'moment', 'choice', 'classroom'],
        third: ['feeling', 'drag', 'tilt', 'strain', 'weight'],
      },
      sentenceFive: {
        first: ['moderately weak', 'shaky', 'strained', 'off-center', 'plainly weaker'],
        second: ['and', 'while', 'yet', 'and', 'while'],
        third: [
          'a little uneasy',
          'easy to notice',
          'short on steadiness',
          'pulled away from neutral',
          'harder on the room',
        ],
      },
    }),
  },
  {
    min: 201,
    max: 300,
    buildTone: score => buildBandTone(score, 201, {
      label: 'Very Weak',
      sentenceOne: {
        first: ['drooping', 'wobbling', 'fading', 'fragile', 'heavy'],
        second: ['very-weak', 'unsteady', 'sagging', 'uneasy', 'downward'],
        third: ['tone', 'rhythm', 'feeling', 'drift', 'weight'],
      },
      sentenceThree: {
        first: ['weak', 'droopy', 'unsteady', 'fragile', 'sinking'],
        second: ['moment', 'room', 'scene', 'choice', 'classroom'],
        third: ['pressure', 'mood', 'tilt', 'weight', 'drag'],
      },
      sentenceFive: {
        first: ['very weak', 'droopy', 'wobbly', 'uneasy', 'fragile'],
        second: ['and', 'while', 'yet', 'and', 'while'],
        third: [
          'hard to ignore',
          'clearly off',
          'too weak for comfort',
          'bigger in the room',
          'bothersome nearby',
        ],
      },
    }),
  },
  {
    min: 301,
    max: 400,
    buildTone: score => buildBandTone(score, 301, {
      label: 'Very Bad',
      sentenceOne: {
        first: ['rough', 'harsh', 'severe', 'unpleasant', 'hard'],
        second: ['very-bad', 'dragging', 'pressing', 'nasty', 'troubling'],
        third: ['tone', 'force', 'rhythm', 'weight', 'push'],
      },
      sentenceThree: {
        first: ['rough', 'hard', 'bad', 'harsh', 'pressing'],
        second: ['room', 'moment', 'scene', 'choice', 'classroom'],
        third: ['strain', 'drop', 'pressure', 'mood', 'weight'],
      },
      sentenceFive: {
        first: ['very bad', 'rough', 'harsh', 'hard', 'uncomfortable'],
        second: ['and', 'while', 'yet', 'and', 'while'],
        third: [
          'hard to sit with',
          'clearly not okay',
          'heavy on the room',
          'intensely unpleasant',
          'pushing everyone down',
        ],
      },
    }),
  },
  {
    min: 401,
    max: 500,
    buildTone: score => buildBandTone(score, 401, {
      label: 'Severely Bad',
      sentenceOne: {
        first: ['overwhelming', 'crushing', 'severe', 'deeply upsetting', 'swallowing'],
        second: ['severe-bad', 'heavy', 'harsh', 'all-the-way-down', 'blunt'],
        third: ['force', 'weight', 'tone', 'pressure', 'drop'],
      },
      sentenceThree: {
        first: ['severe', 'overwhelming', 'crushing', 'heavy', 'harsh'],
        second: ['room', 'scene', 'moment', 'choice', 'classroom'],
        third: ['tension', 'weight', 'mood', 'pressure', 'collapse'],
      },
      sentenceFive: {
        first: ['severely bad', 'overwhelming', 'crushing', 'harsh', 'heavy'],
        second: ['and', 'while', 'yet', 'and', 'while'],
        third: [
          'impossible to miss',
          'full of severe pressure',
          'from start to finish',
          'as bad as the scale gets',
          'big enough to swallow the moment',
        ],
      },
    }),
  },
]

function buildBandTone(score: number, min: number, band: ToneBand) {
  const offset = Math.max(0, score - min)
  const sentenceOne = buildUniquePhrase(offset, band.sentenceOne)
  const sentenceThree = buildUniquePhrase(offset, band.sentenceThree)
  const sentenceFive = buildUniquePhrase(offset, band.sentenceFive)

  return {
    label: band.label,
    sentenceOne: `with ${sentenceOne}`,
    sentenceThree: `while the moment carried ${sentenceThree}`,
    sentenceFive,
  }
}

function buildUniquePhrase(offset: number, sets: PhraseSets) {
  const firstLength = Math.max(1, sets.first.length)
  const secondLength = Math.max(1, sets.second.length)
  const thirdLength = Math.max(1, sets.third.length)

  const first = sets.first[offset % firstLength]
  const second = sets.second[Math.floor(offset / firstLength) % secondLength]
  const third =
    sets.third[
      Math.floor(offset / (firstLength * secondLength)) % thirdLength
    ]

  return `${first} ${second} ${third}`
}

export function getExtendedBehaviorNumberTone(value: unknown) {
  const score = Number(normalizeExtendedBehaviorNumber(value))
  const matchingBand = toneBands.find(band => score >= band.min && score <= band.max)

  if (!matchingBand) {
    return {
      label: 'Statisfactory',
      sentenceOne: 'in a plain and neutral way',
      sentenceThree: 'while the moment stayed plain, balanced, and ordinary',
      sentenceFive: 'plain and neutral',
    }
  }

  return matchingBand.buildTone(score)
}
