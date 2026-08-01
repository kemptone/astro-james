import {getGameStatus, normalizeWord, type GameSnapshot, type GameStatus} from './game.ts'

export const STORAGE_KEY = 'astro-james:wordle:v1'
export const STORAGE_VERSION = 1

export type ThemeSetting = 'system' | 'light' | 'dark'

export interface WordleSettings {
  hardMode: boolean
  theme: ThemeSetting
  highContrast: boolean
}

export interface PracticeSnapshot extends GameSnapshot {
  answerIndex: number
}

export interface PersistedWordleState {
  version: 1
  settings: WordleSettings
  hasSeenHelp: boolean
  daily: Record<string, GameSnapshot>
  practice: PracticeSnapshot | null
  lastPracticeAnswerIndex: number | null
}

export const DEFAULT_SETTINGS: WordleSettings = {
  hardMode: false,
  theme: 'system',
  highContrast: false,
}

export function createDefaultState(): PersistedWordleState {
  return {
    version: STORAGE_VERSION,
    settings: {...DEFAULT_SETTINGS},
    hasSeenHelp: false,
    daily: {},
    practice: null,
    lastPracticeAnswerIndex: null,
  }
}

function parseSettings(value: unknown): WordleSettings {
  if (!value || typeof value !== 'object') return {...DEFAULT_SETTINGS}
  const candidate = value as Partial<WordleSettings>
  return {
    hardMode: typeof candidate.hardMode === 'boolean' ? candidate.hardMode : false,
    theme:
      candidate.theme === 'light' || candidate.theme === 'dark' || candidate.theme === 'system'
        ? candidate.theme
        : 'system',
    highContrast: typeof candidate.highContrast === 'boolean' ? candidate.highContrast : false,
  }
}

function parseGuesses(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .filter(guess => typeof guess === 'string' && /^[A-Za-z]{5}$/.test(guess))
    .slice(0, 6)
    .map(normalizeWord)
}

function parseStatus(value: unknown): GameStatus {
  return value === 'won' || value === 'lost' || value === 'playing' ? value : 'playing'
}

function parseGame(value: unknown): GameSnapshot | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<GameSnapshot>
  const guesses = parseGuesses(candidate.guesses)
  return {
    guesses,
    status: parseStatus(candidate.status),
    hardMode: typeof candidate.hardMode === 'boolean' ? candidate.hardMode : false,
  }
}

export function reconcileGame(snapshot: GameSnapshot, solution: string): GameSnapshot {
  const guesses = parseGuesses(snapshot.guesses)
  return {
    guesses,
    hardMode: Boolean(snapshot.hardMode),
    status: getGameStatus(solution, guesses),
  }
}

export function parseStoredState(
  rawValue: string | null,
  answerCount: number
): PersistedWordleState {
  const fallback = createDefaultState()
  if (!rawValue) return fallback

  try {
    const value = JSON.parse(rawValue) as Record<string, unknown>
    fallback.settings = parseSettings(value?.settings)
    fallback.hasSeenHelp = value?.hasSeenHelp === true
    if (value?.version !== STORAGE_VERSION) return fallback

    if (value.daily && typeof value.daily === 'object' && !Array.isArray(value.daily)) {
      Object.entries(value.daily as Record<string, unknown>)
        .slice(-5000)
        .forEach(([dateKey, record]) => {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return
          const parsed = parseGame(record)
          if (parsed) fallback.daily[dateKey] = parsed
        })
    }

    const practice = parseGame(value.practice)
    const answerIndex = Number((value.practice as {answerIndex?: unknown} | null)?.answerIndex)
    if (
      practice &&
      Number.isInteger(answerIndex) &&
      answerIndex >= 0 &&
      answerIndex < answerCount
    ) {
      fallback.practice = {...practice, answerIndex}
    }

    const previousIndex = Number(value.lastPracticeAnswerIndex)
    if (Number.isInteger(previousIndex) && previousIndex >= 0 && previousIndex < answerCount) {
      fallback.lastPracticeAnswerIndex = previousIndex
    }
  } catch {
    return fallback
  }

  return fallback
}
