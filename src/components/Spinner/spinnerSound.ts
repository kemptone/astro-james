import loadReverb from './spinnerReverb'

export type AudioThing = {
  audioFile: string
  initialPlaybackRate: number
}

export type AudioCallback = {
  source: AudioBufferSourceNode
  play: () => void
  stop: () => void
}

export function useAudioLoop(
  that: HTMLElement,
  audio: AudioThing,
  callback?: (a: AudioCallback) => void,
) {
  const {audioFile, initialPlaybackRate} = audio
  const audioContext = new AudioContext()

  fetch(audioFile)
    .then(response => response.arrayBuffer())
    .then(buffer => audioContext.decodeAudioData(buffer))
    .then(audioBuffer => {
      const {sampleRate, numberOfChannels, length} = audioBuffer

      // we build our samples perfect like this
      const loopLength = Math.floor(length / 8)
      // should be in the middle
      const loopStart = loopLength * 2

      const loopBuffer = audioContext.createBuffer(
        numberOfChannels,
        loopLength,
        sampleRate
      )

      for (let channel = 0; channel < numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel)
        const loopData = loopBuffer.getChannelData(channel)
        for (let i = 0; i < loopLength; i++) {
          loopData[i] = channelData[Math.floor(loopStart) + i]
        }
      }

      const source = audioContext.createBufferSource()
      source.buffer = loopBuffer
      source.loop = true
      source.playbackRate.setValueAtTime(
        initialPlaybackRate,
        audioContext.currentTime
      )

      loadReverb('/impulse/reaperblog/IRx1000_03C.wav', audioContext).then(
        reverb => {
          const gain = new GainNode(audioContext)
          gain.gain.value = 0.125

          source
          // 
          .connect(gain)
          // 
          .connect(reverb)
          // 
          .connect(audioContext.destination)

          function play() {
            source.start(0)
          }

          function stop() {
            source.stop()
          }

          that.addEventListener('started', play)
          that.addEventListener('stopped', stop)

          callback?.({
            source,
            play,
            stop,
          })
        }
      )
    })
}
