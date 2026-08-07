import {
  downloadAllowedMemeAudio,
  normalizeAllowedMemeAudioUrl,
  readBytesWithLimit,
} from '@/data/meme/audio-download'
import {
  AUDIO_CHECK_PIPELINE_VERSION,
} from '@/data/meme/bad-word-ranking'
import {getAudioAccessFailure} from '@/server/talkers2-audio-access'
import {
  analyzeDownloadedMemeAudio,
  type AudioAnalysis,
} from '@/server/talkers2-audio-analysis'
import {getManifestAudioCheck} from '@/server/talkers2-audio-manifest'

const AZURE_SPEECH_KEY = import.meta.env.AZURE_SPEECH_KEY
const AZURE_SPEECH_REGION = import.meta.env.AZURE_SPEECH_REGION
const MAX_REQUEST_BYTES = 2 * 1024
const MAX_CONCURRENT_ANALYSES = 2
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_REQUESTS = 12
const MAX_RATE_LIMIT_CLIENTS = 5_000
const MAX_COMPLETED_ANALYSES = 5_000

const completedAnalyses = new Map<string, AudioAnalysis>()
const pendingAnalyses = new Map<string, Promise<AudioAnalysis>>()
const requestWindows = new Map<string, {count: number; startedAt: number}>()
let activeAnalyses = 0
let lastRateLimitCleanup = 0

class TooManyRequestsError extends Error {}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json',
    },
  })
}

function getRequestClient(request: Request, clientAddress?: string) {
  if (clientAddress) return clientAddress

  const forwardedAddress = request.headers
    .get('x-forwarded-for')
    ?.split(',')[0]
    ?.trim()

  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    forwardedAddress ||
    'unknown'
  )
}

function isRateLimited(client: string) {
  const now = Date.now()

  if (now - lastRateLimitCleanup >= RATE_LIMIT_WINDOW_MS) {
    lastRateLimitCleanup = now
    requestWindows.forEach((window, key) => {
      if (now - window.startedAt >= RATE_LIMIT_WINDOW_MS) {
        requestWindows.delete(key)
      }
    })
  }

  let current = requestWindows.get(client)

  if (!current || now - current.startedAt >= RATE_LIMIT_WINDOW_MS) {
    if (requestWindows.size >= MAX_RATE_LIMIT_CLIENTS) return true
    requestWindows.set(client, {count: 1, startedAt: now})
    current = requestWindows.get(client)
  } else {
    current.count += 1
    if (current.count > RATE_LIMIT_REQUESTS) return true
  }

  return false
}

async function analyzeAudio(audioUrl: string): Promise<AudioAnalysis> {
  const pending = pendingAnalyses.get(audioUrl)
  if (pending) return pending

  if (activeAnalyses >= MAX_CONCURRENT_ANALYSES) {
    throw new TooManyRequestsError('Too many audio checks are running')
  }

  activeAnalyses += 1

  const analysis = (async () => {
    try {
      const downloadedAudio = await downloadAllowedMemeAudio(audioUrl)
      const cacheKey = `${AUDIO_CHECK_PIPELINE_VERSION}:${downloadedAudio.fingerprint}`
      const cached = completedAnalyses.get(cacheKey)
      if (cached) return cached

      const manifestCheck = getManifestAudioCheck(audioUrl)
      if (
        manifestCheck?.audioFingerprint === downloadedAudio.fingerprint
      ) {
        completedAnalyses.set(cacheKey, manifestCheck)
        return manifestCheck
      }

      const result = await analyzeDownloadedMemeAudio(
        audioUrl,
        downloadedAudio,
        {
          speechKey: AZURE_SPEECH_KEY,
          speechRegion: AZURE_SPEECH_REGION,
        }
      )

      completedAnalyses.set(cacheKey, result)
      if (completedAnalyses.size > MAX_COMPLETED_ANALYSES) {
        const oldestKey = completedAnalyses.keys().next().value
        if (oldestKey) completedAnalyses.delete(oldestKey)
      }
      return result
    } finally {
      activeAnalyses -= 1
    }
  })()

  pendingAnalyses.set(audioUrl, analysis)

  try {
    return await analysis
  } finally {
    pendingAnalyses.delete(audioUrl)
  }
}

export const prerender = false

export const POST = async ({
  request,
  clientAddress,
}: {
  request: Request
  clientAddress?: string
}) => {
  const accessFailure = getAudioAccessFailure(request)
  if (accessFailure) {
    return json({error: accessFailure.error}, accessFailure.status)
  }

  if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION) {
    return json({error: 'Audio checking is not configured'}, 503)
  }

  const requestOrigin = request.headers.get('origin')
  const expectedOrigin = new URL(request.url).origin
  if (
    (requestOrigin && requestOrigin !== expectedOrigin) ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  ) {
    return json({error: 'Cross-site requests are not allowed'}, 403)
  }

  const contentType = request.headers
    .get('content-type')
    ?.split(';')[0]
    .trim()
    .toLowerCase()
  if (contentType !== 'application/json') {
    return json({error: 'Content-Type must be application/json'}, 415)
  }

  const contentLength = Number(request.headers.get('content-length'))
  if (contentLength && contentLength > MAX_REQUEST_BYTES) {
    return json({error: 'Request is too large'}, 413)
  }

  let body: unknown
  try {
    const requestBytes = await readBytesWithLimit(
      request.body,
      MAX_REQUEST_BYTES
    )
    body = JSON.parse(new TextDecoder().decode(requestBytes)) as unknown
  } catch (error) {
    if (error instanceof RangeError) {
      return json({error: 'Request is too large'}, 413)
    }
    return json({error: 'Invalid JSON'}, 400)
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({error: 'Invalid request'}, 400)
  }

  const bodyRecord = body as Record<string, unknown>
  if (
    Object.keys(bodyRecord).length !== 1 ||
    typeof bodyRecord.audio !== 'string' ||
    bodyRecord.audio.length > 2_000
  ) {
    return json({error: 'Invalid request'}, 400)
  }

  const audioUrl = normalizeAllowedMemeAudioUrl(bodyRecord.audio)
  if (!audioUrl) {
    return json({error: 'Unknown sound'}, 400)
  }

  if (isRateLimited(getRequestClient(request, clientAddress))) {
    return json({error: 'Too many audio checks. Try again in a minute.'}, 429)
  }

  try {
    return json(await analyzeAudio(audioUrl))
  } catch (error) {
    if (error instanceof TooManyRequestsError) {
      return json({error: 'Too many audio checks are running'}, 429)
    }
    console.error('Could not analyze meme audio', error)
    return json({error: 'Could not check this audio'}, 502)
  }
}
