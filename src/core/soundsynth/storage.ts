import { createDefaultSetup } from './library'
import type { TSavedSetup, TSoundSynthStore, TSynthSetup } from './types'

const STORAGE_KEY = 'sound-synth-v1'

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function cloneSetup<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

export function createDefaultStore(): TSoundSynthStore {
  return {
    currentSetup: createDefaultSetup(),
    loadedSetupId: null,
    savedSetups: [],
  }
}

function normalizeSetup(value: unknown) {
  if (!isObjectLike(value)) {
    return createDefaultSetup()
  }

  const fallback = createDefaultSetup()
  const candidate = value as Partial<TSynthSetup>

  return {
    ...fallback,
    ...candidate,
    adsr: {
      ...fallback.adsr,
      ...(isObjectLike(candidate.adsr) ? candidate.adsr : {}),
    },
    keyboardRange: {
      ...fallback.keyboardRange,
      ...(isObjectLike(candidate.keyboardRange) ? candidate.keyboardRange : {}),
    },
    layers: Array.isArray(candidate.layers) && candidate.layers.length
      ? candidate.layers as TSynthSetup['layers']
      : fallback.layers,
  }
}

function normalizeSavedSetup(value: unknown): TSavedSetup | null {
  if (!isObjectLike(value)) {
    return null
  }

  const name = typeof value.name === 'string' && value.name
    ? value.name
    : 'Untitled Setup'

  return {
    id: typeof value.id === 'string' && value.id ? value.id : createId('setup'),
    name,
    updatedAt: typeof value.updatedAt === 'string'
      ? value.updatedAt
      : new Date().toISOString(),
    setup: normalizeSetup(value.setup),
  }
}

export function loadStore() {
  if (typeof window === 'undefined') {
    return createDefaultStore()
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return createDefaultStore()
    }

    const parsed = JSON.parse(raw)

    if (!isObjectLike(parsed)) {
      return createDefaultStore()
    }

    const currentSetup = normalizeSetup(parsed.currentSetup)
    const savedSetups = Array.isArray(parsed.savedSetups)
      ? parsed.savedSetups
        .map(normalizeSavedSetup)
        .filter((item): item is TSavedSetup => Boolean(item))
      : []

    return {
      currentSetup,
      loadedSetupId: typeof parsed.loadedSetupId === 'string'
        ? parsed.loadedSetupId
        : null,
      savedSetups,
    }
  } catch (error) {
    console.error(error)
    return createDefaultStore()
  }
}

export function persistStore(store: TSoundSynthStore) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch (error) {
    console.error(error)
  }
}

export function createSavedSetup(setup: TSynthSetup, name: string): TSavedSetup {
  return {
    id: createId('setup'),
    name,
    updatedAt: new Date().toISOString(),
    setup: cloneSetup({
      ...setup,
      name,
    }),
  }
}

