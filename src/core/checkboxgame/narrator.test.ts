import assert from 'node:assert/strict'
import test, {type TestContext} from 'node:test'

import {CheckboxNarrator} from './narrator.ts'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return {promise, resolve, reject}
}

function audioResponse() {
  return new Response('speech', {headers: {'Content-Type': 'audio/mpeg'}})
}

async function flush() {
  for (let index = 0; index < 8; index++) await Promise.resolve()
}

function setup(t: TestContext) {
  const originalAudio = Object.getOwnPropertyDescriptor(globalThis, 'Audio')
  const audio: FakeAudio[] = []
  const created: string[] = []
  const revoked: string[] = []
  let play: (instance: FakeAudio) => Promise<void> = () => Promise.resolve()

  class FakeAudio {
    src: string
    paused = false
    sourceRemoved = false
    loads = 0
    onended: (() => void) | null = null
    onerror: (() => void) | null = null

    constructor(src: string) {
      this.src = src
      audio.push(this)
    }

    play() { return play(this) }
    pause() { this.paused = true }
    removeAttribute(name: string) {
      assert.equal(name, 'src')
      this.sourceRemoved = true
      this.src = ''
    }
    load() { this.loads++ }
  }

  Object.defineProperty(globalThis, 'Audio', {configurable: true, value: FakeAudio})
  t.mock.method(URL, 'createObjectURL', () => {
    const url = `blob:joey-${created.length + 1}`
    created.push(url)
    return url
  })
  t.mock.method(URL, 'revokeObjectURL', (url: string) => { revoked.push(url) })

  const narrator = new CheckboxNarrator()
  t.after(() => {
    narrator.stop()
    if (originalAudio) Object.defineProperty(globalThis, 'Audio', originalAudio)
    else Reflect.deleteProperty(globalThis, 'Audio')
  })

  return {
    narrator, audio, created, revoked,
    setPlay(implementation: typeof play) { play = implementation },
  }
}

test('narration uses Talkers1 Joey and releases audio when it finishes', async t => {
  const {narrator, audio, created, revoked} = setup(t)
  const request = t.mock.method(globalThis, 'fetch', async () => audioResponse())
  const messages: string[] = []

  await narrator.speak('  State two, all on.  ', message => messages.push(message))

  const [url, options] = request.mock.calls[0].arguments as [string, RequestInit]
  assert.equal(url, '/api/polly/say')
  assert.equal(options.method, 'POST')
  assert.deepEqual(options.headers, {'Content-Type': 'application/json'})
  assert.deepEqual(JSON.parse(options.body as string), {
    text: 'State two, all on.', voiceId: 'Joey', engine: 'standard',
  })
  assert.ok(options.signal instanceof AbortSignal)
  assert.deepEqual(messages, ['Loading Joey…', 'Joey is speaking…'])
  assert.equal(audio[0].src, created[0])

  audio[0].onended?.()
  assert.deepEqual(revoked, created)
  assert.equal(audio[0].paused, true)
  assert.equal(audio[0].sourceRemoved, true)
  assert.equal(audio[0].loads, 1)
  assert.equal(messages.at(-1), 'Joey finished speaking.')
  narrator.stop()
  assert.equal(revoked.length, 1)
})

test('a newer narration wins even when an aborted fetch completes later', async t => {
  const {narrator, audio} = setup(t)
  const responses = [deferred<Response>(), deferred<Response>()]
  const signals: AbortSignal[] = []
  t.mock.method(globalThis, 'fetch', (_url: unknown, options: RequestInit) => {
    signals.push(options.signal as AbortSignal)
    return responses[signals.length - 1].promise
  })
  const oldMessages: string[] = []
  const newMessages: string[] = []
  const old = narrator.speak('Old state', message => oldMessages.push(message))
  const current = narrator.speak('Current state', message => newMessages.push(message))
  assert.equal(signals[0].aborted, true)

  responses[1].resolve(audioResponse())
  await current
  responses[0].resolve(audioResponse())
  await old

  assert.equal(audio.length, 1)
  assert.deepEqual(oldMessages, ['Loading Joey…'])
  assert.deepEqual(newMessages, ['Loading Joey…', 'Joey is speaking…'])
  assert.equal(audio[0].paused, false)
})

test('a stale response body cannot create or play audio', async t => {
  const {narrator, audio, created} = setup(t)
  const body = deferred<Blob>()
  let calls = 0
  let bodyRead = false
  t.mock.method(globalThis, 'fetch', async () => {
    if (++calls > 1) return audioResponse()
    return {
      ok: true,
      headers: new Headers({'Content-Type': 'audio/mpeg'}),
      blob() { bodyRead = true; return body.promise },
    } as Response
  })
  const oldMessages: string[] = []
  const old = narrator.speak('Old state', message => oldMessages.push(message))
  await flush()
  assert.equal(bodyRead, true)
  await narrator.speak('Current state', () => {})
  body.resolve(new Blob(['old speech'], {type: 'audio/mpeg'}))
  await old

  assert.equal(audio.length, 1)
  assert.equal(created.length, 1)
  assert.deepEqual(oldMessages, ['Loading Joey…'])
})

test('a stale play completion or callback cannot change the newer narration', async t => {
  const {narrator, audio, revoked, setPlay} = setup(t)
  const playback = deferred<void>()
  setPlay(instance => instance === audio[0] ? playback.promise : Promise.resolve())
  t.mock.method(globalThis, 'fetch', async () => audioResponse())
  const oldMessages: string[] = []
  const newMessages: string[] = []
  const old = narrator.speak('Old state', message => oldMessages.push(message))
  await flush()
  assert.equal(audio.length, 1)
  const oldEnded = audio[0].onended
  const oldError = audio[0].onerror

  await narrator.speak('Current state', message => newMessages.push(message))
  playback.resolve()
  await old
  oldEnded?.()
  oldError?.()

  assert.equal(audio.length, 2)
  assert.equal(audio[0].paused, true)
  assert.equal(audio[0].sourceRemoved, true)
  assert.equal(audio[1].paused, false)
  assert.deepEqual(revoked, ['blob:joey-1'])
  assert.deepEqual(oldMessages, ['Loading Joey…'])
  assert.deepEqual(newMessages, ['Loading Joey…', 'Joey is speaking…'])
})

test('stopping or entering blank narration aborts loading and cancels its timeout', async t => {
  t.mock.timers.enable({apis: ['setTimeout']})
  const {narrator, audio} = setup(t)
  const pending = [deferred<Response>(), deferred<Response>()]
  const signals: AbortSignal[] = []
  t.mock.method(globalThis, 'fetch', (_url: unknown, options: RequestInit) => {
    signals.push(options.signal as AbortSignal)
    return pending[signals.length - 1].promise
  })
  const messages: string[] = []
  const first = narrator.speak('First state', message => messages.push(message))
  narrator.stop()
  assert.equal(signals[0].aborted, true)
  pending[0].resolve(audioResponse())
  await first

  const second = narrator.speak('Second state', message => messages.push(message))
  await narrator.speak(' \n\t ', message => messages.push(message))
  assert.equal(signals[1].aborted, true)
  pending[1].resolve(audioResponse())
  await second
  t.mock.timers.tick(30_000)

  assert.equal(signals.length, 2)
  assert.equal(audio.length, 0)
  assert.deepEqual(messages, ['Loading Joey…', 'Loading Joey…'])
})

test('blank narration stops active audio and revokes its URL exactly once', async t => {
  const {narrator, audio, created, revoked} = setup(t)
  const request = t.mock.method(globalThis, 'fetch', async () => audioResponse())
  await narrator.speak('State one', () => {})
  await narrator.speak('', () => assert.fail('Blank text must not report speech status'))
  narrator.stop()

  assert.equal(request.mock.callCount(), 1)
  assert.equal(audio[0].paused, true)
  assert.equal(audio[0].sourceRemoved, true)
  assert.equal(audio[0].onended, null)
  assert.equal(audio[0].onerror, null)
  assert.deepEqual(revoked, created)
})

test('failed requests and invalid audio produce Joey errors without playing error data', async t => {
  const cases = [
    {name: 'HTTP failure', response: () => new Response('Unavailable', {status: 503}), message: /Joey.*503/},
    {name: 'JSON response', response: () => Response.json({error: 'Unavailable'}), message: /Joey.*no playable audio/},
    {name: 'empty audio', response: () => new Response('', {headers: {'Content-Type': 'audio/mpeg'}}), message: /Joey.*no playable audio/},
    {name: 'network error', response: () => { throw new TypeError('Network failed') }, message: /Joey.*load the narration/},
  ]

  for (const example of cases) {
    await t.test(example.name, async subtest => {
      const {narrator, audio, created} = setup(subtest)
      subtest.mock.method(globalThis, 'fetch', async () => example.response())
      const messages: string[] = []
      await narrator.speak('State one', message => messages.push(message))
      assert.match(messages.at(-1)!, example.message)
      assert.equal(audio.length, 0)
      assert.equal(created.length, 0)
      assert.equal(messages.length, 2)
    })
  }
})

test('a rejected play promise produces a recoverable Joey error and releases audio', async t => {
  const {narrator, audio, created, revoked, setPlay} = setup(t)
  setPlay(async () => { throw new DOMException('Playback not allowed', 'NotAllowedError') })
  t.mock.method(globalThis, 'fetch', async () => audioResponse())
  const messages: string[] = []
  await narrator.speak('State one', message => messages.push(message))

  assert.match(messages.at(-1)!, /Joey.*play the narration.*try again/)
  assert.equal(audio[0].paused, true)
  assert.equal(audio[0].sourceRemoved, true)
  assert.deepEqual(revoked, created)
})

test('a playback error releases audio and suppresses a late play rejection', async t => {
  const {narrator, audio, created, revoked, setPlay} = setup(t)
  const playback = deferred<void>()
  setPlay(() => playback.promise)
  t.mock.method(globalThis, 'fetch', async () => audioResponse())
  const messages: string[] = []
  const speech = narrator.speak('State one', message => messages.push(message))
  await flush()
  audio[0].onerror?.()
  playback.reject(new Error('Decode failed'))
  await speech

  assert.equal(messages.length, 2)
  assert.match(messages.at(-1)!, /Joey.*play the narration/)
  assert.equal(audio[0].paused, true)
  assert.deepEqual(revoked, created)
})

test('loading times out after 30 seconds and ignores a late response', async t => {
  t.mock.timers.enable({apis: ['setTimeout']})
  const {narrator, audio} = setup(t)
  const pending = deferred<Response>()
  let signal: AbortSignal | undefined
  t.mock.method(globalThis, 'fetch', (_url: unknown, options: RequestInit) => {
    signal = options.signal as AbortSignal
    return pending.promise
  })
  const messages: string[] = []
  const speech = narrator.speak('State one', message => messages.push(message))
  t.mock.timers.tick(29_999)
  assert.deepEqual(messages, ['Loading Joey…'])
  t.mock.timers.tick(1)
  assert.equal(signal?.aborted, true)
  assert.match(messages.at(-1)!, /Joey took too long/)

  pending.resolve(audioResponse())
  await speech
  assert.equal(audio.length, 0)
  assert.equal(messages.length, 2)
})
