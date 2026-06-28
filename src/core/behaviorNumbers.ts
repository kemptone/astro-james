export const behaviorMomentMin = 0
export const behaviorMomentMax = 100
export const behaviorMomentNeutral = 50
export const behaviorMomentWorst = 44
export const behaviorMomentBest = 56

const legacyScoreMap: Record<string, string> = {
  worst: '44',
  neutral: '50',
  best: '56',
}

const coreLabels: Record<number, string> = {
  56: 'Best',
  55: '10',
  54: '9',
  53: '8',
  52: '7',
  51: '6',
  50: 'Neutral',
  49: '4',
  48: '3',
  47: '2',
  46: '1',
  45: '0',
  44: 'Worst',
}

export type BehaviorMomentTone =
  | 'best'
  | 'good'
  | 'mid'
  | 'warn'
  | 'danger'
  | 'void'

export type BehaviorMomentOptions = {
  opening: string
  noticeLead: string
  notice: string
  handling: string
  sounded: string
  teacher: string
  classmates: string
  ending: string
}

const coreOptions: Record<number, BehaviorMomentOptions> = {
  44: {
    opening: 'in an extra harsh and horrible way',
    noticeLead: 'The problem grew bigger because',
    notice: 'as rough as it could get',
    handling: 'moved through a trouble moment',
    sounded: 'harsh, ugly, frightening, and far beyond okay',
    teacher: 'sounded extremely upset and serious about it',
    classmates: 'frightening and awful',
    ending: 'as ugly as players ever let it get',
  },
  45: {
    opening: 'in a harsh and horrible way',
    noticeLead: 'The problem grew bigger because',
    notice: 'awful right away',
    handling: 'moved through a trouble moment',
    sounded: 'harsh, ugly, and horrible',
    teacher: 'sounded very upset and serious about it',
    classmates: 'horrible in the worst regular number way',
    ending: 'horribly',
  },
  46: {
    opening: 'in a very bad way',
    noticeLead: 'The problem grew bigger because',
    notice: 'too intense very fast',
    handling: 'moved through a trouble moment',
    sounded: 'mean and like too much pressure on the teacher',
    teacher: 'became very upset and serious about it',
    classmates: 'ugly',
    ending: 'very badly',
  },
  47: {
    opening: 'in a very rough way',
    noticeLead: 'The problem grew bigger because',
    notice: 'very off',
    handling: 'moved through a trouble moment',
    sounded: 'rough from start to finish',
    teacher: 'looked ready to step in because the scene felt too rough',
    classmates: 'very rough',
    ending: 'too rough',
  },
  48: {
    opening: 'in a clearly bad way',
    noticeLead: 'The problem grew bigger because',
    notice: 'clearly wrong',
    handling: 'moved through a trouble moment',
    sounded: 'sour and wrong',
    teacher: 'had to step in because it was clearly not going well',
    classmates: 'bad',
    ending: 'wrong',
  },
  49: {
    opening: 'in a slightly weak way',
    noticeLead: 'The problem grew bigger because',
    notice: 'weak and starting to head toward trouble',
    handling: 'moved through a trouble moment',
    sounded: 'too easy to notice in the wrong way',
    teacher: 'spoke in a disappointed voice because it was starting to become trouble',
    classmates: 'starting to slip into trouble',
    ending: 'into trouble',
  },
  50: {
    opening: 'in a plain and neutral way',
    noticeLead: 'Everyone noticed because',
    notice: 'calm and ordinary',
    handling: 'handled it in a no-trouble way',
    sounded: 'plain, balanced, and ordinary',
    teacher: 'treated it as a plain and ordinary moment',
    classmates: 'plain and neutral',
    ending: 'in a plain and neutral way',
  },
  51: {
    opening: 'in a pretty good way',
    noticeLead: 'Everyone noticed because',
    notice: 'a bit powerful',
    handling: 'handled it in a no-trouble way',
    sounded: 'clear and not weak',
    teacher: 'responded warmly because it felt clearly good',
    classmates: 'pretty good',
    ending: 'in a pretty good way',
  },
  52: {
    opening: 'in a strong way',
    noticeLead: 'Everyone noticed because',
    notice: 'like a normal strong good moment',
    handling: 'handled it in a no-trouble way',
    sounded: 'strong and clear',
    teacher: 'made it clear the strong good moment mattered',
    classmates: 'normal strong good',
    ending: 'in a strong good way',
  },
  53: {
    opening: 'in an excellent and super strong way',
    noticeLead: 'Everyone noticed because',
    notice: 'remarkable right away',
    handling: 'handled it in a no-trouble way',
    sounded: 'powerful and very easy to notice',
    teacher: 'spoke about it like a standout excellent moment',
    classmates: 'super strong and game-worthy',
    ending: 'in a standout good way',
  },
  54: {
    opening: 'in an excellent way',
    noticeLead: 'Everyone noticed because',
    notice: 'charming and remarkable',
    handling: 'handled it in a no-trouble way',
    sounded: 'beautiful, charming, and strong',
    teacher: 'treated it like a truly excellent moment that deserved a big reward',
    classmates: 'excellent and Oreo-box worthy',
    ending: 'in a charming and remarkable way',
  },
  55: {
    opening: 'in the best possible numbered way',
    noticeLead: 'Everyone noticed because',
    notice: 'remarkable, like standing in front of the class',
    handling: 'handled it in a no-trouble way',
    sounded: 'clear, remarkable, and at its best numbered level',
    teacher: 'treated it like one of the most remarkable moments of the day',
    classmates: 'strong and memorable',
    ending: 'in one of the best numbered ways possible',
  },
  56: {
    opening: 'in an extra special way that felt even better than 10',
    noticeLead: 'Everyone noticed because',
    notice: 'incredibly special right away',
    handling: 'handled it in a no-trouble way',
    sounded: 'amazing, respectful, and very special',
    teacher: 'treated it like an absolute best behavior moment',
    classmates: 'rare and very special',
    ending: 'in a very special and amazing way',
  },
}

function getHigherThanBestText(difference: number) {
  return difference === 1
    ? '1 step higher than Best'
    : `${difference} steps higher than Best`
}

function getLowerThanWorstText(difference: number) {
  return difference === 1
    ? '1 step lower than Worst'
    : `${difference} steps lower than Worst`
}

function getHigherThanBestNumberText(score: number, difference: number) {
  return `behavior number ${score} was ${getHigherThanBestText(difference)}`
}

function getLowerThanWorstNumberText(score: number, difference: number) {
  return `behavior number ${score} was ${getLowerThanWorstText(difference)}`
}

export function createBehaviorMomentScoreOptions() {
  return Array.from(
    {length: behaviorMomentMax - behaviorMomentMin + 1},
    (_, index) => String(behaviorMomentMax - index)
  )
}

export function normalizeBehaviorMomentScore(
  value: unknown,
  fallback: string = String(behaviorMomentNeutral)
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
    numericValue >= behaviorMomentMin &&
    numericValue <= behaviorMomentMax
  ) {
    return String(numericValue)
  }

  const mappedLegacyScore = legacyScoreMap[trimmed.toLowerCase()]

  if (mappedLegacyScore) {
    return mappedLegacyScore
  }

  return fallback
}

export function getBehaviorMomentLegacyLabel(scoreValue: unknown) {
  const score = Number(normalizeBehaviorMomentScore(String(scoreValue)))

  if (score in coreLabels) {
    return coreLabels[score]
  }

  if (score > behaviorMomentBest) {
    return getHigherThanBestText(score - behaviorMomentBest)
  }

  return getLowerThanWorstText(behaviorMomentWorst - score)
}

export function getBehaviorMomentSummaryText(scoreValue: unknown) {
  const score = Number(normalizeBehaviorMomentScore(String(scoreValue)))

  if (score in coreLabels) {
    return `behavior number ${score}, which meant ${coreLabels[score]}`
  }

  if (score > behaviorMomentBest) {
    return getHigherThanBestNumberText(score, score - behaviorMomentBest)
  }

  return getLowerThanWorstNumberText(score, behaviorMomentWorst - score)
}

function buildEscalatingList(words: string[], difference: number) {
  const count = Math.min(words.length, difference + 2)
  const selected = words.slice(0, count)

  if (selected.length === 1) {
    return selected[0]
  }

  if (selected.length === 2) {
    return `${selected[0]} and ${selected[1]}`
  }

  const head = selected.slice(0, -1).join(', ')
  const tail = selected[selected.length - 1]
  return `${head}, and ${tail}`
}

function buildEscalatingDescriptorList(
  words: string[],
  difference: number,
  baseCount: number
) {
  const count = Math.min(words.length, difference + baseCount)
  return buildEscalatingList(words, count - 2)
}

function buildPositiveEscalation(difference: number) {
  return buildEscalatingDescriptorList(
    [
      'special',
      'amazing',
      'powerful',
      'wonderful',
      'remarkable',
      'brilliant',
      'spectacular',
      'incredible',
      'radiant',
      'joyful',
      'glowing',
      'uplifting',
      'outstanding',
      'fantastic',
      'sparkling',
      'grand',
      'magnificent',
      'marvelous',
      'stunning',
      'gleaming',
      'cheerful',
      'excellent',
      'vibrant',
      'reward-worthy',
      'honored',
      'celebrated',
      'golden',
      'heroic',
      'graceful',
      'delightful',
      'dazzling',
      'memorable',
      'shining',
      'sunlit',
      'thrilling',
      'proud',
      'kind',
      'respectful',
      'impressive',
      'legendary',
      'first-rate',
      'highest',
      'overflowing',
      'victorious',
      'limit-breaking',
      'banner-like',
    ],
    difference,
    2
  )
}

const belowWorstEscalationWords = [
  'harsh',
  'horrible',
  'rough',
  'frightening',
  'awful',
  'extreme',
  'crushing',
  'terrible',
  'grim',
  'heavy',
  'brutal',
  'dark',
  'shocking',
  'icy',
  'punishing',
  'unforgiving',
  'nasty',
  'stress-filled',
  'painful',
  'wild',
  'out-of-control',
  'merciless',
  'hopeless',
  'dreadful',
  'ruinous',
  'catastrophic',
  'absolute',
  'unbearable',
  'beyond awful',
  'destroying',
  'shattered',
  'bottomless',
  'stormy',
  'spiteful',
  'furious',
  'rage-filled',
  'chaotic',
  'poisonous',
  'miserable',
  'blasting',
  'devastating',
  'nightmarish',
  'suffocating',
  'disastrous',
  'hateful',
  'hollow',
  'ruined',
  'collapsed',
  'hopelessly bad',
  'world-dropping',
]

function buildBelowWorstEscalation(score: number) {
  const difference = behaviorMomentWorst - score
  return buildEscalatingDescriptorList(
    belowWorstEscalationWords,
    difference,
    2
  )
}

export function getBehaviorMomentTone(scoreValue: unknown): BehaviorMomentTone {
  const score = Number(normalizeBehaviorMomentScore(String(scoreValue)))

  if (score >= behaviorMomentBest) {
    return 'best'
  }

  if (score >= 51) {
    return 'good'
  }

  if (score === behaviorMomentNeutral) {
    return 'mid'
  }

  if (score >= 47) {
    return 'warn'
  }

  if (score >= behaviorMomentWorst) {
    return 'danger'
  }

  return 'void'
}

export function getBehaviorMomentDescription(scoreValue: unknown) {
  const score = Number(normalizeBehaviorMomentScore(String(scoreValue)))

  if (score === 56) return 'You did a great job.'
  if (score === 55) return 'You did amazing.'
  if (score === 54) return "You've been steller."
  if (score === 53) return "You'll celebrate."
  if (score === 52) return "You'll have a great day from now on."
  if (score === 51) return 'You had an awesome day.'
  if (score === 50) return "You're okay."
  if (score === 49) return "You've had a rocky day."
  if (score === 48) return 'You had a bad day.'
  if (score === 47) return 'You had a very bad day.'
  if (score === 46) return 'You had an extremely bad day.'
  if (score === 45) return 'YOU HAVE ABSOLUTE ROCKINESS.'
  if (score === 44) return 'You are removed from the world.'

  const belowWorstEscalationText = buildBelowWorstEscalation(score)

  if (score <= 10) {
    return `This was one of the worst ten numbers ever, sounding ${belowWorstEscalationText}, and dropping extremely, extremely, extremely fast.`
  }

  if (score <= 20) {
    return `This was already in the fast-drop range, sounding ${belowWorstEscalationText}, where each step changed very, very fast.`
  }

  if (score > behaviorMomentBest) {
    const difference = score - behaviorMomentBest
    const distanceText = getHigherThanBestNumberText(score, difference)
    return `This meant ${distanceText}, sounding ${buildPositiveEscalation(difference)}, and each step kept getting better and better.`
  }

  const difference = behaviorMomentWorst - score
  const distanceText = getLowerThanWorstNumberText(score, difference)
  return `This meant ${distanceText}, sounding ${belowWorstEscalationText}, and each step kept getting worse and worse.`
}

export function getBehaviorMomentOptions(
  scoreValue: unknown
): BehaviorMomentOptions {
  const score = Number(normalizeBehaviorMomentScore(String(scoreValue)))

  if (score in coreOptions) {
    return coreOptions[score]
  }

  if (score > behaviorMomentBest) {
    const difference = score - behaviorMomentBest
    const escalationText = buildPositiveEscalation(difference)

    return {
      opening: `in an extra ${escalationText} way`,
      noticeLead: 'Everyone noticed because',
      notice: `${escalationText} right away`,
      handling: 'handled it in a no-trouble way',
      sounded: `${escalationText} from start to finish`,
      teacher:
        'treated it like a behavior moment that kept getting better and better',
      classmates: `${escalationText} and easy to notice`,
      ending: `in an extra ${escalationText} way`,
    }
  }

  if (score <= 10) {
    const escalationText = buildBelowWorstEscalation(score)

    return {
      opening: `in one of the worst ten-number ways ever, in an extra ${escalationText} way`,
      noticeLead: 'The problem grew bigger because',
      notice:
        'it dropped extremely, extremely, extremely fast into one of the worst ten numbers ever',
      handling: 'moved through a trouble moment',
      sounded: `${escalationText} from start to finish`,
      teacher:
        'treated it like one of the worst ten-number behavior moments ever',
      classmates: `one of the worst ten-number moments ever, ${escalationText}`,
      ending:
        'in one of the worst ten-number ways ever, with the drop going extremely, extremely, extremely fast',
    }
  }

  if (score <= 20) {
    const escalationText = buildBelowWorstEscalation(score)

    return {
      opening: `in a very fast-dropping ${escalationText} way`,
      noticeLead: 'The problem grew bigger because',
      notice: 'it changed very, very fast and kept getting rougher',
      handling: 'moved through a trouble moment',
      sounded: `${escalationText} from start to finish`,
      teacher:
        'treated it like a fast-drop behavior moment that changed very, very fast',
      classmates: `${escalationText} and getting rougher very fast`,
      ending: 'in a fast-drop way that changed very, very fast',
    }
  }

  const escalationText = buildBelowWorstEscalation(score)

  return {
    opening: `in an extra ${escalationText} way`,
    noticeLead: 'The problem grew bigger because',
    notice: `${escalationText} right away`,
    handling: 'moved through a trouble moment',
    sounded: `${escalationText} from start to finish`,
    teacher:
      'treated it like a behavior moment that kept getting worse and worse',
    classmates: `${escalationText} and easy to notice`,
    ending: `in an extra ${escalationText} way`,
  }
}

export function createBehaviorMomentDefinitions() {
  return createBehaviorMomentScoreOptions().map(score => ({
    id: score,
    label: score,
    legacyLabel: getBehaviorMomentLegacyLabel(score),
    tone: getBehaviorMomentTone(score),
    description: getBehaviorMomentDescription(score),
  }))
}
