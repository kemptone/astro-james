import {
  bestBehaviorLetter,
  getBehaviorLetterStoryTone,
  normalizeBehaviorLetter,
} from '@/core/girls/behaviorLetters'
import {
  extendedBehaviorNumberNeutral,
  getExtendedBehaviorNumberTone,
  normalizeExtendedBehaviorNumber,
} from '@/core/girls/behaviorNumbers'

type StoryPreviewValues = {
  personName?: string
  choice?: string
  behaviorScore?: string
  howGood?: string
  whatHappened?: string
}

export function buildStoryPreviewLines(values: StoryPreviewValues) {
  const personName = values.personName || 'This person'
  const choice = values.choice || 'made a choice at school'
  const behaviorLetter = normalizeBehaviorLetter(
    values.behaviorScore || bestBehaviorLetter
  )
  const howGoodNumber = normalizeExtendedBehaviorNumber(
    values.howGood || String(extendedBehaviorNumberNeutral)
  )
  const whatHappened =
    values.whatHappened || 'the teacher noticed right away'
  const behaviorTone = getBehaviorLetterStoryTone(behaviorLetter)
  const howGoodTone = getExtendedBehaviorNumberTone(howGoodNumber)

  return [
    `${personName} has extended behavior number day at school and chose ${choice} ${howGoodTone.sentenceOne}.`,
    `${behaviorLetter} is ${behaviorTone.sentenceTwo}.`,
    `${personName} ${behaviorTone.sentenceThree} ${howGoodTone.sentenceThree}.`,
    `When ${whatHappened}, the teacher said that choice caused ${personName} to have a school behavior letter of ${behaviorLetter}.`,
    `Other students could see the moment felt ${howGoodTone.sentenceFive}.`,
    `The parents ${behaviorTone.parents} about the behavior score of ${behaviorLetter}.`,
  ]
}

export function buildStoryPreviewText(values: StoryPreviewValues) {
  return buildStoryPreviewLines(values).join(' ')
}
