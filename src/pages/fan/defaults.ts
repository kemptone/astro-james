import type { SoundLayer } from '@/lib/fanSound'

export const defaultSoundLayers: SoundLayer[] = [
  { url: "/fans/00.wav", initialPlaybackRate: 0.5 },
  { url: "/fans/01.wav", initialPlaybackRate: 1.0 },
  { url: "/fans/08.wav", initialPlaybackRate: 0.25 },
]

export const fanDefaults = {
  // Timing defaults
  accelTime: 5,
  fullSpeedTime: 95, // Previously calculated as totalTime - accelTime - decelTime
  decelTime: 20,
  maxSpeed: 1.3234,

  // Visual defaults
  scale: 1.59,
  opacity: 1,
  bladeCount: 3,
  bladeType: "paddleSpacer",

  // Audio defaults - layered approach
  soundLayers: defaultSoundLayers,

  // Backward compatibility
  fanSound: "/fans/08.wav",
  reverbType: "/impulse/reaperblog/IRx1000_03C.wav", // Match timer4
  reverbAmount: 0.52, // Note: Not used with 100% wet signal, kept for UI compatibility
} as const

export type FanDefaults = typeof fanDefaults
