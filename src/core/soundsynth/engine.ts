import { createDefaultSetup } from './library'
import { noteNumberToPitchRatio } from './music'
import type {
  TLayerConfig,
  TPlaybackRateSegment,
  TSynthSetup,
} from './types'

type TLayerBus = {
  input: GainNode
  dryGain: GainNode
  wetGain: GainNode
  convolver: ConvolverNode
}

type TActiveSource = {
  source: AudioBufferSourceNode
  gain: GainNode
}

type TActiveLayerNote = {
  noteGain: GainNode
  sources: TActiveSource[]
}

type TActiveNote = {
  noteNumber: number
  layers: TActiveLayerNote[]
  releaseTimer?: number
}

const MIN_DURATION = 0.01
const MIN_PLAYBACK_RATE = 0.0001
const CURVE_SAMPLES_PER_SECOND = 60

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function toTimelineValue(value: unknown) {
  const numeric = Number(value)

  if (!Number.isFinite(numeric)) {
    return 50
  }

  return numeric
}

function getRowDurationSeconds(bpm: number, multiplier: number) {
  const safeBpm = clamp(Number.isFinite(bpm) ? bpm : 120, 20, 300)
  const safeMultiplier = clamp(
    Number.isFinite(multiplier) ? multiplier : 1,
    0.125,
    8,
  )

  return (60 / safeBpm) * safeMultiplier
}

function getTimelineDurationSeconds(
  segments: TPlaybackRateSegment[],
  bpm: number,
  multiplier: number,
) {
  if (!segments.length) {
    return MIN_DURATION
  }

  return Math.max(
    segments.length * getRowDurationSeconds(bpm, multiplier),
    MIN_DURATION,
  )
}

function getTimelineValueAtTime(
  timeSeconds: number,
  segments: TPlaybackRateSegment[],
  bpm: number,
  multiplier: number,
) {
  if (!segments.length) {
    return 1
  }

  const rowDuration = getRowDurationSeconds(bpm, multiplier)

  if (timeSeconds <= 0) {
    return Math.max(toTimelineValue(segments[0].start) / 50, MIN_PLAYBACK_RATE)
  }

  const index = Math.floor(timeSeconds / rowDuration)

  if (index >= segments.length) {
    return Math.max(
      toTimelineValue(segments[segments.length - 1].end) / 50,
      MIN_PLAYBACK_RATE,
    )
  }

  const segment = segments[index]
  const localTime = timeSeconds - index * rowDuration
  const progress = clamp(localTime / rowDuration, 0, 1)
  const start = toTimelineValue(segment.start)
  const end = toTimelineValue(segment.end)
  const interpolated = start + (end - start) * progress

  return Math.max(interpolated / 50, MIN_PLAYBACK_RATE)
}

function createPlaybackRateCurve(
  noteNumber: number,
  basePitchCorrection: number,
  layer: TLayerConfig,
  bpm: number,
) {
  const duration = getTimelineDurationSeconds(
    layer.playbackRateSegments,
    bpm,
    layer.timelineMultiplier,
  )
  const sampleCount = Math.max(Math.ceil(duration * CURVE_SAMPLES_PER_SECOND), 2)
  const curve = new Float32Array(sampleCount)
  const noteRatio = noteNumberToPitchRatio(noteNumber, 60)
  const pitchCorrection = clamp(basePitchCorrection, MIN_PLAYBACK_RATE, 8)

  for (let index = 0; index < sampleCount; index += 1) {
    const progress = sampleCount === 1 ? 0 : index / (sampleCount - 1)
    const time = progress * duration
    const timelineRatio = getTimelineValueAtTime(
      time,
      layer.playbackRateSegments,
      bpm,
      layer.timelineMultiplier,
    )

    curve[index] = noteRatio * pitchCorrection * timelineRatio
  }

  return {
    curve,
    duration,
  }
}

export class SoundSynthEngine {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private layerBuses = new Map<string, TLayerBus>()
  private sampleBufferPromises = new Map<string, Promise<AudioBuffer>>()
  private impulseBufferPromises = new Map<string, Promise<AudioBuffer>>()
  private activeNotes = new Map<number, TActiveNote>()
  private pendingStartTokens = new Map<number, number>()
  private noteStartVersion = 0
  private heldMonoNotes: number[] = []
  private currentMonoNote: number | null = null
  private setupVersion = 0
  private currentSetup: TSynthSetup = createDefaultSetup()

  getAnalyser() {
    return this.analyser
  }

  async applySetup(setup: TSynthSetup) {
    this.currentSetup = JSON.parse(JSON.stringify(setup)) as TSynthSetup
    const version = ++this.setupVersion
    const context = await this.ensureContext(false)

    if (!context || version !== this.setupVersion) {
      return
    }

    this.stopAll()
    this.rebuildLayerBuses(context, setup)
    this.setMasterVolume(setup.masterVolume)

    const loadJobs: Promise<unknown>[] = []

    setup.layers.forEach(layer => {
      if (layer.reverb.impulseFile) {
        loadJobs.push(this.loadImpulseBuffer(layer.reverb.impulseFile))
      }

      layer.samples.forEach(sample => {
        if (sample.enabled) {
          loadJobs.push(this.loadSampleBuffer(sample.sampleFile))
        }
      })
    })

    await Promise.allSettled(loadJobs)
  }

  async noteOn(noteNumber: number) {
    const context = await this.ensureContext(true)

    if (!context) {
      return
    }

    if (this.currentSetup.mode === 'mono') {
      this.handleMonoNoteOn(noteNumber)
      return
    }

    if (this.activeNotes.has(noteNumber)) {
      return
    }

    await this.startNote(noteNumber)
  }

  noteOff(noteNumber: number) {
    if (this.currentSetup.mode === 'mono') {
      this.handleMonoNoteOff(noteNumber)
      return
    }

    this.releaseNote(noteNumber)
  }

  stopAll() {
    this.pendingStartTokens.clear()
    Array.from(this.activeNotes.keys()).forEach(noteNumber => {
      this.stopNoteImmediately(noteNumber)
    })
    this.activeNotes.clear()
    this.heldMonoNotes = []
    this.currentMonoNote = null
  }

  destroy() {
    this.stopAll()

    this.layerBuses.forEach(bus => {
      bus.input.disconnect()
      bus.dryGain.disconnect()
      bus.convolver.disconnect()
      bus.wetGain.disconnect()
    })
    this.layerBuses.clear()

    if (this.masterGain) {
      this.masterGain.disconnect()
    }

    if (this.analyser) {
      this.analyser.disconnect()
    }
  }

  private async ensureContext(shouldResume: boolean) {
    if (typeof window === 'undefined') {
      return null
    }

    if (!this.audioContext) {
      const context = new (window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext)()
      const masterGain = context.createGain()
      const analyser = context.createAnalyser()

      analyser.fftSize = 2048
      masterGain.gain.value = 0.8

      masterGain.connect(analyser)
      analyser.connect(context.destination)

      this.audioContext = context
      this.masterGain = masterGain
      this.analyser = analyser
    }

    if (shouldResume && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume()
      } catch (error) {
        console.error(error)
      }
    }

    return this.audioContext
  }

  private setMasterVolume(value: number) {
    if (!this.masterGain || !this.audioContext) {
      return
    }

    const now = this.audioContext.currentTime

    this.masterGain.gain.cancelScheduledValues(now)
    this.masterGain.gain.setTargetAtTime(clamp(value, 0, 1), now, 0.02)
  }

  private rebuildLayerBuses(context: AudioContext, setup: TSynthSetup) {
    this.layerBuses.forEach(bus => {
      bus.input.disconnect()
      bus.dryGain.disconnect()
      bus.convolver.disconnect()
      bus.wetGain.disconnect()
    })
    this.layerBuses.clear()

    setup.layers.forEach(layer => {
      const input = context.createGain()
      const dryGain = context.createGain()
      const wetGain = context.createGain()
      const convolver = context.createConvolver()

      dryGain.gain.value = clamp(layer.dryVolume, 0, 1)
      wetGain.gain.value = clamp(layer.reverb.wet, 0, 1)

      input.connect(dryGain)
      input.connect(convolver)
      convolver.connect(wetGain)

      if (this.masterGain) {
        dryGain.connect(this.masterGain)
        wetGain.connect(this.masterGain)
      }

      this.layerBuses.set(layer.id, {
        input,
        dryGain,
        wetGain,
        convolver,
      })

      if (layer.reverb.impulseFile) {
        this.loadImpulseBuffer(layer.reverb.impulseFile)
          .then(buffer => {
            const liveBus = this.layerBuses.get(layer.id)

            if (liveBus) {
              liveBus.convolver.buffer = buffer
            }
          })
          .catch(error => {
            console.error(error)
          })
      }
    })
  }

  private async loadSampleBuffer(url: string) {
    if (this.sampleBufferPromises.has(url)) {
      return this.sampleBufferPromises.get(url)!
    }

    const promise = this.ensureContext(false)
      .then(async context => {
        if (!context) {
          throw new Error('Audio context unavailable.')
        }

        const response = await fetch(url)
        const arrayBuffer = await response.arrayBuffer()

        return await context.decodeAudioData(arrayBuffer)
      })

    this.sampleBufferPromises.set(url, promise)
    return promise
  }

  private async loadImpulseBuffer(url: string) {
    if (this.impulseBufferPromises.has(url)) {
      return this.impulseBufferPromises.get(url)!
    }

    const promise = this.ensureContext(false)
      .then(async context => {
        if (!context) {
          throw new Error('Audio context unavailable.')
        }

        const response = await fetch(url)
        const arrayBuffer = await response.arrayBuffer()

        return await context.decodeAudioData(arrayBuffer)
      })

    this.impulseBufferPromises.set(url, promise)
    return promise
  }

  private handleMonoNoteOn(noteNumber: number) {
    if (!this.heldMonoNotes.includes(noteNumber)) {
      this.heldMonoNotes = [...this.heldMonoNotes, noteNumber]
    }

    const targetNote = this.heldMonoNotes[this.heldMonoNotes.length - 1] ?? null

    if (targetNote === this.currentMonoNote) {
      return
    }

    if (this.currentMonoNote !== null) {
      this.stopNoteImmediately(this.currentMonoNote)
    }

    this.currentMonoNote = targetNote

    if (targetNote !== null) {
      void this.startNote(targetNote, () => this.currentMonoNote === targetNote)
    }
  }

  private handleMonoNoteOff(noteNumber: number) {
    this.heldMonoNotes = this.heldMonoNotes.filter(item => item !== noteNumber)

    if (this.currentMonoNote !== noteNumber) {
      return
    }

    const fallbackNote = this.heldMonoNotes[this.heldMonoNotes.length - 1] ?? null

    if (fallbackNote === null) {
      this.releaseNote(noteNumber)
      this.currentMonoNote = null
      return
    }

    this.stopNoteImmediately(noteNumber)
    this.currentMonoNote = fallbackNote

    void this.startNote(fallbackNote, () => this.currentMonoNote === fallbackNote)
  }

  private async startNote(
    noteNumber: number,
    shouldCommit: () => boolean = () => true,
  ) {
    const token = ++this.noteStartVersion

    this.pendingStartTokens.set(noteNumber, token)

    const note = await this.buildActiveNote(noteNumber)

    if (
      !note ||
      this.pendingStartTokens.get(noteNumber) !== token ||
      !shouldCommit()
    ) {
      if (note) {
        this.disposeDetachedNote(note)
      }
      return
    }

    this.pendingStartTokens.delete(noteNumber)
    this.activeNotes.set(noteNumber, note)
  }

  private async buildActiveNote(noteNumber: number) {
    const context = await this.ensureContext(true)

    if (!context) {
      return null
    }

    const layerNotes = await Promise.all(
      this.currentSetup.layers
        .filter(layer => layer.enabled)
        .map(layer => this.buildLayerNote(layer, noteNumber, context)),
    )
    const liveLayers = layerNotes.filter(
      (layerNote): layerNote is TActiveLayerNote => Boolean(layerNote),
    )

    if (!liveLayers.length) {
      return null
    }

    return {
      noteNumber,
      layers: liveLayers,
    } satisfies TActiveNote
  }

  private async buildLayerNote(
    layer: TLayerConfig,
    noteNumber: number,
    context: AudioContext,
  ) {
    const layerBus = this.layerBuses.get(layer.id)
    const activeSamples = layer.samples.filter(sample => sample.enabled)

    if (!layerBus || !activeSamples.length) {
      return null
    }

    const noteGain = context.createGain()
    const now = context.currentTime
    const attack = clamp(this.currentSetup.adsr.attack, 0.001, 10)
    const decay = clamp(this.currentSetup.adsr.decay, 0.001, 10)
    const sustain = clamp(this.currentSetup.adsr.sustain, 0, 1)

    noteGain.gain.setValueAtTime(0, now)
    noteGain.gain.linearRampToValueAtTime(1, now + attack)
    noteGain.gain.linearRampToValueAtTime(sustain, now + attack + decay)
    noteGain.connect(layerBus.input)

    const sources = await Promise.all(
      activeSamples.map(async sample => {
        const buffer = await this.loadSampleBuffer(sample.sampleFile)
        const source = context.createBufferSource()
        const gain = context.createGain()
        const curve = createPlaybackRateCurve(
          noteNumber,
          sample.basePitchCorrection,
          layer,
          this.currentSetup.bpm,
        )

        source.buffer = buffer
        source.loop = sample.loopSustain
        source.playbackRate.setValueCurveAtTime(curve.curve, now, curve.duration)

        gain.gain.value = clamp(sample.volume, 0, 1)

        source.connect(gain)
        gain.connect(noteGain)
        source.start(now)

        return {
          source,
          gain,
        } satisfies TActiveSource
      }),
    )

    return {
      noteGain,
      sources,
    } satisfies TActiveLayerNote
  }

  private releaseNote(noteNumber: number) {
    const context = this.audioContext
    const note = this.activeNotes.get(noteNumber)

    this.pendingStartTokens.delete(noteNumber)

    if (!context || !note) {
      return
    }

    const now = context.currentTime
    const release = clamp(this.currentSetup.adsr.release, 0.01, 10)

    note.layers.forEach(layer => {
      layer.noteGain.gain.cancelScheduledValues(now)
      layer.noteGain.gain.setValueAtTime(layer.noteGain.gain.value, now)
      layer.noteGain.gain.linearRampToValueAtTime(0, now + release)

      layer.sources.forEach(({ source }) => {
        try {
          source.stop(now + release + 0.05)
        } catch (error) {
          console.error(error)
        }
      })
    })

    window.clearTimeout(note.releaseTimer)
    note.releaseTimer = window.setTimeout(() => {
      this.cleanupNote(noteNumber)
    }, (release + 0.1) * 1000)
  }

  private stopNoteImmediately(noteNumber: number) {
    const note = this.activeNotes.get(noteNumber)

    this.pendingStartTokens.delete(noteNumber)

    if (!note) {
      return
    }

    note.layers.forEach(layer => {
      layer.sources.forEach(({ source }) => {
        try {
          source.stop()
        } catch (error) {
          console.error(error)
        }
      })
    })

    this.cleanupNote(noteNumber)
  }

  private cleanupNote(noteNumber: number) {
    const note = this.activeNotes.get(noteNumber)

    this.pendingStartTokens.delete(noteNumber)

    if (!note) {
      return
    }

    window.clearTimeout(note.releaseTimer)

    note.layers.forEach(layer => {
      layer.sources.forEach(({ source, gain }) => {
        source.disconnect()
        gain.disconnect()
      })
      layer.noteGain.disconnect()
    })

    this.activeNotes.delete(noteNumber)
  }

  private disposeDetachedNote(note: TActiveNote) {
    note.layers.forEach(layer => {
      layer.sources.forEach(({ source, gain }) => {
        try {
          source.stop()
        } catch (error) {
          console.error(error)
        }
        source.disconnect()
        gain.disconnect()
      })
      layer.noteGain.disconnect()
    })
  }
}
