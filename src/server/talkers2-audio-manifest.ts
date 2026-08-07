import {createHash} from 'node:crypto'
import manifestData from '@/data/meme/audio-rank-manifest.json'
import {
  AUDIO_CHECK_PIPELINE_VERSION,
  badWordRanking,
} from '@/data/meme/bad-word-ranking'
import {allowedMemeAudioUrls} from '@/data/meme/all-sounds'
import type {ManifestAudioCheck} from './talkers2-audio-analysis'

type AudioRankManifest = {
  schemaVersion?: unknown
  catalogDigest?: unknown
  catalogUrlCount?: unknown
  urlToFingerprint?: unknown
  analysesByPipeline?: unknown
}

const AUDIO_FINGERPRINT_PATTERN = /^sha256-[a-f0-9]{64}$/
const validRanks = new Set(badWordRanking.map(item => item.rank))

function currentCatalogDigest() {
  return `sha256-${createHash('sha256')
    .update(JSON.stringify([...allowedMemeAudioUrls].sort()))
    .digest('hex')}`
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isBadWordRanks(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.every(
      (rank, index) =>
        Number.isInteger(rank) &&
        validRanks.has(rank) &&
        (index === 0 || value[index - 1] < rank)
    )
  )
}

function hasValidCheckedAt(value: unknown) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

export function buildManifestChecksForCatalog(
  manifestValue: unknown,
  options: {
    allowedAudioUrls: ReadonlySet<string>
    expectedCatalogDigest: string
    pipelineVersion: string
  }
) {
  const checks = new Map<string, ManifestAudioCheck>()
  const manifest = manifestValue as AudioRankManifest

  if (
    manifest.schemaVersion !== 1 ||
    manifest.catalogUrlCount !== options.allowedAudioUrls.size ||
    manifest.catalogDigest !== options.expectedCatalogDigest ||
    !isPlainObject(manifest.urlToFingerprint) ||
    !isPlainObject(manifest.analysesByPipeline)
  ) {
    return checks
  }

  const currentAnalyses = manifest.analysesByPipeline[
    options.pipelineVersion
  ]
  if (!isPlainObject(currentAnalyses)) return checks

  Object.entries(manifest.urlToFingerprint).forEach(
    ([audioUrl, fingerprint]) => {
      if (
        !options.allowedAudioUrls.has(audioUrl) ||
        typeof fingerprint !== 'string' ||
        !AUDIO_FINGERPRINT_PATTERN.test(fingerprint)
      ) {
        return
      }

      const analysis = currentAnalyses[fingerprint]
      if (!isPlainObject(analysis) || !hasValidCheckedAt(analysis.checkedAt)) {
        return
      }

      if (
        analysis.audioCheckStatus === 'checked' &&
        isBadWordRanks(analysis.badWordRanks)
      ) {
        checks.set(audioUrl, {
          audioCheckStatus: 'checked',
          badWordRanks: analysis.badWordRanks,
          audioFingerprint: fingerprint,
          checkedAt: analysis.checkedAt as string,
        })
      } else if (
        analysis.audioCheckStatus === 'inconclusive' &&
        analysis.badWordRanks === null
      ) {
        checks.set(audioUrl, {
          audioCheckStatus: 'inconclusive',
          badWordRanks: null,
          audioFingerprint: fingerprint,
          checkedAt: analysis.checkedAt as string,
        })
      }
    }
  )

  return checks
}

const manifestChecks = buildManifestChecksForCatalog(manifestData, {
  allowedAudioUrls: allowedMemeAudioUrls,
  expectedCatalogDigest: currentCatalogDigest(),
  pipelineVersion: AUDIO_CHECK_PIPELINE_VERSION,
})

export function getManifestAudioCheck(audioUrl: string) {
  return manifestChecks.get(audioUrl) || null
}
