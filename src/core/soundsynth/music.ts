const PITCH_CLASSES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const

const BLACK_PITCH_CLASS_INDEXES = new Set([1, 3, 6, 8, 10])

export type TNoteDescriptor = {
  noteNumber: number
  name: string
  pitchClass: string
  octave: number
  isBlack: boolean
}

function mod(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor
}

export function noteNumberToName(noteNumber: number) {
  const pitchClass = PITCH_CLASSES[mod(noteNumber, 12)]
  const octave = Math.floor(noteNumber / 12) - 1

  return `${pitchClass}${octave}`
}

export function parseNoteName(noteName: string) {
  const cleaned = noteName.trim().toUpperCase()
  const match = cleaned.match(/^([A-G])(#?)(-?\d+)$/)

  if (!match) {
    return null
  }

  const [, letter, accidental, octaveRaw] = match
  const pitchClass = `${letter}${accidental}`
  const pitchIndex = PITCH_CLASSES.indexOf(pitchClass as (typeof PITCH_CLASSES)[number])

  if (pitchIndex === -1) {
    return null
  }

  const octave = Number(octaveRaw)

  if (!Number.isFinite(octave)) {
    return null
  }

  return (octave + 1) * 12 + pitchIndex
}

export function describeNote(noteNumber: number): TNoteDescriptor {
  const pitchIndex = mod(noteNumber, 12)
  const octave = Math.floor(noteNumber / 12) - 1

  return {
    noteNumber,
    name: noteNumberToName(noteNumber),
    pitchClass: PITCH_CLASSES[pitchIndex],
    octave,
    isBlack: BLACK_PITCH_CLASS_INDEXES.has(pitchIndex),
  }
}

export function buildNoteRange(startNoteNumber: number, semitoneCount: number) {
  return Array.from({ length: semitoneCount }, (_, index) =>
    describeNote(startNoteNumber + index),
  )
}

export function noteNumberToFrequency(noteNumber: number) {
  return 440 * 2 ** ((noteNumber - 69) / 12)
}

export function noteNumberToPitchRatio(noteNumber: number, referenceNote = 60) {
  return 2 ** ((noteNumber - referenceNote) / 12)
}

export function buildKeyboardMap(startNoteNumber: number) {
  const middleOctaveStart = startNoteNumber + 12
  const bindings = [
    'KeyA',
    'KeyW',
    'KeyS',
    'KeyE',
    'KeyD',
    'KeyF',
    'KeyT',
    'KeyG',
    'KeyY',
    'KeyH',
    'KeyU',
    'KeyJ',
    'KeyK',
  ] as const

  return Object.fromEntries(
    bindings.map((keyCode, index) => [keyCode, middleOctaveStart + index]),
  ) as Record<(typeof bindings)[number], number>
}

export function clampVisibleStartNote(noteNumber: number) {
  const minNote = parseNoteName('C-3') ?? -24
  const maxEndNote = parseNoteName('C9') ?? 120
  const visibleSemitones = 36
  const maxStart = maxEndNote - (visibleSemitones - 1)

  return Math.max(minNote, Math.min(maxStart, noteNumber))
}

