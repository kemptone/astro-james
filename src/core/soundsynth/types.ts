export type TSynthMode = 'mono' | 'poly'

export type TPlaybackRateSegment = {
  start: string
  end: string
}

export type TSampleSlot = {
  id: string
  enabled: boolean
  sampleFile: string
  volume: number
  loopSustain: boolean
  basePitchCorrection: number
}

export type TLayerReverb = {
  impulseFile: string
  wet: number
}

export type TLayerConfig = {
  id: string
  name: string
  enabled: boolean
  dryVolume: number
  timelineMultiplier: number
  playbackRateSegments: TPlaybackRateSegment[]
  reverb: TLayerReverb
  samples: TSampleSlot[]
}

export type TAdsrConfig = {
  attack: number
  decay: number
  sustain: number
  release: number
}

export type TKeyboardRange = {
  startNote: string
  visibleOctaves: number
}

export type TSynthSetup = {
  name: string
  bpm: number
  mode: TSynthMode
  masterVolume: number
  adsr: TAdsrConfig
  keyboardRange: TKeyboardRange
  layers: TLayerConfig[]
}

export type TSavedSetup = {
  id: string
  name: string
  updatedAt: string
  setup: TSynthSetup
}

export type TSoundSynthStore = {
  currentSetup: TSynthSetup
  loadedSetupId: string | null
  savedSetups: TSavedSetup[]
}

