export const RANKED_OR_UNCHECKED_NUMBER = 41

export type CompletedSoundCheck =
  | {
      audioCheckStatus: 'checked'
      badWordRanks: number[]
    }
  | {
      audioCheckStatus: 'inconclusive'
      badWordRanks: null
    }

export type SoundAudienceModes = Readonly<{
  kid: boolean
  adult: boolean
  badWords: boolean
}>

export type SoundAudience = 'kid' | 'adult' | 'badWords'

export function soundAudienceForCheck(
  check: CompletedSoundCheck | null
): SoundAudience {
  if (!check || check.audioCheckStatus === 'inconclusive') return 'adult'
  return check.badWordRanks.length ? 'badWords' : 'kid'
}

export function soundCheckMatchesAudienceModes(
  check: CompletedSoundCheck | null,
  modes: SoundAudienceModes
) {
  if (!modes.kid && !modes.adult && !modes.badWords) return true
  return modes[soundAudienceForCheck(check)]
}

const RANK_LIST_PATTERN = /^\s*(?:[1-9]|[1-3]\d|4[01])(?:\s*,\s*(?:[1-9]|[1-3]\d|4[01]))*\s*$/

/**
 * Parses a complete comma-separated list of audio ranking numbers. Partial
 * numbers and ordinary title searches deliberately do not enter rank mode.
 */
export function parseSoundRankList(value: string) {
  if (!RANK_LIST_PATTERN.test(value)) return null

  return Array.from(
    new Set(value.split(',').map(part => Number(part.trim())))
  )
}

export function soundCheckHasNumber(
  check: CompletedSoundCheck | null,
  number: number
) {
  if (number === RANKED_OR_UNCHECKED_NUMBER) {
    return (
      !check ||
      (check.audioCheckStatus === 'checked' && check.badWordRanks.length > 0)
    )
  }

  if (!check || check.audioCheckStatus !== 'checked') return false

  return check.badWordRanks.includes(number)
}

export function soundCheckHasAnyNumber(
  check: CompletedSoundCheck | null,
  numbers: readonly number[]
) {
  return numbers.some(number => soundCheckHasNumber(check, number))
}
