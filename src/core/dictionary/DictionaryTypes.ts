export type DictionaryEntry = {
  startIndex: number
  endIndex: number
  raw: string
  word: string
  prounciation?: string
  definitions?: string[]
  examples?: string[]
  synonyms?: string[]
  antonyms?: string[]
  related?: string[]
  etymology?: string
  others?: string
}
