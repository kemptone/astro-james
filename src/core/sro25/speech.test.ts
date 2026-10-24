import assert from 'node:assert/strict'
import test from 'node:test'
import {loadVoices, TourSpeech} from './speech.ts'
import {defaults} from './settings.ts'

function mockWindow(t: any) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      speechSynthesis: {cancel() {}},
      setTimeout,
      clearTimeout,
    },
  })
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'window', original)
    else Reflect.deleteProperty(globalThis, 'window')
  })
}

test('stopping a pending preview prevents late audio and status updates', async t => {
  mockWindow(t)
  let resolveResponse!: (response: Response) => void
  let requestSignal: AbortSignal | undefined
  t.mock.method(globalThis, 'fetch', (_url: string, options: RequestInit) => {
    requestSignal = options.signal as AbortSignal
    // Simulate a service that finishes even after cancellation.
    return new Promise<Response>(resolve => {
      resolveResponse = resolve
    })
  })
  const statuses: string[] = []
  const speech = new TourSpeech()
  const preview = speech.speak(
    'Preview',
    {...defaults, provider: 'chatgpt'},
    {id: 'alloy', name: 'alloy'},
    message => statuses.push(message),
  )
  speech.stop()
  assert.equal(requestSignal?.aborted, true)
  resolveResponse(
    new Response('audio', {headers: {'Content-Type': 'audio/mpeg'}}),
  )
  await preview
  assert.deepEqual(statuses, ['Loading speech…'])
})

test('provider failures produce a recoverable message instead of playing error data', async t => {
  mockWindow(t)
  t.mock.method(
    globalThis,
    'fetch',
    async () => new Response('Unavailable', {status: 503}),
  )
  const statuses: string[] = []
  await new TourSpeech().speak(
    'Preview',
    {...defaults, provider: 'amazon'},
    {id: 'Nicole', name: 'Nicole'},
    message => statuses.push(message),
  )
  assert.match(statuses.at(-1)!, /failed.*Native/)
})

test('Amazon voice choices preserve supported engines and reject malformed catalogs', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () =>
    Response.json({
      Voices: [
        {
          Id: 'Nicole',
          Name: 'Nicole',
          LanguageCode: 'en-AU',
          SupportedEngines: ['standard'],
        },
        {
          Id: 'Amy',
          Name: 'Amy',
          LanguageCode: 'en-GB',
          SupportedEngines: ['neural'],
        },
      ],
    }),
  )
  const voices = await loadVoices('amazon')
  assert.equal(voices[0].engine, 'standard')
  assert.equal(voices[1].engine, 'neural')
  fetch.mock.mockImplementation(async () =>
    Response.json({error: 'credentials missing'}),
  )
  await assert.rejects(loadVoices('amazon'), /unavailable/)
})
