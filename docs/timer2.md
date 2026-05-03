# `timer2` How It Works

## Overview

`/timer2` is a client-only Preact timer page that renders a spinning SVG fan and plays layered looping fan audio whose playback speed changes over time.

The route file is small:

- `src/pages/timer2.astro` mounts the shared site `Layout` and renders `src/core/timer4/index.tsx` with `client:only="preact"`.

That means nearly all of the feature logic lives in the `timer4` core module, even though the public route is `/timer2`.

## File Map

These are the files directly involved in the page:

- `src/pages/timer2.astro`
  Wraps the feature in the app layout.
- `src/layouts/Layout.astro`
  Provides the HTML shell, global CSS import, service worker script, and menu.
- `src/components/menu.astro`
  Adds the site hamburger menu and includes a `/timer2` nav entry.
- `src/core/timer4/index.tsx`
  Main timer UI and runtime logic.
- `src/core/timer4/style.css`
  Styles the page, spinner animation, footer controls, and settings dialog content.
- `src/components/Timer/OuterWrap.tsx`
  Builds the three sound definitions passed into the timer.
- `src/hooks/useAudioLoop.tsx`
  Fetches and decodes each audio file, extracts a loopable slice, creates an `AudioBufferSourceNode`, and exposes play/stop callbacks.
- `src/hooks/useReverb.tsx`
  Loads the impulse response used for reverb.
- `src/components/AdjustableBlades.tsx`
  Draws the SVG fan blades.
- `src/components/Dialog/index.tsx`
  Wraps the settings modal and handles open/close behavior.
- `src/components/Dialog/dialog.css`
  Styles the modal.
- `src/components/RangeWithTicks.tsx`
  Slider fieldset used for fan size, line width, and opacity.
- `src/components/SettingItem.tsx`
  Generic labeled input used for blade count and wait time.
- `src/components/Select.tsx`
  Persisted `<select>` used by the blade-style picker.
- `src/components/SelectWithFieldset.tsx`
  Fieldset wrapper around the select.
- `src/components/ModeItem.tsx`
  Checkbox rows that toggle body classes like `darkmode`.
- `src/helpers/localStorage.ts`
  Persists timer settings in one localStorage object under the `JAMES` key.
- `src/helpers/setBodyStyleProp.ts`
  Updates CSS custom properties and toggles classes on the body or a specific element.

Static runtime assets:

- `public/spin/fans/00.wav`
- `public/spin/fans/01.wav`
- `public/spin/fans/08.wav`
- `public/impulse/reaperblog/IRx1000_03C.wav`

## Startup Flow

1. Astro serves `src/pages/timer2.astro`.
2. The page uses `Layout.astro`, so it gets the standard document shell, menu, service worker loader, and global styles.
3. `client:only="preact"` prevents server rendering for the timer view and mounts the timer entirely in the browser.
4. `src/core/timer4/index.tsx` is exported through `OuterWrap`, which creates a `Sounds` array containing three fan audio definitions.
5. `InnerCore` receives `Sounds`, reads persisted settings from localStorage, and initializes the timer UI.

## Main State And Refs

Inside `src/core/timer4/index.tsx`, the timer keeps a mix of Preact state and DOM refs:

- `bladeCount`
  Controls how many SVG fan blades are drawn.
- `audioRateSegments`
  The audio-speed envelope. Each array item represents 1 second and stores a `start` and `end` value.
- `buttonStatus`
  Shows `Start`, `Waiting`, or `Stop`.
- `curveType`
  Chooses the blade path shape.
- `timerState`
  A ref used like a tiny state machine:
  `0` means idle, `1` means spinning.
- Several element refs
  Point to the button, spinner wrapper, inputs, and audio context.

The file-level `values` constant is loaded once from `getState()` and is mainly used for initial defaults.

## Persisted Settings

The timer stores its settings in localStorage under one JSON object keyed by `JAMES`.

Relevant persisted keys include:

- `blades`
- `wait`
- `bladeScale`
- `opacity`
- `bladesLineWidth`
- `curveType`
- `audioRateSegments`
- `darkmode`
- `darkmode2`
- `whitemode`

Most inputs persist automatically through `SettingItem`, `RangeWithTicks`, `Select`, and the helper functions in `src/helpers/localStorage.ts`.

## Version Modes

The Base Audio Frequency editor now exposes two versions for interpreting the timer's value domain:

- Version 1
  Uses the value as-is.
- Version 2
  Inverts the range so `81920` behaves like `0` and `0` behaves like `81920`.
  In practice, that means subtracting the incoming value from `81920`:
  `mappedValue = 81920 - originalValue`

The timer starts in Version 1.

## What The User Sees

The main page has three visible parts:

- The SVG spinner button in the middle of the page.
- A fixed footer with:
  blade count, wait time, and the start/stop button.
- A `Settings` button that opens a dialog containing:
  audio envelope rows, size/line-width/opacity sliders, blade shape select, and mode toggles.

## Spinner Rendering

`src/components/AdjustableBlades.tsx` builds the fan as an SVG:

- It computes evenly spaced rotation angles from `bladeCount`.
- It renders one blade path per angle.
- The blade shape comes from the `CurveTypes` map.
- If `bladeCount > 500`, it skips the background-blade layer to reduce rendering cost.

The timer styles use CSS custom properties such as:

- `--blade-scale`
- `--opacity`
- `--stroke-width`
- `--runtime`
- `--rotations_runtime`

When the `spinning` class is added to the outer element, the SVG rotates with a linear transition whose duration and total degrees are set from those CSS variables.

## Start / Wait / Stop Behavior

Submitting the form calls `runSpin()`.

### If the timer is idle

- If `wait` has a value, the button text changes to `Waiting`.
- A `setTimeout()` delays the real run by that many seconds.
- If `wait` is empty or `0`, the timer starts immediately.

### When the real run starts

`run()` does two things in parallel:

- Starts the visual spinner with `startFan()`.
- Starts the audio pipeline.

`startFan()`:

- Computes the total duration from `audioRateSegments.length`.
- Computes total rotations from `duration * FAN_RATE`.
- Writes `--runtime` and `--rotations_runtime`.
- Removes and re-adds the `spinning` class so the CSS transition restarts cleanly.

### When the visual spin ends

A `transitionend` listener resets the UI:

- removes the `spinning` class
- sets `timerState` back to idle
- changes the button text back to `Start`

### If the user presses the button while spinning

The code:

- removes the `spinning` class
- resets `timerState`
- sets the button text to `Start`
- calls each sound's `refStop.current()`

## Audio Pipeline

The timer audio is built around the Web Audio API.

### Sound definitions

`OuterWrap.tsx` provides three layered sounds:

- `/spin/fans/00.wav` at `0.5x`
- `/spin/fans/01.wav` at `1x`
- `/spin/fans/08.wav` at `0.25x`

Each sound object carries refs for:

- the current source node
- whether it is playing
- play and stop functions
- whether it has loaded

### Audio context and reverb

When `run()` starts:

1. It creates an `AudioContext` if needed.
2. It resumes the context if Safari left it suspended.
3. It loads `/impulse/reaperblog/IRx1000_03C.wav` with `loadReverb()`.
4. It creates a `GainNode` set to `0.125`.
5. It connects:
   source -> gain -> convolver -> destination

### Loop construction

Despite its name, `useAudioLoop()` is not a React hook in the usual sense. It is a helper function called at run time.

For each sound, it:

1. fetches the WAV file
2. decodes it to an `AudioBuffer`
3. takes the middle eighth of the file as a loop region
4. creates a looping `AudioBufferSourceNode`
5. stores `play()` and `stop()` functions onto refs
6. hands the source node back through a callback

### Playback-rate envelope

The changing fan sound comes from `audioRateSegments`.

Each row in the settings dialog is exactly 1 second long:

- `start`
  playback-rate multiplier source value at the beginning of that second
- `end`
  playback-rate multiplier source value at the end of that second

`getAudioEnvelopeValueAtTime()` linearly interpolates within each second.

`createPlaybackRateCurve()` samples that envelope across the full timer duration and multiplies it by:

- the base fan rate (`FAN_RATE`)
- the sound's `initialPlaybackRate`

The resulting `Float32Array` is applied with `source.playbackRate.setValueCurveAtTime(...)`.

Each source is then:

- started with `refPlay.current()`
- connected to the gain/reverb chain
- scheduled to stop after `duration + 2` seconds

## Audio Envelope Editor

The settings dialog exposes the timeline directly.

Behavior:

- The settings dialog includes a version selector above the segment rows.
- The initial value comes from `audioRateSegments` in localStorage.
- The selected version is persisted in localStorage as `audioVersion`.
- If no segment array exists, the timer falls back to one flat segment built from the legacy `audioRate` value or the default `50`.
- In Version 2, the editor displays each value as `81920 - storedValue`.
- `Add second` appends a new row, seeded from the previous row's `end`.
- `Remove` deletes a row, but only appears when there is more than one row.
- On blur, values are normalized to two decimals.

The displayed "Total time" is simply the number of rows in `audioRateSegments`.

## Visual Settings

The dialog also updates styling live:

- `Size of Fan`
  updates `--blade-scale`
- `Line width`
  updates `--stroke-width`
- `Opacity`
  updates `--opacity`
- `Change the blades`
  switches the SVG path shape
- `dark_mode`, `other_dark_mode`, `white_mode`
  toggle body classes that the CSS listens to

One extra behavior is baked into the blade-count input:

- if the blade count goes over `500`, the code adds `darkmode2`

## Important Quirks

- `timer2.astro` actually renders the `timer4` implementation. If you want to change `/timer2`, start in `src/core/timer4/index.tsx`.
- `useAudioLoop()` runs a fresh fetch/decode/build cycle on every timer run. It does not cache decoded buffers.
- The audio envelope duration is tied directly to the number of segment rows.
- The wait flow uses `setTimeout()` but does not keep a timeout ref for cancellation. Repeated clicks while in the `Waiting` state can schedule more than one delayed start.
- The module-level `values = getState()` is read once on load, so it is used for initial setup rather than reactive updates.

## Short Mental Model

If you need to reason about the page quickly, think of it like this:

1. `timer2.astro` mounts a client-only Preact timer.
2. `OuterWrap` injects three looping fan sounds.
3. `InnerCore` renders an SVG fan and settings UI.
4. Pressing `Start` sets CSS variables for the spin and starts Web Audio playback.
5. `audioRateSegments` defines how the playback speed changes second by second.
6. Most controls persist automatically to localStorage under `JAMES`.
