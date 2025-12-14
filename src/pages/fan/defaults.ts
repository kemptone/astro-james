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

  // Audio defaults
  fanSound: "/fans/08.wav",
  reverbType: "/impulse/IRx1000_01A.wav", // Hall A
  reverbAmount: 0.52,
} as const

export type FanDefaults = typeof fanDefaults
