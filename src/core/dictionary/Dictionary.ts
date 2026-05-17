import '../../components/Dictionary/wc-dictionary-item'
import {loader} from './Dictionary.helpers'
import type {DictionaryEntry} from './Dictionary.types'

const e_list = document.querySelector('#list')
const e_form = document.querySelector('form')
const e_hangmanPuzzle = document.querySelector('#hangman-puzzle')
const e_hangmanFeedback = document.querySelector('#hangman-feedback')
const e_hangmanLetterButtons = document.querySelectorAll(
  '[data-hangman-letter]'
)

const parts: DictionaryEntry[] = []
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const hangmanState = {
  answer: '',
  guesses: new Set<string>(),
  active: false,
}

const vowelNumberMap = {
  '1': 'A',
  '2': 'E',
  '3': 'I',
  '4': 'O',
  '5': 'U',
} as const

function matchesMissingVowelNumbers(
  word: string,
  missingVowelNumbersRaw: string
) {
  const cleaned = (missingVowelNumbersRaw || '').replace(/\s+/g, '')

  if (!cleaned) return true

  const uniqueDigits = Array.from(new Set(cleaned.split('')))

  if (uniqueDigits.includes('0')) {
    return Object.values(vowelNumberMap).every(vowel => word.includes(vowel))
  }

  return Object.entries(vowelNumberMap).every(([digit, vowel]) => {
    const shouldBeMissing = uniqueDigits.includes(digit)
    return shouldBeMissing ? !word.includes(vowel) : word.includes(vowel)
  })
}

function buildHangmanPuzzle() {
  if (!hangmanState.answer) {
    return 'Pick a dictionary word and press Play hangman.'
  }

  return hangmanState.answer
    .split('')
    .map(character => {
      if (character < 'A' || character > 'Z') {
        return character
      }

      return hangmanState.guesses.has(character) ? character : '_'
    })
    .join(' ')
}

function updateHangmanPuzzle() {
  if (!e_hangmanPuzzle) return
  e_hangmanPuzzle.textContent = buildHangmanPuzzle()
}

function updateHangmanButtons() {
  e_hangmanLetterButtons.forEach(button => {
    const e_button = button as HTMLButtonElement
    const letter = e_button.dataset.hangmanLetter || ''
    const isGuessed = hangmanState.guesses.has(letter)
    const isCorrect = isGuessed && hangmanState.answer.includes(letter)
    const isWrong = isGuessed && !hangmanState.answer.includes(letter)

    e_button.disabled = !hangmanState.active || isGuessed
    e_button.classList.toggle('is-correct', isCorrect)
    e_button.classList.toggle('is-wrong', isWrong)
  })
}

function setHangmanFeedback(
  message: string,
  tone: 'neutral' | 'success' | 'danger' | 'warning' = 'neutral'
) {
  if (!e_hangmanFeedback) return
  e_hangmanFeedback.textContent = message
  e_hangmanFeedback.dataset.tone = tone
}

function clearHangman(message = 'Pick a dictionary word and press Play hangman.') {
  hangmanState.answer = ''
  hangmanState.guesses.clear()
  hangmanState.active = false
  updateHangmanButtons()
  updateHangmanPuzzle()
  setHangmanFeedback(message)
}

function finishHangmanIfSolved() {
  const uniqueLetters = new Set(
    hangmanState.answer
      .split('')
      .filter(character => character >= 'A' && character <= 'Z')
  )
  const solved = Array.from(uniqueLetters).every(letter =>
    hangmanState.guesses.has(letter)
  )

  if (!solved) return false

  hangmanState.active = false
  updateHangmanButtons()
  setHangmanFeedback(`You guessed ${hangmanState.answer}.`, 'success')
  return true
}

function startHangman(wordRaw: string) {
  const word = wordRaw.toUpperCase().trim()

  if (!word) {
    clearHangman('Pick a real word first.')
    setHangmanFeedback('Pick a real word first.', 'warning')
    return
  }

  const hasLetters = word.split('').some(letter => alphabet.includes(letter))

  if (!hasLetters) {
    clearHangman('That word does not have letters to guess.')
    setHangmanFeedback('That word does not have letters to guess.', 'warning')
    return
  }

  hangmanState.answer = word
  hangmanState.guesses.clear()
  hangmanState.active = true
  updateHangmanButtons()
  updateHangmanPuzzle()
  setHangmanFeedback(`Hangman is on for ${word}.`)
}

e_form?.addEventListener('proto-submit', (e: any) => {
  const missingVowelNumbers = String(
    e.detail.values.missing_vowel_numbers || ''
  )
  let results = parts.slice()

  if (missingVowelNumbers) {
    results = results
      .filter(part => part.word.indexOf(' ') === -1)
      .filter(part => matchesMissingVowelNumbers(part.word, missingVowelNumbers))
  }

  if (missingVowelNumbers) {
    return renderList(results)
  }
})

function renderList(list: DictionaryEntry[]) {
  if (!e_list) return
  e_list.innerHTML = ''
  const e_fragment = document.createDocumentFragment()
  list.forEach(entry => {
    const e_element = document.createElement('wc-dictionary-item')
    const {definitions, ...others} = entry
    for (let key in others) {
      // @ts-ignore
      if (!others[key]) delete others[key]
    }
    Object.assign(e_element.dataset, {
      ...others,
      definitions: definitions?.join('\n\n'),
    })
    e_fragment.appendChild(e_element)
  })
  e_list.appendChild(e_fragment)
}

e_list?.addEventListener('dictionary-play-hangman', e => {
  const detail = (e as CustomEvent).detail as {word?: string}
  startHangman(detail?.word || '')
})

e_hangmanLetterButtons.forEach(button => {
  button.addEventListener('click', () => {
    if (!hangmanState.active) return

    const e_button = button as HTMLButtonElement
    const letter = e_button.dataset.hangmanLetter || ''

    if (!letter || hangmanState.guesses.has(letter)) return

    hangmanState.guesses.add(letter)
    const isCorrect = hangmanState.answer.includes(letter)

    updateHangmanButtons()
    updateHangmanPuzzle()

    if (isCorrect) {
      if (finishHangmanIfSolved()) return
      setHangmanFeedback(`${letter} is in the word.`, 'success')
      return
    }

    setHangmanFeedback(`${letter} is not in the word.`, 'danger')
  })
})

updateHangmanButtons()
updateHangmanPuzzle()

loader(parts).then(() => {
  // creates a new array that is only 100 length
  const sanity = parts.slice(0, 50)

  renderList(sanity)
})
