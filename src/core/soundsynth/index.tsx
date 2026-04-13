import { useEffect, useRef, useState } from 'preact/hooks'
import {
  createDefaultSetup,
  createNewLayer,
  IMPULSE_RESPONSE_LIBRARY,
  SAMPLE_LIBRARY,
} from './library'
import { SoundSynthEngine } from './engine'
import {
  buildKeyboardMap,
  buildNoteRange,
  clampVisibleStartNote,
  noteNumberToName,
  parseNoteName,
} from './music'
import {
  cloneSetup,
  createSavedSetup,
  loadStore,
  persistStore,
} from './storage'
import type {
  TLayerConfig,
  TPlaybackRateSegment,
  TSampleSlot,
  TSavedSetup,
  TSoundSynthStore,
  TSynthSetup,
} from './types'
import './style.css'

const VISIBLE_SEMITONES = 36

function formatNumber(value: number, digits = 2) {
  return Number(value).toFixed(digits)
}

function getAudioSignature(setup: TSynthSetup) {
  return JSON.stringify({
    bpm: setup.bpm,
    mode: setup.mode,
    masterVolume: setup.masterVolume,
    adsr: setup.adsr,
    keyboardRange: setup.keyboardRange,
    layers: setup.layers,
  })
}

function getSampleFileLabel(sampleFile: string) {
  return sampleFile.split('/').pop() || sampleFile
}

function getLayerSampleSummary(layer: TLayerConfig) {
  const enabledCount = layer.samples.filter(sample => sample.enabled).length

  return `${enabledCount}/${layer.samples.length} samples live`
}

function openDialog(ref: { current: HTMLDialogElement | null }) {
  if (!ref.current?.open) {
    ref.current?.showModal()
  }
}

function closeDialog(ref: { current: HTMLDialogElement | null }) {
  ref.current?.close()
}

function drawIdleWaveform(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  context.clearRect(0, 0, width, height)
  context.fillStyle = '#0d1f29'
  context.fillRect(0, 0, width, height)

  context.strokeStyle = 'rgba(173, 248, 220, 0.35)'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(0, height / 2)
  context.lineTo(width, height / 2)
  context.stroke()
}

function SoundSynth() {
  const storeRef = useRef<TSoundSynthStore | null>(null)

  if (!storeRef.current) {
    storeRef.current = loadStore()
  }

  const [setup, setSetup] = useState<TSynthSetup>(
    storeRef.current.currentSetup || createDefaultSetup(),
  )
  const [loadedSetupId, setLoadedSetupId] = useState<string | null>(
    storeRef.current.loadedSetupId,
  )
  const [savedSetups, setSavedSetups] = useState<TSavedSetup[]>(
    storeRef.current.savedSetups,
  )
  const [statusText, setStatusText] = useState(
    'Press a piano key or computer key to wake the synth.',
  )
  const [lastNote, setLastNote] = useState<string>('None')
  const [audioReady, setAudioReady] = useState(false)
  const [pressedNotes, setPressedNotes] = useState<number[]>([])
  const [startNoteInput, setStartNoteInput] = useState(setup.keyboardRange.startNote)
  const engineRef = useRef<SoundSynthEngine | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const settingsDialogRef = useRef<HTMLDialogElement | null>(null)
  const setupsDialogRef = useRef<HTMLDialogElement | null>(null)
  const pressedNoteCountsRef = useRef(new Map<number, number>())
  const pressedKeyCodesRef = useRef(new Set<string>())

  const startNoteNumber = clampVisibleStartNote(
    parseNoteName(setup.keyboardRange.startNote) ??
      parseNoteName('C3') ??
      48,
  )
  const endNoteNumber = startNoteNumber + VISIBLE_SEMITONES - 1
  const visibleNotes = buildNoteRange(startNoteNumber, VISIBLE_SEMITONES)
  const whiteNotes = visibleNotes.filter(note => !note.isBlack)
  const keyboardMap = buildKeyboardMap(startNoteNumber)
  const keyboardLabels = Object.fromEntries(
    Object.entries(keyboardMap).map(([keyCode, noteNumber]) => [
      noteNumber,
      keyCode.replace('Key', ''),
    ]),
  ) as Record<number, string>
  const activeNoteSet = new Set(pressedNotes)
  const audioSignature = getAudioSignature(setup)

  function syncPressedNotes() {
    setPressedNotes(
      Array.from(pressedNoteCountsRef.current.keys()).sort((a, b) => a - b),
    )
  }

  function applyStartNoteInput() {
    const parsed = parseNoteName(startNoteInput)

    if (parsed === null) {
      setStartNoteInput(setup.keyboardRange.startNote)
      setStatusText('Use note names like C3, F#2, or C-3.')
      return
    }

    const clamped = clampVisibleStartNote(parsed)
    const normalized = noteNumberToName(clamped)

    setStartNoteInput(normalized)
    setSetup(current => ({
      ...current,
      keyboardRange: {
        ...current.keyboardRange,
        startNote: normalized,
      },
    }))
  }

  function updateLayer(
    layerId: string,
    updater: (layer: TLayerConfig) => TLayerConfig,
  ) {
    setSetup(current => ({
      ...current,
      layers: current.layers.map(layer =>
        layer.id === layerId ? updater(layer) : layer
      ),
    }))
  }

  function updateSample(
    layerId: string,
    sampleId: string,
    updater: (sample: TSampleSlot) => TSampleSlot,
  ) {
    updateLayer(layerId, layer => ({
      ...layer,
      samples: layer.samples.map(sample =>
        sample.id === sampleId ? updater(sample) : sample
      ),
    }))
  }

  function updateSegment(
    layerId: string,
    index: number,
    field: keyof TPlaybackRateSegment,
    value: string,
  ) {
    updateLayer(layerId, layer => ({
      ...layer,
      playbackRateSegments: layer.playbackRateSegments.map((segment, segmentIndex) =>
        segmentIndex === index ? { ...segment, [field]: value } : segment
      ),
    }))
  }

  function normalizeSegmentValue(
    layerId: string,
    index: number,
    field: keyof TPlaybackRateSegment,
  ) {
    updateLayer(layerId, layer => ({
      ...layer,
      playbackRateSegments: layer.playbackRateSegments.map((segment, segmentIndex) =>
        segmentIndex === index
          ? {
            ...segment,
            [field]: formatNumber(Number(segment[field]) || 50, 2),
          }
          : segment
      ),
    }))
  }

  function addTimelineSegment(layerId: string) {
    updateLayer(layerId, layer => {
      const lastSegment = layer.playbackRateSegments[layer.playbackRateSegments.length - 1]
      const anchor = lastSegment?.end ?? '50.00'

      return {
        ...layer,
        playbackRateSegments: [
          ...layer.playbackRateSegments,
          {
            start: formatNumber(Number(anchor) || 50, 2),
            end: formatNumber(Number(anchor) || 50, 2),
          },
        ],
      }
    })
  }

  function removeTimelineSegment(layerId: string, index: number) {
    updateLayer(layerId, layer => ({
      ...layer,
      playbackRateSegments: layer.playbackRateSegments.filter(
        (_, segmentIndex) => segmentIndex !== index,
      ),
    }))
  }

  function addLayer() {
    setSetup(current => ({
      ...current,
      layers: [
        ...current.layers,
        createNewLayer(`Layer ${current.layers.length + 1}`),
      ],
    }))
  }

  function removeLayer(layerId: string) {
    setSetup(current => ({
      ...current,
      layers: current.layers.filter(layer => layer.id !== layerId),
    }))
  }

  function addSample(layerId: string) {
    updateLayer(layerId, layer => ({
      ...layer,
      samples: [
        ...layer.samples,
        {
          id: `sample-${Math.random().toString(36).slice(2, 10)}`,
          enabled: true,
          sampleFile: '/spin/fans/01.wav',
          volume: 0.45,
          loopSustain: true,
          basePitchCorrection: 1,
        },
      ],
    }))
  }

  function removeSample(layerId: string, sampleId: string) {
    updateLayer(layerId, layer => ({
      ...layer,
      samples: layer.samples.filter(sample => sample.id !== sampleId),
    }))
  }

  function playNote(noteNumber: number) {
    const nextCount = (pressedNoteCountsRef.current.get(noteNumber) || 0) + 1

    pressedNoteCountsRef.current.set(noteNumber, nextCount)
    if (nextCount === 1) {
      setAudioReady(true)
      setLastNote(noteNumberToName(noteNumber))
      setStatusText(`Playing ${noteNumberToName(noteNumber)}.`)
      void engineRef.current?.noteOn(noteNumber)
    }
    syncPressedNotes()
  }

  function stopNote(noteNumber: number) {
    const currentCount = pressedNoteCountsRef.current.get(noteNumber)

    if (!currentCount) {
      return
    }

    if (currentCount === 1) {
      pressedNoteCountsRef.current.delete(noteNumber)
      void engineRef.current?.noteOff(noteNumber)
    } else {
      pressedNoteCountsRef.current.set(noteNumber, currentCount - 1)
    }

    if (pressedNoteCountsRef.current.size === 0) {
      setStatusText('Ready for the next note.')
    }
    syncPressedNotes()
  }

  function saveCurrentSetup() {
    if (!setup.name.trim()) {
      setStatusText('Give the setup a name before saving it.')
      return
    }

    if (!loadedSetupId) {
      saveCurrentSetupAs()
      return
    }

    const timestamp = new Date().toISOString()

    setSavedSetups(current =>
      current.map(saved =>
        saved.id === loadedSetupId
          ? {
            ...saved,
            name: setup.name,
            updatedAt: timestamp,
            setup: cloneSetup(setup),
          }
          : saved
      ),
    )
    setStatusText(`Saved ${setup.name}.`)
  }

  function saveCurrentSetupAs(defaultName = setup.name) {
    const promptedName = window.prompt('Save setup as:', defaultName)

    if (!promptedName) {
      return
    }

    const savedSetup = createSavedSetup(setup, promptedName)
    const nextSetup = cloneSetup({
      ...setup,
      name: promptedName,
    })

    setSavedSetups(current => [...current, savedSetup])
    setLoadedSetupId(savedSetup.id)
    setSetup(nextSetup)
    setStatusText(`Saved new setup ${promptedName}.`)
  }

  function duplicateCurrentSetup() {
    const duplicateName = window.prompt(
      'Duplicate setup as:',
      `${setup.name} copy`,
    )

    if (!duplicateName) {
      return
    }

    const savedSetup = createSavedSetup(setup, duplicateName)

    setSavedSetups(current => [...current, savedSetup])
    setLoadedSetupId(savedSetup.id)
    setSetup(cloneSetup({
      ...setup,
      name: duplicateName,
    }))
    setStatusText(`Duplicated setup to ${duplicateName}.`)
  }

  function loadSavedSetup(saved: TSavedSetup) {
    pressedNoteCountsRef.current.clear()
    pressedKeyCodesRef.current.clear()
    setPressedNotes([])
    setSetup(cloneSetup(saved.setup))
    setLoadedSetupId(saved.id)
    setStartNoteInput(saved.setup.keyboardRange.startNote)
    setStatusText(`Loaded ${saved.name}.`)
    closeDialog(setupsDialogRef)
  }

  function deleteSavedSetup(saved: TSavedSetup) {
    if (!window.confirm(`Delete ${saved.name}?`)) {
      return
    }

    setSavedSetups(current => current.filter(item => item.id !== saved.id))
    if (loadedSetupId === saved.id) {
      setLoadedSetupId(null)
    }
    setStatusText(`Deleted ${saved.name}.`)
  }

  function duplicateSavedSetup(saved: TSavedSetup) {
    const duplicateName = window.prompt(
      'Duplicate saved setup as:',
      `${saved.name} copy`,
    )

    if (!duplicateName) {
      return
    }

    const duplicate = createSavedSetup(saved.setup, duplicateName)

    setSavedSetups(current => [...current, duplicate])
    setStatusText(`Created ${duplicateName}.`)
  }

  useEffect(() => {
    const engine = new SoundSynthEngine()

    engineRef.current = engine
    void engine.applySetup(setup)

    return () => {
      engine.destroy()
      engineRef.current = null
    }
  }, [])

  useEffect(() => {
    setStartNoteInput(setup.keyboardRange.startNote)
  }, [setup.keyboardRange.startNote])

  useEffect(() => {
    if (!engineRef.current) {
      return
    }

    void engineRef.current.applySetup(setup)
  }, [audioSignature])

  useEffect(() => {
    persistStore({
      currentSetup: setup,
      loadedSetupId,
      savedSetups,
    })
  }, [setup, loadedSetupId, savedSetups])

  useEffect(() => {
    let frame = 0

    const draw = () => {
      const canvas = canvasRef.current

      if (!canvas) {
        frame = window.requestAnimationFrame(draw)
        return
      }

      const context = canvas.getContext('2d')

      if (!context) {
        frame = window.requestAnimationFrame(draw)
        return
      }

      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const width = Math.max(Math.round(rect.width), 1)
      const height = Math.max(Math.round(rect.height), 1)

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr
        canvas.height = height * dpr
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      const analyser = engineRef.current?.getAnalyser()

      if (!analyser || !audioReady) {
        drawIdleWaveform(context, width, height)
        frame = window.requestAnimationFrame(draw)
        return
      }

      const data = new Uint8Array(analyser.fftSize)

      analyser.getByteTimeDomainData(data)

      context.clearRect(0, 0, width, height)
      context.fillStyle = '#0d1f29'
      context.fillRect(0, 0, width, height)

      const gradient = context.createLinearGradient(0, 0, width, 0)

      gradient.addColorStop(0, '#8bf6cf')
      gradient.addColorStop(0.5, '#ffd166')
      gradient.addColorStop(1, '#ff8c61')

      context.strokeStyle = gradient
      context.lineWidth = 2.5
      context.beginPath()

      for (let index = 0; index < data.length; index += 1) {
        const x = (index / (data.length - 1)) * width
        const normalized = data[index] / 128
        const y = (normalized * height) / 2

        if (index === 0) {
          context.moveTo(x, y)
        } else {
          context.lineTo(x, y)
        }
      }

      context.stroke()

      frame = window.requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [audioReady])

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) {
        return false
      }

      return ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || isTypingTarget(event.target)) {
        return
      }

      const noteNumber = keyboardMap[event.code as keyof typeof keyboardMap]

      if (noteNumber === undefined) {
        return
      }

      event.preventDefault()

      if (pressedKeyCodesRef.current.has(event.code)) {
        return
      }

      pressedKeyCodesRef.current.add(event.code)
      playNote(noteNumber)
    }

    function onKeyUp(event: KeyboardEvent) {
      const noteNumber = keyboardMap[event.code as keyof typeof keyboardMap]

      if (noteNumber === undefined) {
        return
      }

      event.preventDefault()
      pressedKeyCodesRef.current.delete(event.code)
      stopNote(noteNumber)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [setup.keyboardRange.startNote])

  return (
    <div className='soundsynth-shell'>
      <section className='soundsynth-hero'>
        <div>
          <p className='soundsynth-eyebrow'>Sound Synth</p>
          <h1>{setup.name}</h1>
          <p className='soundsynth-status'>{statusText}</p>
        </div>

        <div className='soundsynth-live-strip'>
          <label>
            <span>BPM</span>
            <input
              type='number'
              min='20'
              max='300'
              step='1'
              value={String(setup.bpm)}
              onInput={event => {
                const bpm = Number(event.currentTarget.value) || 120

                setSetup(current => ({
                  ...current,
                  bpm: Math.max(20, Math.min(300, bpm)),
                }))
              }}
            />
          </label>

          <label>
            <span>Mode</span>
            <select
              value={setup.mode}
              onInput={event => {
                const value = event.currentTarget.value === 'mono' ? 'mono' : 'poly'

                setSetup(current => ({
                  ...current,
                  mode: value,
                }))
              }}
            >
              <option value='poly'>Poly</option>
              <option value='mono'>Mono</option>
            </select>
          </label>

          <label className='soundsynth-range-label'>
            <span>Master Volume</span>
            <input
              type='range'
              min='0'
              max='1'
              step='0.01'
              value={String(setup.masterVolume)}
              onInput={event => {
                const nextValue = Number(event.currentTarget.value)

                setSetup(current => ({
                  ...current,
                  masterVolume: nextValue,
                }))
              }}
            />
            <strong>{formatNumber(setup.masterVolume, 2)}</strong>
          </label>

          <div className='soundsynth-note-pill'>
            <span>Last Note</span>
            <strong>{lastNote}</strong>
          </div>
        </div>

        <div className='soundsynth-visualizer-wrap'>
          <canvas ref={canvasRef} className='soundsynth-visualizer' />
        </div>

        <div className='soundsynth-actions'>
          <button type='button' onClick={() => openDialog(settingsDialogRef)}>
            Open Settings
          </button>
          <button type='button' onClick={() => openDialog(setupsDialogRef)}>
            Setups
          </button>
          <button type='button' onClick={addLayer}>
            Add Layer
          </button>
        </div>
      </section>

      <section className='soundsynth-layer-grid'>
        {setup.layers.length
          ? setup.layers.map(layer => (
            <article className='soundsynth-layer-card' key={layer.id}>
              <div className='soundsynth-layer-heading'>
                <div>
                  <h2>{layer.name}</h2>
                  <p>{getLayerSampleSummary(layer)}</p>
                </div>
                <label className='soundsynth-inline-toggle'>
                  <input
                    type='checkbox'
                    checked={layer.enabled}
                    onInput={event => {
                      updateLayer(layer.id, currentLayer => ({
                        ...currentLayer,
                        enabled: event.currentTarget.checked,
                      }))
                    }}
                  />
                  <span>{layer.enabled ? 'On' : 'Off'}</span>
                </label>
              </div>

              <label className='soundsynth-range-label'>
                <span>Dry Volume</span>
                <input
                  type='range'
                  min='0'
                  max='1'
                  step='0.01'
                  value={String(layer.dryVolume)}
                  onInput={event => {
                    const nextValue = Number(event.currentTarget.value)

                    updateLayer(layer.id, currentLayer => ({
                      ...currentLayer,
                      dryVolume: nextValue,
                    }))
                  }}
                />
                <strong>{formatNumber(layer.dryVolume, 2)}</strong>
              </label>

              <div className='soundsynth-layer-meta'>
                <span>
                  Timeline {layer.playbackRateSegments.length} beat
                  {layer.playbackRateSegments.length === 1 ? '' : 's'} at {formatNumber(layer.timelineMultiplier, 2)}x
                </span>
                <span>
                  Reverb {getSampleFileLabel(layer.reverb.impulseFile)} / {formatNumber(layer.reverb.wet, 2)}
                </span>
              </div>

              <div className='soundsynth-layer-preview'>
                {layer.samples.map(sample => (
                  <span
                    className={sample.enabled
                      ? 'soundsynth-chip'
                      : 'soundsynth-chip soundsynth-chip-muted'}
                    key={sample.id}
                  >
                    {getSampleFileLabel(sample.sampleFile)}
                  </span>
                ))}
              </div>

              <div className='soundsynth-card-actions'>
                <button type='button' onClick={() => openDialog(settingsDialogRef)}>
                  Edit Layer
                </button>
                <button
                  type='button'
                  className='danger'
                  onClick={() => removeLayer(layer.id)}
                >
                  Remove
                </button>
              </div>
            </article>
          ))
          : (
            <article className='soundsynth-empty-card'>
              <h2>No layers yet</h2>
              <p>Add a layer to start stacking samples.</p>
              <button type='button' onClick={addLayer}>
                Add First Layer
              </button>
            </article>
          )}
      </section>

      <section className='soundsynth-keyboard-section'>
        <div className='soundsynth-keyboard-meta'>
          <div>
            <strong>Keyboard Range</strong>
            <span>
              {noteNumberToName(startNoteNumber)} to {noteNumberToName(endNoteNumber)}
            </span>
          </div>
          <div>
            <strong>Computer Keys</strong>
            <span>{noteNumberToName(startNoteNumber + 12)} to {noteNumberToName(startNoteNumber + 24)}</span>
          </div>
        </div>

        <div className='soundsynth-keyboard'>
          <div className='soundsynth-white-keys'>
            {whiteNotes.map(note => (
              <button
                key={note.noteNumber}
                type='button'
                className={activeNoteSet.has(note.noteNumber)
                  ? 'soundsynth-key white active'
                  : 'soundsynth-key white'}
                onPointerDown={event => {
                  event.preventDefault()
                  event.currentTarget.setPointerCapture(event.pointerId)
                  playNote(note.noteNumber)
                }}
                onPointerUp={event => {
                  event.preventDefault()
                  stopNote(note.noteNumber)
                }}
                onPointerCancel={event => {
                  event.preventDefault()
                  stopNote(note.noteNumber)
                }}
              >
                <span className='note'>{note.name}</span>
                {keyboardLabels[note.noteNumber] && (
                  <span className='hotkey'>{keyboardLabels[note.noteNumber]}</span>
                )}
              </button>
            ))}
          </div>

          {visibleNotes
            .filter(note => note.isBlack)
            .map(note => {
              const previousWhiteCount = visibleNotes
                .filter(visible => !visible.isBlack && visible.noteNumber < note.noteNumber)
                .length
              const leftPercentage = (previousWhiteCount / whiteNotes.length) * 100

              return (
                <button
                  key={note.noteNumber}
                  type='button'
                  className={activeNoteSet.has(note.noteNumber)
                    ? 'soundsynth-key black active'
                    : 'soundsynth-key black'}
                  style={{ left: `${leftPercentage}%` }}
                  onPointerDown={event => {
                    event.preventDefault()
                    event.currentTarget.setPointerCapture(event.pointerId)
                    playNote(note.noteNumber)
                  }}
                  onPointerUp={event => {
                    event.preventDefault()
                    stopNote(note.noteNumber)
                  }}
                  onPointerCancel={event => {
                    event.preventDefault()
                    stopNote(note.noteNumber)
                  }}
                >
                  <span className='note'>{note.name}</span>
                  {keyboardLabels[note.noteNumber] && (
                    <span className='hotkey'>{keyboardLabels[note.noteNumber]}</span>
                  )}
                </button>
              )
            })}
        </div>
      </section>

      <dialog className='soundsynth-dialog' ref={settingsDialogRef}>
        <div className='soundsynth-dialog-inner'>
          <div className='soundsynth-dialog-header'>
            <div>
              <p className='soundsynth-eyebrow'>Instrument Settings</p>
              <h2>{setup.name}</h2>
            </div>
            <button type='button' onClick={() => closeDialog(settingsDialogRef)}>
              Close
            </button>
          </div>

          <section className='soundsynth-settings-section'>
            <h3>Global Instrument</h3>
            <div className='soundsynth-field-grid'>
              <label>
                <span>Setup Name</span>
                <input
                  type='text'
                  value={setup.name}
                  onInput={event => {
                    const nextValue = event.currentTarget.value

                    setSetup(current => ({
                      ...current,
                      name: nextValue,
                    }))
                  }}
                />
              </label>

              <label>
                <span>BPM</span>
                <input
                  type='number'
                  min='20'
                  max='300'
                  step='1'
                  value={String(setup.bpm)}
                  onInput={event => {
                    const bpm = Number(event.currentTarget.value) || 120

                    setSetup(current => ({
                      ...current,
                      bpm: Math.max(20, Math.min(300, bpm)),
                    }))
                  }}
                />
              </label>

              <label>
                <span>Mode</span>
                <select
                  value={setup.mode}
                  onInput={event => {
                    const nextMode = event.currentTarget.value === 'mono' ? 'mono' : 'poly'

                    setSetup(current => ({
                      ...current,
                      mode: nextMode,
                    }))
                  }}
                >
                  <option value='poly'>Poly</option>
                  <option value='mono'>Mono</option>
                </select>
              </label>

              <label>
                <span>Master Volume</span>
                <input
                  type='number'
                  min='0'
                  max='1'
                  step='0.01'
                  value={String(setup.masterVolume)}
                  onInput={event => {
                    const nextValue = Number(event.currentTarget.value)

                    setSetup(current => ({
                      ...current,
                      masterVolume: Math.max(0, Math.min(1, nextValue || 0)),
                    }))
                  }}
                />
              </label>
            </div>
          </section>

          <section className='soundsynth-settings-section'>
            <h3>Keyboard</h3>
            <div className='soundsynth-field-grid soundsynth-keyboard-grid'>
              <label>
                <span>Start Note</span>
                <input
                  type='text'
                  value={startNoteInput}
                  onInput={event => {
                    setStartNoteInput(event.currentTarget.value)
                  }}
                  onBlur={() => {
                    applyStartNoteInput()
                  }}
                  onKeyDown={event => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      applyStartNoteInput()
                    }
                  }}
                />
              </label>

              <div className='soundsynth-note-range-card'>
                <span>Visible Range</span>
                <strong>
                  {noteNumberToName(startNoteNumber)} to {noteNumberToName(endNoteNumber)}
                </strong>
              </div>
            </div>
          </section>

          <section className='soundsynth-settings-section'>
            <h3>Shared ADSR</h3>
            <div className='soundsynth-field-grid'>
              <label>
                <span>Attack</span>
                <input
                  type='number'
                  min='0.001'
                  max='10'
                  step='0.001'
                  value={String(setup.adsr.attack)}
                  onInput={event => {
                    const attack = Number(event.currentTarget.value) || 0.02

                    setSetup(current => ({
                      ...current,
                      adsr: {
                        ...current.adsr,
                        attack: attack,
                      },
                    }))
                  }}
                />
              </label>

              <label>
                <span>Decay</span>
                <input
                  type='number'
                  min='0.001'
                  max='10'
                  step='0.001'
                  value={String(setup.adsr.decay)}
                  onInput={event => {
                    const decay = Number(event.currentTarget.value) || 0.18

                    setSetup(current => ({
                      ...current,
                      adsr: {
                        ...current.adsr,
                        decay,
                      },
                    }))
                  }}
                />
              </label>

              <label>
                <span>Sustain</span>
                <input
                  type='number'
                  min='0'
                  max='1'
                  step='0.01'
                  value={String(setup.adsr.sustain)}
                  onInput={event => {
                    const sustain = Number(event.currentTarget.value)

                    setSetup(current => ({
                      ...current,
                      adsr: {
                        ...current.adsr,
                        sustain: Math.max(0, Math.min(1, sustain || 0)),
                      },
                    }))
                  }}
                />
              </label>

              <label>
                <span>Release</span>
                <input
                  type='number'
                  min='0.01'
                  max='10'
                  step='0.01'
                  value={String(setup.adsr.release)}
                  onInput={event => {
                    const release = Number(event.currentTarget.value) || 0.3

                    setSetup(current => ({
                      ...current,
                      adsr: {
                        ...current.adsr,
                        release,
                      },
                    }))
                  }}
                />
              </label>
            </div>
          </section>

          <section className='soundsynth-settings-section'>
            <div className='soundsynth-section-title-row'>
              <h3>Layers</h3>
              <button type='button' onClick={addLayer}>
                Add Layer
              </button>
            </div>

            {setup.layers.map((layer, layerIndex) => (
              <article className='soundsynth-layer-editor' key={layer.id}>
                <div className='soundsynth-layer-editor-header'>
                  <div>
                    <p className='soundsynth-eyebrow'>Layer {layerIndex + 1}</p>
                    <h4>{layer.name}</h4>
                  </div>
                  <button
                    type='button'
                    className='danger'
                    onClick={() => removeLayer(layer.id)}
                  >
                    Remove Layer
                  </button>
                </div>

                <div className='soundsynth-field-grid'>
                  <label>
                    <span>Layer Name</span>
                    <input
                      type='text'
                      value={layer.name}
                      onInput={event => {
                        const nextValue = event.currentTarget.value

                        updateLayer(layer.id, currentLayer => ({
                          ...currentLayer,
                          name: nextValue,
                        }))
                      }}
                    />
                  </label>

                  <label>
                    <span>Dry Volume</span>
                    <input
                      type='number'
                      min='0'
                      max='1'
                      step='0.01'
                      value={String(layer.dryVolume)}
                      onInput={event => {
                        const nextValue = Number(event.currentTarget.value)

                        updateLayer(layer.id, currentLayer => ({
                          ...currentLayer,
                          dryVolume: Math.max(0, Math.min(1, nextValue || 0)),
                        }))
                      }}
                    />
                  </label>

                  <label>
                    <span>Timeline Multiplier</span>
                    <input
                      type='number'
                      min='0.125'
                      max='8'
                      step='0.125'
                      value={String(layer.timelineMultiplier)}
                      onInput={event => {
                        const nextValue = Number(event.currentTarget.value)

                        updateLayer(layer.id, currentLayer => ({
                          ...currentLayer,
                          timelineMultiplier: Math.max(
                            0.125,
                            Math.min(8, nextValue || 1),
                          ),
                        }))
                      }}
                    />
                  </label>

                  <label className='soundsynth-inline-toggle'>
                    <input
                      type='checkbox'
                      checked={layer.enabled}
                      onInput={event => {
                        updateLayer(layer.id, currentLayer => ({
                          ...currentLayer,
                          enabled: event.currentTarget.checked,
                        }))
                      }}
                    />
                    <span>Layer Enabled</span>
                  </label>
                </div>

                <div className='soundsynth-field-grid'>
                  <label>
                    <span>Impulse Response</span>
                    <select
                      value={layer.reverb.impulseFile}
                      onInput={event => {
                        const nextValue = event.currentTarget.value

                        updateLayer(layer.id, currentLayer => ({
                          ...currentLayer,
                          reverb: {
                            ...currentLayer.reverb,
                            impulseFile: nextValue,
                          },
                        }))
                      }}
                    >
                      {IMPULSE_RESPONSE_LIBRARY.map(item => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Wet / Dry Amount</span>
                    <input
                      type='number'
                      min='0'
                      max='1'
                      step='0.01'
                      value={String(layer.reverb.wet)}
                      onInput={event => {
                        const nextValue = Number(event.currentTarget.value)

                        updateLayer(layer.id, currentLayer => ({
                          ...currentLayer,
                          reverb: {
                            ...currentLayer.reverb,
                            wet: Math.max(0, Math.min(1, nextValue || 0)),
                          },
                        }))
                      }}
                    />
                  </label>
                </div>

                <div className='soundsynth-lane-editor'>
                  <div className='soundsynth-section-title-row'>
                    <h5>Playback-Rate Timeline</h5>
                    <button type='button' onClick={() => addTimelineSegment(layer.id)}>
                      Add Beat
                    </button>
                  </div>

                  {layer.playbackRateSegments.map((segment, segmentIndex) => (
                    <div className='soundsynth-segment-row' key={`${layer.id}-${segmentIndex}`}>
                      <span>Beat {segmentIndex + 1}</span>

                      <label>
                        <span>From</span>
                        <input
                          type='number'
                          step='0.01'
                          value={segment.start}
                          onInput={event => {
                            updateSegment(
                              layer.id,
                              segmentIndex,
                              'start',
                              event.currentTarget.value,
                            )
                          }}
                          onBlur={() => {
                            normalizeSegmentValue(layer.id, segmentIndex, 'start')
                          }}
                        />
                      </label>

                      <label>
                        <span>To</span>
                        <input
                          type='number'
                          step='0.01'
                          value={segment.end}
                          onInput={event => {
                            updateSegment(
                              layer.id,
                              segmentIndex,
                              'end',
                              event.currentTarget.value,
                            )
                          }}
                          onBlur={() => {
                            normalizeSegmentValue(layer.id, segmentIndex, 'end')
                          }}
                        />
                      </label>

                      <button
                        type='button'
                        className='ghost danger'
                        disabled={layer.playbackRateSegments.length === 1}
                        onClick={() => removeTimelineSegment(layer.id, segmentIndex)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className='soundsynth-sample-editor'>
                  <div className='soundsynth-section-title-row'>
                    <h5>Sample Stack</h5>
                    <button type='button' onClick={() => addSample(layer.id)}>
                      Add Sample
                    </button>
                  </div>

                  {layer.samples.map(sample => (
                    <div className='soundsynth-sample-row' key={sample.id}>
                      <label className='soundsynth-inline-toggle'>
                        <input
                          type='checkbox'
                          checked={sample.enabled}
                          onInput={event => {
                            updateSample(layer.id, sample.id, currentSample => ({
                              ...currentSample,
                              enabled: event.currentTarget.checked,
                            }))
                          }}
                        />
                        <span>On</span>
                      </label>

                      <label>
                        <span>Sample</span>
                        <select
                          value={sample.sampleFile}
                          onInput={event => {
                            const nextValue = event.currentTarget.value

                            updateSample(layer.id, sample.id, currentSample => ({
                              ...currentSample,
                              sampleFile: nextValue,
                            }))
                          }}
                        >
                          {SAMPLE_LIBRARY.map(item => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span>Volume</span>
                        <input
                          type='number'
                          min='0'
                          max='1'
                          step='0.01'
                          value={String(sample.volume)}
                          onInput={event => {
                            const nextValue = Number(event.currentTarget.value)

                            updateSample(layer.id, sample.id, currentSample => ({
                              ...currentSample,
                              volume: Math.max(0, Math.min(1, nextValue || 0)),
                            }))
                          }}
                        />
                      </label>

                      <label>
                        <span>Pitch Correction</span>
                        <input
                          type='number'
                          min='0.0001'
                          max='8'
                          step='0.0001'
                          value={String(sample.basePitchCorrection)}
                          onInput={event => {
                            const nextValue = Number(event.currentTarget.value)

                            updateSample(layer.id, sample.id, currentSample => ({
                              ...currentSample,
                              basePitchCorrection: Math.max(
                                0.0001,
                                Math.min(8, nextValue || 1),
                              ),
                            }))
                          }}
                        />
                      </label>

                      <label className='soundsynth-inline-toggle'>
                        <input
                          type='checkbox'
                          checked={sample.loopSustain}
                          onInput={event => {
                            updateSample(layer.id, sample.id, currentSample => ({
                              ...currentSample,
                              loopSustain: event.currentTarget.checked,
                            }))
                          }}
                        />
                        <span>Loop Sustain</span>
                      </label>

                      <button
                        type='button'
                        className='ghost danger'
                        onClick={() => removeSample(layer.id, sample.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>
        </div>
      </dialog>

      <dialog className='soundsynth-dialog soundsynth-setups-dialog' ref={setupsDialogRef}>
        <div className='soundsynth-dialog-inner'>
          <div className='soundsynth-dialog-header'>
            <div>
              <p className='soundsynth-eyebrow'>Setups</p>
              <h2>Save, load, and duplicate</h2>
            </div>
            <button type='button' onClick={() => closeDialog(setupsDialogRef)}>
              Close
            </button>
          </div>

          <section className='soundsynth-settings-section'>
            <h3>Current Working Setup</h3>
            <div className='soundsynth-current-setup-card'>
              <div>
                <strong>{setup.name}</strong>
                <p>
                  {loadedSetupId
                    ? 'Linked to a saved setup. Edits stay local until you press Save.'
                    : 'Unsaved working setup.'}
                </p>
              </div>

              <div className='soundsynth-card-actions'>
                <button type='button' onClick={saveCurrentSetup}>
                  Save
                </button>
                <button type='button' onClick={() => saveCurrentSetupAs()}>
                  Save As
                </button>
                <button type='button' onClick={duplicateCurrentSetup}>
                  Duplicate
                </button>
              </div>
            </div>
          </section>

          <section className='soundsynth-settings-section'>
            <h3>Saved Setups</h3>
            {savedSetups.length
              ? (
                <div className='soundsynth-saved-list'>
                  {savedSetups.map(saved => (
                    <article className='soundsynth-saved-card' key={saved.id}>
                      <div>
                        <strong>{saved.name}</strong>
                        <p>Updated {new Date(saved.updatedAt).toLocaleString()}</p>
                      </div>

                      <div className='soundsynth-card-actions'>
                        <button type='button' onClick={() => loadSavedSetup(saved)}>
                          Load
                        </button>
                        <button type='button' onClick={() => duplicateSavedSetup(saved)}>
                          Duplicate
                        </button>
                        <button
                          type='button'
                          className='danger'
                          onClick={() => deleteSavedSetup(saved)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )
              : (
                <p className='soundsynth-empty-state'>
                  No saved setups yet. Save the current instrument to build a library.
                </p>
              )}
          </section>
        </div>
      </dialog>
    </div>
  )
}

export default SoundSynth
