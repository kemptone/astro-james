import {CountryKeys} from '@/data/Countries'
import Languages from '@/data/Languages'
import {persist, populate} from '@/helpers/localStorage'

// import {CountryKeys} from '@/data/Countries'
// import Languages from '@/data/Languages'
// import {persist, populate} from '@/helperslocalStorage'

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

export function createVoiceManager() {
  // Initialize state variables
  let voices: MetaVoice[] = []
  let englishOnly: boolean = true
  let synth: SpeechSynthesis | null = null

  // Retrieve persisted data from local storage
  const persistedData = populate('voice') ?? {}
  let voice_name: string = persistedData.voice_name || ''
  let read: string = persistedData.read || ''

  // Set synth to window.speechSynthesis (originally in useEffect)
  synth = window.speechSynthesis

  // Function to update the voices list
  function updateVoices() {
    const allVoices = loadAllVoiceList()
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

    voices = flatlist
  }

  // Set up event listener for when available voices change (originally in useEffect)
  window.speechSynthesis.onvoiceschanged = () => {
    updateVoices()
  }

  // Perform initial voices update (replacing initial useEffect run)
  updateVoices()

  // Method to change the englishOnly filter
  function changeEnglishOnly(newValue: boolean) {
    englishOnly = newValue
    updateVoices()
  }

  // Speak function to handle text-to-speech
  function Speak({read = '', voice_name = ''}) {
    persist('voice', {voice_name, read})

    if (synth?.speaking) {
      console.error('speechSynthesis.speaking')
      return
    }

    if (!read) {
      return
    }

    const utterThis = new SpeechSynthesisUtterance(read)

    utterThis.onend = function () {
      console.log('SpeechSynthesisUtterance.onend')
    }

    utterThis.onerror = function () {
      console.error('SpeechSynthesisUtterance.onerror')
    }

    const selected_voice = voices.find(item => item.name === voice_name)

    if (selected_voice) {
      utterThis.voice = selected_voice.voice
      synth?.speak(utterThis)
    }
  }

  // Return an object with getters and methods
  return {
    get voices() {
      return voices
    },
    get englishOnly() {
      return englishOnly
    },
    changeEnglishOnly,
    get synth() {
      return synth
    },
    get voice_name() {
      return voice_name
    },
    get read() {
      return read
    },
    Speak,
  }
}

export function loadAllVoiceList() {
  const synth = window.speechSynthesis
  const voices = synth.getVoices().sort(function (a, b) {
    const aname = a.lang
    const bname = b.lang
    if (aname < bname) {
      return -1
    } else if (aname == bname) {
      return 0
    } else {
      return +1
    }
  })
  return voices
}
