import {useEffect, useRef, useState} from 'preact/hooks'
import {
  defaults,
  readSettings,
  saveSettings,
  SETTINGS_EVENT,
  type TourSettings,
  type Provider,
} from '../core/sro25/settings'
import {loadVoices, TourSpeech, type TourVoice} from '../core/sro25/speech'
import './sro25-tour.css'

const introduction =
  'Welcome to the SRO25 Discovery Tour. Explore how numbers change the controls. The gas valve is disabled during this tour. You can still move the plug and create your own labeled ranges.'
const questions = [
  {
    text: 'Which plug value means unplugged?',
    answers: ['100', '5', '0'],
    correct: '100',
    explanation: '100 means unplugged. 5 is normal, and 0 is super tight.',
  },
  {
    text: 'Can two labeled ranges show at the same time?',
    answers: ['Yes', 'No'],
    correct: 'Yes',
    explanation:
      'Yes! When ranges overlap, the slider shows every matching label.',
  },
  {
    text: 'What do From and To set for each label?',
    answers: ['The start and end of its range', 'The voice volume'],
    correct: 'The start and end of its range',
    explanation:
      'From and To set the first and last numbers where a label appears, including both ends.',
  },
]

export default function Sro25Tour() {
  const [settings, setSettings] = useState<TourSettings>(defaults)
  const [voices, setVoices] = useState<TourVoice[]>([])
  const [loading, setLoading] = useState(false)
  const [reload, setReload] = useState(0)
  const [status, setStatus] = useState('Ready')
  const [transcript, setTranscript] = useState(introduction)
  const [started, setStarted] = useState(false)
  const [question, setQuestion] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const speech = useRef<TourSpeech | null>(null)

  useEffect(() => {
    speech.current = new TourSpeech()
    const sync = () => {
      speech.current?.stop()
      setSettings(readSettings())
      setStatus('Ready')
    }
    const stop = () => speech.current?.stop()
    sync()
    window.addEventListener(SETTINGS_EVENT, sync)
    window.addEventListener('storage', sync)
    window.addEventListener('pagehide', stop)
    return () => {
      stop()
      window.removeEventListener(SETTINGS_EVENT, sync)
      window.removeEventListener('storage', sync)
      window.removeEventListener('pagehide', stop)
    }
  }, [])

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 15000)
    setVoices([])
    setLoading(true)
    const load = async () => {
      try {
        const available = await loadVoices(settings.provider, controller.signal)
        if (!active) return
        setVoices(available)
        setStatus(
          settings.provider === 'wrapper'
            ? 'Wrapper Offline is not connected. Audrey needs a working voice source.'
            : available.length
              ? 'Ready'
              : 'No voices available. Reload voices or choose another talker.',
        )
      } catch {
        if (active)
          setStatus('Could not load voices. Reload voices or choose Native.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    const synthesis =
      settings.provider === 'native' ? window.speechSynthesis : undefined
    synthesis?.addEventListener('voiceschanged', load)
    return () => {
      active = false
      clearTimeout(timeout)
      controller.abort()
      synthesis?.removeEventListener('voiceschanged', load)
    }
  }, [settings.provider, reload])

  useEffect(() => {
    const valve = document.getElementById('gasValveSection')
    if (valve) {
      valve.hidden = settings.enabled
      valve.querySelectorAll('input').forEach(input => {
        input.disabled = settings.enabled
      })
    }
    const subtitle = document.getElementById('sro25Subtitle')
    if (subtitle)
      subtitle.textContent = settings.enabled
        ? 'Discovery Tour — explore the plug and your custom ranges'
        : 'Control the gas valve, plug, and custom slider'
    if (!settings.enabled) {
      speech.current?.stop()
      setStarted(false)
      setQuestion(null)
    }
  }, [settings.enabled])

  const selected = settings.voice
    ? voices.find(voice => voice.id === settings.voice)
    : voices[0]
  const update = (patch: Partial<TourSettings>) => {
    speech.current?.stop()
    try {
      saveSettings({...settings, ...patch})
    } catch {
      setStatus(
        'Could not save your settings. Allow site storage and try again.',
      )
    }
  }
  const narrate = (text: string) => {
    setTranscript(text)
    if (settings.behavior !== 'quiet')
      void speech.current?.speak(text, settings, selected, setStatus)
  }

  useEffect(() => {
    if (!settings.enabled || !started) return
    // Speak after a committed change, not on every slider movement.
    const describe = (event: Event) => {
      const target = event.target as HTMLInputElement
      if (target.id === 'plugState' || target.id === 'plugSlider') {
        narrate(
          `The plug is at ${document.getElementById('plugDisplay')?.textContent}. ${settings.behavior === 'questions' ? 'Can you move it to 100 to unplug it?' : ''}`,
        )
      } else if (target.id === 'customSlider') {
        const labels = document
          .getElementById('bulletsDisplay')
          ?.textContent?.trim()
        narrate(
          `The slider is at ${target.value}. ${labels ? `Matching labels: ${labels}.` : 'No labels match this value.'} ${settings.behavior === 'questions' ? 'What happens when two ranges overlap?' : ''}`,
        )
      }
    }
    document.addEventListener('change', describe)
    return () => document.removeEventListener('change', describe)
  }, [settings, voices, started])

  return (
    <section className="sro25-tour" aria-label="Discovery Tour and debug">
      {settings.enabled ? (
        <>
          <h2>Discovery Tour</h2>
          <p className="tour-caption" aria-live="polite">
            {transcript}
          </p>
          <div className="tour-actions">
            <button
              type="button"
              onClick={() => {
                setStarted(true)
                narrate(introduction)
              }}
            >
              {started ? 'Replay introduction' : 'Start tour'}
            </button>
            {settings.behavior === 'questions' && (
              <button
                type="button"
                onClick={() => {
                  const next =
                    question === null ? 0 : (question + 1) % questions.length
                  setStarted(true)
                  setQuestion(next)
                  setFeedback('')
                  narrate(questions[next].text)
                }}
              >
                {question === null ? 'Ask me a question' : 'Next question'}
              </button>
            )}
          </div>
          {question !== null && settings.behavior === 'questions' && (
            <fieldset>
              <legend>{questions[question].text}</legend>
              <div className="tour-actions">
                {questions[question].answers.map(answer => (
                  <button
                    type="button"
                    key={answer}
                    onClick={() => {
                      const text = `${answer === questions[question].correct ? 'That’s right!' : 'Try again.'} ${questions[question].explanation}`
                      setFeedback(text)
                      narrate(text)
                    }}
                  >
                    {answer}
                  </button>
                ))}
              </div>
              <p aria-live="polite">{feedback}</p>
            </fieldset>
          )}
        </>
      ) : (
        <p>
          Turn on <a href="/settings">Discovery Tour in Settings</a> to explore
          with a talking guide.
        </p>
      )}
      <details>
        <summary>Debug — talkers and behavior</summary>
        <div className="tour-fields">
          <label>
            Talker
            <select
              value={settings.provider}
              onChange={event =>
                update({
                  provider: event.currentTarget.value as Provider,
                  voice: '',
                })
              }
            >
              <option value="native">Native</option>
              <option value="chatgpt">ChatGPT</option>
              <option value="amazon">Amazon</option>
              <option value="microsoft">Microsoft</option>
              <option value="wrapper">Wrapper Offline</option>
            </select>
          </label>
          <label>
            Voice
            <select
              value={selected?.id || ''}
              disabled={loading || !voices.length}
              onChange={event => update({voice: event.currentTarget.value})}
            >
              {!selected && (
                <option value="">
                  {loading ? 'Loading voices…' : 'Choose a voice'}
                </option>
              )}
              {voices.map(voice => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Behavior
            <select
              value={settings.behavior}
              onChange={event =>
                update({
                  behavior: event.currentTarget
                    .value as TourSettings['behavior'],
                })
              }
            >
              <option value="questions">Explain and ask questions</option>
              <option value="explain">Explain only</option>
              <option value="quiet">Text only</option>
            </select>
          </label>
          <label>
            Speaking speed: {settings.rate.toFixed(1)}×
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.rate}
              onChange={event =>
                update({rate: Number(event.currentTarget.value)})
              }
            />
          </label>
        </div>
        {settings.provider === 'wrapper' && (
          <p>
            Legacy choices shown: Audrey, Brian, Emma, Nicole, and Joey. A
            Wrapper Offline voice service has not been connected, so these
            cannot be previewed yet. Readloud and Streamlabs are not connected.
            Try Amazon for available Brian, Emma, Nicole, or Joey voices.
          </p>
        )}
        {settings.voice && !selected && !loading && (
          <p>
            The saved voice is no longer in this list. Please select another
            voice.
          </p>
        )}
        <div className="tour-actions">
          <button
            type="button"
            disabled={loading || !selected || selected.unavailable}
            onClick={() =>
              void speech.current?.speak(
                'Hello! I am your SRO25 guide. Let’s explore the plug and labeled ranges together.',
                settings,
                selected,
                setStatus,
              )
            }
          >
            Preview voice
          </button>
          <button
            type="button"
            onClick={() => {
              speech.current?.stop()
              setReload(value => value + 1)
            }}
          >
            Reload voices
          </button>
        </div>
        <p>
          Speech is computer-generated. Voice availability depends on your
          device or the connected service.
        </p>
      </details>
      <div className="tour-actions">
        <button
          type="button"
          onClick={() => {
            speech.current?.stop()
            setStatus('Stopped')
            setStarted(false)
          }}
        >
          Stop speech
        </button>
        <span role="status">{loading ? 'Loading voices…' : status}</span>
      </div>
    </section>
  )
}
