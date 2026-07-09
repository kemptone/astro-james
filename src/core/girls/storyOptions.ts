import {
  bestBehaviorLetter,
  getBehaviorLetterStoryTone,
  getHowGoodStoryTone,
  normalizeBehaviorLetter,
} from '@/core/girls/behaviorLetters'

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
  const howGoodLetter = normalizeBehaviorLetter(
    values.howGood || bestBehaviorLetter
  )
  const whatHappened =
    values.whatHappened || 'the teacher noticed right away'
  const behaviorTone = getBehaviorLetterStoryTone(behaviorLetter)
  const howGoodTone = getHowGoodStoryTone(howGoodLetter)

  return [
    `${personName} has behavior letter day at school and chose ${choice} ${howGoodTone.sentenceOne}.`,
    `${behaviorLetter} is ${behaviorTone.sentenceTwo}. ${howGoodLetter} is ${howGoodTone.sentenceTwo}.`,
    `${personName} ${behaviorTone.sentenceThree}.`,
    `When ${whatHappened}, the teacher said that choice caused ${personName} to have a school behavior letter of ${behaviorLetter}.`,
    `Other students could see the moment felt ${behaviorTone.sentenceFive}.`,
    `${personName} ended the day understanding the moment went ${howGoodTone.sentenceSix}, and the parents ${behaviorTone.parents}.`,
  ]
}

export function buildStoryPreviewText(values: StoryPreviewValues) {
  return buildStoryPreviewLines(values).join(' ')
}
