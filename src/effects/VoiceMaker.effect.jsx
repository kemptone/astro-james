import { useEffect, useState } from 'preact/hooks'
import { CountryKeys } from '../data/Countries.ts'
import Languages from '../data/Languages.ts'
import { persist, populate } from '../helpers/localStorage.js'

export default function () {

  const synth = window.speechSynthesis
  const { voice_name, read } = populate("voice") ?? {}
  const [voices, addVoices] = useState([])
  const [englishOnly, changeEnglishOnly] = useState(true)

  useEffect(() => {

    const allVoices = loadAllVoiceList()
    const flatlist = []

    allVoices
      .filter(voice => {
        if (englishOnly) {
          let [lang, region] = voice?.lang?.split("-") ?? ["fard", "FARD"]
          return lang === "en"
        }
        return true
      })
      .forEach(voice => {
        const [langKey, countryKey] = voice.lang.split("-")
        flatlist.push({
          name: voice.name
          , localService: voice.localService
          , voiceURI: voice.voiceURI
          , lang: {
            countryKey
            , langKey
            , countryName: CountryKeys[countryKey]
            , ...Languages[langKey]
          }
          , voice: voice
        })
      })

    // const languages_set = new Set(allVoices.map(i => i.lang))
    addVoices(flatlist)

  }, [englishOnly])

  return {
    voices
    , addVoices
    , englishOnly
    , changeEnglishOnly
    , synth
    , voice_name
    , read
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

export const Speak = ({ synth, voices }) => (e) => {

  const {
    read
    , voice_name
  } = Object.fromEntries(new FormData(e.currentTarget))

  persist("voice", { voice_name, read })

  if (synth.speaking) {
    console.error("speechSynthesis.speaking")
    return
  }

  if (!read)
    return

  const utterThis = new SpeechSynthesisUtterance(read)

  utterThis.onend = function (event) {
    console.log("SpeechSynthesisUtterance.onend")
  }

  utterThis.onerror = function (event) {
    console.error("SpeechSynthesisUtterance.onerror")
  }

  const selected_voice = voices.find(item => item.name === voice_name)
  utterThis.voice = selected_voice.voice
  synth.speak(utterThis)

}