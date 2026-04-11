# Sampler Synth Spec

## Status

Draft v1 feature spec based on the existing `timer2` / `timer4` playback-rate timeline logic.

## Purpose

Build a new sample-based synthesizer page that reuses the core idea from the current Base Audio Frequency editor:

- a timeline of decimal values
- value `50.00` as neutral playback rate
- values below `50.00` slow playback down
- values above `50.00` speed playback up
- interpolation across rows over time

Instead of driving fan-spin ambience only, the new page will behave like a playable sampler instrument:

- a full-width piano keyboard at the bottom of the screen
- top-area controls for live performance and setup summary
- deep editing in modals for iPad-friendly use
- multiple layers
- multiple stacked samples inside each layer
- per-layer playback-rate timeline
- per-layer convolution reverb
- shared instrument ADSR
- named setups stored in `localStorage`

## v1 Summary

The first version is a new page, separate from `timer2`, that:

- uses only built-in repo samples, not uploads
- starts with one default layer containing the three current `timer2` fan samples
- lets users add and remove layers
- lets each layer contain any number of sample slots
- lets each sample slot be enabled/disabled, swapped to another built-in `.wav`, given a volume, given a loop sustain toggle, and given a base pitch correction multiplier
- lets each layer define one shared playback-rate timeline and timeline speed multiplier
- lets each layer choose one impulse response and wet/dry amount
- lets the whole instrument share one ADSR envelope
- supports touch/mouse piano input and physical keyboard input
- supports mono/poly mode, with mono returning to previously held notes when appropriate
- stores current state and named setups in `localStorage`

## Existing Assets

### Built-in Sample Library

Use the built-in fan samples in:

- `public/spin/fans/00.wav`
- `public/spin/fans/01.wav`
- `public/spin/fans/02.wav`
- ...
- `public/spin/fans/20.wav`

UI labels should use the raw `.wav` filenames.

### Built-in Impulse Responses

Use the impulse response files in:

- `public/impulse/reaperblog/*.wav`

The current timer implementation uses:

- `public/impulse/reaperblog/IRx1000_03C.wav`

These files become the initial reverb library for per-layer convolution.

## Relationship To Existing Timer Logic

The existing Base Audio Frequency logic in `src/core/timer4/index.tsx` should be extracted into reusable utilities rather than copied inline again.

Concepts to preserve:

- timeline rows with `{ start, end }`
- decimal editing
- interpolation across each row
- default neutral value of `50.00`
- persistence format compatible with JSON in `localStorage`

Concepts to change:

- row timing should become beat-based rather than fixed one-second rows
- the playback-rate timeline should target sample playback in a keyboard instrument
- the final playback-rate value should hold after the timeline ends
- the visual fan animation should not come along to the new page

## Core Audio Model

### Instrument

The instrument contains:

- global BPM
- global mono/poly mode
- global master volume
- shared ADSR envelope
- keyboard range settings
- a collection of layers
- waveform visualizer on final mixed output

### Layer

Each layer is a musical unit. A layer contains:

- layer id
- layer name
- enabled state
- dry volume
- playback-rate timeline
- playback timeline speed multiplier relative to BPM
- reverb impulse response selection
- reverb wet/dry amount
- a collection of sample slots

Each layer shares one playback-rate timeline across all of its sample slots.

### Sample Slot

Each sample slot inside a layer contains:

- sample slot id
- enabled state
- selected built-in sample file
- per-sample volume
- loop sustain toggle
- base pitch correction multiplier

Each sample slot represents one stacked sound ingredient within the layer.

## Pitch Model

The keyboard is a pitch changer, not an oscillator note generator.

For v1:

- treat the sample itself as being referenced from middle C (`C4`)
- pressing a keyboard note changes playback rate relative to `C4`
- no generated oscillator waveform is used for pitch generation
- all selected samples in the layer play together

Each sample slot also has a base pitch correction multiplier:

- default: `1.0000`
- range: `0.0001` to `8.0000`
- raw multiplier UI only

Final sample playback rate should be derived from:

1. note pitch ratio relative to `C4`
2. sample base pitch correction multiplier
3. layer playback-rate timeline envelope

Conceptually:

`finalPlaybackRate = notePitchRatio * basePitchCorrection * timelineRate`

Where:

- `timelineRate = playbackRateValue / 50`
- `50.00` means neutral

## Playback-Rate Timeline

### Lane Behavior

Each layer owns one playback-rate lane made of rows:

- each row has `start` and `end`
- values are decimals
- rows interpolate linearly
- neutral row value is `50.00`

### Timing

The lane should be beat-based.

Rules:

- at `1x`, one row equals one beat
- the lane timing is based on global BPM
- each layer has its own speed multiplier
- lower multipliers run faster
- higher multipliers run slower

Example:

- BPM `120`
- speed multiplier `1x`
- one row lasts `0.5s`
- speed multiplier `2x`
- one row lasts `1.0s`
- speed multiplier `0.5x`
- one row lasts `0.25s`

### End Behavior

If a note lasts longer than the lane:

- the final playback-rate value holds
- the lane does not loop

## Envelope Model

The instrument uses one shared ADSR envelope for loudness.

### ADSR Parameters

- attack
- decay
- sustain
- release

Rules:

- values are edited in real time, not beat time
- ADSR is shared by the whole instrument
- ADSR controls amplitude, not playback rate

### Sustain Behavior

If a sample slot has loop sustain enabled:

- the full sample loops while the key is held
- on key release, the note enters release stage

If a sample slot does not have loop sustain enabled:

- the sample plays through once
- if the sample ends before key release, it stops sounding
- no synthetic sustain is created

## Polyphony And Note Priority

### Poly Mode

- multiple notes may sound at once
- touch and physical keyboard may both trigger notes

### Mono Mode

- a new note immediately cuts the old note
- no portamento or glide
- if note B replaces note A, and note B is released while note A is still physically held, playback jumps back to note A

## Keyboard UI

### On-Screen Keyboard

- piano-style layout
- full-width
- anchored near the bottom of the screen
- fixed visible range of 3 octaves
- configurable start note
- start note may be any pitch, not only `C`
- highest possible window must stay within a top boundary that prevents the visible range from exceeding the intended upper limit

The user specified that the visible window is fixed at 3 octaves and may be shifted.

### Range Configuration

The visible range start note is configurable.

The visible range should support low starts such as:

- `C3`
- `C0`
- `C-3`

The visible range should also support arbitrary starts such as:

- `F#2`
- `A1`

### Key Visual State

Pressed notes should visually depress:

- key-down shadow treatment
- same visual behavior for touch/mouse and physical keyboard input

## Physical Keyboard Input

Use a standard piano-like one-octave mapping for v1, such as:

- white/black key pattern similar to `A W S E D F T G Y H U J K`

Rules:

- the physical keyboard controls one octave at a time
- that mapped octave should target the middle visible octave
- changing the visible keyboard range should update physical keyboard note mapping too

## UI Layout

### Always-Visible Top Area

The top area should include:

- current setup name
- BPM
- mono/poly mode
- master volume
- final-mix waveform visualizer
- compact layer summary cards
- access to settings modal
- access to setups modal

### Layer Summary Cards

The top area should show more than just a layer name, but still summarize rather than fully expose all deep controls.

Each layer summary card should show at least:

- layer name
- enabled state
- dry volume
- sample count summary
- active sample count summary
- reverb summary
- quick access to deeper editing

Detailed sample-slot editing stays in the main shared settings modal.

### Main Settings Modal

There should be one shared settings modal for deep editing across the instrument.

This modal should group controls by function:

- global instrument
- keyboard/range
- envelope
- setups
- layers
- per-layer sample stack
- per-layer timeline
- per-layer reverb

This grouping is important for iPad usability and space management.

### Setups Modal

Saved setups should live in a dedicated modal.

Supported setup actions in v1:

- load
- save
- save as
- duplicate
- delete

Rules:

- loading a setup immediately replaces the current on-screen state
- editing a loaded setup does not overwrite the saved version automatically
- explicit save is required to update a named setup

## Storage Model

### Persistence

Use `localStorage` for v1.

Persist:

- current working setup
- named setups
- global settings
- keyboard range
- layers
- sample slot choices
- ADSR
- BPM
- mono/poly mode
- master volume
- per-layer playback lanes
- per-layer reverb selections

### Future Expansion

The storage design should leave room for future persistence in a database, but v1 does not require that.

### Custom Samples

V1 does not include custom sample upload or IndexedDB-backed asset storage.

Only built-in repo samples are supported in v1.

## Default State

### Default Instrument

On first load:

- create one default layer
- that layer contains the three current `timer2` fan samples as enabled sample slots
- use the existing timer sample set as the initial sonic identity

### New Layer Default

When a new layer is added:

- create one sample slot by default
- set that slot to `01.wav`
- leave the user free to add more sample slots to the layer

## Reverb Model

Each layer owns its own convolution reverb settings.

Per-layer reverb controls:

- impulse response file selection
- wet/dry amount

Each layer also has:

- dry volume

Signal flow per layer should conceptually be:

1. mix active sample slots in the layer
2. apply layer dry gain
3. send to layer wet path through selected convolver
4. blend dry and wet
5. route to master output

## Visualizer

Add one waveform visualizer for the final mixed output.

Rules:

- show the final combined audio, not per-layer output
- default visualization is waveform, not frequency bars

## Non-Goals For v1

- custom sample uploads
- IndexedDB sample persistence
- database-backed setup storage
- multi-sample note zoning across the keyboard
- per-sample playback-rate lanes
- per-layer ADSR
- glide / portamento
- per-layer visualizers
- generated oscillator synthesis

## Recommended Technical Structure

### New Route

Create a new page and keep it separate from `timer2`.

Suggested route naming can be decided during implementation, but it should not replace the current timer page.

### Suggested Modules

Recommended extraction targets:

- `src/lib/audio/` or similar reusable audio engine utilities
- playback-rate lane utilities extracted from `src/core/timer4/index.tsx`
- built-in sample library manifest
- built-in impulse response manifest
- keyboard note mapping utilities
- setup serialization/deserialization helpers

Suggested logical modules:

- `noteMath`
- `samplerEngine`
- `playbackRateLane`
- `adsr`
- `sampleLibrary`
- `irLibrary`
- `setupStore`
- `keyboardMapping`

### Existing Code To Reuse

Relevant existing pieces:

- `src/core/timer4/index.tsx`
- `src/components/Timer/OuterWrap.tsx`
- `src/hooks/useAudioLoop.tsx`
- `src/hooks/useReverb.tsx`
- `src/lib/audio.ts`
- `src/pages/extraspecial.astro`

The implementation should reuse ideas and utilities where appropriate, but the new synth should have its own clearer architecture rather than extending timer UI directly.

## Data Shape Proposal

```ts
type PlaybackRateSegment = {
  start: string
  end: string
}

type SampleSlot = {
  id: string
  enabled: boolean
  sampleFile: string
  volume: number
  loopSustain: boolean
  basePitchCorrection: number
}

type LayerReverb = {
  impulseFile: string
  wet: number
}

type LayerConfig = {
  id: string
  name: string
  enabled: boolean
  dryVolume: number
  timelineMultiplier: number
  playbackRateSegments: PlaybackRateSegment[]
  reverb: LayerReverb
  samples: SampleSlot[]
}

type AdsrConfig = {
  attack: number
  decay: number
  sustain: number
  release: number
}

type KeyboardRange = {
  startNote: string
  visibleOctaves: 3
}

type SynthSetup = {
  id: string
  name: string
  bpm: number
  mode: 'mono' | 'poly'
  masterVolume: number
  adsr: AdsrConfig
  keyboardRange: KeyboardRange
  layers: LayerConfig[]
}
```

## Open Questions

These items are close enough to implementation to continue later, but are not blockers for writing code:

- exact route name for the new synth page
- default numeric ranges for BPM, master volume, dry volume, wet amount, and ADSR controls
- exact upper-bound note enforcement details for the 3-octave window
- exact layer summary card layout in the top area
- whether setup names must be unique or can duplicate

## Acceptance Criteria For v1

The feature is successful when:

- a new page loads a playable sample-based instrument
- the bottom keyboard works on touch/mouse and computer keyboard
- the instrument defaults to one layer containing the three current timer fan samples
- note pitch is created by sample playback-rate shifting relative to `C4`
- each layer has a shared playback-rate lane based on the existing timer logic
- each layer can add and remove sample slots
- each sample slot can be enabled, disabled, swapped to another built-in `.wav`, given a volume, given loop sustain, and given base pitch correction
- mono/poly mode works as specified
- shared ADSR works as specified
- per-layer reverb impulse and wet/dry work
- a final mixed waveform visualizer is visible
- current setup and named setups persist in `localStorage`
- loading a named setup immediately replaces the current state

