import {
  behaviorMomentNeutral,
  getBehaviorMomentOptions,
  normalizeBehaviorMomentScore,
} from '@/core/behaviorNumbers'
import {style_score as styleScoreValues, style_score_default} from '../../data/bad_stuff'

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

export function normalizeStyleScore(styleScore: unknown) {
  return normalizeBehaviorMomentScore(styleScore, style_score_default)
}

export function getStoryStyleLabel(styleScore: unknown) {
  const normalized = normalizeStyleScore(styleScore)
  return normalized
}

export function getStoryOptions(styleScore: unknown) {
  const normalized = normalizeStyleScore(styleScore)
  return getBehaviorMomentOptions(normalized)
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
    storyOptionFieldOrder.map(({key}) => [
      key,
      key in specialStoryChoices
        ? storyOptionSelectDefault
        : String(behaviorMomentNeutral),
    ])
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

  if (styleScoreValues.includes(normalized)) {
    return getBehaviorMomentOptions(normalized)[key]
  }

  return value
}

function resolveStoryOptions(values: StoryPreviewValues) {
  const fallbackStyleScore = values.styleScore || style_score_default

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
