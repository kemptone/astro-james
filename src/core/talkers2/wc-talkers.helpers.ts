import {VoiceId} from '@aws-sdk/client-polly'
import {type AzureVoiceInfo} from './types'

const VOICES = 'get_ms_voices'

const dog = {
  [VOICES]: (function () {
    let _t = localStorage.getItem(VOICES)
    if (_t) return JSON.parse(_t) as AzureVoiceInfo[]
    return null
  })(),
}

export async function getMicrosoftVoices() {
  if (dog[VOICES]) return dog[VOICES]
  const response = await fetch('/api/polly/list_m')
  const _voices: AzureVoiceInfo[] = await response.json()

  const voices = _voices
    .filter(item => {
      return item.Locale.startsWith('en-')
    })
    .filter(item => {
      return !item.Name.includes('Multilingual')
    })

  voices.forEach(item => {
    item.Face = makeFace(item.ShortName)
    return item
  })

  localStorage.setItem(VOICES, JSON.stringify(voices))
  return (dog[VOICES] = voices)
}

function makeFace(name: string) {
  return `https://api.dicebear.com/9.x/croodles-neutral/svg?seed=${name}`
}

export type FormType = {
  voiceId: VoiceId
  text: string
  text_hidden?: string
  engine: string
}

export type GrokStoryType = {
  voiceId: VoiceId
  name: string
  engine: string
}

export const playGrokStory = async (
  values: GrokStoryType,
  should_play: boolean
) => {
  const response = await fetch('/api/polly/say_story', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name : values.name,
      voiceId: values.voiceId,
      engine: values.engine,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch audio')
  }

  // Read the response body as a ReadableStream
  const reader = response.body?.getReader()
  const chunks = []

  // Read chunks of data from the stream
  while (true) {
    const {done, value} = await reader?.read?.()
    if (done) break
    chunks.push(value)
  }

  // Convert chunks to a Blob
  const audioBlob = new Blob(chunks, {type: 'audio/mpeg'})
  const audioUrl = URL.createObjectURL(audioBlob)

  // Create and play an audio element
  const audio = new Audio(audioUrl)
  if (should_play) {
    audio.play()
  }
  return audio
}

export const playText = async (
  form: {
    values: FormType
  },
  should_play: boolean
) => {
  const response = await fetch('/api/polly/say', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: form.values.text || form.values.text_hidden,
      voiceId: form.values.voiceId,
      engine: form.values.engine,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch audio')
  }

  // Read the response body as a ReadableStream
  const reader = response.body?.getReader()
  const chunks = []

  // Read chunks of data from the stream
  while (true) {
    const {done, value} = await reader?.read?.()
    if (done) break
    chunks.push(value)
  }

  // Convert chunks to a Blob
  const audioBlob = new Blob(chunks, {type: 'audio/mpeg'})
  const audioUrl = URL.createObjectURL(audioBlob)

  // Create and play an audio element
  const audio = new Audio(audioUrl)
  if (should_play) {
    audio.play()
  }
  return audio
}

export const playMeme = async ({audio}: {audio: string}) => {
  const response = await fetch('/api/get_meme', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ audio }),
  })
  if (!response.ok) throw new Error('Failed to fetch MP3')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  return new Audio(url)
}

type WordGapCompressionOptions = {
  percent: number
  silenceThreshold?: number
  frameMs?: number
  minGapMs?: number
  maxGapMs?: number
}

type SilenceRange = {
  start: number
  end: number
  keep: number
}

const DEFAULT_WORD_GAP_OPTIONS: Required<WordGapCompressionOptions> = {
  percent: 100,
  // Base threshold. The runtime analyzer adapts this per clip.
  silenceThreshold: 0.004,
  frameMs: 8,
  minGapMs: 55,
  maxGapMs: 420,
}

export async function compressWordGaps(
  audio: HTMLAudioElement,
  options: WordGapCompressionOptions
) {
  const merged = {
    ...DEFAULT_WORD_GAP_OPTIONS,
    ...options,
  }

  if (!audio?.src) return audio

  const percent = clamp(merged.percent, 0, 100)
  if (percent === 100) return audio

  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & {webkitAudioContext?: typeof AudioContext})
      .webkitAudioContext

  if (!AudioContextCtor) return audio

  const sourceResponse = await fetch(audio.src)
  if (!sourceResponse.ok) return audio

  const sourceBuffer = await sourceResponse.arrayBuffer()
  const context = new AudioContextCtor()

  try {
    const decoded = await context.decodeAudioData(sourceBuffer.slice(0))

    const compressed = buildCompressedGapBuffer(decoded, context, {
      ...merged,
      percent,
    })

    if (!compressed) return audio

    const wavBlob = audioBufferToWav(compressed)
    const wavUrl = URL.createObjectURL(wavBlob)
    const nextAudio = new Audio(wavUrl)
    nextAudio.addEventListener(
      'ended',
      () => {
        URL.revokeObjectURL(wavUrl)
      },
      {once: true}
    )

    if (audio.src.startsWith('blob:')) {
      URL.revokeObjectURL(audio.src)
    }

    return nextAudio
  } finally {
    context.close().catch(() => {})
  }
}

function buildCompressedGapBuffer(
  input: AudioBuffer,
  context: BaseAudioContext,
  options: Required<WordGapCompressionOptions>
) {
  const ranges = collectWordGapRanges(input, options)
  if (ranges.length === 0) return null

  const totalRemoved = ranges.reduce((sum, range) => {
    const len = range.end - range.start
    return sum + Math.max(0, len - range.keep)
  }, 0)

  if (totalRemoved <= 0) return null

  const outputLength = Math.max(1, input.length - totalRemoved)
  const output = context.createBuffer(
    input.numberOfChannels,
    outputLength,
    input.sampleRate
  )

  for (let channel = 0; channel < input.numberOfChannels; channel++) {
    const source = input.getChannelData(channel)
    const target = output.getChannelData(channel)
    let sourcePos = 0
    let targetPos = 0

    for (const range of ranges) {
      if (range.start > sourcePos) {
        target.set(source.subarray(sourcePos, range.start), targetPos)
        targetPos += range.start - sourcePos
      }

      if (range.keep > 0) {
        const keepEnd = range.start + range.keep
        target.set(source.subarray(range.start, keepEnd), targetPos)
        targetPos += range.keep
      }

      sourcePos = range.end
    }

    if (sourcePos < input.length) {
      target.set(source.subarray(sourcePos), targetPos)
    }
  }

  return output
}

function collectWordGapRanges(
  input: AudioBuffer,
  options: Required<WordGapCompressionOptions>
) {
  const frameSize = Math.max(
    1,
    Math.floor((input.sampleRate * options.frameMs) / 1000)
  )
  const frameCount = Math.ceil(input.length / frameSize)
  const channelData = Array.from(
    {length: input.numberOfChannels},
    (_, index) => input.getChannelData(index)
  )
  const frameRms = new Array<number>(frameCount).fill(0)
  const framePeak = new Array<number>(frameCount).fill(0)

  for (let frame = 0; frame < frameCount; frame++) {
    const start = frame * frameSize
    const end = Math.min(start + frameSize, input.length)
    let peak = 0
    let sumSquares = 0
    let samples = 0

    for (let ch = 0; ch < channelData.length; ch++) {
      const data = channelData[ch]
      for (let i = start; i < end; i++) {
        const value = Math.abs(data[i])
        if (value > peak) peak = value
        sumSquares += value * value
        samples++
      }
    }

    framePeak[frame] = peak
    frameRms[frame] = Math.sqrt(sumSquares / Math.max(1, samples))
  }

  const adaptiveThreshold = buildAdaptiveSilenceThreshold(
    frameRms,
    options.silenceThreshold
  )
  const silentFrames = frameRms.map((rms, index) => {
    return rms < adaptiveThreshold && framePeak[index] < adaptiveThreshold * 2.1
  })

  // Smooth one-frame spikes from MP3 artifacts.
  for (let i = 1; i < silentFrames.length - 1; i++) {
    if (!silentFrames[i] && silentFrames[i - 1] && silentFrames[i + 1]) {
      silentFrames[i] = true
    }
  }

  const runs: Array<{startSample: number; endSample: number; gapMs: number}> = []
  let runStart = -1

  for (let i = 0; i <= silentFrames.length; i++) {
    const isSilent = i < silentFrames.length ? silentFrames[i] : false

    if (isSilent && runStart === -1) {
      runStart = i
      continue
    }

    if (!isSilent && runStart !== -1) {
      const startSample = runStart * frameSize
      const endSample = Math.min(i * frameSize, input.length)
      const gapSamples = endSample - startSample

      const gapMs = (gapSamples / input.sampleRate) * 1000
      runs.push({startSample, endSample, gapMs})

      runStart = -1
    }
  }

  const interiorGapMs = runs
    .filter(run => {
      return run.startSample > 0 && run.endSample < input.length
    })
    .map(run => run.gapMs)
    .filter(ms => ms >= options.minGapMs * 0.6 && ms <= options.maxGapMs * 1.8)

  const typicalGapMs = median(interiorGapMs)
  const dynamicMinGapMs = typicalGapMs
    ? Math.max(35, typicalGapMs * 0.5)
    : options.minGapMs
  const dynamicMaxGapMs = typicalGapMs
    ? Math.max(dynamicMinGapMs + 25, typicalGapMs * 1.8)
    : options.maxGapMs

  const ranges: SilenceRange[] = []
  for (const run of runs) {
    const isEdgeGap = run.startSample === 0 || run.endSample === input.length
    const isWordGap = run.gapMs >= dynamicMinGapMs && run.gapMs <= dynamicMaxGapMs
    if (isEdgeGap || !isWordGap) continue

    const gapSamples = run.endSample - run.startSample
    if (gapSamples <= 0) continue

    ranges.push({
      start: run.startSample,
      end: run.endSample,
      keep: Math.floor((gapSamples * options.percent) / 100),
    })
  }

  if (ranges.length === 0 && options.percent === 0) {
    for (const run of runs) {
      const isEdgeGap = run.startSample === 0 || run.endSample === input.length
      const isBroadSilence = run.gapMs >= 20 && run.gapMs <= 900
      if (isEdgeGap || !isBroadSilence) continue

      ranges.push({
        start: run.startSample,
        end: run.endSample,
        keep: 0,
      })
    }
  }

  return ranges
}

function audioBufferToWav(buffer: AudioBuffer) {
  const channels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const frames = buffer.length
  const bytesPerSample = 2
  const dataSize = frames * channels * bytesPerSample
  const arrayBuffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(arrayBuffer)

  writeAscii(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeAscii(view, 8, 'WAVE')
  writeAscii(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * channels * bytesPerSample, true)
  view.setUint16(32, channels * bytesPerSample, true)
  view.setUint16(34, 16, true)
  writeAscii(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < frames; i++) {
    for (let channel = 0; channel < channels; channel++) {
      const value = buffer.getChannelData(channel)[i]
      const sample = Math.max(-1, Math.min(1, value))
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true
      )
      offset += bytesPerSample
    }
  }

  return new Blob([view], {type: 'audio/wav'})
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i))
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function buildAdaptiveSilenceThreshold(frameRms: number[], base: number) {
  if (frameRms.length === 0) return base

  const p20 = percentile(frameRms, 0.2)
  const p40 = percentile(frameRms, 0.4)

  const floor = Math.max(0.0015, p20 * 1.35)
  const ceiling = Math.max(floor, p40 * 0.62)

  return clamp(Math.max(base, floor), 0.0015, Math.max(0.03, ceiling))
}

function percentile(values: number[], q: number) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = clamp(q, 0, 1) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]
  const ratio = index - lower
  return sorted[lower] * (1 - ratio) + sorted[upper] * ratio
}

function median(values: number[]) {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }
  return sorted[middle]
}

export const playTextAzure = async (
  form: {
    values: AzureVoiceInfo & {
      text?: string
      text_hidden?: string
      express_as?: string
    }
  },
  should_play: boolean
) => {
  const response = await fetch('/api/polly/say_m', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...form.values,
      text: form.values.text || form.values.text_hidden,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch audio')
  }

  // Read the response body as a ReadableStream
  const reader = response.body?.getReader()
  const chunks = []

  // Read chunks of data from the stream
  while (true) {
    const {done, value} = await reader?.read?.()
    if (done) break
    chunks.push(value)
  }

  // Convert chunks to a Blob
  const audioBlob = new Blob(chunks, {type: 'audio/mpeg'})
  const audioUrl = URL.createObjectURL(audioBlob)

  // Create and play an audio element
  const audio = new Audio(audioUrl)
  if (should_play) {
    audio.play()
  }
  return audio
}

export const playSSMLAzure = async (
  form: {
    values: {ssml: string}
  },
  should_play: boolean
) => {
  const response = await fetch('/api/polly/say_m2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(form.values),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch audio')
  }

  // Read the response body as a ReadableStream
  const reader = response.body?.getReader()
  const chunks = []

  // Read chunks of data from the stream
  while (true) {
    const {done, value} = await reader?.read?.()
    if (done) break
    chunks.push(value)
  }

  // Convert chunks to a Blob
  const audioBlob = new Blob(chunks, {type: 'audio/mpeg'})
  const audioUrl = URL.createObjectURL(audioBlob)

  // Create and play an audio element
  const audio = new Audio(audioUrl)
  if (should_play) {
    audio.play()
  }
  return audio
}

// export function waitForAudioReady(audio : HTMLAudioElement) {
//   return new Promise((resolve, reject) => {
//     // Resolve when the audio can play through
//     audio.addEventListener('canplaythrough', () => resolve(audio), {once: true})

//     // Reject if an error occurs
//     audio.addEventListener(
//       'error',
//       () => reject(new Error('Failed to load audio')),
//       {once: true}
//     )
//   })
// }
