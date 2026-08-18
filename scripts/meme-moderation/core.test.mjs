import assert from 'node:assert/strict'
import test from 'node:test'

import {
  allMemeSources,
  buildMemeInventory,
  canonicalizeAudioPath,
  getPublishedMemeItems,
  publishedMemeSources,
} from '../../src/data/meme/inventory.ts'
import {getBlockedAudioPaths} from '../../src/data/meme/moderation.ts'
import {
  canStartRequestWithinBudget,
  calculateUsageCost,
  combineUsage,
  downloadAudio,
  isReusableDecision,
  hasCompletedPilot,
  parseModerationResponse,
  requestModeration,
  selectPilotSample,
  validateDecisionArguments,
  withRetries,
} from './core.mjs'

test('inventory loads all sources and deduplicates canonical audio paths', () => {
  const entryCount = allMemeSources.reduce(
    (sum, source) => sum + source.items.length,
    0
  )
  const inventory = buildMemeInventory()
  const canonicalPaths = allMemeSources.flatMap(source =>
    source.items.map(item => canonicalizeAudioPath(item.audio))
  )

  assert.ok(entryCount > 0)
  assert.equal(canonicalPaths.length, entryCount)
  assert.equal(inventory.length, new Set(canonicalPaths).size)
  assert.equal(
    new Set(inventory.map(item => item.audioPath)).size,
    inventory.length
  )
  assert.deepEqual(
    publishedMemeSources.map(source => source.name),
    ['reactions', 'memes2', 'music', 'pranks']
  )
})

test('canonical paths reject external and non-media URLs', () => {
  assert.equal(
    canonicalizeAudioPath('/media/sounds/example.mp3'),
    '/media/sounds/example.mp3'
  )
  assert.throws(() => canonicalizeAudioPath('https://example.com/audio.mp3'))
  assert.throws(() => canonicalizeAudioPath('/not-media/example.mp3'))
})

test('published items remain deduplicated and blocked duplicates are removed', () => {
  const sources = [
    {
      name: 'memes2',
      published: true,
      items: [
        {name: 'first', audio: '/media/sounds/shared.mp3'},
        {name: 'allowed', audio: '/media/sounds/allowed.mp3'},
        {name: 'uncertain', audio: '/media/sounds/uncertain.mp3'},
        {name: 'failed', audio: '/media/sounds/failed.mp3'},
        {name: 'unscanned', audio: '/media/sounds/unscanned.mp3'},
      ],
    },
    {
      name: 'music',
      published: true,
      items: [{name: 'duplicate', audio: '/media/sounds/shared.mp3'}],
    },
  ]
  const manifest = {
    decisions: {
      '/media/sounds/shared.mp3': {status: 'block'},
      '/media/sounds/allowed.mp3': {status: 'allow'},
      '/media/sounds/uncertain.mp3': {status: 'uncertain'},
      '/media/sounds/failed.mp3': {status: 'error'},
    },
  }

  const blocked = getBlockedAudioPaths(manifest)
  assert.deepEqual(getPublishedMemeItems(blocked, sources), [
    {name: 'allowed', audio: '/media/sounds/allowed.mp3'},
    {name: 'uncertain', audio: '/media/sounds/uncertain.mp3'},
    {name: 'failed', audio: '/media/sounds/failed.mp3'},
    {name: 'unscanned', audio: '/media/sounds/unscanned.mp3'},
  ])
})

test('pilot sample is deterministic, unique, and split 80/20', () => {
  const inventory = buildMemeInventory()
  const first = selectPilotSample(inventory)
  const second = selectPilotSample(inventory)

  assert.equal(first.length, 100)
  assert.equal(new Set(first.map(item => item.audioPath)).size, 100)
  assert.deepEqual(
    first.map(item => item.audioPath),
    second.map(item => item.audioPath)
  )
  assert.equal(
    first.filter(item => item.sampleGroup === 'representative').length,
    80
  )
  assert.equal(first.filter(item => item.sampleGroup === 'risk').length, 20)
  assert.deepEqual(
    new Set(first.filter(item => item.sampleGroup === 'representative').map(item => item.sources[0])),
    new Set(allMemeSources.map(source => source.name))
  )
})

test('model decisions use the fixed schema and fail closed at validation', () => {
  assert.deepEqual(
    validateDecisionArguments(
      JSON.stringify({
        status: 'block',
        reasonCodes: ['profanity_or_obscenity', 'profanity_or_obscenity'],
      })
    ),
    {status: 'block', reasonCodes: ['profanity_or_obscenity']}
  )
  assert.throws(() =>
    validateDecisionArguments(
      JSON.stringify({status: 'block', reasonCodes: [], transcript: 'unsafe'})
    )
  )
  assert.throws(() =>
    validateDecisionArguments(
      JSON.stringify({status: 'allow', reasonCodes: ['other_not_child_safe']})
    )
  )
})

test('usage pricing separates audio and text tokens', () => {
  const usage = calculateUsageCost({
    prompt_tokens: 700,
    completion_tokens: 20,
    prompt_tokens_details: {audio_tokens: 600},
    completion_tokens_details: {audio_tokens: 0},
  })

  assert.equal(usage.audioInputTokens, 600)
  assert.equal(usage.textInputTokens, 100)
  assert.equal(usage.textOutputTokens, 20)
  assert.equal(usage.costUsd, 0.01965)
  assert.equal(usage.conservativeEstimate, false)

  const conservative = calculateUsageCost({
    prompt_tokens: 600,
    completion_tokens: 10,
  })
  assert.equal(conservative.audioInputTokens, 600)
  assert.equal(conservative.textInputTokens, 0)
  assert.equal(conservative.conservativeEstimate, true)
  assert.throws(() => calculateUsageCost({}))
})

test('budget reserve prevents starting a request that would cross the ceiling', () => {
  assert.equal(canStartRequestWithinBudget(1.8, 2, 0.1), true)
  assert.equal(canStartRequestWithinBudget(1.91, 2, 0.1), false)
})

test('full scan is gated on a completed 100-clip pilot', () => {
  assert.equal(hasCompletedPilot({runs: []}), false)
  assert.equal(
    hasCompletedPilot({
      runs: [
        {
          mode: 'pilot',
          sampleSize: 100,
          selected: 100,
          budgetStopped: false,
          statusCounts: {
            allow: 80,
            block: 10,
            uncertain: 5,
            error: 5,
            missing: 0,
          },
        },
      ],
    }),
    true
  )
})

test('completed decisions resume while errors are retried', () => {
  assert.equal(isReusableDecision({status: 'allow'}), true)
  assert.equal(isReusableDecision({status: 'block'}), true)
  assert.equal(isReusableDecision({status: 'uncertain'}), true)
  assert.equal(isReusableDecision({status: 'error'}), false)
})

test('audio downloader enforces the approved host and MP3 content', async () => {
  const mp3 = Buffer.from([0x49, 0x44, 0x33, 0x04, 0x00, 0x00])
  const downloaded = await downloadAudio('/media/sounds/example.mp3', {
    fetchImpl: async () =>
      new Response(mp3, {
        status: 200,
        headers: {'content-type': 'audio/mpeg'},
      }),
  })
  assert.deepEqual(downloaded, mp3)

  await assert.rejects(
    downloadAudio('https://example.com/example.mp3', {
      fetchImpl: async () => new Response(mp3),
    }),
    error => error.code === 'unapproved_audio_url'
  )
  await assert.rejects(
    downloadAudio('/media/sounds/example.mp3', {
      fetchImpl: async () =>
        new Response('<html></html>', {
          headers: {'content-type': 'text/html'},
        }),
    }),
    error => error.code === 'invalid_audio_content'
  )
})

test('moderation response accepts only the forced validated function call', () => {
  const parsed = parseModerationResponse({
    choices: [
      {
        message: {
          tool_calls: [
            {
              function: {
                name: 'record_meme_moderation',
                arguments: JSON.stringify({status: 'allow', reasonCodes: []}),
              },
            },
          ],
        },
      },
    ],
    usage: {prompt_tokens: 100, completion_tokens: 10},
  })
  assert.equal(parsed.decision.status, 'allow')
  assert.throws(
    () =>
      parseModerationResponse({
        choices: [],
        usage: {prompt_tokens: 100, completion_tokens: 10},
      }),
    error => error.code === 'invalid_model_result' && error.usage.costUsd > 0
  )
})

test('moderation request sends actual audio and validates the function result', async () => {
  const audio = Buffer.from([0x49, 0x44, 0x33, 0x04])
  let requestBody
  const result = await requestModeration(
    {
      names: ['example'],
      audioPath: '/media/sounds/example.mp3',
    },
    audio,
    'test-api-key',
    {
      fetchImpl: async (_url, init) => {
        requestBody = JSON.parse(init.body)
        return Response.json({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    function: {
                      name: 'record_meme_moderation',
                      arguments: JSON.stringify({
                        status: 'allow',
                        reasonCodes: [],
                      }),
                    },
                  },
                ],
              },
            },
          ],
          usage: {prompt_tokens: 100, completion_tokens: 10},
        })
      },
    }
  )

  assert.equal(result.decision.status, 'allow')
  assert.equal(requestBody.messages[1].content[1].type, 'input_audio')
  assert.equal(
    requestBody.messages[1].content[1].input_audio.data,
    audio.toString('base64')
  )
  assert.equal(
    requestBody.tool_choice.function.name,
    'record_meme_moderation'
  )
})

test('usage from failed paid attempts is retained across retries', async () => {
  let calls = 0
  let billedUsage = combineUsage()
  const result = await withRetries(
    async () => {
      calls += 1
      if (calls === 1) {
        const error = new Error('malformed')
        error.retryable = true
        error.usage = calculateUsageCost({
          prompt_tokens: 100,
          completion_tokens: 10,
        })
        throw error
      }
      return 'ok'
    },
    {
      onFailure: async error => {
        billedUsage = combineUsage(billedUsage, error.usage)
      },
      sleep: async () => {},
    }
  )

  assert.equal(result.retryCount, 1)
  assert.ok(billedUsage.costUsd > 0)
})

test('retry helper retries transient failures and stops on permanent ones', async () => {
  let transientCalls = 0
  const transient = await withRetries(
    async () => {
      transientCalls += 1
      if (transientCalls < 3) throw {retryable: true}
      return 'ok'
    },
    {sleep: async () => {}}
  )
  assert.deepEqual(transient, {value: 'ok', retryCount: 2})

  let permanentCalls = 0
  await assert.rejects(
    withRetries(
      async () => {
        permanentCalls += 1
        throw {retryable: false}
      },
      {sleep: async () => {}}
    )
  )
  assert.equal(permanentCalls, 1)
})
