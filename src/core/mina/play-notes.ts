// Define available keys
const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
export type Key = typeof keys[number]

// Define scale types with their interval patterns (in semitones)
const scaleTypes = {
  'Major': [0, 2, 4, 5, 7, 9, 11],
  'Natural Minor': [0, 2, 3, 5, 7, 8, 10],
  'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
  'Melodic Minor': [0, 2, 3, 5, 7, 9, 11],
  'Dorian': [0, 2, 3, 5, 7, 9, 10],
  'Phrygian': [0, 1, 3, 5, 7, 8, 10],
  'Lydian': [0, 2, 4, 6, 7, 9, 11],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'Locrian': [0, 1, 3, 5, 6, 8, 10],
  'Blues': [0, 3, 5, 6, 7, 10],
  'Pentatonic Major': [0, 2, 4, 7, 9],
  'Pentatonic Minor': [0, 3, 5, 7, 10],
  'Whole Tone': [0, 2, 4, 6, 8, 10],
} as const

export type ScaleType = keyof typeof scaleTypes

// Current key and scale type (configurable)
let currentKey: Key = 'C'
let currentScaleType: ScaleType = 'Major'

/**
 * Helper function to convert semitone offset to note name
 */
function semitonesToNoteName(keyStartIndex: number, semitones: number): string {
  const noteIndex = (keyStartIndex + semitones) % 12
  return keys[noteIndex]
}

/**
 * Generates a scale in a specific key
 */
function buildScale(key: Key, scaleType: ScaleType): string[] {
  const keyIndex = keys.indexOf(key)
  const intervals = scaleTypes[scaleType]
  
  return intervals.map(semitone => semitonesToNoteName(keyIndex, semitone))
}

/**
 * Sets the current musical key
 * @param key - The key to use (C, D, E, etc.)
 */
export function setKey(key: Key): void {
  currentKey = key
  console.log(`Key changed to: ${key}`)
}

/**
 * Sets the current scale type
 * @param scaleType - The scale type to use (Major, Minor, etc.)
 */
export function setScaleType(scaleType: ScaleType): void {
  currentScaleType = scaleType
  console.log(`Scale type changed to: ${scaleType}`)
}

/**
 * Sets both key and scale type at once
 * @param key - The key to use
 * @param scaleType - The scale type to use
 */
export function setKeyAndScale(key: Key, scaleType: ScaleType): void {
  currentKey = key
  currentScaleType = scaleType
  console.log(`Scale changed to: ${key} ${scaleType}`)
}

/**
 * Gets the current key
 * @returns Current key
 */
export function getCurrentKey(): Key {
  return currentKey
}

/**
 * Gets the current scale type
 * @returns Current scale type
 */
export function getCurrentScaleType(): ScaleType {
  return currentScaleType
}

/**
 * Gets all available keys
 * @returns Array of available keys
 */
export function getAvailableKeys(): readonly Key[] {
  return keys
}

/**
 * Gets all available scale types
 * @returns Array of available scale types
 */
export function getAvailableScaleTypes(): readonly ScaleType[] {
  return Object.keys(scaleTypes) as ScaleType[]
}

/**
 * Converts a number to a musical note within the specified or current scale
 * @param num - Number to convert (1 = first degree, 8 = octave, etc.)
 * @param key - Optional key override
 * @param scaleType - Optional scale type override
 * @returns Musical note string (e.g., "C2", "D3")
 */
function numberToNote(num: number, key?: Key, scaleType?: ScaleType): string {
  const useKey = key || currentKey
  const useScaleType = scaleType || currentScaleType
  const scale = buildScale(useKey, useScaleType)
  const scaleLength = scale.length
  
  // Calculate octave and scale degree
  const octave = Math.floor((num - 1) / scaleLength) + 2
  const scaleDegree = (num - 1) % scaleLength
  const noteName = scale[scaleDegree]

  return `${noteName}${octave}`
}

/**
 * Converts a musical note to frequency in Hz
 * @param note - Musical note (e.g., "C2", "A4")
 * @returns Frequency in Hz
 */
function noteToFrequency(note: string): number {
  // Convert note to frequency (A4 = 440Hz as reference)
  const noteRegex = /^([A-G]#?)(\d+)$/
  const match = note.match(noteRegex)

  if (!match) return 440 // Default to A4

  const [, noteName, octaveStr] = match
  const octave = parseInt(octaveStr, 10)

  // Semitones from A4
  const noteOffsets: {[key: string]: number} = {
    C: -9,
    'C#': -8,
    D: -7,
    'D#': -6,
    E: -5,
    F: -4,
    'F#': -3,
    G: -2,
    'G#': -1,
    A: 0,
    'A#': 1,
    B: 2,
  }

  const semitonesFromA4 = noteOffsets[noteName] + (octave - 3) * 12
  return 440 * Math.pow(2, semitonesFromA4 / 12)
}

/**
 * Plays a single tone for a specified duration
 * @param audioContext - Web Audio API context
 * @param frequency - Frequency in Hz
 * @param duration - Duration in seconds
 * @returns Promise that resolves when the tone finishes
 */
function playTone(
  audioContext: AudioContext,
  frequency: number,
  duration: number,
): Promise<void> {
  return new Promise(resolve => {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration,
    )

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + duration)

    oscillator.onended = () => resolve()
  })
}

/**
 * Creates a delay
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Plays an array of numbers as musical notes
 * @param numbers - Array of numbers to convert to notes and play
 * @param options - Optional configuration object
 * @returns Promise that resolves when all notes have been played
 */
export async function playNotes(
  numbers: number[],
  options?: {
    key?: Key
    scaleType?: ScaleType
    noteDuration?: number
    gapDuration?: number
  }
): Promise<void> {
  const {
    key,
    scaleType,
    noteDuration = 0.5,
    gapDuration = 100
  } = options || {}
  if (numbers.length === 0) {
    console.warn('No numbers provided to play')
    return
  }

  try {
    // Create audio context
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)()

    // Convert numbers to notes and play them sequentially
    for (const num of numbers) {
      if (num < 1) {
        console.warn(
          `Skipping invalid number: ${num}. Numbers must be positive.`,
        )
        continue
      }

      const note = numberToNote(num, key, scaleType)
      const frequency = noteToFrequency(note)

      console.log(`Playing: ${num} → ${note} (${frequency.toFixed(2)}Hz)`)

      await playTone(audioContext, frequency, noteDuration)

      if (gapDuration > 0) {
        await delay(gapDuration)
      }
    }

    console.log('Finished playing notes')
  } catch (error) {
    console.error('Error playing notes:', error)
    throw new Error('Audio playback not supported in this browser')
  }
}

/**
 * Gets the note names for an array of numbers without playing them
 * @param numbers - Array of numbers to convert
 * @param key - Optional key override
 * @param scaleType - Optional scale type override
 * @returns Array of note names
 */
export function getNotesFromNumbers(
  numbers: number[], 
  key?: Key, 
  scaleType?: ScaleType
): string[] {
  return numbers.map(num => {
    if (num < 1) {
      console.warn(`Invalid number: ${num}. Numbers must be positive.`)
      return 'Invalid'
    }
    return numberToNote(num, key, scaleType)
  })
}

// Example usage:
// setKeyAndScale('C', 'Major')
// playNotes([1, 3, 5]) // Plays C2, E2, G2 (C major triad)
// playNotes([1, 2, 3, 4, 5, 6, 7, 8]) // Plays C major scale (C2-C3)
// 
// Or specify directly in the function call:
// playNotes([1, 3, 5], { key: 'A', scaleType: 'Natural Minor' }) // A minor triad
// playNotes([1, 2, 3, 4, 5, 6, 7], { key: 'D', scaleType: 'Dorian' }) // D Dorian scale
