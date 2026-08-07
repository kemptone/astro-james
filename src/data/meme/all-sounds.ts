import {memes2} from './memes2'
import {music} from './music'
import {pranks} from './pranks'
import {reactions} from './reactions'
import {restoredMemeSounds} from './restored-sounds'
import {sound_effects} from './sound_fx'

export type MemeSoundSource = {
  name: string
  audio: string
}

export const allMemeSounds: readonly MemeSoundSource[] = [
  ...reactions,
  ...memes2,
  ...music,
  ...pranks,
  ...sound_effects,
  ...restoredMemeSounds,
]

const MYINSTANTS_ORIGIN = 'https://www.myinstants.com'

export const allowedMemeAudioUrls = new Set(
  allMemeSounds.map(item => new URL(item.audio, MYINSTANTS_ORIGIN).href)
)
