import {
  style_score as styleScoreValues,
  style_score_default,
} from '../../data/bad_stuff'

export const storyOptionSelectDefault = ''

export type StoryOptionSet = {
  opening: string
  noticeLead: string
  notice: string
  handling: string
  sounded: string
  teacher: string
  classmates: string
  ending: string
}

type StoryPreviewValues = {
  personName?: string
  choice?: string
  styleScore?: string
  behaviorScore?: string
  whatHappened?: string
} & Partial<StoryOptionSet>

const STORY_OPTIONS: Record<string, StoryOptionSet> = {
  Worst: {
    opening: 'in an extra harsh and ugly way',
    noticeLead: 'The problem grew bigger because',
    notice: 'as rough as it could get',
    handling: 'moved through a trouble moment',
    sounded: 'harsh, ugly, frightening, and far beyond okay',
    teacher: 'sounded extremely upset and serious about it',
    classmates: 'frightening and awful',
    ending: 'as ugly as players ever let it get',
  },
  '0': {
    opening: 'in a harsh and horrible way',
    noticeLead: 'The problem grew bigger because',
    notice: 'awful right away',
    handling: 'moved through a trouble moment',
    sounded: 'harsh, ugly, and horrible',
    teacher: 'sounded very upset and serious about it',
    classmates: 'horrible in the worst regular number way',
    ending: 'horribly',
  },
  '1': {
    opening: 'in a very bad way',
    noticeLead: 'The problem grew bigger because',
    notice: 'too intense very fast',
    handling: 'moved through a trouble moment',
    sounded: 'mean and like too much pressure on the teacher',
    teacher: 'became very upset and serious about it',
    classmates: 'ugly',
    ending: 'very badly',
  },
  '2': {
    opening: 'in a very rough way',
    noticeLead: 'The problem grew bigger because',
    notice: 'very off',
    handling: 'moved through a trouble moment',
    sounded: 'rough from start to finish',
    teacher: 'looked ready to step in because the scene felt too rough',
    classmates: 'very rough',
    ending: 'too rough',
  },
  '3': {
    opening: 'in a clearly bad way',
    noticeLead: 'The problem grew bigger because',
    notice: 'clearly wrong',
    handling: 'moved through a trouble moment',
    sounded: 'sour and wrong',
    teacher: 'had to step in because it was clearly not going well',
    classmates: 'bad',
    ending: 'wrong',
  },
  '4': {
    opening: 'in a slightly weak way',
    noticeLead: 'The problem grew bigger because',
    notice: 'weak and starting to head toward trouble',
    handling: 'moved through a trouble moment',
    sounded: 'too easy to notice in the wrong way',
    teacher: 'spoke in a disappointed voice because it was starting to become trouble',
    classmates: 'starting to slip into trouble',
    ending: 'into trouble',
  },
  '5': {
    opening: 'in a weak but still good way',
    noticeLead: 'Everyone noticed because',
    notice: 'weak and flat, but not like trouble',
    handling: 'handled it in a no-trouble way',
    sounded: 'good, but still weak and flat',
    teacher: 'could tell it was still a good moment, even if it felt weak',
    classmates: 'good, even if it felt flat',
    ending: 'in a weak but still good way',
  },
  '': {
    opening: 'in a plain and neutral way',
    noticeLead: 'Everyone noticed because',
    notice: 'calm and ordinary',
    handling: 'handled it in a no-trouble way',
    sounded: 'plain, balanced, and ordinary',
    teacher: 'treated it as a plain and ordinary moment',
    classmates: 'plain and neutral',
    ending: 'in a plain and neutral way',
  },
  '6': {
    opening: 'in a pretty good way',
    noticeLead: 'Everyone noticed because',
    notice: 'a bit powerful',
    handling: 'handled it in a no-trouble way',
    sounded: 'clear and not weak',
    teacher: 'responded warmly because it felt clearly good',
    classmates: 'pretty good',
    ending: 'in a pretty good way',
  },
  '7': {
    opening: 'in a strong way',
    noticeLead: 'Everyone noticed because',
    notice: 'like a normal strong good moment',
    handling: 'handled it in a no-trouble way',
    sounded: 'strong and clear',
    teacher: 'made it clear the strong good moment mattered',
    classmates: 'normal strong good',
    ending: 'in a strong good way',
  },
  '8': {
    opening: 'in an excellent and super strong way',
    noticeLead: 'Everyone noticed because',
    notice: 'remarkable right away',
    handling: 'handled it in a no-trouble way',
    sounded: 'powerful and very easy to notice',
    teacher: 'spoke about it like a standout excellent moment',
    classmates: 'super strong and game-worthy',
    ending: 'in a standout good way',
  },
  '9': {
    opening: 'in an excellent way',
    noticeLead: 'Everyone noticed because',
    notice: 'charming and remarkable',
    handling: 'handled it in a no-trouble way',
    sounded: 'beautiful, charming, and strong',
    teacher: 'treated it like a truly excellent moment that deserved a big reward',
    classmates: 'excellent and Oreo-box worthy',
    ending: 'in a charming and remarkable way',
  },
  '10': {
    opening: 'in the best possible numbered way',
    noticeLead: 'Everyone noticed because',
    notice: 'remarkable, like standing in front of the class',
    handling: 'handled it in a no-trouble way',
    sounded: 'clear, remarkable, and at its best numbered level',
    teacher: 'treated it like one of the most remarkable moments of the day',
    classmates: 'strong and memorable',
    ending: 'in one of the best numbered ways possible',
  },
  Best: {
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

export function normalizeStyleScore(styleScore: unknown) {
  if (typeof styleScore !== 'string') {
    return style_score_default
  }

  const trimmed = styleScore.trim()

  if (trimmed === '') {
    return ''
  }

  if (trimmed.toLowerCase() === 'best') {
    return 'Best'
  }

  if (trimmed.toLowerCase() === 'worst') {
    return 'Worst'
  }

  return styleScoreValues.includes(trimmed) ? trimmed : style_score_default
}

export function getStoryStyleLabel(styleScore: unknown) {
  const normalized = normalizeStyleScore(styleScore)
  return normalized === '' ? 'empty' : normalized
}

export function getStoryOptions(styleScore: unknown) {
  const normalized = normalizeStyleScore(styleScore)
  return STORY_OPTIONS[normalized] || STORY_OPTIONS[style_score_default]
}

export const storyOptionFieldOrder: Array<{
  key: keyof StoryOptionSet
  label: string
}> = [
  {key: 'opening', label: 'opening option'},
  {key: 'noticeLead', label: 'notice lead option'},
  {key: 'notice', label: 'moment felt option'},
  {key: 'handling', label: 'handling option'},
  {key: 'sounded', label: 'sounded option'},
  {key: 'teacher', label: 'teacher option'},
  {key: 'classmates', label: 'classmates option'},
  {key: 'ending', label: 'ending option'},
]

const specialStoryChoices: Partial<Record<keyof StoryOptionSet, string[]>> = {
  noticeLead: ['', 'Good', 'Bad'],
  handling: ['', 'Good', 'Bad'],
}

export const storyOptionChoices = Object.fromEntries(
  storyOptionFieldOrder.map(({key}) => [key, specialStoryChoices[key] || styleScoreValues])
) as Record<keyof StoryOptionSet, string[]>

export function getDefaultStoryOptionScores() {
  return Object.fromEntries(
    storyOptionFieldOrder.map(({key}) => [key, storyOptionSelectDefault])
  ) as Record<keyof StoryOptionSet, string>
}

function resolveOptionText(
  key: keyof StoryOptionSet,
  value: string | undefined,
  fallbackStyleScore: string
) {
  if (!value) {
    return getStoryOptions(fallbackStyleScore)[key]
  }

  if (key === 'noticeLead') {
    if (value === 'Good') {
      return 'Everyone noticed because'
    }

    if (value === 'Bad') {
      return 'The problem grew bigger because'
    }
  }

  if (key === 'handling') {
    if (value === 'Good') {
      return 'handled it in a no-trouble way'
    }

    if (value === 'Bad') {
      return 'moved through a trouble moment'
    }
  }

  const normalized = normalizeStyleScore(value)

  if (normalized in STORY_OPTIONS) {
    return STORY_OPTIONS[normalized][key]
  }

  return value
}

function resolveStoryOptions(values: StoryPreviewValues) {
  const fallbackStyleScore = values.styleScore || storyOptionSelectDefault

  return {
    opening: resolveOptionText('opening', values.opening, fallbackStyleScore),
    noticeLead: resolveOptionText(
      'noticeLead',
      values.noticeLead,
      fallbackStyleScore
    ),
    notice: resolveOptionText('notice', values.notice, fallbackStyleScore),
    handling: resolveOptionText(
      'handling',
      values.handling,
      fallbackStyleScore
    ),
    sounded: resolveOptionText('sounded', values.sounded, fallbackStyleScore),
    teacher: resolveOptionText('teacher', values.teacher, fallbackStyleScore),
    classmates: resolveOptionText(
      'classmates',
      values.classmates,
      fallbackStyleScore
    ),
    ending: resolveOptionText('ending', values.ending, fallbackStyleScore),
  }
}

export function buildStoryPreviewLines(values: StoryPreviewValues) {
  const personName = values.personName || 'This person'
  const choice = values.choice || 'made a choice at school'
  const behaviorScore = values.behaviorScore || '1000'
  const whatHappened =
    values.whatHappened || 'the teacher noticed right away'
  const options = resolveStoryOptions(values)

  return [
    `${personName} had Behavior Number Day at school and chose ${choice} ${options.opening}.`,
    `${options.noticeLead} ${whatHappened}, and the moment felt ${options.notice}.`,
    `${personName} ${options.handling}, and the moment sounded ${options.sounded}.`,
    `The teacher said that choice caused ${personName} to have a school behavior score of ${behaviorScore}, and the teacher ${options.teacher}.`,
    `Other students could see that the moment was ${options.classmates}.`,
    `${personName} ended the day understanding the moment went ${options.ending}.`,
  ]
}

export function buildStoryPreviewText(values: StoryPreviewValues) {
  return buildStoryPreviewLines(values).join(' ')
}
