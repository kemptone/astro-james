export const WORD_LENGTH = 5
export const MAX_GUESSES = 6
export const DAILY_EPOCH = '2026-01-01'

export type TileState = 'absent' | 'present' | 'correct'
export type GameStatus = 'playing' | 'won' | 'lost'
export type GameMode = 'daily' | 'practice'

export interface GameSnapshot {
  guesses: string[]
  status: GameStatus
  hardMode: boolean
}

export interface DailyRecord extends GameSnapshot {}

export interface WordleStats {
  played: number
  wins: number
  winPercentage: number
  currentStreak: number
  maxStreak: number
  distribution: number[]
}

export interface HardModeResult {
  valid: boolean
  message?: string
}

export interface ShareOptions {
  mode: GameMode
  dateKey?: string
  guesses: string[]
  solution: string
  status: GameStatus
  highContrast: boolean
}

const STATE_PRIORITY: Record<TileState, number> = {
  absent: 1,
  present: 2,
  correct: 3,
}

export function normalizeWord(value: string) {
  return value.trim().toUpperCase()
}

export function scoreGuess(solutionValue: string, guessValue: string): TileState[] {
  const solution = normalizeWord(solutionValue)
  const guess = normalizeWord(guessValue)
  const result: TileState[] = Array.from({length: WORD_LENGTH}, () => 'absent')
  const remaining = new Map<string, number>()

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (guess[index] === solution[index]) {
      result[index] = 'correct'
    } else {
      const letter = solution[index]
      remaining.set(letter, (remaining.get(letter) ?? 0) + 1)
    }
  }

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (result[index] === 'correct') continue
    const letter = guess[index]
    const available = remaining.get(letter) ?? 0
    if (available > 0) {
      result[index] = 'present'
      remaining.set(letter, available - 1)
    }
  }

  return result
}

export function getGameStatus(solutionValue: string, guesses: string[]): GameStatus {
  const solution = normalizeWord(solutionValue)
  const normalizedGuesses = guesses.map(normalizeWord)
  if (normalizedGuesses.includes(solution)) return 'won'
  if (normalizedGuesses.length >= MAX_GUESSES) return 'lost'
  return 'playing'
}

export function getKeyboardStates(
  solution: string,
  guesses: string[]
): Record<string, TileState> {
  const keyboard: Record<string, TileState> = {}

  guesses.forEach(guess => {
    const normalized = normalizeWord(guess)
    const states = scoreGuess(solution, normalized)
    normalized.split('').forEach((letter, index) => {
      const nextState = states[index]
      const currentState = keyboard[letter]
      if (!currentState || STATE_PRIORITY[nextState] > STATE_PRIORITY[currentState]) {
        keyboard[letter] = nextState
      }
    })
  })

  return keyboard
}

function pluralizeLetter(letter: string, count: number) {
  return count === 1 ? letter : `${count} ${letter}'s`
}

export function validateHardModeGuess(
  solutionValue: string,
  previousGuesses: string[],
  candidateValue: string
): HardModeResult {
  if (previousGuesses.length === 0) return {valid: true}

  const solution = normalizeWord(solutionValue)
  const candidate = normalizeWord(candidateValue)
  const fixedPositions = new Map<number, string>()
  const forbiddenPositions = new Map<string, Set<number>>()
  const requiredCounts = new Map<string, number>()

  previousGuesses.forEach(previousGuess => {
    const guess = normalizeWord(previousGuess)
    const states = scoreGuess(solution, guess)
    const rowCounts = new Map<string, number>()

    states.forEach((state, index) => {
      const letter = guess[index]
      if (state === 'correct') fixedPositions.set(index, letter)
      if (state === 'present') {
        const positions = forbiddenPositions.get(letter) ?? new Set<number>()
        positions.add(index)
        forbiddenPositions.set(letter, positions)
      }
      if (state !== 'absent') rowCounts.set(letter, (rowCounts.get(letter) ?? 0) + 1)
    })

    rowCounts.forEach((count, letter) => {
      requiredCounts.set(letter, Math.max(requiredCounts.get(letter) ?? 0, count))
    })
  })

  for (const [index, letter] of fixedPositions) {
    if (candidate[index] !== letter) {
      return {valid: false, message: `${letter} must stay in position ${index + 1}.`}
    }
  }

  for (const [letter, positions] of forbiddenPositions) {
    for (const position of positions) {
      if (candidate[position] === letter && fixedPositions.get(position) !== letter) {
        return {
          valid: false,
          message: `${letter} cannot be used in position ${position + 1}.`,
        }
      }
    }
  }

  for (const [letter, minimum] of requiredCounts) {
    const actual = candidate.split('').filter(candidateLetter => candidateLetter === letter).length
    if (actual < minimum) {
      return {
        valid: false,
        message: `Your guess must contain ${pluralizeLetter(letter, minimum)}.`,
      }
    }
  }

  return {valid: true}
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateKey(dateKey: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const utc = Date.UTC(year, month - 1, day)
  const parsed = new Date(utc)
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null
  }
  return utc
}

export function getDailyAnswerIndex(date: Date, answerCount: number) {
  if (!Number.isInteger(answerCount) || answerCount < 1) {
    throw new Error('answerCount must be a positive integer')
  }

  const localCalendarUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const epochUtc = parseDateKey(DAILY_EPOCH) as number
  const offset = Math.floor((localCalendarUtc - epochUtc) / 86_400_000)
  return ((offset % answerCount) + answerCount) % answerCount
}

export function choosePracticeAnswerIndex(
  answerCount: number,
  excludedIndexes: number[],
  randomValue: number
) {
  if (!Number.isInteger(answerCount) || answerCount < 1) {
    throw new Error('answerCount must be a positive integer')
  }

  const excluded = new Set(excludedIndexes.filter(index => index >= 0 && index < answerCount))
  const available = Array.from({length: answerCount}, (_, index) => index).filter(
    index => !excluded.has(index)
  )
  const pool = available.length ? available : Array.from({length: answerCount}, (_, index) => index)
  const boundedRandom = Math.min(Math.max(randomValue, 0), 0.9999999999999999)
  return pool[Math.floor(boundedRandom * pool.length)]
}

function addDays(dateKey: string, amount: number) {
  const timestamp = parseDateKey(dateKey)
  if (timestamp === null) return null
  const date = new Date(timestamp + amount * 86_400_000)
  return date.toISOString().slice(0, 10)
}

export function calculateStats(
  records: Record<string, DailyRecord>,
  todayKey: string
): WordleStats {
  const completed = Object.entries(records)
    .filter(([, record]) => record.status === 'won' || record.status === 'lost')
    .filter(([dateKey]) => parseDateKey(dateKey) !== null)
    .sort(([left], [right]) => left.localeCompare(right))

  const played = completed.length
  const wins = completed.filter(([, record]) => record.status === 'won').length
  const distribution = Array.from({length: MAX_GUESSES}, () => 0)
  completed.forEach(([, record]) => {
    if (record.status === 'won' && record.guesses.length >= 1 && record.guesses.length <= 6) {
      distribution[record.guesses.length - 1] += 1
    }
  })

  let maxStreak = 0
  let runningStreak = 0
  let previousDate: string | null = null
  completed.forEach(([dateKey, record]) => {
    if (
      record.status === 'won' &&
      (previousDate === null || addDays(previousDate, 1) === dateKey)
    ) {
      runningStreak += 1
    } else if (record.status === 'won') {
      runningStreak = 1
    } else {
      runningStreak = 0
    }
    maxStreak = Math.max(maxStreak, runningStreak)
    previousDate = dateKey
  })

  let currentStreak = 0
  const latest = completed.at(-1)
  const yesterdayKey = addDays(todayKey, -1)
  if (
    latest &&
    latest[1].status === 'won' &&
    (latest[0] === todayKey || latest[0] === yesterdayKey)
  ) {
    currentStreak = 1
    let expected = addDays(latest[0], -1)
    for (let index = completed.length - 2; index >= 0; index -= 1) {
      const [dateKey, record] = completed[index]
      if (dateKey !== expected || record.status !== 'won') break
      currentStreak += 1
      expected = addDays(dateKey, -1)
    }
  }

  return {
    played,
    wins,
    winPercentage: played === 0 ? 0 : Math.round((wins / played) * 100),
    currentStreak,
    maxStreak,
    distribution,
  }
}

export function formatShareText(options: ShareOptions) {
  const score = options.status === 'won' ? String(options.guesses.length) : 'X'
  const label =
    options.mode === 'daily'
      ? `Astro James Wordle ${options.dateKey ?? ''}`.trim()
      : 'Astro James Wordle Practice'
  const palette = options.highContrast
    ? {correct: '🟧', present: '🟦', absent: '⬛'}
    : {correct: '🟩', present: '🟨', absent: '⬛'}
  const rows = options.guesses.map(guess =>
    scoreGuess(options.solution, guess)
      .map(state => palette[state])
      .join('')
  )
  return `${label} ${score}/${MAX_GUESSES}\n\n${rows.join('\n')}`
}

export function getTimeUntilNextLocalDay(now = new Date()) {
  const next = new Date(now)
  next.setHours(24, 0, 0, 0)
  return Math.max(0, next.getTime() - now.getTime())
}

export function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':')
}
