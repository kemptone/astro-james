import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateStats,
  choosePracticeAnswerIndex,
  formatShareText,
  getDailyAnswerIndex,
  getGameStatus,
  getKeyboardStates,
  scoreGuess,
  validateHardModeGuess,
  type DailyRecord,
} from './game.ts'
import {ANSWERS, VALID_GUESSES} from './word-data.ts'
import {parseStoredState} from './storage.ts'

test('scores repeated letters without awarding extra matches', () => {
  assert.deepEqual(scoreGuess('APPLE', 'ALLEY'), [
    'correct',
    'present',
    'absent',
    'present',
    'absent',
  ])
  assert.deepEqual(scoreGuess('SHEEP', 'PEEPS'), [
    'present',
    'present',
    'correct',
    'absent',
    'present',
  ])
})

test('keyboard clues only move to a stronger state', () => {
  const keyboard = getKeyboardStates('APPLE', ['PUPPY', 'PLANT'])
  assert.equal(keyboard.P, 'correct')
  assert.equal(keyboard.A, 'present')
  assert.equal(keyboard.U, 'absent')
})

test('game status detects wins and the sixth-guess loss', () => {
  assert.equal(getGameStatus('APPLE', ['CRANE']), 'playing')
  assert.equal(getGameStatus('APPLE', ['CRANE', 'APPLE']), 'won')
  assert.equal(
    getGameStatus('APPLE', ['CRANE', 'LIGHT', 'SOUND', 'BRICK', 'MOTEL', 'FUZZY']),
    'lost'
  )
})

test('hard mode preserves green positions and moves yellow letters', () => {
  assert.deepEqual(validateHardModeGuess('APPLE', ['ALLEY'], 'AMPLE'), {valid: true})
  assert.match(validateHardModeGuess('APPLE', ['ALLEY'], 'PLANT').message ?? '', /position 1/i)
  assert.match(validateHardModeGuess('APPLE', ['ALLEY'], 'ALARM').message ?? '', /position 2/i)
  assert.match(validateHardModeGuess('APPLE', ['ALLEY'], 'ARBOR').message ?? '', /contain L/i)
})

test('hard mode respects the minimum revealed duplicate count', () => {
  const result = validateHardModeGuess('EERIE', ['EERIE'], 'EAGLE')
  assert.equal(result.valid, false)
  assert.match(result.message ?? '', /position 2|2 E's/i)
})

test('daily answers are deterministic and advance with the local calendar', () => {
  const first = getDailyAnswerIndex(new Date(2026, 0, 1, 12), ANSWERS.length)
  const sameDay = getDailyAnswerIndex(new Date(2026, 0, 1, 23, 59), ANSWERS.length)
  const nextDay = getDailyAnswerIndex(new Date(2026, 0, 2, 1), ANSWERS.length)
  assert.equal(first, 0)
  assert.equal(sameDay, first)
  assert.equal(nextDay, 1)
})

test('practice selection excludes daily and previous answers when possible', () => {
  assert.equal(choosePracticeAnswerIndex(5, [0, 1], 0), 2)
  assert.equal(choosePracticeAnswerIndex(5, [0, 1], 0.999999), 4)
  assert.equal(choosePracticeAnswerIndex(1, [0], 0.5), 0)
})

test('daily statistics handle wins, losses, gaps, and distributions', () => {
  const record = (status: 'won' | 'lost', guesses: number): DailyRecord => ({
    status,
    guesses: Array.from({length: guesses}, () => 'CRANE'),
    hardMode: false,
  })
  const records = {
    '2026-01-01': record('won', 3),
    '2026-01-02': record('won', 2),
    '2026-01-03': record('lost', 6),
    '2026-01-05': record('won', 4),
  }
  assert.deepEqual(calculateStats(records, '2026-01-05'), {
    played: 4,
    wins: 3,
    winPercentage: 75,
    currentStreak: 1,
    maxStreak: 2,
    distribution: [0, 1, 1, 1, 0, 0],
  })
  assert.equal(calculateStats(records, '2026-01-07').currentStreak, 0)
})

test('share output contains clues but never the answer', () => {
  const result = formatShareText({
    mode: 'daily',
    dateKey: '2026-01-01',
    guesses: ['CRANE', 'APPLE'],
    solution: 'APPLE',
    status: 'won',
    highContrast: false,
  })
  assert.match(result, /Astro James Wordle 2026-01-01 2\/6/)
  assert.match(result, /🟩/)
  assert.doesNotMatch(result, /APPLE/)
})

test('stored state recovers valid settings and rejects corrupt game data', () => {
  const parsed = parseStoredState(
    JSON.stringify({
      version: 1,
      settings: {hardMode: true, theme: 'dark', highContrast: true},
      hasSeenHelp: true,
      daily: {
        '2026-01-01': {guesses: ['crane', 'too-long'], status: 'won', hardMode: true},
        invalid: {guesses: ['apple'], status: 'won'},
      },
      practice: {answerIndex: 4, guesses: ['light'], status: 'playing', hardMode: false},
      lastPracticeAnswerIndex: 3,
    }),
    ANSWERS.length
  )
  assert.deepEqual(parsed.settings, {hardMode: true, theme: 'dark', highContrast: true})
  assert.deepEqual(parsed.daily['2026-01-01'].guesses, ['CRANE'])
  assert.equal(parsed.daily.invalid, undefined)
  assert.equal(parsed.practice?.answerIndex, 4)
  assert.equal(parseStoredState('{broken', ANSWERS.length).version, 1)

  const migrated = parseStoredState(
    JSON.stringify({
      version: 99,
      settings: {hardMode: true, theme: 'light', highContrast: false},
      daily: {'2026-01-01': {guesses: ['APPLE'], status: 'won'}},
    }),
    ANSWERS.length
  )
  assert.equal(migrated.settings.hardMode, true)
  assert.deepEqual(migrated.daily, {})
})

test('word data is unique, valid, and large enough for the frozen schedule', () => {
  const answerSet = new Set(ANSWERS)
  const guessSet = new Set(VALID_GUESSES)
  assert.ok(ANSWERS.length >= 1000)
  assert.equal(answerSet.size, ANSWERS.length)
  assert.equal(guessSet.size, VALID_GUESSES.length)
  assert.ok(ANSWERS.every(word => /^[a-z]{5}$/.test(word)))
  assert.ok(VALID_GUESSES.every(word => /^[a-z]{5}$/.test(word)))
  assert.ok(ANSWERS.every(word => guessSet.has(word)))
})
