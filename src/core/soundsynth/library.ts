import type {
  TLayerConfig,
  TPlaybackRateSegment,
  TSampleSlot,
  TSynthSetup,
} from './types'

export type TLibraryItem = {
  label: string
  value: string
}

export const SAMPLE_LIBRARY: TLibraryItem[] = Array.from(
  { length: 21 },
  (_, index) => {
    const filename = `${String(index).padStart(2, '0')}.wav`

    return {
      label: filename,
      value: `/spin/fans/${filename}`,
    }
  },
)

const IR_SIZES = [125, 250, 500, 1000]
const IR_BANKS = ['01', '02', '03', '04']
const IR_VARIANTS = ['A', 'B', 'C']

export const IMPULSE_RESPONSE_LIBRARY: TLibraryItem[] = IR_SIZES.flatMap(size =>
  IR_BANKS.flatMap(bank =>
    IR_VARIANTS.map(variant => {
      const filename = `IRx${size}_${bank}${variant}.wav`

      return {
        label: filename,
        value: `/impulse/reaperblog/${filename}`,
      }
    }),
  ),
)

export const DEFAULT_SAMPLE_LIBRARY_VALUES = [
  '/spin/fans/00.wav',
  '/spin/fans/01.wav',
  '/spin/fans/08.wav',
]

export const DEFAULT_IMPULSE_RESPONSE = '/impulse/reaperblog/IRx1000_03C.wav'

export const DEFAULT_VISIBLE_OCTAVES = 3
export const DEFAULT_START_NOTE = 'C3'
export const DEFAULT_TIMELINE_SEGMENTS: TPlaybackRateSegment[] = [
  {
    start: '50.00',
    end: '50.00',
  },
]

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function createSampleSlot(sampleFile = '/spin/fans/01.wav'): TSampleSlot {
  return {
    id: createId('sample'),
    enabled: true,
    sampleFile,
    volume: 0.4,
    loopSustain: true,
    basePitchCorrection: 1,
  }
}

export function createDefaultLayer(name = 'Layer 1'): TLayerConfig {
  return {
    id: createId('layer'),
    name,
    enabled: true,
    dryVolume: 0.75,
    timelineMultiplier: 1,
    playbackRateSegments: DEFAULT_TIMELINE_SEGMENTS.map(segment => ({ ...segment })),
    reverb: {
      impulseFile: DEFAULT_IMPULSE_RESPONSE,
      wet: 0.22,
    },
    samples: DEFAULT_SAMPLE_LIBRARY_VALUES.map(sampleFile => createSampleSlot(sampleFile)),
  }
}

export function createNewLayer(name = 'New Layer'): TLayerConfig {
  return {
    ...createDefaultLayer(name),
    samples: [createSampleSlot('/spin/fans/01.wav')],
  }
}

export function createDefaultSetup(): TSynthSetup {
  return {
    name: 'Sound Synth',
    bpm: 120,
    mode: 'poly',
    masterVolume: 0.8,
    adsr: {
      attack: 0.02,
      decay: 0.18,
      sustain: 0.72,
      release: 0.3,
    },
    keyboardRange: {
      startNote: DEFAULT_START_NOTE,
      visibleOctaves: DEFAULT_VISIBLE_OCTAVES,
    },
    layers: [createDefaultLayer()],
  }
}

