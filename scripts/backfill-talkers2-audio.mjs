#!/usr/bin/env node

import {createHash} from 'node:crypto'
import {
  open,
  mkdir,
  readFile,
  realpath,
  rename,
  truncate,
  unlink,
} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {hostname} from 'node:os'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = join(
  projectRoot,
  'src/data/meme/audio-rank-manifest.json'
)
const stateDirectory = join(projectRoot, '.talkers2-audio-backfill')
const journalPath = join(stateDirectory, 'journal.ndjson')
const lockPath = join(stateDirectory, 'backfill.lock')
const revokedKeyHashesPath = join(stateDirectory, 'revoked-key-hashes.json')
const myInstantsOrigin = 'https://www.myinstants.com'
const manifestCheckpointInterval = 20

function argumentValue(name) {
  const prefix = `--${name}=`
  const argument = process.argv.slice(2).find(value => value.startsWith(prefix))
  return argument?.slice(prefix.length)
}

function hasArgument(name) {
  return process.argv.slice(2).includes(`--${name}`)
}

function boundedInteger(value, fallback, minimum, maximum) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) return fallback
  return Math.max(minimum, Math.min(maximum, parsed))
}

const dryRun = hasArgument('dry-run')
const markCurrentKeyRevoked = hasArgument('mark-current-key-revoked')
const refresh = hasArgument('refresh')
const retryInconclusive = hasArgument('retry-inconclusive')
const concurrency = boundedInteger(
  process.env.TALKERS2_BACKFILL_CONCURRENCY,
  2,
  1,
  4
)
const azureStartIntervalMs = boundedInteger(
  process.env.TALKERS2_BACKFILL_INTERVAL_MS,
  5_200,
  1_000,
  60_000
)
const maxAttempts = boundedInteger(
  process.env.TALKERS2_BACKFILL_MAX_ATTEMPTS,
  5,
  1,
  8
)
const requestedLimit = argumentValue('limit')
const itemLimit = requestedLimit === undefined ? null : Number(requestedLimit)
const unknownArguments = process.argv.slice(2).filter(
  argument =>
    ![
      '--dry-run',
      '--mark-current-key-revoked',
      '--refresh',
      '--retry-inconclusive',
    ].includes(argument) && !argument.startsWith('--limit=')
)

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isFingerprint(value) {
  return typeof value === 'string' && /^sha256-[a-f0-9]{64}$/.test(value)
}

function isStoredAnalysis(value) {
  if (!isPlainObject(value) || !Number.isFinite(Date.parse(value.checkedAt))) {
    return false
  }

  if (value.audioCheckStatus === 'inconclusive') {
    return value.badWordRanks === null
  }

  return (
    value.audioCheckStatus === 'checked' &&
    Array.isArray(value.badWordRanks) &&
    value.badWordRanks.every(
      (rank, index) =>
        Number.isInteger(rank) &&
        rank >= 1 &&
        rank <= 40 &&
        (index === 0 || value.badWordRanks[index - 1] < rank)
    )
  )
}

async function loadProjectBackfillModule() {
  const astroPackagePath = await realpath(
    join(projectRoot, 'node_modules/astro/package.json')
  )
  const requireFromAstro = createRequire(astroPackagePath)
  const requireFromVite = createRequire(requireFromAstro.resolve('vite'))
  const {build} = requireFromVite('esbuild')
  const result = await build({
    stdin: {
      contents: `
        export {allMemeSounds} from './src/data/meme/all-sounds.ts'
        export {downloadAllowedMemeAudio} from './src/data/meme/audio-download.ts'
        export {AUDIO_CHECK_PIPELINE_VERSION} from './src/data/meme/bad-word-ranking.ts'
        export {analyzeDownloadedMemeAudio} from './src/server/talkers2-audio-analysis.ts'
      `,
      loader: 'ts',
      resolveDir: projectRoot,
      sourcefile: 'talkers2-audio-backfill-entry.ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node22',
    write: false,
  })
  const source = result.outputFiles[0].text
  const encoded = Buffer.from(source).toString('base64')
  return import(`data:text/javascript;base64,${encoded}`)
}

function catalogFromSources(allMemeSounds) {
  const byUrl = new Map()

  allMemeSounds.forEach(item => {
    const audio = new URL(item.audio, myInstantsOrigin).href
    if (!byUrl.has(audio)) byUrl.set(audio, {name: item.name, audio})
  })

  return [...byUrl.values()]
}

function catalogDigest(catalog) {
  const urls = catalog.map(item => item.audio).sort()
  return `sha256-${createHash('sha256')
    .update(JSON.stringify(urls))
    .digest('hex')}`
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    throw error
  }
}

async function atomicWriteJson(path, value) {
  const temporaryPath = `${path}.tmp`
  const file = await open(temporaryPath, 'w')

  try {
    await file.writeFile(`${JSON.stringify(value, null, 2)}\n`)
    await file.sync()
  } finally {
    await file.close()
  }

  await rename(temporaryPath, path)

  try {
    const directory = await open(dirname(path), 'r')
    try {
      await directory.sync()
    } finally {
      await directory.close()
    }
  } catch (error) {
    if (!['EINVAL', 'ENOTSUP'].includes(error?.code)) throw error
  }
}

async function appendFully(file, value) {
  const bytes = Buffer.from(value)
  let offset = 0

  while (offset < bytes.byteLength) {
    const {bytesWritten} = await file.write(
      bytes,
      offset,
      bytes.byteLength - offset,
      null
    )
    if (!bytesWritten) throw new Error('Could not append to the backfill journal')
    offset += bytesWritten
  }
}

async function acquireLock() {
  await mkdir(stateDirectory, {recursive: true})

  try {
    const file = await open(lockPath, 'wx')
    await file.writeFile(
      JSON.stringify({pid: process.pid, hostname: hostname(), startedAt: new Date()})
    )
    await file.sync()
    return file
  } catch (error) {
    if (error?.code !== 'EEXIST') throw error
  }

  const existing = await readJson(lockPath).catch(() => null)
  if (existing?.hostname === hostname() && Number.isInteger(existing.pid)) {
    try {
      process.kill(existing.pid, 0)
      throw new Error(
        `Another Talkers2 backfill is running with PID ${existing.pid}`
      )
    } catch (error) {
      if (error?.code !== 'ESRCH') throw error
      await unlink(lockPath)
      return acquireLock()
    }
  }

  throw new Error(
    `A backfill lock already exists at ${lockPath}; verify no run is active before removing it.`
  )
}

async function releaseLock(file) {
  await file?.close().catch(() => {})
  await unlink(lockPath).catch(error => {
    if (error?.code !== 'ENOENT') throw error
  })
}

function normalizeManifest(rawManifest, pipelineVersion) {
  const manifest = isPlainObject(rawManifest) ? rawManifest : {}
  const analysesByPipeline = isPlainObject(manifest.analysesByPipeline)
    ? manifest.analysesByPipeline
    : {}

  if (!isPlainObject(analysesByPipeline[pipelineVersion])) {
    analysesByPipeline[pipelineVersion] = {}
  }

  return {
    schemaVersion: 1,
    generatedAt:
      typeof manifest.generatedAt === 'string' ? manifest.generatedAt : null,
    catalogDigest: null,
    catalogUrlCount: 0,
    analyzedUrlCount: 0,
    lastSequence: Number.isSafeInteger(manifest.lastSequence)
      ? manifest.lastSequence
      : 0,
    urlToFingerprint: isPlainObject(manifest.urlToFingerprint)
      ? manifest.urlToFingerprint
      : {},
    analysesByPipeline,
  }
}

function cleanError(error) {
  const status = Number.isInteger(error?.status) ? error.status : null
  const message =
    typeof error?.message === 'string'
      ? error.message.replace(/[\r\n]+/g, ' ').slice(0, 240)
      : 'Unknown error'
  return {status, message}
}

function statusFromError(error) {
  if (Number.isInteger(error?.status)) return error.status
  const match = String(error?.message || '').match(/(?:with|status)\s+(\d{3})/i)
  return match ? Number(match[1]) : null
}

function isRetryable(error) {
  const status = statusFromError(error)
  if (status === null) return true
  return [408, 409, 425, 429, 500, 502, 503, 504].includes(status)
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

class OperationFailure extends Error {
  constructor(stage, attempts, cause) {
    super(cause?.message || `${stage} failed`)
    this.name = 'OperationFailure'
    this.stage = stage
    this.attempts = attempts
    this.cause = cause
    this.status = statusFromError(cause)
  }
}

let stopRequested = false
let fatalError = null

function requestStop(signal) {
  if (stopRequested) return
  stopRequested = true
  console.log(`\n${signal} received; finishing active work and saving progress…`)
}

process.on('SIGINT', () => requestStop('SIGINT'))
process.on('SIGTERM', () => requestStop('SIGTERM'))

async function retryOperation(stage, operation) {
  let lastError

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (stopRequested) throw new OperationFailure(stage, attempt - 1, lastError)

    try {
      return await operation(attempt)
    } catch (error) {
      lastError = error
      const status = statusFromError(error)
      if (stage === 'transcription' && [401, 403].includes(status)) {
        fatalError = new Error(
          `Azure rejected the speech credentials with status ${status}`
        )
        stopRequested = true
        throw new OperationFailure(stage, attempt, error)
      }

      if (attempt >= maxAttempts || !isRetryable(error)) {
        throw new OperationFailure(stage, attempt, error)
      }

      const exponential = Math.min(60_000, 2_000 * 2 ** (attempt - 1))
      const jittered = Math.floor(Math.random() * exponential)
      const retryAfter = Number.isFinite(error?.retryAfterMs)
        ? error.retryAfterMs
        : 0
      await wait(Math.max(jittered, retryAfter))
    }
  }

  throw new OperationFailure(stage, maxAttempts, lastError)
}

async function main() {
  if (unknownArguments.length) {
    throw new Error(`Unknown argument: ${unknownArguments.join(', ')}`)
  }
  if (
    itemLimit !== null &&
    (!Number.isSafeInteger(itemLimit) || itemLimit < 1)
  ) {
    throw new Error('--limit must be a positive whole number.')
  }

  if (markCurrentKeyRevoked) {
    const speechKey = process.env.AZURE_SPEECH_KEY?.trim()
    if (!speechKey) throw new Error('AZURE_SPEECH_KEY is not set.')

    await mkdir(stateDirectory, {recursive: true})
    const existingHashes = await readJson(revokedKeyHashesPath)
    const hashes = Array.isArray(existingHashes)
      ? existingHashes.filter(value => typeof value === 'string')
      : []
    const currentHash = createHash('sha256').update(speechKey).digest('hex')
    if (!hashes.includes(currentHash)) hashes.push(currentHash)
    await atomicWriteJson(revokedKeyHashesPath, hashes.sort())
    console.log(
      'The current Azure key is now blocked from Talkers2 backfill use. No network requests were made.'
    )
    return
  }

  const projectModule = await loadProjectBackfillModule()
  const {
    allMemeSounds,
    downloadAllowedMemeAudio,
    AUDIO_CHECK_PIPELINE_VERSION: pipelineVersion,
    analyzeDownloadedMemeAudio,
  } = projectModule
  const catalog = catalogFromSources(allMemeSounds)
  const digest = catalogDigest(catalog)
  const rawManifest = await readJson(manifestPath)
  const manifest = normalizeManifest(rawManifest, pipelineVersion)
  const catalogUrls = new Set(catalog.map(item => item.audio))
  const currentAnalyses = manifest.analysesByPipeline[pipelineVersion]

  Object.keys(manifest.urlToFingerprint).forEach(audioUrl => {
    if (!catalogUrls.has(audioUrl)) delete manifest.urlToFingerprint[audioUrl]
  })

  const hasCompleteMapping = audioUrl => {
    const fingerprint = manifest.urlToFingerprint[audioUrl]
    const analysis = currentAnalyses[fingerprint]
    return isFingerprint(fingerprint) && isStoredAnalysis(analysis)
  }

  const alreadyComplete = catalog.filter(item => hasCompleteMapping(item.audio))
    .length
  console.log(
    `Talkers2 catalog: ${catalog.length.toLocaleString()} URLs; ` +
      `${alreadyComplete.toLocaleString()} already indexed; pipeline ${pipelineVersion}`
  )

  if (dryRun) {
    console.log(`Catalog digest: ${digest}`)
    console.log('Dry run complete; no downloads or Azure requests were made.')
    return
  }

  const speechKey = process.env.AZURE_SPEECH_KEY?.trim()
  const speechRegion = process.env.AZURE_SPEECH_REGION?.trim()
  if (!speechKey || !speechRegion) {
    throw new Error(
      'AZURE_SPEECH_KEY and AZURE_SPEECH_REGION must be set in the environment.'
    )
  }
  if (!/^[a-z0-9-]+$/i.test(speechRegion)) {
    throw new Error('AZURE_SPEECH_REGION is not a valid region slug.')
  }
  const revokedKeyHashes = await readJson(revokedKeyHashesPath)
  const currentKeyHash = createHash('sha256').update(speechKey).digest('hex')
  if (
    Array.isArray(revokedKeyHashes) &&
    revokedKeyHashes.includes(currentKeyHash)
  ) {
    throw new Error(
      'The configured Azure key is marked exposed. Rotate it and update .env before launching.'
    )
  }

  const lockFile = await acquireLock()
  let journalFile
  let sequence = manifest.lastSequence
  let journalQueue = Promise.resolve()
  let journalFailed = false
  let eventsSinceManifest = 0
  const failures = new Map()

  const applyEvent = event => {
    if (
      !isPlainObject(event) ||
      event.pipelineVersion !== pipelineVersion ||
      !catalogUrls.has(event.audioUrl)
    ) {
      return
    }

    if (
      event.type === 'complete' &&
      isFingerprint(event.audioFingerprint) &&
      isStoredAnalysis(event.analysis)
    ) {
      manifest.urlToFingerprint[event.audioUrl] = event.audioFingerprint
      currentAnalyses[event.audioFingerprint] = event.analysis
      failures.delete(event.audioUrl)
    } else if (event.type === 'failure') {
      if (event.invalidateMapping) {
        delete manifest.urlToFingerprint[event.audioUrl]
      }
      failures.set(event.audioUrl, event)
    }
  }

  const writeManifest = async () => {
    const orderedUrls = {}
    catalog
      .map(item => item.audio)
      .sort()
      .forEach(audioUrl => {
        const fingerprint = manifest.urlToFingerprint[audioUrl]
        if (isFingerprint(fingerprint) && isStoredAnalysis(currentAnalyses[fingerprint])) {
          orderedUrls[audioUrl] = fingerprint
        }
      })

    manifest.generatedAt = new Date().toISOString()
    manifest.catalogDigest = digest
    manifest.catalogUrlCount = catalog.length
    manifest.analyzedUrlCount = Object.keys(orderedUrls).length
    manifest.lastSequence = sequence
    manifest.urlToFingerprint = orderedUrls
    manifest.analysesByPipeline[pipelineVersion] = Object.fromEntries(
      Object.entries(currentAnalyses)
        .filter(([fingerprint, analysis]) =>
          isFingerprint(fingerprint) && isStoredAnalysis(analysis)
        )
        .sort(([left], [right]) => left.localeCompare(right))
    )
    await atomicWriteJson(manifestPath, manifest)
    eventsSinceManifest = 0
  }

  const recordEvent = payload => {
    journalQueue = journalQueue.then(async () => {
      const event = {
        sequence: ++sequence,
        pipelineVersion,
        at: new Date().toISOString(),
        ...payload,
      }
      await appendFully(journalFile, `${JSON.stringify(event)}\n`)
      await journalFile.sync()
      applyEvent(event)
      eventsSinceManifest += 1
      if (eventsSinceManifest >= manifestCheckpointInterval) {
        await writeManifest()
      }
    })
    return journalQueue.catch(error => {
      journalFailed = true
      fatalError = new Error(`Could not save backfill progress: ${error.message}`)
      stopRequested = true
      throw error
    })
  }

  try {
    await mkdir(stateDirectory, {recursive: true})
    let journalText = ''
    try {
      journalText = await readFile(journalPath, 'utf8')
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }

    const journalLines = journalText.split('\n')
    let discardIncompleteFinalLine = false
    journalLines.forEach((line, index) => {
      if (!line.trim()) return
      try {
        const event = JSON.parse(line)
        if (Number.isSafeInteger(event.sequence)) {
          sequence = Math.max(sequence, event.sequence)
          if (event.sequence > manifest.lastSequence) applyEvent(event)
        }
      } catch (error) {
        const isLastNonemptyLine = journalLines
          .slice(index + 1)
          .every(candidate => !candidate.trim())
        if (!isLastNonemptyLine) throw error
        discardIncompleteFinalLine = true
        console.warn('Ignoring an incomplete final journal line from an interrupted run.')
      }
    })

    if (discardIncompleteFinalLine) {
      const lastNewline = journalText.lastIndexOf('\n')
      const completePrefix =
        lastNewline >= 0 ? journalText.slice(0, lastNewline + 1) : ''
      await truncate(journalPath, Buffer.byteLength(completePrefix))
      journalText = completePrefix
    }

    journalFile = await open(journalPath, 'a')
    if (journalText && !journalText.endsWith('\n')) {
      await appendFully(journalFile, '\n')
      await journalFile.sync()
    }
    await writeManifest()

    const shouldRetryCompletedItem = item => {
      const fingerprint = manifest.urlToFingerprint[item.audio]
      const analysis = currentAnalyses[fingerprint]
      return (
        retryInconclusive &&
        isStoredAnalysis(analysis) &&
        analysis.audioCheckStatus === 'inconclusive'
      )
    }
    const remainingWork = catalog.filter(
      item =>
        refresh ||
        !hasCompleteMapping(item.audio) ||
        shouldRetryCompletedItem(item)
    )
    const work =
      itemLimit === null ? remainingWork : remainingWork.slice(0, itemLimit)
    let nextIndex = 0
    let processed = 0
    let transcribed = 0
    let reused = 0
    let skipped = catalog.length - remainingWork.length
    let failed = 0
    let inconclusive = 0
    let consecutiveServiceFailures = 0
    let consecutiveTransientDownloadFailures = 0
    let repeatedTranscriptionFailureCount = 0
    let lastTranscriptionFailureSignature = ''
    const pendingByFingerprint = new Map()
    const retriedInconclusiveFingerprints = new Set()
    let azureSlotQueue = Promise.resolve()
    let nextAzureStart = Date.now()

    const waitForAzureSlot = () => {
      azureSlotQueue = azureSlotQueue.then(async () => {
        const delay = Math.max(0, nextAzureStart - Date.now())
        if (delay) await wait(delay)
        if (stopRequested) throw new Error('Backfill is stopping')
        nextAzureStart = Math.max(Date.now(), nextAzureStart) + azureStartIntervalMs
      })
      return azureSlotQueue
    }

    const analyzeFingerprint = (item, downloadedAudio) => {
      const existing = currentAnalyses[downloadedAudio.fingerprint]
      const shouldRetryExisting =
        retryInconclusive &&
        existing?.audioCheckStatus === 'inconclusive' &&
        !retriedInconclusiveFingerprints.has(downloadedAudio.fingerprint)
      if (
        isStoredAnalysis(existing) &&
        !shouldRetryExisting
      ) {
        reused += 1
        return Promise.resolve(existing)
      }

      const pending = pendingByFingerprint.get(downloadedAudio.fingerprint)
      if (pending) {
        reused += 1
        return pending
      }

      if (shouldRetryExisting) {
        retriedInconclusiveFingerprints.add(downloadedAudio.fingerprint)
      }
      const analysisPromise = retryOperation(
        'transcription',
        async () => {
          await waitForAzureSlot()
          const result = await analyzeDownloadedMemeAudio(
            item.audio,
            downloadedAudio,
            {speechKey, speechRegion}
          )
          transcribed += 1
          consecutiveServiceFailures = 0
          repeatedTranscriptionFailureCount = 0
          lastTranscriptionFailureSignature = ''
          return {
            audioCheckStatus: result.audioCheckStatus,
            badWordRanks: result.badWordRanks,
            checkedAt: new Date().toISOString(),
          }
        }
      ).then(analysis => {
        currentAnalyses[downloadedAudio.fingerprint] = analysis
        return analysis
      })
      pendingByFingerprint.set(downloadedAudio.fingerprint, analysisPromise)
      analysisPromise.then(
        () => pendingByFingerprint.delete(downloadedAudio.fingerprint),
        () => pendingByFingerprint.delete(downloadedAudio.fingerprint)
      )
      return analysisPromise
    }

    const reportProgress = (item, outcome) => {
      if (processed <= 5 || processed % 10 === 0 || outcome.startsWith('failed')) {
        console.log(
          `[${processed.toLocaleString()}/${work.length.toLocaleString()}] ` +
            `${outcome}: ${item.name}`
        )
      }
    }

    const processItem = async item => {
      if (
        !refresh &&
        hasCompleteMapping(item.audio) &&
        !shouldRetryCompletedItem(item)
      ) {
        skipped += 1
        processed += 1
        reportProgress(item, 'already indexed')
        return
      }

      let downloadedAudio
      try {
        downloadedAudio = await retryOperation('download', () =>
          downloadAllowedMemeAudio(item.audio)
        )
        consecutiveTransientDownloadFailures = 0
      } catch (error) {
        failed += 1
        processed += 1
        await recordEvent({
          type: 'failure',
          audioUrl: item.audio,
          stage: error.stage || 'download',
          attempts: error.attempts || 0,
          error: cleanError(error.cause || error),
          invalidateMapping: false,
        })
        if (isRetryable(error.cause || error)) {
          consecutiveTransientDownloadFailures += 1
          if (consecutiveTransientDownloadFailures >= 5) {
            fatalError = new Error(
              'Five consecutive transient sound-download failures stopped the backfill.'
            )
            stopRequested = true
          }
        } else {
          consecutiveTransientDownloadFailures = 0
        }
        reportProgress(item, 'failed download')
        return
      }

      try {
        const analysis = await analyzeFingerprint(item, downloadedAudio)
        if (analysis.audioCheckStatus === 'inconclusive') inconclusive += 1
        await recordEvent({
          type: 'complete',
          audioUrl: item.audio,
          audioFingerprint: downloadedAudio.fingerprint,
          analysis,
        })
        processed += 1
        const ranks =
          analysis.audioCheckStatus === 'checked'
            ? analysis.badWordRanks.length
              ? `ranks ${analysis.badWordRanks.join(',')}`
              : 'clean (41)'
            : 'inconclusive'
        reportProgress(item, ranks)
      } catch (error) {
        if (journalFailed) throw error
        failed += 1
        processed += 1
        const status = statusFromError(error)
        if (status === null || status === 429 || status >= 500) {
          consecutiveServiceFailures += 1
          if (consecutiveServiceFailures >= 5) {
            fatalError = new Error(
              'Five consecutive Azure service failures stopped the backfill.'
            )
            stopRequested = true
          }
        }
        const cleanedError = cleanError(error.cause || error)
        const failureSignature = `${cleanedError.status}:${cleanedError.message}`
        if (failureSignature === lastTranscriptionFailureSignature) {
          repeatedTranscriptionFailureCount += 1
        } else {
          lastTranscriptionFailureSignature = failureSignature
          repeatedTranscriptionFailureCount = 1
        }
        if (repeatedTranscriptionFailureCount >= 5) {
          fatalError = new Error(
            'Five identical transcription failures stopped the backfill.'
          )
          stopRequested = true
        }
        await recordEvent({
          type: 'failure',
          audioUrl: item.audio,
          audioFingerprint: downloadedAudio.fingerprint,
          stage: error.stage || 'transcription',
          attempts: error.attempts || 0,
          error: cleanedError,
          invalidateMapping:
            manifest.urlToFingerprint[item.audio] !== downloadedAudio.fingerprint,
        })
        reportProgress(item, 'failed transcription')
      }
    }

    const worker = async () => {
      while (!stopRequested) {
        const index = nextIndex
        nextIndex += 1
        if (index >= work.length) return
        await processItem(work[index])
      }
    }

    console.log(
      `Starting with ${concurrency} workers and one Azure start every ` +
        `${(azureStartIntervalMs / 1000).toFixed(1)} seconds.`
    )
    await Promise.all(Array.from({length: concurrency}, () => worker()))
    await journalQueue
    await writeManifest()

    console.log(
      `Saved ${manifest.analyzedUrlCount.toLocaleString()} indexed URLs. ` +
        `This run: ${transcribed} transcribed, ${reused} fingerprint reuses, ` +
        `${skipped} skipped, ${inconclusive} inconclusive, ${failed} failed.`
    )

    if (fatalError) throw fatalError
    if (stopRequested) process.exitCode = 130
    else if (failed) process.exitCode = 1
  } finally {
    await journalQueue.catch(() => {})
    if (journalFile) await journalFile.close().catch(() => {})
    await releaseLock(lockFile)
  }
}

main().catch(error => {
  console.error(`Talkers2 backfill stopped: ${error.message}`)
  process.exitCode = 1
})
