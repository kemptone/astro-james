import type {ReplacementMode} from './settings'
import {STATES_BY_POPULATION} from './states.ts'

/** Playful, kid-friendly words for the game's 1–40 ranking. */
export const RUDE_WORDS = [
  'silly', 'goofy', 'oddball', 'klutz', 'clumsy', 'scatterbrain', 'grumpy',
  'grump', 'fussy', 'grouch', 'sourpuss', 'pest', 'nuisance', 'rascal',
  'scamp', 'troublemaker', 'chatterbox', 'show-off', 'smarty-pants',
  'know-it-all', 'bossy', 'messy', 'sloppy', 'stinker', 'stinky',
  'silly goose', 'ding-a-ling', 'dingbat', 'goofball', 'doofus',
  'nincompoop', 'numbskull', 'airhead', 'blockhead', 'bonehead',
  'knucklehead', 'loudmouth', 'brat', 'bully', 'cow',
] as const

export type CityForReplacement = {name: string}

// Multiply decimal digits as integers so values such as 0.125 stay exact.
function multiplyByEight(value: string): string {
  const number = value.replace(/,/g, '')
  const negative = number.startsWith('-')
  const [whole, fraction = ''] = number.replace(/^[-+]/, '').split('.')
  let product = (BigInt(`${whole || '0'}${fraction}`) * 8n).toString()

  if (fraction.length) {
    product = product.padStart(fraction.length + 1, '0')
    const decimalPosition = product.length - fraction.length
    const decimals = product.slice(decimalPosition).replace(/0+$/, '')
    product = product.slice(0, decimalPosition) + (decimals ? `.${decimals}` : '')
  }

  return negative && product !== '0' ? `-${product}` : product
}

const standaloneNumber = /^[-+]?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|\.\d+)$/u

/** A single number has a predictable answer that Kevin can say immediately. */
export function directReplacementReply(message: string, mode: ReplacementMode, heardMessage: string): string | null {
  if (!standaloneNumber.test(message)) return null
  if (mode === 'multiply') return heardMessage
  if ((mode === 'states' || mode === 'cities') && heardMessage !== message) return `${heardMessage}.`
  return null
}

/** Replace complete numbers according to the selected setting. */
export function replaceRankedNumbers(
  message: string,
  mode: ReplacementMode,
  cities: readonly CityForReplacement[] = [],
): string {
  if (mode === 'none') return message

  if (mode === 'multiply') {
    return message.replace(
      /(?<![\p{L}\p{N}_.])[-+]?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|\.\d+)(?![\p{L}\p{N}_]|\.\d)/gu,
      multiplyByEight,
    )
  }

  return message.replace(
    /(?<![\p{L}\p{N}_])(?:\d{1,3}(?:,\d{3})+|\d+)(?![\p{L}\p{N}_])/gu,
    (match, offset: number, original: string) => {
      const before = original[offset - 1]
      const after = original[offset + match.length]
      if (
        before === '.' ||
        (after === '.' && /\d/.test(original[offset + match.length + 1] ?? '')) ||
        (before === '-' && (offset === 1 || !/[\p{L}\p{N}_)]/u.test(original[offset - 2] ?? '')))
      ) return match

      const rank = Number(match.replace(/,/g, ''))
      if (!Number.isSafeInteger(rank) || rank < 1) return match

      if (mode === 'rude') return RUDE_WORDS[rank - 1] ?? match
      if (mode === 'states') return STATES_BY_POPULATION[rank - 1] ?? match
      const city = cities[rank - 1]
      // The Census calls it "New York city"; this is the familiar spelling.
      return city?.name.replace(/^New York city,/, 'New York City,') ?? match
    },
  )
}
