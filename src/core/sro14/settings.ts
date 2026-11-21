export const DEFAULT_GAME_NAME = 'Clover'
export const GAME_NAME_STORAGE_KEY = 'sro14-game-name'
export const REPLACEMENT_MODE_STORAGE_KEY = 'sro14-replacement-mode'

export type ReplacementMode = 'multiply' | 'none' | 'rude' | 'states' | 'cities'
export const DEFAULT_REPLACEMENT_MODE: ReplacementMode = 'multiply'

/** A game name is a short name, not a separate instruction to Kevin. */
export function normalizeGameName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const name = value.trim().replace(/\s+/g, ' ')
  if (!name || name.length > 40 || !/^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} .’'\-]*$/u.test(name)) {
    return null
  }
  return name
}

export function readGameName(): string {
  try {
    return normalizeGameName(localStorage.getItem(GAME_NAME_STORAGE_KEY)) ?? DEFAULT_GAME_NAME
  } catch {
    return DEFAULT_GAME_NAME
  }
}

export function normalizeReplacementMode(value: unknown): ReplacementMode {
  return value === 'none' || value === 'rude' || value === 'states' || value === 'cities' || value === 'multiply'
    ? value
    : DEFAULT_REPLACEMENT_MODE
}

export function readReplacementMode(): ReplacementMode {
  try {
    return normalizeReplacementMode(localStorage.getItem(REPLACEMENT_MODE_STORAGE_KEY))
  } catch {
    return DEFAULT_REPLACEMENT_MODE
  }
}

export function saveSetting(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // The game still works for this visit if browser storage is unavailable.
  }
}
