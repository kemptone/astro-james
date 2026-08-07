import {badWordRanking} from '../../data/meme/bad-word-ranking'

const rankToWord = new Map(
  badWordRanking.map(({rank, word}) => [String(rank), word])
)
const wordToRank = new Map(
  badWordRanking.map(({rank, word}) => [word.toLowerCase(), String(rank)])
)

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const rankPattern = [...rankToWord.keys()]
  .sort((a, b) => b.length - a.length || b.localeCompare(a))
  .map(escapeRegExp)
  .join('|')

const wordPattern = [...wordToRank.keys()]
  .sort((a, b) => b.length - a.length)
  .map(word => escapeRegExp(word).replace(/ /g, '\\s+'))
  .join('|')

const playbackSwapPattern = new RegExp(
  `(^|[^\\p{L}\\p{N}_])(?:(${rankPattern})([\\p{L}]*)|(${wordPattern}))(?![\\p{L}\\p{N}_])`,
  'giu'
)

/**
 * Swaps canonical bad-word ranks and words in the text sent to Talkers2 TTS.
 * A single replacement pass keeps generated values from being swapped again.
 */
export function swapBadWordRanksForPlayback(value: string) {
  return value.replace(
    playbackSwapPattern,
    (
      match,
      prefix: string,
      matchedRank: string | undefined,
      rankSuffix: string | undefined,
      matchedWord: string | undefined
    ) => {
      const replacement = matchedRank
        ? rankToWord.get(matchedRank)
        : wordToRank.get((matchedWord || '').toLowerCase().replace(/\s+/g, ' '))

      return replacement === undefined
        ? match
        : `${prefix}${replacement}${rankSuffix || ''}`
    }
  )
}
