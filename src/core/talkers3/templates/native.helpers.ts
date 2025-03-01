import {CountryKeys} from '@/data/Countries'
import Languages from '@/data/Languages'

export type MetaVoice = {
  name: string
  localService: boolean
  voiceURI: string
  lang: {
    countryKey: string
    langKey: string
    countryName: string
    name?: string
  }
  voice: SpeechSynthesisVoice
}

const Voices: MetaVoice[] = []
const synth = window.speechSynthesis

export function speak(read = '', voice_name = '') {
  return new Promise((resolve, reject) => {
    if (synth?.speaking) {
      console.error('speechSynthesis.speaking')
      return
    }

    if (!read) {
      return
    }

    const utterThis = new SpeechSynthesisUtterance(read)

    utterThis.onend = function () {
      resolve({read, voice_name})
    }

    utterThis.onerror = function () {
      reject({read, voice_name})
    }

    const selected_voice = Voices.find(item => item.name === voice_name)

    if (selected_voice) {
      utterThis.voice = selected_voice.voice
      synth?.speak(utterThis)
    }
  })
}

export async function loadAllVoiceList() {
  const synth = window.speechSynthesis

  return new Promise(resolve => {
    let voices = synth.getVoices()
    if (voices.length !== 0) {
      resolve(voices.sort((a, b) => a.lang.localeCompare(b.lang)))
    } else {
      synth.onvoiceschanged = () => {
        voices = synth.getVoices()
        resolve(voices.sort((a, b) => a.lang.localeCompare(b.lang)))
      }
    }
  })
}

export async function getSortedVoices(englishOnly?: boolean) {
  const allVoices = (await loadAllVoiceList()) as SpeechSynthesisVoice[]
  const flatlist: MetaVoice[] = []

  allVoices
    .filter(voice => {
      if (englishOnly) {
        let [lang] = voice?.lang?.split('-') ?? ['', '']
        return lang === 'en'
      }
      return true
    })
    .forEach(voice => {
      const [langKey, countryKey] = voice.lang.split('-')
      flatlist.push({
        name: voice.name,
        localService: voice.localService,
        voiceURI: voice.voiceURI,
        lang: {
          countryKey,
          langKey,
          countryName: CountryKeys[countryKey],
          ...Languages[langKey],
        },
        voice: voice,
      })
    })

  Voices.length = 0
  Voices.push(...flatlist)

  return flatlist
}
