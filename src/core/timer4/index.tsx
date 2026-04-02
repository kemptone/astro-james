import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import useAudioLoop from '../../hooks/useAudioLoop.tsx'
import type { AudioThing } from '../../hooks/useAudioLoop.tsx'
import { loadReverb } from '../../hooks/useReverb.tsx'
import AdjustableBlades, {
  CurveTypes
} from '../../components/AdjustableBlades.tsx'
import Dialog from '../../components/Dialog'
import OuterWrap from '../../components/Timer/OuterWrap.tsx'
import RangeWithTicks from '../../components/RangeWithTicks.tsx'
import { SettingItem } from '../../components/SettingItem.tsx'
import {
  removeClassListItem,
  setBodyStyleProp,
  setClassListItem
} from '../../helpers/setBodyStyleProp.ts'
import type { TCurveType } from '../../components/AdjustableBlades.tsx'
import Select from '../../components/SelectWithFieldset.tsx'
import { getState, persist } from '../../helpers/localStorage.ts'
import ModeItem from '../../components/ModeItem.tsx'
import './style.css'

type TButtonStatus = 'Start' | 'Stop' | 'Waiting'
type TTimerState = 0 | 1
type TAudioRateSegment = {
  start: string
  end: string
}

const values = getState()
const AUDIO_RATE_DEFAULT = 50
const FAN_SPEED = 50
const FAN_RATE = FAN_SPEED / 20
const MIN_DURATION = 0.01

function toAudioRateValue (value: unknown) {
  const numeric = Number(value)

  return Number.isFinite(numeric) ? numeric : AUDIO_RATE_DEFAULT
}

function formatAudioRateValue (value: unknown) {
  return toAudioRateValue(value).toFixed(2)
}

function createDefaultAudioRateSegments (value?: unknown): TAudioRateSegment[] {
  const numeric = formatAudioRateValue(value)

  return [{ start: numeric, end: numeric }]
}

function getAudioRateSegmentsFromState () {
  const raw = values.audioRateSegments

  if (typeof raw === 'string' && raw) {
    try {
      const parsed = JSON.parse(raw)

      if (Array.isArray(parsed)) {
        const segments = parsed
          .map(segment => {
            if (!segment || typeof segment !== 'object') {
              return null
            }

            return {
              start: formatAudioRateValue(segment.start),
              end: formatAudioRateValue(segment.end)
            }
          })
          .filter((segment): segment is TAudioRateSegment => Boolean(segment))

        if (segments.length) {
          return segments
        }
      }
    } catch (error) {
      console.error(error)
    }
  }

  return createDefaultAudioRateSegments(values.audioRate)
}

function persistAudioRateSegments (segments: TAudioRateSegment[]) {
  persist('audioRateSegments', JSON.stringify(segments))
}

function getAudioTimelineDuration (segments: TAudioRateSegment[]) {
  return Math.max(segments.length, MIN_DURATION)
}

function getAudioEnvelopeValueAtTime (
  time: number,
  segments: TAudioRateSegment[]
) {
  if (!segments.length) {
    return AUDIO_RATE_DEFAULT / 50
  }

  if (time <= 0) {
    return toAudioRateValue(segments[0].start) / 50
  }

  const index = Math.floor(time)

  if (index >= segments.length) {
    return toAudioRateValue(segments[segments.length - 1].end) / 50
  }

  const segment = segments[index]
  const progress = Math.max(0, Math.min(1, time - index))
  const start = toAudioRateValue(segment.start)
  const end = toAudioRateValue(segment.end)
  const rawValue = start + (end - start) * progress

  return rawValue / 50
}

function createPlaybackRateCurve ({
  rate,
  initialPlaybackRate,
  audioRateSegments
}: {
  rate: number
  initialPlaybackRate: number
  audioRateSegments: TAudioRateSegment[]
}) {
  const duration = getAudioTimelineDuration(audioRateSegments)
  const sampleCount = Math.max(Math.ceil(duration * 60), 2)
  const curve = new Float32Array(sampleCount)

  for (let index = 0; index < sampleCount; index++) {
    const progress = sampleCount === 1 ? 0 : index / (sampleCount - 1)
    const time = progress * duration
    const audioEnvelope = getAudioEnvelopeValueAtTime(time, audioRateSegments)

    curve[index] = initialPlaybackRate * rate * audioEnvelope
  }

  return {
    curve,
    duration
  }
}

const InnerCore = ({ Sounds }: { Sounds: AudioThing[] }) => {
  const refAudioContext = useRef<AudioContext | undefined>()
  const e_blades = useRef<HTMLInputElement | null>(null)
  const e_bladeScale = useRef<HTMLInputElement | null>(null)
  const e_bladeLineWidth = useRef<HTMLInputElement | null>(null)
  const e_opacity = useRef<HTMLInputElement | null>(null)
  const e_wait = useRef<HTMLInputElement | null>(null)
  const e_outer = useRef<HTMLElement | null>(null)
  const e_spinner = useRef<HTMLButtonElement | null>(null)
  const e_button = useRef<HTMLButtonElement | null>(null)
  const refAudioRateStartInputs = useRef<Array<HTMLInputElement | null>>([])
  const timerState = useRef<TTimerState>(0)
  const [bladeCount, setBladeCount] = useState(values.blades || 5)
  const [audioRateSegments, setAudioRateSegments] = useState<TAudioRateSegment[]>(
    getAudioRateSegmentsFromState
  )
  const [buttonStatus, setButtonStatus] = useState<TButtonStatus>('Start')
  const [curveType, setCurveType] = useState<TCurveType>(
    values.curveType || 'paddle'
  )

  useEffect(() => {
    if (
      e_wait.current &&
      e_blades.current &&
      e_bladeScale.current &&
      e_opacity.current &&
      e_bladeLineWidth.current
    ) {
      const bs = (values.bladeScale as string) || String(30 / 20)
      const o = (values.opacity as string) || String(100)
      const lw = (values.bladesLineWidth as string) || String(20)

      e_wait.current.value = values.wait || '0'
      e_blades.current.value = values.blades || '5'
      e_bladeScale.current.value = bs // values.bladeScale || String(30 / 20);

      setBodyStyleProp('--blade-scale', String(Number(bs) * 20))

      setBodyStyleProp('--opacity', String(Number(o) / 100))

      setBodyStyleProp('--stroke-width', String(Number(lw) / 1000))

      e_opacity.current.value = o
      e_bladeLineWidth.current.value = lw
    }
  }, [])

  function updateAudioRateSegment (
    index: number,
    field: keyof TAudioRateSegment,
    value: string
  ) {
    setAudioRateSegments(current => {
      const next = current.map((segment, segmentIndex) => {
        if (segmentIndex !== index) {
          return segment
        }

        return {
          ...segment,
          [field]: value
        }
      })

      persistAudioRateSegments(next)

      return next
    })
  }

  function normalizeAudioRateSegment (
    index: number,
    field: keyof TAudioRateSegment
  ) {
    setAudioRateSegments(current => {
      const next = current.map((segment, segmentIndex) => {
        if (segmentIndex !== index) {
          return segment
        }

        return {
          ...segment,
          [field]: formatAudioRateValue(segment[field])
        }
      })

      persistAudioRateSegments(next)

      return next
    })
  }

  function addAudioRateSegment () {
    setAudioRateSegments(current => {
      const previous = current[current.length - 1]
      const next = [
        ...current,
        {
          start: formatAudioRateValue(previous?.end ?? AUDIO_RATE_DEFAULT),
          end: formatAudioRateValue(previous?.end ?? AUDIO_RATE_DEFAULT)
        }
      ]

      persistAudioRateSegments(next)
      requestAnimationFrame(() => {
        const target = refAudioRateStartInputs.current[next.length - 1]

        target?.focus()
        target?.scrollIntoView({
          block: 'nearest'
        })
      })

      return next
    })
  }

  function removeAudioRateSegment (index: number) {
    setAudioRateSegments(current => {
      const next = current.filter((_, currentIndex) => currentIndex !== index)

      persistAudioRateSegments(next)

      return next
    })
  }

  const startFan = useCallback(() => {
    if (e_spinner.current) {
      const duration = getAudioTimelineDuration(audioRateSegments)
      const rotations = Math.max(duration * FAN_RATE, MIN_DURATION)

      removeClassListItem('spinning', e_outer)
      void e_outer.current?.offsetWidth

      setBodyStyleProp('--runtime', String(duration) + 's')
      setBodyStyleProp('--rotations_runtime', 360 * rotations + 'deg')

      timerState.current = 1
      setClassListItem('spinning', e_outer)
    }
  }, [audioRateSegments])

  useEffect(() => {
    const spinner = e_spinner.current

    if (!spinner) {
      return
    }

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.propertyName !== 'transform' || timerState.current !== 1) {
        return
      }

      removeClassListItem('spinning', e_outer)
      timerState.current = 0
      setButtonStatus('Start')
    }

    spinner.addEventListener('transitionend', onTransitionEnd)

    return () => {
      spinner.removeEventListener('transitionend', onTransitionEnd)
    }
  }, [])

  function runSpin () {
    if (timerState.current === 0 && e_wait.current && e_button.current) {
      if (e_wait?.current?.value) {
        const wait = Number(e_wait?.current?.value ?? '1')

        setButtonStatus('Waiting')

        setTimeout(run, wait * 1000)
      } else {
        run()
      }
    } else if (e_button.current) {
      removeClassListItem('spinning', e_outer)
      timerState.current = 0
      setButtonStatus('Start')
      Sounds.forEach(item => {
        item.refStop.current()
      })
    }
  }

  function run () {
    startFan()

    let context = refAudioContext.current

    if (!context) {
      context = refAudioContext.current = new (window.AudioContext ||
        window.webkitAudioContext)()
    }

    // This is fixing an issue that shows up on Safari
    if (context.state === 'suspended') {
      context.resume()
    }

    loadReverb('/impulse/reaperblog/IRx1000_03C.wav', context).then(reverb => {
      if (!context) {
        context = refAudioContext.current = new (window.AudioContext ||
          window.webkitAudioContext)()
      }

      const gain = new GainNode(context)
      gain.gain.value = 0.125

      reverb.connect(context.destination)

      gain.connect(reverb)

      Sounds.forEach(s => {
        if (!context) {
          return
        }

        useAudioLoop(s, context, ({ source }) => {
          if (source && context) {
            const playbackRateCurve = createPlaybackRateCurve({
              rate: FAN_RATE,
              initialPlaybackRate: s.initialPlaybackRate,
              audioRateSegments
            })

            source.playbackRate.setValueCurveAtTime(
              playbackRateCurve.curve,
              context.currentTime,
              playbackRateCurve.duration
            )

            source.connect(gain)

            s.refPlay.current()

            source.stop(context.currentTime + playbackRateCurve.duration + 2)

            setButtonStatus('Stop')
          }
        })
      })
    })
  }

  return (
    <Dialog>
      {D => (
        <>
          <form
            action='javascript:void(0)'
            onSubmit={e => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const formData = new FormData(form)
              runSpin()
            }}
          >
            <main id='jamestimer' ref={e_outer}>
              <div className='innerwrap'>
                <button type='submit' className='blades-wrap' ref={e_spinner}>
                  <AdjustableBlades
                    bladeCount={bladeCount}
                    curveType={curveType}
                  />
                </button>
              </div>
              <footer>
                <div className='new-timer-section'>
                  <SettingItem
                    name='number_of_blades'
                    type='number'
                    lskey='blades'
                    step={1}
                    inputRef={e_blades}
                    onInput={e => {
                      const target = e.currentTarget // as HTMLInputElement;
                      const bladeCount = Math.min(Number(target.value), 7500)

                      if (bladeCount > 500) {
                        setClassListItem('darkmode2')
                      }
                      setBladeCount(bladeCount)
                    }}
                  />

                  <SettingItem name='wait' inputRef={e_wait} lskey='wait' />

                  <button
                    ref={e_button}
                    type={'submit'}
                    children={buttonStatus}
                  />
                </div>
              </footer>
              <div id='timersettings' style={{ zIndex: 1000 }}>
                <button
                  style={{ margin: '10px' }}
                  type={'button'}
                  onClick={() => {
                    D.openDialog()
                  }}
                >
                  Settings
                </button>
              </div>
            </main>
          </form>
          <D.Dialog ref={D.ref}>
            <form>
              <fieldset className='audio-rate-editor'>
                <legend>Base Audio Frequency</legend>
                <p>
                  Each row lasts 1 second. A row like <code>25.00 -&gt;
                  15.00</code> will slow the sound from 25.00 to 15.00 over
                  that second.
                </p>
                <p>Total time: {audioRateSegments.length} seconds.</p>

                <div className='audio-rate-segments'>
                  {audioRateSegments.map((segment, index) => (
                    <div className='audio-rate-segment' key={index}>
                      <span>Second {index + 1}</span>

                      <label>
                        <span>From</span>
                        <input
                          type='number'
                          step='0.01'
                          inputMode='decimal'
                          ref={element => {
                            refAudioRateStartInputs.current[index] = element
                          }}
                          value={segment.start}
                          onInput={event => {
                            updateAudioRateSegment(
                              index,
                              'start',
                              event.currentTarget.value
                            )
                          }}
                          onBlur={() => {
                            normalizeAudioRateSegment(index, 'start')
                          }}
                        />
                      </label>

                      <label>
                        <span>To</span>
                        <input
                          type='number'
                          step='0.01'
                          inputMode='decimal'
                          value={segment.end}
                          onInput={event => {
                            updateAudioRateSegment(
                              index,
                              'end',
                              event.currentTarget.value
                            )
                          }}
                          onBlur={() => {
                            normalizeAudioRateSegment(index, 'end')
                          }}
                        />
                      </label>

                      {audioRateSegments.length > 1 && (
                        <button
                          type='button'
                          onClick={() => {
                            removeAudioRateSegment(index)
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type='button'
                  onClick={() => {
                    addAudioRateSegment()
                  }}
                >
                  Add second
                </button>
              </fieldset>

              <RangeWithTicks
                legendText='Size of Fan'
                lskey='bladeScale'
                inputRef={e_bladeScale}
                onInput={({ currentTarget }) => {
                  setBodyStyleProp(
                    '--blade-scale',
                    String(Number(currentTarget.value) * 20)
                  )
                }}
              />

              <RangeWithTicks
                legendText='Line width'
                lskey='bladesLineWidth'
                inputRef={e_bladeLineWidth}
                onInput={({ currentTarget }) => {
                  setBodyStyleProp(
                    '--stroke-width',
                    String(Number(currentTarget.value) / 1000)
                  )
                }}
              />

              <RangeWithTicks
                legendText='Opacity'
                inputRef={e_opacity}
                lskey='opacity'
                onInput={({ currentTarget }) => {
                  setBodyStyleProp(
                    '--opacity',
                    String(Number(currentTarget.value) / 100)
                  )
                }}
              />

              <Select
                options={Object.keys(CurveTypes)}
                legendText='Change the blades'
                selected={curveType}
                lskey='curveType'
                onInput={e => {
                  const target = e.currentTarget as HTMLSelectElement
                  setCurveType(target.value as TCurveType)
                }}
              />

              <fieldset>
                <legend>More Mystery Settings</legend>
                <ModeItem name='dark_mode' lskey='darkmode' />
                <ModeItem name='other_dark_mode' lskey='darkmode2' />
                <ModeItem name='white_mode' lskey='whitemode' />
              </fieldset>
            </form>
          </D.Dialog>
        </>
      )}
    </Dialog>
  )
}

export default OuterWrap({ InnerCore })
