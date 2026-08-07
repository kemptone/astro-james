import {
  downloadAllowedMemeAudio,
  normalizeAllowedMemeAudioUrl,
  readBytesWithLimit,
} from '@/data/meme/audio-download'
import {getAudioAccessFailure} from '@/server/talkers2-audio-access'

const MAX_REQUEST_BYTES = 4 * 1024
const MAX_CONCURRENT_DOWNLOADS = 6
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_REQUESTS = 60
const MAX_RATE_LIMIT_CLIENTS = 5_000

const requestWindows = new Map<string, {count: number; startedAt: number}>()
let activeDownloads = 0
let lastRateLimitCleanup = 0

function textResponse(message: string, status: number) {
  return new Response(message, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

function getRequestClient(request: Request, clientAddress?: string) {
  if (clientAddress) return clientAddress
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
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

  const current = requestWindows.get(client)
  if (!current || now - current.startedAt >= RATE_LIMIT_WINDOW_MS) {
    if (requestWindows.size >= MAX_RATE_LIMIT_CLIENTS) return true
    requestWindows.set(client, {count: 1, startedAt: now})
    return false
  }

  current.count += 1
  return current.count > RATE_LIMIT_REQUESTS
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
    return textResponse(accessFailure.error, accessFailure.status)
  }

  const requestOrigin = request.headers.get('origin')
  const expectedOrigin = new URL(request.url).origin
  if (
    (requestOrigin && requestOrigin !== expectedOrigin) ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  ) {
    return textResponse('Cross-site requests are not allowed', 403)
  }

  const contentType = request.headers
    .get('content-type')
    ?.split(';')[0]
    .trim()
    .toLowerCase()
  if (contentType !== 'application/json') {
    return textResponse('Content-Type must be application/json', 415)
  }

  const contentLength = Number(request.headers.get('content-length'))
  if (contentLength && contentLength > MAX_REQUEST_BYTES) {
    return textResponse('Request is too large', 413)
  }

  let body: unknown
  try {
    const bytes = await readBytesWithLimit(request.body, MAX_REQUEST_BYTES)
    body = JSON.parse(new TextDecoder().decode(bytes)) as unknown
  } catch (error) {
    return textResponse(
      error instanceof RangeError ? 'Request is too large' : 'Invalid JSON',
      error instanceof RangeError ? 413 : 400
    )
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return textResponse('Invalid request', 400)
  }

  const bodyRecord = body as Record<string, unknown>
  if (
    Object.keys(bodyRecord).length !== 2 ||
    typeof bodyRecord.audio !== 'string' ||
    typeof bodyRecord.audioFingerprint !== 'string' ||
    !/^sha256-[a-f0-9]{64}$/.test(bodyRecord.audioFingerprint)
  ) {
    return textResponse('Invalid request', 400)
  }

  const audioUrl = normalizeAllowedMemeAudioUrl(bodyRecord.audio)
  if (!audioUrl) return textResponse('Unknown sound', 400)

  if (isRateLimited(getRequestClient(request, clientAddress))) {
    return textResponse('Too many sound requests. Try again in a minute.', 429)
  }
  if (activeDownloads >= MAX_CONCURRENT_DOWNLOADS) {
    return textResponse('Too many sound requests are running', 429)
  }

  activeDownloads += 1
  try {
    const downloadedAudio = await downloadAllowedMemeAudio(audioUrl)
    if (downloadedAudio.fingerprint !== bodyRecord.audioFingerprint) {
      return textResponse('The sound changed and must be checked again', 409)
    }

    return new Response(downloadedAudio.bytes, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Disposition': 'inline',
        'Content-Type': downloadedAudio.contentType,
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Could not load checked meme audio', error)
    return textResponse('Could not load this sound', 502)
  } finally {
    activeDownloads -= 1
  }
}
