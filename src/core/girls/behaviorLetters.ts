const uppercaseLetters = Array.from({length: 26}, (_, index) =>
  String.fromCharCode(65 + index)
)
const lowercaseLetters = Array.from({length: 26}, (_, index) =>
  String.fromCharCode(97 + index)
)

export const bestBehaviorLetter = '+A'
export const neutralBehaviorLetter = 'Z'
export const worstBehaviorLetter = '-Z'

export const behaviorLetterOptions = [
  ...uppercaseLetters.map(letter => `+${letter}`),
  ...lowercaseLetters.map(letter => `+${letter}`),
  ...uppercaseLetters,
  ...lowercaseLetters,
  ...lowercaseLetters.map(letter => `-${letter}`),
  ...uppercaseLetters.map(letter => `-${letter}`),
]

export const behaviorLetterCount = behaviorLetterOptions.length

export function normalizeBehaviorLetter(value: unknown) {
  if (typeof value !== 'string') {
    return bestBehaviorLetter
  }

  const trimmed = value.trim()
  return behaviorLetterOptions.includes(trimmed)
    ? trimmed
    : bestBehaviorLetter
}

type BehaviorLetterStoryTone = {
  label: string
  sentenceOne: string
  sentenceTwo: string
  sentenceThree: string
  sentenceFive: string
  sentenceSix: string
  parents: string
}

const extremelyStrongWords = [
  'amazing',
  'blazing',
  'champion',
  'dazzling',
  'electric',
  'fearless',
  'glowing',
  'heroic',
  'intense',
  'joy-loaded',
  'keen',
  'legend-bright',
  'mighty',
  'noble',
  'outstanding',
  'power-packed',
  'quality-top',
  'radiant',
  'super-strong',
  'towering',
  'ultra-bold',
  'victory-high',
  'wonder-filled',
  'x-factor',
  'yes-top',
  'zenith',
]

const veryGreatWords = [
  'awesome',
  'breezy-good',
  'cheery',
  'delightful',
  'easygoing',
  'friendly',
  'gentle-good',
  'happy',
  'impressive',
  'jolly',
  'kind',
  'light-good',
  'merry',
  'nice-and-clear',
  'open-hearted',
  'pleasant',
  'quick-smile',
  'really-good',
  'sunny',
  'terrific',
  'upbeat',
  'very-kind',
  'warm',
  'x-nice',
  'yellow-bright',
  'zippy-good',
]

const noTroubleWords = [
  'all-clear',
  'balanced',
  'calm',
  'decent',
  'even',
  'fine',
  'good-enough',
  'honest',
  'in-line',
  'just-right',
  'kept-steady',
  'low-drama',
  'middle-safe',
  'no-fuss',
  'okay',
  'plain-good',
  'quiet-safe',
  'regular-safe',
  'settled',
  'tidy',
  'under-control',
  'very-steady',
  'well-behaved',
  'x-safe',
  'yard-calm',
  'zero-trouble',
]

const troubleWords = [
  'awkward',
  'bumpy',
  'crooked',
  'dicey',
  'edgy',
  'fussy',
  'glitchy',
  'hard',
  'itchy',
  'jangled',
  'knotty',
  'lopsided',
  'messy',
  'nervy',
  'off-track',
  'prickly',
  'quirky-bad',
  'rough',
  'shaky',
  'tense',
  'uneven',
  'wobbly',
  'wrong-way',
  'x-out-of-line',
  'yikesy',
  'zigzaggy',
]

const seriousTroubleWords = [
  'alarming',
  'big-trouble',
  'crisis-close',
  'deep-trouble',
  'extra-hard',
  'far-gone',
  'grave',
  'heavy',
  'intense-bad',
  'jolting',
  'knotted-up',
  'loud-bad',
  'major',
  'nasty',
  'over-the-line',
  'pressing',
  'quick-drop',
  'red-alert',
  'severe',
  'too-much',
  'upset-big',
  'very-heavy',
  'warning-high',
  'x-tra-bad',
  'yellow-alert',
  'zone-danger',
]

const tooFarWords = [
  'abyss-deep',
  'bottom-heavy',
  'crash-hard',
  'disaster-close',
  'extreme-drop',
  'far-below',
  'gone-too-far',
  'hardest-hit',
  'impossibly-low',
  'jammed-deep',
  'knocked-down',
  'lowest-swing',
  'meltdown-level',
  'no-way-good',
  'overboard',
  'past-safe',
  'quake-heavy',
  'rock-bottom',
  'storm-deep',
  'too-far',
  'under-dark',
  'very-bottom',
  'way-too-much',
  'x-marked-down',
  'yanked-low',
  'zero-room-left',
]

function buildTone(
  word: string,
  sentences: {
    label: string
    sentenceOne: string
    sentenceTwo: string
    sentenceThree: string
    sentenceFive: string
    sentenceSix: string
    parents: string
  }
) {
  return {
    label: sentences.label.replaceAll('{word}', word),
    sentenceOne: sentences.sentenceOne.replaceAll('{word}', word),
    sentenceTwo: sentences.sentenceTwo.replaceAll('{word}', word),
    sentenceThree: sentences.sentenceThree.replaceAll('{word}', word),
    sentenceFive: sentences.sentenceFive.replaceAll('{word}', word),
    sentenceSix: sentences.sentenceSix.replaceAll('{word}', word),
    parents: sentences.parents.replaceAll('{word}', word),
  }
}

export function getBehaviorLetterStoryTone(value: unknown): BehaviorLetterStoryTone {
  const letter = normalizeBehaviorLetter(value)
  const letterIndex = indexOfLetter(letter.slice(-1))

  if (letter === '+A') {
    return {
      label: 'the very best letter in the whole game',
      sentenceOne: 'in the strongest way possible',
      sentenceTwo: 'the very best letter in the whole game',
      sentenceThree: 'handled the moment as strongly as possible',
      sentenceFive: 'bright, bold, and hard to top',
      sentenceSix: 'as well as it could go',
      parents: 'felt as proud as they could be',
    }
  }

  if (letter === '-Z') {
    return {
      label: 'the very worst letter in the whole game',
      sentenceOne: 'all the way at the bottom',
      sentenceTwo: 'the very worst letter in the whole game',
      sentenceThree: 'moved as far into trouble as the game can go',
      sentenceFive: 'as heavy and overwhelming as possible',
      sentenceSix: 'as badly as it could go',
      parents: 'were as upset as they could be',
    }
  }

  if (/^\+[A-Z]$/.test(letter)) {
    return buildTone(extremelyStrongWords[letterIndex], {
      label: '{word} in the extremely strong range',
      sentenceOne: 'in a {word} way',
      sentenceTwo: '{word} in the extremely strong range',
      sentenceThree: 'handled the moment extremely strongly in a {word} way',
      sentenceFive: '{word} and clearly powerful',
      sentenceSix: '{word} and strongly good',
      parents: 'felt a {word} kind of pride',
    })
  }

  if (/^\+[a-z]$/.test(letter)) {
    return buildTone(veryGreatWords[letterIndex], {
      label: '{word} in the very great range',
      sentenceOne: 'in a {word} way',
      sentenceTwo: '{word} in the very great range',
      sentenceThree: 'handled the moment very well in a {word} way',
      sentenceFive: '{word} and comfortably good',
      sentenceSix: '{word} and very good',
      parents: 'felt a {word} kind of happiness',
    })
  }

  if (letter === neutralBehaviorLetter) {
    return {
      label: 'plain and neutral',
      sentenceOne: 'in a plain and neutral way',
      sentenceTwo: 'plain and neutral',
      sentenceThree: 'handled the moment in a plain and steady way',
      sentenceFive: 'quiet and even',
      sentenceSix: 'plainly and evenly',
      parents: 'took it calmly',
    }
  }

  if (/^[A-Z]$/.test(letter)) {
    return buildTone(noTroubleWords[letterIndex], {
      label: '{word} in the no-trouble range',
      sentenceOne: 'in a {word} way',
      sentenceTwo: '{word} in the no-trouble range',
      sentenceThree: 'handled the moment in a no-trouble way with a {word} tone',
      sentenceFive: '{word} and steady',
      sentenceSix: '{word} and smooth enough',
      parents: 'felt a {word} kind of calm',
    })
  }

  if (/^[a-z]$/.test(letter)) {
    return buildTone(troubleWords[letterIndex], {
      label: '{word} in the trouble range',
      sentenceOne: 'in a {word} way',
      sentenceTwo: '{word} in the trouble range',
      sentenceThree: 'moved through a trouble moment with a {word} tone',
      sentenceFive: '{word} and uneasy',
      sentenceSix: '{word} and rough',
      parents: 'felt a {word} kind of concern',
    })
  }

  if (/^-[a-z]$/.test(letter)) {
    return buildTone(seriousTroubleWords[letterIndex], {
      label: '{word} in the serious trouble range',
      sentenceOne: 'in a {word} way',
      sentenceTwo: '{word} in the serious trouble range',
      sentenceThree: 'moved into serious trouble with a {word} tone',
      sentenceFive: '{word} and heavy',
      sentenceSix: '{word} and badly',
      parents: 'felt a {word} kind of upset',
    })
  }

  return buildTone(tooFarWords[letterIndex], {
    label: '{word} in the too-far-into-trouble range',
    sentenceOne: 'in a {word} way',
    sentenceTwo: '{word} in the too-far-into-trouble range',
    sentenceThree: 'moved too far into trouble with a {word} tone',
    sentenceFive: '{word} and overwhelming',
    sentenceSix: '{word} and very badly',
    parents: 'felt a {word} kind of shock',
  })
}

export function getHowGoodStoryTone(value: unknown) {
  const letter = normalizeBehaviorLetter(value)
  const letterIndex = indexOfLetter(letter.slice(-1))

  if (letter === '+A') {
    return {
      label: 'the very best how-good letter in the whole game',
      sentenceOne: 'in the strongest possible way',
      sentenceTwo: 'the choice landed in the very best way possible',
      sentenceThree: 'handled the choice in the very best possible way',
      sentenceFive: 'bright and easy to admire',
      sentenceSix: 'the very best way possible',
      parents: 'felt as proud as they could be',
    }
  }

  if (letter === '-Z') {
    return {
      label: 'the very worst how-good letter in the whole game',
      sentenceOne: 'in the hardest possible way',
      sentenceTwo: 'the choice landed in the very worst way possible',
      sentenceThree: 'handled the choice in the hardest possible way',
      sentenceFive: 'heavy and impossible to miss',
      sentenceSix: 'the very worst way possible',
      parents: 'were as upset as they could be',
    }
  }

  if (/^\+[A-Z]$/.test(letter)) {
    return buildTone(extremelyStrongWords[letterIndex], {
      label: '{word} on the how-good side',
      sentenceOne: 'in a {word} way',
      sentenceTwo: 'the choice landed in a {word} extremely strong way',
      sentenceThree: 'handled the choice in a {word} extremely strong way',
      sentenceFive: '{word} and easy to notice',
      sentenceSix: 'in a {word} extremely strong way',
      parents: 'felt a {word} kind of pride',
    })
  }

  if (/^\+[a-z]$/.test(letter)) {
    return buildTone(veryGreatWords[letterIndex], {
      label: '{word} on the how-good side',
      sentenceOne: 'in a {word} way',
      sentenceTwo: 'the choice landed in a {word} very great way',
      sentenceThree: 'handled the choice in a {word} very great way',
      sentenceFive: '{word} and clearly kind',
      sentenceSix: 'in a {word} very great way',
      parents: 'felt a {word} kind of happiness',
    })
  }

  if (letter === neutralBehaviorLetter) {
    return {
      label: 'plain and neutral on the how-good side',
      sentenceOne: 'in a plain and neutral way',
      sentenceTwo: 'the choice landed in a plain and neutral way',
      sentenceThree: 'handled the choice in a plain and neutral way',
      sentenceFive: 'even and unsurprising',
      sentenceSix: 'in a plain and neutral way',
      parents: 'took it calmly',
    }
  }

  if (/^[A-Z]$/.test(letter)) {
    return buildTone(noTroubleWords[letterIndex], {
      label: '{word} on the how-good side',
      sentenceOne: 'in a {word} way',
      sentenceTwo: 'the choice landed in a {word} no-trouble way',
      sentenceThree: 'handled the choice in a {word} no-trouble way',
      sentenceFive: '{word} and settled',
      sentenceSix: 'in a {word} no-trouble way',
      parents: 'felt a {word} kind of calm',
    })
  }

  if (/^[a-z]$/.test(letter)) {
    return buildTone(troubleWords[letterIndex], {
      label: '{word} on the how-good side',
      sentenceOne: 'in a {word} way',
      sentenceTwo: 'the choice landed in a {word} trouble way',
      sentenceThree: 'handled the choice in a {word} trouble way',
      sentenceFive: '{word} and uneasy',
      sentenceSix: 'in a {word} trouble way',
      parents: 'felt a {word} kind of concern',
    })
  }

  if (/^-[a-z]$/.test(letter)) {
    return buildTone(seriousTroubleWords[letterIndex], {
      label: '{word} on the how-good side',
      sentenceOne: 'in a {word} way',
      sentenceTwo: 'the choice landed in a {word} serious-trouble way',
      sentenceThree: 'handled the choice in a {word} serious-trouble way',
      sentenceFive: '{word} and harsh',
      sentenceSix: 'in a {word} serious-trouble way',
      parents: 'felt a {word} kind of upset',
    })
  }

  return buildTone(tooFarWords[letterIndex], {
    label: '{word} on the how-good side',
    sentenceOne: 'in a {word} way',
    sentenceTwo: 'the choice landed in a {word} too-far-into-trouble way',
    sentenceThree: 'handled the choice in a {word} too-far-into-trouble way',
    sentenceFive: '{word} and overwhelming',
    sentenceSix: 'in a {word} too-far-into-trouble way',
    parents: 'felt a {word} kind of shock',
  })
}

function indexOfLetter(letter: string) {
  const lower = letter.toLowerCase()
  return lower.charCodeAt(0) - 97
}
