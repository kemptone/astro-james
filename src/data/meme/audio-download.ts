import {allowedMemeAudioUrls} from './all-sounds'

export const MAX_MEME_AUDIO_BYTES = 25 * 1024 * 1024

export class MemeAudioDownloadError extends Error {
  status: number
  retryAfterMs: number | null

  constructor(status: number, retryAfterMs: number | null) {
    super(`Sound download failed with ${status}`)
    this.name = 'MemeAudioDownloadError'
    this.status = status
    this.retryAfterMs = retryAfterMs
  }
}

function retryAfterMilliseconds(value: string | null) {
  if (!value) return null

  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000

  const date = Date.parse(value)
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : null
}

export function normalizeAllowedMemeAudioUrl(value: unknown) {
  if (typeof value !== 'string') return null

  try {
    const audioUrl = new URL(value)
    return allowedMemeAudioUrls.has(audioUrl.href) ? audioUrl.href : null
  } catch {
    return null
  }
}

export async function readBytesWithLimit(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number
) {
  if (!body) return new Uint8Array()

  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    while (true) {
      const {done, value} = await reader.read()
      if (done) break

      totalBytes += value.byteLength
      if (totalBytes > maxBytes) {
        await reader.cancel('Response exceeded its size limit')
        throw new RangeError('Body is too large')
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const bytes = new Uint8Array(totalBytes)
  let offset = 0
  chunks.forEach(chunk => {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  })
  return bytes
}

export async function getAudioFingerprint(bytes: Uint8Array) {
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', Uint8Array.from(bytes))
  )
  const hex = Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join(
    ''
  )
  return `sha256-${hex}`
}

export async function downloadAllowedMemeAudio(audioUrl: string) {
  if (!allowedMemeAudioUrls.has(audioUrl)) {
    throw new Error('Unknown sound')
  }

  const response = await fetch(audioUrl, {
    redirect: 'error',
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    throw new MemeAudioDownloadError(
      response.status,
      retryAfterMilliseconds(response.headers.get('retry-after'))
    )
  }

  const contentType = response.headers
    .get('content-type')
    ?.split(';')[0]
    .trim()
    .toLowerCase()
  if (!contentType?.startsWith('audio/')) {
    throw new Error('Sound download did not return audio')
  }

  const contentLength = Number(response.headers.get('content-length'))
  if (contentLength && contentLength > MAX_MEME_AUDIO_BYTES) {
    throw new Error('Sound is larger than the audio limit')
  }

  const bytes = await readBytesWithLimit(response.body, MAX_MEME_AUDIO_BYTES)
  if (!bytes.byteLength) throw new Error('Sound download was empty')

  return {
    bytes,
    contentType,
    fingerprint: await getAudioFingerprint(bytes),
  }
}
