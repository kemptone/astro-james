// let audioContext: AudioContext
import {soundLevels, type SoundLevel} from './soundLevels'

const audios = [
  '/too_loud/too_loud_1.m4a',
  '/too_loud/too_loud_2.m4a',
  '/too_loud/too_loud_3.m4a',
  '/too_loud/too_loud_4.m4a',
  '/too_loud/too_loud_5.m4a',
]

// TypeScript code

// Get the audio file
// const audioFileUrl = 'path/to/your/audiofile.mp4';

// Initialize the AudioContext
// const audioContext = new (window.AudioContext || window.webkitAudioContext)();

let stop = false

// Function to load and play the audio
const playAudio = async () => {

  if (stop) return
  stop = true

  let length = audios.length
  const audioFileUrl = audios[Math.floor(Math.random() * length)]

  // const audioFileUrl = 'path/to/your/audiofile.mp4'
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()

  try {
    const response = await fetch(audioFileUrl)
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    // Create a buffer source node
    const source = audioContext.createBufferSource()
    source.buffer = audioBuffer

    const gainNode = audioContext.createGain()
    gainNode.gain.value = 3.0

    source.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Play the audio
    source.start(0)

    setTimeout(() => {
      stop = false
    }, 2000)

  } catch (error) {
    console.error('Error loading audio:', error)
  }
}

const addDecibelListener =
  (self: any, callback: (stream: MediaStream, _interval: any) => void) =>
  () => {
    const $ = (selector: string) => self.querySelector(selector)
    const e_graph1: HTMLElement = $('.graph1')
    let audioContext: AudioContext

    playAudio()

    // @ts-ignore
    if (window.AudioContext || window.webkitAudioContext) {
      // @ts-ignore
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
    }

    // Get user media
    navigator.mediaDevices
      .getUserMedia({audio: true})
      .then(stream => {
        const audioInput = audioContext.createMediaStreamSource(stream)
        const analyser = audioContext.createAnalyser()

        // Set up analyser node
        analyser.fftSize = 256
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        // Connect the audio input to the analyser
        audioInput.connect(analyser)

        // Function to calculate average amplitude
        const getAverageAmplitude = () => {
          analyser.getByteFrequencyData(dataArray)
          let sum = dataArray.reduce((acc, value) => acc + value, 0)
          return sum / bufferLength
        }

        const maxSmallArray: number[] = []
        const maxMediumArray: number[] = []
        const maxLargeArray: number[] = []

        // Interval to check average amplitude and trigger event
        const interval = setInterval(() => {
          const averageAmplitude = getAverageAmplitude()
          maxSmallArray.push(averageAmplitude)
          maxMediumArray.push(averageAmplitude)
          maxLargeArray.push(averageAmplitude)
          const maxSmall = Math.max(...maxSmallArray)
          const maxMedium = Math.max(...maxMediumArray)
          const maxLarge = Math.max(...maxLargeArray)

          if (maxSmallArray.length > 10) {
            maxSmallArray.splice(0, 1)
          }
          if (maxMediumArray.length > 50) {
            maxMediumArray.splice(0, 1)
          }
          if (maxLargeArray.length > 410) {
            maxLargeArray.splice(0, 1)
            if (e_graph1 && e_graph1.firstChild) {
              e_graph1.removeChild(e_graph1.firstChild)
            }
          }

          // creates a custom event
          const event = new CustomEvent('decibel', {
            detail: {
              averageAmplitude,
              maxSmall,
              maxMedium,
              maxLarge,
            },
          })

          self.dispatchEvent(event)
        }, 30)

        callback(stream, interval)
      })

      .catch(error => {
        console.error('Error accessing microphone:', error)
      })
  }

function buildGraphItem(height: number, range: SoundLevel | undefined) {
  const gi = document.createElement('div')
  gi.style.height = String(height * 3.5) + 'px'

  if (range) {
    gi.classList.add(range.css)
  }

  return gi
}

class WCDecibel extends HTMLElement {
  state = {
    is_on: false,
  }

  connectedCallback() {
    const $ = (selector: string) => this.querySelector(selector)
    const e_button = $('button')
    const e_button_inner = $('button span')
    const e_reading = $('.reading')
    const e_reading_name = $('.reading-name')
    const e_graph1 = $('.graph1')
    const e_slider = $('input[type=range]') as HTMLInputElement

    let threshold = Number(e_slider.value || '86')

    e_slider.addEventListener('input', () => {
      threshold = Number(e_slider.value || '86')
    })

    const that = this

    if (!e_reading || !e_reading_name || !e_button_inner) return

    // let stop = false

    // function playRandomAudio() {
    //   if (stop) return
    //   stop = true
    //   let length = e_audios.length
    //   let random = Math.floor(Math.random() * length)
    //   e_audios[random].play()
    //   console.log('playing audio')
    //   setTimeout(() => {
    //     stop = false
    //   }, 2000)
    // }

    const decibelEvent = (e: any) => {
      const {detail} = e
      const {averageAmplitude, maxSmall, maxMedium, maxLarge} = detail

      const formattedAmplitude = Intl.NumberFormat(undefined, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      }).format(maxSmall)

      const range = soundLevels.find(({range}) => {
        return maxMedium >= range.min && maxMedium <= range.max
      })

      e_reading.innerHTML = formattedAmplitude + ' dB'
      e_reading_name.innerHTML = range?.name || 'Unknown'
      e_button_inner.innerHTML = range?.symbol || '🎧'

      e_graph1?.append(buildGraphItem(averageAmplitude, range))

      if (maxSmall > threshold) {
        playAudio()
        // playRandomAudio()
      }
    }

    const listener = addDecibelListener(this, (stream, interval) => {
      console.count('adding decibel')
      that.addEventListener('decibel', decibelEvent)
      e_button?.removeEventListener('click', listener)

      const listener2 = () => {
        console.count('re adding click, and removing audio listening')
        clearInterval(interval)
        stream.getTracks().forEach(track => {
          track.stop()
        })
        that.removeEventListener('decibel', decibelEvent)
        e_button?.removeEventListener('click', listener2)
        e_button?.addEventListener('click', listener)
      }

      e_button?.addEventListener('click', listener2)
    })

    e_button?.addEventListener('click', listener)
    e_button_inner.innerHTML = soundLevels?.[0]?.symbol
  }
}

if (typeof window != 'undefined') customElements.define('wc-decibel', WCDecibel)
