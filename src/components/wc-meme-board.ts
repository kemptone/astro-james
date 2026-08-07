import {
  AUDIO_CHECK_UPDATED_EVENT,
  getPreferredAudioCheck,
} from './wc-meme-item'
import type {MemeType} from './wc-meme-item'
import {
  parseSoundRankList,
  soundCheckMatchesAudienceModes,
  soundCheckHasAnyNumber,
  type CompletedSoundCheck,
} from '@/core/talkers2/sound-rank-filter'
const SOUNDS_PAGE_SIZE = 100

function normalizeSoundSearch(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[“”"]/g, '"')
    .trim()
}

let cachedMemes: MemeType[] | null = null

export const getMemes = async () => {
  if (cachedMemes) return cachedMemes
  const results = await fetch('/api/get_memes?ranking=audio-v1', {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  try {
    if (!results.ok) throw new Error(`Could not load sounds (${results.status})`)
    const data = (await results.json()) as MemeType[]
    cachedMemes = data
    return data
  } catch (error) {
    console.error(error)
    return null
  }
}

if (typeof window != 'undefined')
  customElements.define(
    'wc-meme-board',
    class MemeBoard extends HTMLElement {
      cleanupAudioCheckListener?: () => void

      async connectedCallback() {
        if (this.dataset.memeBoardInitialized === 'true') return
        this.dataset.memeBoardInitialized = 'true'

        const data = ((await getMemes()) || []).filter(item => item.name)

        const e_list = this.querySelector('.list') as HTMLDivElement
        const e_filter = this.querySelector(
          'input[name="filter"]'
        ) as HTMLInputElement
        const e_excluded_ranks = this.querySelector(
          'input[name="exclude_ranks"]'
        ) as HTMLInputElement
        const e_kid_mode = this.querySelector(
          'input[name="kid_mode"]'
        ) as HTMLInputElement
        const e_adult_mode = this.querySelector(
          'input[name="adult_mode"]'
        ) as HTMLInputElement
        const e_bad_words_mode = this.querySelector(
          'input[name="bad_words_mode"]'
        ) as HTMLInputElement
        if (e_kid_mode) e_kid_mode.checked = true
        if (e_adult_mode) e_adult_mode.checked = false
        if (e_bad_words_mode) e_bad_words_mode.checked = false
        const e_count = this.querySelector(
          '[data-sound-count]'
        ) as HTMLOutputElement
        const e_show_more = this.querySelector(
          '.show-more-sounds'
        ) as HTMLButtonElement
        const renderedItems = new Map<string, HTMLElement>()
        const sourceOrder = new Map(
          data.map((item, index) => [item.audio, index])
        )
        const normalizedNames = new Map(
          data.map(item => [item.audio, normalizeSoundSearch(item.name)])
        )
        let visibleLimit = SOUNDS_PAGE_SIZE

        function completedCheck(item: MemeType): CompletedSoundCheck | null {
          const preferredCheck = getPreferredAudioCheck(item)

          if (preferredCheck?.audioCheckStatus === 'checked') {
            return {
              audioCheckStatus: 'checked',
              badWordRanks: preferredCheck.badWordRanks,
            }
          }

          if (preferredCheck?.audioCheckStatus === 'inconclusive') {
            return {
              audioCheckStatus: 'inconclusive',
              badWordRanks: null,
            }
          }

          return null
        }

        function updateCount(
          count: number,
          showing: number,
          rankMode: boolean,
          rankedOrUncheckedMode: boolean,
          checkedCount: number,
          hasAudioNumberFilter: boolean
        ) {
          if (e_count) {
            const noun = rankMode
              ? rankedOrUncheckedMode
                ? count === 1
                  ? 'ranked or unchecked sound'
                  : 'ranked or unchecked sounds'
                : count === 1
                  ? 'checked match'
                  : 'checked matches'
              : count === 1
                ? 'sound'
                : 'sounds'
            const parts = [`${count.toLocaleString()} ${noun}`]

            if (showing < count) {
              parts.push(`showing ${showing.toLocaleString()}`)
            }
            if (hasAudioNumberFilter) {
              parts.push(
                `${checkedCount.toLocaleString()} of ${data.length.toLocaleString()} classified`
              )
            }

            e_count.textContent = parts.join(' · ')
          }
        }

        function build() {
          const value = normalizeSoundSearch(e_filter?.value || '')
          const searchedRanks = parseSoundRankList(value)
          const excludeValue = e_excluded_ranks?.value.trim() || ''
          const excludedRanks = parseSoundRankList(excludeValue)
          const hasInvalidExclusions = Boolean(excludeValue && !excludedRanks)

          e_excluded_ranks?.setCustomValidity(
            hasInvalidExclusions
              ? 'Use numbers 1 through 41 separated by commas.'
              : ''
          )

          const checks = new Map(
            data.map(item => [item.audio, completedCheck(item)])
          )
          const checkedCount = Array.from(checks.values()).filter(
            check => check?.audioCheckStatus === 'checked'
          ).length
          const audienceModes = {
            kid: e_kid_mode?.checked ?? true,
            adult: e_adult_mode?.checked ?? false,
            badWords: e_bad_words_mode?.checked ?? false,
          }
          const searchedData = searchedRanks
            ? data.filter(item =>
                soundCheckHasAnyNumber(
                  checks.get(item.audio) || null,
                  searchedRanks
                )
              )
            : value
              ? data.filter(item =>
                  normalizedNames.get(item.audio)?.includes(value)
                )
              : data
          const modeFilteredData = searchedRanks
            ? searchedData
            : searchedData.filter(item =>
                soundCheckMatchesAudienceModes(
                  checks.get(item.audio) || null,
                  audienceModes
                )
              )
          const filteredData = excludedRanks
            ? modeFilteredData.filter(
                item => {
                  const check = checks.get(item.audio) || null

                  // Hiding 41 is the explicit "checked clean only" mode, so
                  // unchecked and inconclusive sounds must not leak into it.
                  if (
                    excludedRanks.includes(41) &&
                    check?.audioCheckStatus !== 'checked'
                  ) {
                    return false
                  }

                  return !soundCheckHasAnyNumber(check, excludedRanks)
                }
              )
            : modeFilteredData
          const visibleData = filteredData.slice(0, visibleLimit)
          const visibleAudioUrls = new Set(
            visibleData.map(item => item.audio)
          )

          renderedItems.forEach((element, audioUrl) => {
            element.hidden = !visibleAudioUrls.has(audioUrl)
          })

          visibleData.forEach(item => {
            let element = renderedItems.get(item.audio)
            if (!element) {
              const itemOrder = sourceOrder.get(item.audio) || 0
              element = document.createElement('wc-meme-item')
              element.dataset.item = JSON.stringify(item)
              element.dataset.sourceOrder = String(itemOrder)
              renderedItems.set(item.audio, element)

              const nextElement = Array.from(e_list.children).find(child => {
                const childOrder = Number(
                  (child as HTMLElement).dataset.sourceOrder
                )
                return childOrder > itemOrder
              })
              e_list.insertBefore(element, nextElement || null)
            }

            element.hidden = false
          })
          updateCount(
            filteredData.length,
            visibleData.length,
            Boolean(searchedRanks),
            Boolean(searchedRanks?.includes(41)),
            checkedCount,
            Boolean(searchedRanks || excludedRanks)
          )

          if (e_show_more) {
            const remaining = filteredData.length - visibleData.length
            e_show_more.hidden = remaining <= 0
            e_show_more.textContent = `Show ${Math.min(
              SOUNDS_PAGE_SIZE,
              remaining
            ).toLocaleString()} more`
          }
        }

        e_filter?.addEventListener?.('input', () => {
          visibleLimit = SOUNDS_PAGE_SIZE
          build()
        })

        e_excluded_ranks?.addEventListener('input', () => {
          visibleLimit = SOUNDS_PAGE_SIZE
          build()
        })

        ;[e_kid_mode, e_adult_mode, e_bad_words_mode].forEach(input => {
          input?.addEventListener('change', () => {
            visibleLimit = SOUNDS_PAGE_SIZE
            build()
          })
        })

        document.addEventListener(AUDIO_CHECK_UPDATED_EVENT, build)
        this.cleanupAudioCheckListener = () => {
          document.removeEventListener(AUDIO_CHECK_UPDATED_EVENT, build)
        }

        e_show_more?.addEventListener('click', () => {
          visibleLimit += SOUNDS_PAGE_SIZE
          build()
        })

        build()
      }

      disconnectedCallback() {
        this.cleanupAudioCheckListener?.()
        this.cleanupAudioCheckListener = undefined
        delete this.dataset.memeBoardInitialized
      }
    }
  )
