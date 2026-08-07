import {
  badWordSpeechPhrases,
  getBadWordRanks,
} from '@/data/meme/bad-word-ranking'

export type DownloadedMemeAudio = {
  bytes: Uint8Array
  contentType: string
  fingerprint: string
}

export type AudioAnalysis =
  | {
      audioCheckStatus: 'checked'
      badWordRanks: number[]
      audioFingerprint: string
    }
  | {
      audioCheckStatus: 'inconclusive'
      badWordRanks: null
      audioFingerprint: string
    }

export type ManifestAudioCheck = AudioAnalysis & {checkedAt: string}

export type AzureSpeechAnalysisOptions = {
  speechKey: string
  speechRegion: string
  timeoutMs?: number
}

export class AudioTranscriptionError extends Error {
  status: number
  retryAfterMs: number | null

  constructor(status: number, retryAfterMs: number | null) {
    super(`Transcription failed with ${status}`)
    this.name = 'AudioTranscriptionError'
    this.status = status
    this.retryAfterMs = retryAfterMs
  }
}

const MINIMUM_PHRASE_CONFIDENCE = 0.65

function audioFileName(audioUrl: string) {
  const pathname = new URL(audioUrl).pathname
  const lastPart = pathname.split('/').pop() || 'sound.mp3'
  return decodeURIComponent(lastPart).replace(/[^a-z0-9._-]/gi, '_')
}

function retryAfterMilliseconds(value: string | null) {
  if (!value) return null

  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000

  const date = Date.parse(value)
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : null
}

export async function analyzeDownloadedMemeAudio(
  audioUrl: string,
  downloadedAudio: DownloadedMemeAudio,
  options: AzureSpeechAnalysisOptions
): Promise<AudioAnalysis> {
  const audioBuffer = new ArrayBuffer(downloadedAudio.bytes.byteLength)
  new Uint8Array(audioBuffer).set(downloadedAudio.bytes)
  const audioBlob = new Blob([audioBuffer], {
    type: downloadedAudio.contentType,
  })
  const formData = new FormData()
  formData.append('audio', audioBlob, audioFileName(audioUrl))
  formData.append(
    'definition',
    JSON.stringify({
      locales: ['en-US', 'en-GB'],
      profanityFilterMode: 'None',
      phraseList: {
        phrases: badWordSpeechPhrases,
      },
    })
  )

  const transcriptionEndpoint =
    `https://${options.speechRegion}.api.cognitive.microsoft.com/` +
    'speechtotext/transcriptions:transcribe?api-version=2025-10-15'
  const transcriptionResponse = await fetch(transcriptionEndpoint, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': options.speechKey,
    },
    body: formData,
    signal: AbortSignal.timeout(options.timeoutMs || 120_000),
  })

  if (!transcriptionResponse.ok) {
    throw new AudioTranscriptionError(
      transcriptionResponse.status,
      retryAfterMilliseconds(transcriptionResponse.headers.get('retry-after'))
    )
  }

  const transcription = (await transcriptionResponse.json()) as {
    phrases?: Array<{text?: unknown; confidence?: unknown}>
  }
  const recognizedPhrases = (transcription.phrases || []).filter(
    phrase =>
      typeof phrase.text === 'string' && /[a-z0-9]/i.test(phrase.text)
  )
  const transcript = recognizedPhrases
    .map(phrase => phrase.text as string)
    .join(' ')
    .trim()
  const detectedRanks = getBadWordRanks(transcript)
  const hasLowConfidencePhrase = recognizedPhrases.some(
    phrase =>
      typeof phrase.confidence !== 'number' ||
      !Number.isFinite(phrase.confidence) ||
      phrase.confidence < MINIMUM_PHRASE_CONFIDENCE ||
      phrase.confidence > 1
  )

  // A low-confidence ranked word is conservatively retained. Low-confidence
  // audio with no ranked word cannot safely be called clean, so it remains
  // inconclusive instead of becoming category 41.
  return transcript && (!hasLowConfidencePhrase || detectedRanks.length)
    ? {
        audioCheckStatus: 'checked',
        badWordRanks: detectedRanks,
        audioFingerprint: downloadedAudio.fingerprint,
      }
    : {
        audioCheckStatus: 'inconclusive',
        badWordRanks: null,
        audioFingerprint: downloadedAudio.fingerprint,
      }
}
