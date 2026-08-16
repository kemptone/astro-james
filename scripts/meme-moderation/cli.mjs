import {fileURLToPath} from 'node:url'

import {
  allMemeSources,
  buildMemeInventory,
} from '../../src/data/meme/inventory.ts'
import {
  canStartRequestWithinBudget,
  combineUsage,
  DEFAULT_BUDGET_RESERVE_USD,
  downloadAudio,
  isReusableDecision,
  hasCompletedPilot,
  MAX_ATTEMPTS,
  MODEL,
  POLICY_VERSION,
  readManifest,
  requestModeration,
  SafeModerationError,
  selectPilotSample,
  summarizeDecisions,
  withRetries,
  writeManifestAtomic,
} from './core.mjs'

const MANIFEST_PATH = fileURLToPath(
  new URL('../../src/data/meme/moderation-manifest.json', import.meta.url)
)

function usage() {
  return [
    'Usage:',
    '  pnpm memes:moderate -- --sample <count> --max-cost-usd <amount>',
    '  pnpm memes:moderate -- --all --max-cost-usd <amount>',
    '',
    'Options:',
    '  --force        Reclassify completed paths.',
    '  --seed <text>  Override the deterministic pilot seed.',
  ].join('\n')
}

function readOptionValue(argumentsList, index, name) {
  const argument = argumentsList[index]
  if (argument.startsWith(`${name}=`)) {
    return {value: argument.slice(name.length + 1), consumed: 0}
  }
  const value = argumentsList[index + 1]
  if (!value || value.startsWith('--')) throw new Error(`Missing value for ${name}`)
  return {value, consumed: 1}
}

export function parseArguments(argumentsList) {
  const options = {
    all: false,
    sample: null,
    maxCostUsd: null,
    force: false,
    seed: 'meme-moderation-v1',
  }

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index]
    if (argument === '--') continue
    if (argument === '--all') options.all = true
    else if (argument === '--force') options.force = true
    else if (argument === '--help' || argument === '-h') {
      return {...options, help: true}
    } else if (argument === '--sample' || argument.startsWith('--sample=')) {
      const {value, consumed} = readOptionValue(
        argumentsList,
        index,
        '--sample'
      )
      options.sample = Number(value)
      index += consumed
    } else if (
      argument === '--max-cost-usd' ||
      argument.startsWith('--max-cost-usd=')
    ) {
      const {value, consumed} = readOptionValue(
        argumentsList,
        index,
        '--max-cost-usd'
      )
      options.maxCostUsd = Number(value)
      index += consumed
    } else if (argument === '--seed' || argument.startsWith('--seed=')) {
      const {value, consumed} = readOptionValue(argumentsList, index, '--seed')
      options.seed = value
      index += consumed
    } else {
      throw new Error(`Unknown option: ${argument}`)
    }
  }

  if (options.all === (options.sample !== null)) {
    throw new Error('Choose exactly one of --sample or --all')
  }
  if (
    options.sample !== null &&
    (!Number.isInteger(options.sample) || options.sample < 1)
  ) {
    throw new Error('--sample must be a positive integer')
  }
  if (!Number.isFinite(options.maxCostUsd) || options.maxCostUsd <= 0) {
    throw new Error('--max-cost-usd must be a positive number')
  }
  return options
}

function errorRecord(item, error, sampleGroup, retryCount, usage) {
  return {
    status: 'error',
    reasonCodes: [],
    errorCode:
      error instanceof SafeModerationError ? error.code : 'unexpected_error',
    sources: item.sources,
    names: item.names,
    published: item.published,
    model: MODEL,
    policyVersion: POLICY_VERSION,
    sampleGroup,
    attemptedAt: new Date().toISOString(),
    retryCount,
    usage,
  }
}

function decisionRecord(item, result, sampleGroup, retryCount, usage) {
  return {
    status: result.decision.status,
    reasonCodes: result.decision.reasonCodes,
    sources: item.sources,
    names: item.names,
    published: item.published,
    model: MODEL,
    policyVersion: POLICY_VERSION,
    sampleGroup,
    attemptedAt: new Date().toISOString(),
    retryCount,
    usage,
  }
}

async function main() {
  let options
  try {
    options = parseArguments(process.argv.slice(2))
  } catch (error) {
    console.error(error.message)
    console.error(usage())
    process.exitCode = 1
    return
  }
  if (options.help) {
    console.log(usage())
    return
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('OPENAI_API_KEY is required')
    process.exitCode = 1
    return
  }

  const inventory = buildMemeInventory(allMemeSources)
  if (options.sample > inventory.length) {
    console.error(`--sample cannot exceed ${inventory.length}`)
    process.exitCode = 1
    return
  }

  const selected = options.all
    ? inventory.map(item => ({...item, sampleGroup: 'all'}))
    : selectPilotSample(inventory, {
        sampleSize: options.sample,
        riskSize: Math.min(20, Math.floor(options.sample / 5)),
        seed: options.seed,
      })
  const manifest = await readManifest(MANIFEST_PATH)
  if (options.all && !hasCompletedPilot(manifest)) {
    console.error(
      'Run and complete the deterministic 100-clip pilot before using --all'
    )
    process.exitCode = 1
    return
  }
  const runStartedAt = new Date().toISOString()
  let spentUsd = 0
  let attempted = 0
  let skipped = 0
  let retryCount = 0
  let budgetStopped = false
  const currentRunPaths = []
  const reserveUsd = Math.min(
    DEFAULT_BUDGET_RESERVE_USD,
    options.maxCostUsd / 4
  )

  console.log(
    `Inventory: ${allMemeSources.reduce((sum, source) => sum + source.items.length, 0)} entries, ${inventory.length} unique audio paths`
  )
  console.log(
    `Selected: ${selected.length}; mode=${options.all ? 'all' : 'pilot'}; budget=$${options.maxCostUsd.toFixed(2)}`
  )

  for (let index = 0; index < selected.length; index += 1) {
    const item = selected[index]
    const existing = manifest.decisions[item.audioPath]
    if (!options.force && isReusableDecision(existing)) {
      skipped += 1
      continue
    }
    if (!canStartRequestWithinBudget(spentUsd, options.maxCostUsd, reserveUsd)) {
      budgetStopped = true
      break
    }

    attempted += 1
    currentRunPaths.push(item.audioPath)
    let itemRetries = 0
    let itemUsage = combineUsage()
    let record
    try {
      const download = await withRetries(() => downloadAudio(item.audioPath), {
        maxAttempts: MAX_ATTEMPTS,
      })
      itemRetries += download.retryCount

      const moderation = await withRetries(
        () => {
          if (
            !canStartRequestWithinBudget(
              spentUsd,
              options.maxCostUsd,
              reserveUsd
            )
          ) {
            throw new SafeModerationError('budget_ceiling_reached')
          }
          return requestModeration(item, download.value, apiKey)
        },
        {
          maxAttempts: MAX_ATTEMPTS,
          onFailure: async error => {
            if (!error?.usage) return
            itemUsage = combineUsage(itemUsage, error.usage)
            spentUsd += error.usage.costUsd
          },
        }
      )
      itemRetries += moderation.retryCount
      itemUsage = combineUsage(itemUsage, moderation.value.usage)
      spentUsd += moderation.value.usage.costUsd
      record = decisionRecord(
        item,
        moderation.value,
        item.sampleGroup,
        itemRetries,
        itemUsage
      )
    } catch (error) {
      itemRetries += error?.retryCount ?? 0
      budgetStopped ||=
        error?.code === 'budget_ceiling_reached' ||
        error?.code === 'invalid_openai_usage'
      record = errorRecord(
        item,
        error,
        item.sampleGroup,
        itemRetries,
        itemUsage
      )
    }

    retryCount += itemRetries
    manifest.decisions[item.audioPath] = record
    manifest.updatedAt = new Date().toISOString()
    await writeManifestAtomic(MANIFEST_PATH, manifest)
    console.log(
      `[${index + 1}/${selected.length}] status=${record.status} cost=$${spentUsd.toFixed(4)} retries=${retryCount}`
    )
    if (budgetStopped) break
  }

  const summary = summarizeDecisions(selected, manifest.decisions)
  const representativeRecords = currentRunPaths
    .map(audioPath => manifest.decisions[audioPath])
    .filter(record => record?.sampleGroup === 'representative')
  const representativeCost = representativeRecords.reduce(
    (sum, record) => sum + (record.usage?.costUsd ?? 0),
    0
  )
  const projectedFullScanCostUsd = representativeRecords.length
    ? Number(
        (
          (representativeCost / representativeRecords.length) *
          inventory.length
        ).toFixed(2)
      )
    : null
  const actualUsage = combineUsage(
    ...currentRunPaths.map(audioPath => manifest.decisions[audioPath]?.usage)
  )
  const report = {
    startedAt: runStartedAt,
    endedAt: new Date().toISOString(),
    mode: options.all ? 'all' : 'pilot',
    sampleSize: options.all ? null : options.sample,
    selected: selected.length,
    attempted,
    skipped,
    retryCount,
    budgetUsd: options.maxCostUsd,
    actualCostUsd: Number(actualUsage.costUsd.toFixed(6)),
    actualUsage,
    projectedFullScanCostUsd,
    budgetStopped,
    failOpen: true,
    ...summary,
  }

  manifest.runs.push(report)
  manifest.updatedAt = report.endedAt
  await writeManifestAtomic(MANIFEST_PATH, manifest)
  console.log(JSON.stringify(report, null, 2))
}

main().catch(error => {
  console.error(
    error instanceof SafeModerationError ? error.code : 'moderation_cli_failed'
  )
  process.exitCode = 1
})
