import './wc-audio'
import './wc-meme-image'
import {AUDIO_CHECK_PIPELINE_VERSION} from '@/data/meme/bad-word-ranking'
import {fetchTalkers2Audio} from '@/core/talkers2/audio-access'

export type AudioCheckStatus =
  | 'unchecked'
  | 'checking'
  | 'checked'
  | 'inconclusive'
  | 'error'

export type MemeType = {
  name: string
  audio: string
  badWordRanks: number[] | null
  audioFingerprint: string | null
  audioCheckedAt: string | null
  audioCheckStatus: AudioCheckStatus
}

export type AudioCheckResult =
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

export type TimestampedAudioCheck = AudioCheckResult & {checkedAt: number}
type CachedAudioCheck = TimestampedAudioCheck

type MemeItemElement = HTMLElement & {
  cleanupMemeAudio?: () => void
}

const AUDIO_CHECK_CACHE_KEY = `talkers2_audio_checks_${AUDIO_CHECK_PIPELINE_VERSION}`
const AUDIO_CHECK_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000
const AUDIO_FINGERPRINT_PATTERN = /^sha256-[a-f0-9]{64}$/
export const AUDIO_CHECK_UPDATED_EVENT = 'talkers2_audio_check_updated'

function isAudioFingerprint(value: unknown): value is string {
  return (
    typeof value === 'string' && AUDIO_FINGERPRINT_PATTERN.test(value)
  )
}

function isBadWordRanks(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.every(
      rank => Number.isInteger(rank) && rank >= 1 && rank <= 40
    ) &&
    new Set(value).size === value.length
  )
}

function readAudioCheckCache() {
  if (typeof localStorage === 'undefined') return {}

  try {
    const parsed = JSON.parse(
      localStorage.getItem(AUDIO_CHECK_CACHE_KEY) || '{}'
    ) as unknown

    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, CachedAudioCheck>)
      : {}
  } catch {
    return {}
  }
}

const audioCheckCache = readAudioCheckCache()

export function getCachedAudioCheck(audioUrl: string) {
  const cached = audioCheckCache[audioUrl]
  const hasValidResult =
    (cached?.audioCheckStatus === 'checked' &&
      isBadWordRanks(cached.badWordRanks) &&
      isAudioFingerprint(cached.audioFingerprint)) ||
    (cached?.audioCheckStatus === 'inconclusive' &&
      cached.badWordRanks === null &&
      isAudioFingerprint(cached.audioFingerprint))
  if (
    cached &&
    hasValidResult &&
    Date.now() - cached.checkedAt < AUDIO_CHECK_CACHE_MAX_AGE
  ) {
    return cached
  }

  if (cached) {
    delete audioCheckCache[audioUrl]
  }

  return null
}

function removeAudioCheck(audioUrl: string) {
  if (typeof localStorage === 'undefined') return

  delete audioCheckCache[audioUrl]
  try {
    localStorage.setItem(AUDIO_CHECK_CACHE_KEY, JSON.stringify(audioCheckCache))
  } catch (error) {
    console.warn('Could not remove the old audio check', error)
  }

  document.dispatchEvent(
    new CustomEvent(AUDIO_CHECK_UPDATED_EVENT, {
      detail: {audio: audioUrl, result: null},
    })
  )
}

function saveAudioCheck(audioUrl: string, result: AudioCheckResult) {
  if (typeof localStorage === 'undefined') return

  audioCheckCache[audioUrl] = {
    ...result,
    checkedAt: Date.now(),
  }

  try {
    localStorage.setItem(AUDIO_CHECK_CACHE_KEY, JSON.stringify(audioCheckCache))
  } catch (error) {
    console.warn('Could not cache the audio check', error)
  }

  document.dispatchEvent(
    new CustomEvent(AUDIO_CHECK_UPDATED_EVENT, {
      detail: {audio: audioUrl, result},
    })
  )
}

function isChecked(
  item: MemeType
): item is MemeType & {
  audioCheckStatus: 'checked'
  badWordRanks: number[]
  audioFingerprint: string
} {
  return (
    item.audioCheckStatus === 'checked' &&
    isBadWordRanks(item.badWordRanks) &&
    isAudioFingerprint(item.audioFingerprint)
  )
}

function getCompletedAudioCheck(item: MemeType): TimestampedAudioCheck | null {
  const parsedCheckedAt = Date.parse(item.audioCheckedAt || '')
  const checkedAt = Number.isFinite(parsedCheckedAt) ? parsedCheckedAt : 0

  if (isChecked(item)) {
    return {
      audioCheckStatus: 'checked',
      badWordRanks: item.badWordRanks,
      audioFingerprint: item.audioFingerprint,
      checkedAt,
    }
  }

  if (
    item.audioCheckStatus === 'inconclusive' &&
    isAudioFingerprint(item.audioFingerprint)
  ) {
    return {
      audioCheckStatus: 'inconclusive',
      badWordRanks: null,
      audioFingerprint: item.audioFingerprint,
      checkedAt,
    }
  }

  return null
}

export function getPreferredAudioCheck(item: MemeType) {
  const itemCheck = getCompletedAudioCheck(item)
  const cachedCheck = getCachedAudioCheck(item.audio)

  if (!itemCheck) return cachedCheck
  if (!cachedCheck) return itemCheck
  return cachedCheck.checkedAt > itemCheck.checkedAt ? cachedCheck : itemCheck
}

if (typeof window != 'undefined')
  customElements.define(
    'wc-meme-item',
    class MemeBoardItem extends HTMLElement {
      async connectedCallback() {
        if (this.dataset.memeInitialized === 'true') return
        this.dataset.memeInitialized = 'true'

        const {item: _item, is_display} = this.dataset
        if (!_item) return

        const itemElement = this as MemeItemElement
        const item = JSON.parse(_item) as MemeType
        const preferredCheck = getPreferredAudioCheck(item)

        if (preferredCheck) {
          item.audioCheckStatus = preferredCheck.audioCheckStatus
          item.badWordRanks = preferredCheck.badWordRanks
          item.audioFingerprint = preferredCheck.audioFingerprint
          item.audioCheckedAt = new Date(preferredCheck.checkedAt).toISOString()
        } else {
          item.badWordRanks = null
          item.audioFingerprint = null
          item.audioCheckedAt = null
          item.audioCheckStatus = 'unchecked'
        }
        itemElement.dataset.item = JSON.stringify(item)

        const title = document.createElement('h5')
        title.textContent = item.name
        const rankSummary = document.createElement('p')
        rankSummary.className = 'bad-word-ranks unchecked-ranks'
        rankSummary.setAttribute('aria-live', 'polite')
        const image = document.createElement('wc-meme-image')
        image.dataset.name = item.name
        const actions = document.createElement('div')
        const checkButton = document.createElement('button')
        checkButton.type = 'button'
        checkButton.className = 'check-audio'
        checkButton.textContent = 'Check audio'
        const playButton = document.createElement('button')
        playButton.type = 'button'
        playButton.className = 'play'
        playButton.textContent = 'Play'
        const addButton = document.createElement('button')
        addButton.type = 'button'
        addButton.className = 'add'
        addButton.textContent = is_display ? 'remove' : 'add'
        actions.append(checkButton, playButton, addButton)
        this.replaceChildren(title, rankSummary, image, actions)

        function renderAudioCheckStatus() {
          rankSummary.replaceChildren()
          rankSummary.className = 'bad-word-ranks'

          if (item.audioCheckStatus === 'checking') {
            rankSummary.classList.add('checking-ranks')
            rankSummary.textContent = 'Checking the words in the audio…'
          } else if (item.audioCheckStatus === 'error') {
            rankSummary.classList.add('error-ranks')
            rankSummary.textContent = 'Could not check this audio — safety unknown'
          } else if (item.audioCheckStatus === 'inconclusive') {
            rankSummary.classList.add('inconclusive-ranks')
            rankSummary.textContent =
              'No clear words recognized — safety unknown'
          } else if (isChecked(item) && item.badWordRanks.length) {
            rankSummary.classList.add('has-ranks')
            rankSummary.append('Bad-word numbers heard: ')
            const strong = document.createElement('strong')
            strong.textContent = item.badWordRanks.join(', ')
            rankSummary.append(strong)
          } else if (isChecked(item)) {
            rankSummary.classList.add('no-ranks')
            rankSummary.textContent = 'No ranked words detected in the audio'
          } else {
            rankSummary.classList.add('unchecked-ranks')
            rankSummary.textContent = 'Audio not checked yet'
          }

          checkButton.hidden = Boolean(getCompletedAudioCheck(item))
          checkButton.disabled = item.audioCheckStatus === 'checking'
          checkButton.textContent =
            item.audioCheckStatus === 'error' ? 'Retry check' : 'Check audio'

          if (
            item.audioCheckStatus !== 'checking' &&
            !playButton.hasAttribute('data-state')
          ) {
            const needsWarning =
              item.audioCheckStatus === 'inconclusive' ||
              (isChecked(item) && item.badWordRanks.length > 0)
            playButton.textContent = needsWarning ? 'Play anyway' : 'Play'
          }
        }

        function invalidateAudioCheck() {
          removeAudioCheck(item.audio)
          item.badWordRanks = null
          item.audioFingerprint = null
          item.audioCheckedAt = null
          item.audioCheckStatus = 'unchecked'
          itemElement.dataset.item = JSON.stringify(item)
          renderAudioCheckStatus()
        }

        const onMemeAudioChanged = (event: Event) => {
          const changedAudio = (event as CustomEvent<{audio?: unknown}>).detail
            ?.audio
          if (changedAudio === item.audio) invalidateAudioCheck()
        }
        document.addEventListener('meme_audio_changed', onMemeAudioChanged)

        const onAudioCheckUpdated = (event: Event) => {
          const detail = (
            event as CustomEvent<{audio?: unknown; result?: unknown}>
          ).detail
          if (detail?.audio !== item.audio) return

          const updatedCheck = getCachedAudioCheck(item.audio)
          if (updatedCheck) {
            item.audioCheckStatus = updatedCheck.audioCheckStatus
            item.badWordRanks = updatedCheck.badWordRanks
            item.audioFingerprint = updatedCheck.audioFingerprint
            item.audioCheckedAt = new Date(
              updatedCheck.checkedAt
            ).toISOString()
          } else {
            item.audioCheckStatus = 'unchecked'
            item.badWordRanks = null
            item.audioFingerprint = null
            item.audioCheckedAt = null
          }

          itemElement.dataset.item = JSON.stringify(item)
          renderAudioCheckStatus()
        }
        document.addEventListener(
          AUDIO_CHECK_UPDATED_EVENT,
          onAudioCheckUpdated
        )

        let analysisPromise: Promise<AudioCheckResult> | undefined
        let analysisAbortController: AbortController | undefined

        async function analyzeAudio() {
          const completedCheck = getCompletedAudioCheck(item)
          if (completedCheck) return completedCheck
          if (analysisPromise) return analysisPromise

          analysisPromise = (async () => {
            item.audioCheckStatus = 'checking'
            renderAudioCheckStatus()
            analysisAbortController = new AbortController()

            try {
              const response = await fetchTalkers2Audio(
                '/api/analyze_meme_audio',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({audio: item.audio}),
                  signal: analysisAbortController.signal,
                }
              )

              if (!response.ok) throw new Error('Audio check failed')

              const result = (await response.json()) as {
                audioCheckStatus?: unknown
                badWordRanks?: unknown
                audioFingerprint?: unknown
              }

              const hasValidFingerprint =
                isAudioFingerprint(result.audioFingerprint)
              const isCheckedResult =
                hasValidFingerprint &&
                result.audioCheckStatus === 'checked' &&
                isBadWordRanks(result.badWordRanks)
              const isInconclusiveResult =
                hasValidFingerprint &&
                result.audioCheckStatus === 'inconclusive' &&
                result.badWordRanks === null

              if (!isCheckedResult && !isInconclusiveResult) {
                throw new Error('Audio check returned an invalid result')
              }

              const completedResult: AudioCheckResult = isCheckedResult
                ? {
                    audioCheckStatus: 'checked',
                    badWordRanks: result.badWordRanks as number[],
                    audioFingerprint: result.audioFingerprint as string,
                  }
                : {
                    audioCheckStatus: 'inconclusive',
                    badWordRanks: null,
                    audioFingerprint: result.audioFingerprint as string,
                  }

              item.badWordRanks = completedResult.badWordRanks
              item.audioFingerprint = completedResult.audioFingerprint
              item.audioCheckedAt = new Date().toISOString()
              item.audioCheckStatus = completedResult.audioCheckStatus
              itemElement.dataset.item = JSON.stringify(item)
              saveAudioCheck(item.audio, completedResult)
              renderAudioCheckStatus()
              return completedResult
            } catch (error) {
              item.badWordRanks = null
              item.audioFingerprint = null
              item.audioCheckedAt = null
              item.audioCheckStatus = 'error'
              itemElement.dataset.item = JSON.stringify(item)
              renderAudioCheckStatus()
              throw error
            } finally {
              analysisAbortController = undefined
              analysisPromise = undefined
            }
          })()

          return analysisPromise
        }

        renderAudioCheckStatus()

        checkButton.addEventListener('click', async () => {
          try {
            await analyzeAudio()
          } catch (error) {
            console.error('Could not check this sound', error)
          }
        })

        let audio: HTMLAudioElement | undefined
        let audioObjectUrl: string | undefined
        let playbackAbortController: AbortController | undefined

        async function loadAudioCached() {
          if (audio) return audio

          playbackAbortController = new AbortController()
          const response = await fetchTalkers2Audio('/api/get_meme', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              audio: item.audio,
              audioFingerprint: item.audioFingerprint,
            }),
            signal: playbackAbortController.signal,
          })

          if (response.status === 409) {
            invalidateAudioCheck()
            throw new Error('The sound changed and must be checked again')
          }

          if (!response.ok) throw new Error('Failed to fetch MP3')
          const blob = await response.blob()
          audioObjectUrl = URL.createObjectURL(blob)
          audio = new Audio(audioObjectUrl)
          playbackAbortController = undefined

          audio.addEventListener('ended', () => {
            if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl)
            audioObjectUrl = undefined
            audio = undefined
            playButton.removeAttribute('data-state')
            playButton.removeEventListener('click', onPlayPause)
            playButton.removeEventListener('click', onPlayResume)
            playButton.addEventListener('click', onPlayInitial)
            renderAudioCheckStatus()
          })

          return audio
        }

        function onPlayResume(e: Event) {
          const target = e.target as HTMLButtonElement
          audio?.play?.()
          target.innerText = 'Playing'
          target.removeEventListener('click', onPlayResume)
          target.addEventListener('click', onPlayPause)
        }

        function onPlayPause(e: Event) {
          const target = e.target as HTMLButtonElement
          audio?.pause?.()
          target.innerText = 'Paused'
          target.removeEventListener('click', onPlayPause)
          target.addEventListener('click', onPlayResume)
        }

        async function onPlayInitial(e: Event) {
          const target = e.target as HTMLButtonElement
          if (!target) return

          e.preventDefault()
          const neededAudioCheck = !getCompletedAudioCheck(item)

          if (neededAudioCheck) {
            target.disabled = true
            target.innerText = 'Checking…'

            try {
              const completedCheck = await analyzeAudio()
              target.disabled = false

              if (
                completedCheck.audioCheckStatus === 'inconclusive' ||
                completedCheck.badWordRanks.length
              ) {
                renderAudioCheckStatus()
                return
              }
            } catch (error) {
              console.error(
                'The sound was not played because checking failed',
                error
              )
              target.disabled = false
              target.innerText = 'Play'
              return
            }
          }

          try {
            target.disabled = true
            target.innerText = 'Loading...'

            const loadedAudio = await loadAudioCached()
            await loadedAudio.play()

            target.removeEventListener('click', onPlayInitial)
            target.addEventListener('click', onPlayPause)
            target.disabled = false
            target.setAttribute('data-state', '1')
            target.innerText = 'Playing'
          } catch (error) {
            console.error('Could not play this sound', error)
            target.disabled = false
            target.removeAttribute('data-state')
            target.removeEventListener('click', onPlayPause)
            target.removeEventListener('click', onPlayResume)
            target.addEventListener('click', onPlayInitial)
            renderAudioCheckStatus()
          }
        }

        playButton.addEventListener('click', onPlayInitial)

        addButton.addEventListener('click', () => {
          if (is_display) {
            return this.parentElement?.removeChild(this)
          }

          const event = new CustomEvent('add_meme_sound', {
            detail: item,
            bubbles: true,
            composed: true,
          })
          console.count('hit add')
          this.dispatchEvent(event)
        })

        itemElement.cleanupMemeAudio = () => {
          analysisAbortController?.abort()
          playbackAbortController?.abort()
          document.removeEventListener(
            'meme_audio_changed',
            onMemeAudioChanged
          )
          document.removeEventListener(
            AUDIO_CHECK_UPDATED_EVENT,
            onAudioCheckUpdated
          )
          audio?.pause()
          audio = undefined
          if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl)
          audioObjectUrl = undefined
        }
      }

      disconnectedCallback() {
        ;(this as MemeItemElement).cleanupMemeAudio?.()
      }
    }
  )
