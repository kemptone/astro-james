// Define different musical scales
const scales = {
  'C Major': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  'C Minor': ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
  'D Major': ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
  'D Minor': ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'],
  'E Minor': ['E', 'F#', 'G', 'A', 'B', 'C', 'D'],
  'F Major': ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
  'G Major': ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
  'A Minor': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
} as const

type ScaleName = keyof typeof scales

// Current scale (configurable)
let currentScale: ScaleName = 'C Major'

/**
 * Sets the current musical scale
 * @param scaleName - Name of the scale to use
 */
export function setScale(scaleName: ScaleName): void {
  currentScale = scaleName
  console.log(`Scale changed to: ${scaleName}`)
}

/**
 * Gets the current scale name
 * @returns Current scale name
 */
export function getCurrentScale(): ScaleName {
  return currentScale
}

/**
 * Gets all available scale names
 * @returns Array of available scale names
 */
export function getAvailableScales(): ScaleName[] {
  return Object.keys(scales) as ScaleName[]
}

/**
 * Converts a number to a musical note within the current scale
 * @param num - Number to convert (1 = first degree, 8 = octave, etc.)
 * @returns Musical note string (e.g., "C2", "D3")
 */
function numberToNote(num: number): string {
  const scale = scales[currentScale]
  const scaleLength = scale.length
  
  // Calculate octave and scale degree
  // 1-7 = octave 2, 8-14 = octave 3, etc.
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
 * @param noteDuration - Duration of each note in seconds (default: 0.5)
 * @param gapDuration - Gap between notes in milliseconds (default: 100)
 * @returns Promise that resolves when all notes have been played
 */
export async function playNotes(
  numbers: number[],
  noteDuration: number = 0.5,
  gapDuration: number = 100,
): Promise<void> {
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

      const note = numberToNote(num)
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
 * @returns Array of note names
 */
export function getNotesFromNumbers(numbers: number[]): string[] {
  return numbers.map(num => {
    if (num < 1) {
      console.warn(`Invalid number: ${num}. Numbers must be positive.`)
      return 'Invalid'
    }
    return numberToNote(num)
  })
}

// Example usage:
// setScale('C Major')
// playNotes([1, 3, 5]) // Plays C2, E2, G2 (C major triad)
// playNotes([1, 2, 3, 4, 5, 6, 7, 8]) // Plays C major scale (C2-C3)
// 
// setScale('A Minor') 
// playNotes([1, 3, 5]) // Plays A2, C3, E3 (A minor triad)
