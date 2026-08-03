export type BadWordRankingItem = {
  rank: number
  word: string
}

// Lower numbers are stronger. Source ranking:
// https://www.joe.ie/life-style/swear-words-definitive-ranking-776528
export const badWordRanking: readonly BadWordRankingItem[] = [
  {rank: 1, word: 'cunt'},
  {rank: 2, word: 'wanker'},
  {rank: 3, word: 'motherfucker'},
  {rank: 4, word: 'fuck'},
  {rank: 5, word: 'bastard'},
  {rank: 6, word: 'dick'},
  {rank: 7, word: 'dickhead'},
  {rank: 8, word: 'knob'},
  {rank: 9, word: 'cock'},
  {rank: 10, word: 'minge'},
  {rank: 11, word: 'pussy'},
  {rank: 12, word: 'punani'},
  {rank: 13, word: 'twat'},
  {rank: 14, word: 'prick'},
  {rank: 15, word: 'gash'},
  {rank: 16, word: 'clunge'},
  {rank: 17, word: 'snatch'},
  {rank: 18, word: 'fanny'},
  {rank: 19, word: 'tit'},
  {rank: 20, word: 'bellend'},
  {rank: 21, word: 'bollocks'},
  {rank: 22, word: 'son of a bitch'},
  {rank: 23, word: 'bitch'},
  {rank: 24, word: 'jesus christ'},
  {rank: 25, word: 'shit'},
  {rank: 26, word: 'pissed'},
  {rank: 27, word: 'bullshit'},
  {rank: 28, word: 'arsehole'},
  {rank: 29, word: 'balls'},
  {rank: 30, word: 'minger'},
  {rank: 31, word: 'munter'},
  {rank: 32, word: 'bint'},
  {rank: 33, word: 'arse'},
  {rank: 34, word: 'git'},
  {rank: 35, word: 'bugger'},
  {rank: 36, word: 'sod'},
  {rank: 37, word: 'bloody'},
  {rank: 38, word: 'crap'},
  {rank: 39, word: 'damn'},
  {rank: 40, word: 'cow'},
]

const badWordAliases: Readonly<Partial<Record<number, readonly string[]>>> = {
  1: ['cunts'],
  2: ['wankers'],
  3: ['mf', 'motherf', 'motherfs', 'motherfuckers'],
  4: ['fkn', 'wtf', 'f cked', 'fucks', 'fucked', 'fucking', 'fuckers'],
  5: ['bastards'],
  6: ['dicks'],
  7: ['dickheads'],
  8: ['knobs'],
  9: ['cocks'],
  10: ['minges'],
  11: ['pussies'],
  12: ['punanis'],
  13: ['twats'],
  14: ['pricks'],
  15: ['gashes'],
  16: ['clunges'],
  17: ['snatches'],
  18: ['fannies'],
  19: ['tits'],
  20: ['bellends'],
  22: ['sons of bitches'],
  23: ['bitches', 'b tch'],
  25: ['shits', 'shitty', 'shitpost', 'shitposts'],
  27: ['bullshits', 'bullshet'],
  28: ['arseholes'],
  30: ['mingers'],
  31: ['munters'],
  32: ['bints'],
  33: ['arses'],
  34: ['gits'],
  35: ['buggers'],
  36: ['sods'],
  38: ['craps'],
  39: ['damns', 'goddamn'],
  40: ['cows'],
}

const censoredWordPatterns = [
  {rank: 4, pattern: /\bf+u+c+k+\b/i},
  {rank: 23, pattern: /\bbit\*{2,}/i},
] as const

function normalizeWords(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function getBadWordRanks(value: string) {
  const normalizedValue = normalizeWords(value)
  if (!normalizedValue) return []

  const paddedValue = ` ${normalizedValue} `
  const ranks = badWordRanking
    .filter(({rank, word}) => {
      const words = [word, ...(badWordAliases[rank] || [])]
      return words.some(candidate => {
        const normalizedWord = normalizeWords(candidate)
        return paddedValue.includes(` ${normalizedWord} `)
      })
    })
    .map(({rank}) => rank)

  censoredWordPatterns.forEach(({rank, pattern}) => {
    if (pattern.test(value) && !ranks.includes(rank)) ranks.push(rank)
  })

  // "Son of a bitch" is one ranked phrase, rather than two separate flags.
  if (ranks.includes(22)) {
    const bitchIndex = ranks.indexOf(23)
    if (bitchIndex !== -1) ranks.splice(bitchIndex, 1)
  }

  return ranks.sort((a, b) => a - b)
}
