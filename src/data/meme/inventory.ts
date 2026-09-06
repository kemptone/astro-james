import {memes2} from './memes2.ts'
import {music} from './music.ts'
import {pranks} from './pranks.ts'
import {reactions} from './reactions.ts'
import {sound_effects} from './sound_fx.ts'

export const MEME_AUDIO_ORIGIN = 'https://www.myinstants.com'

export type MemeDataItem = {
  name: string
  audio: string
}

export type MemeDataSource = {
  name: 'memes2' | 'music' | 'pranks' | 'reactions' | 'sound_fx'
  items: MemeDataItem[]
  published: boolean
}

export type MemeInventoryItem = {
  audioPath: string
  rawAudioPath: string
  names: string[]
  sources: MemeDataSource['name'][]
  published: boolean
}

export const allMemeSources: MemeDataSource[] = [
  {name: 'memes2', items: memes2, published: true},
  {name: 'music', items: music, published: true},
  {name: 'pranks', items: pranks, published: true},
  {name: 'reactions', items: reactions, published: true},
  {name: 'sound_fx', items: sound_effects, published: false},
]

// Preserve the order used by the existing public API.
export const publishedMemeSources = [
  allMemeSources.find(source => source.name === 'reactions')!,
  allMemeSources.find(source => source.name === 'memes2')!,
  allMemeSources.find(source => source.name === 'music')!,
  allMemeSources.find(source => source.name === 'pranks')!,
]

export function canonicalizeAudioPath(audio: string) {
  if (typeof audio !== 'string' || !audio.startsWith('/')) {
    throw new Error('Meme audio paths must be origin-relative')
  }

  const url = new URL(audio, MEME_AUDIO_ORIGIN)

  if (
    url.origin !== MEME_AUDIO_ORIGIN ||
    !url.pathname.startsWith('/media/sounds/')
  ) {
    throw new Error('Meme audio path is outside the approved media directory')
  }

  return url.pathname
}

export function buildMemeInventory(
  sources: MemeDataSource[] = allMemeSources
) {
  const inventory = new Map<string, MemeInventoryItem>()

  for (const source of sources) {
    for (const item of source.items) {
      const audioPath = canonicalizeAudioPath(item.audio)
      const existing = inventory.get(audioPath)

      if (existing) {
        if (!existing.names.includes(item.name)) existing.names.push(item.name)
        if (!existing.sources.includes(source.name)) {
          existing.sources.push(source.name)
        }
        existing.published ||= source.published
        continue
      }

      inventory.set(audioPath, {
        audioPath,
        rawAudioPath: item.audio,
        names: [item.name],
        sources: [source.name],
        published: source.published,
      })
    }
  }

  return [...inventory.values()]
}

export function getPublishedMemeItems(
  blockedAudioPaths: ReadonlySet<string>,
  sources: MemeDataSource[] = publishedMemeSources
) {
  const seen = new Set<string>()
  const published: MemeDataItem[] = []

  for (const source of sources) {
    for (const item of source.items) {
      const audioPath = canonicalizeAudioPath(item.audio)
      if (seen.has(audioPath) || blockedAudioPaths.has(audioPath)) continue

      seen.add(audioPath)
      published.push(item)
    }
  }

  return published
}

export function getPublishedAudioPaths(
  blockedAudioPaths: ReadonlySet<string>,
  sources: MemeDataSource[] = publishedMemeSources
) {
  return new Set(
    getPublishedMemeItems(blockedAudioPaths, sources).map(item =>
      canonicalizeAudioPath(item.audio)
    )
  )
}
