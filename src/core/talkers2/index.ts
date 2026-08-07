import {
  playTextAzure,
  getMicrosoftVoices,
  playMeme,
  compressWordGaps,
} from './wc-talkers.helpers'
import type {Talkers2VoiceDetails as VoiceDetails} from './types'
import './wc-talker-azure'
import {swapBadWordRanksForPlayback} from './playback-text'
import {getPreferredAudioCheck} from '../../components/wc-meme-item'
import {$, $$, d} from '../grok/grok.helpers'
import type {MemeType} from '@/components/wc-meme-item'

d.addEventListener('DOMContentLoaded', async e => {
  const data = await getMicrosoftVoices()
  const e_list = $('#list') as HTMLFormElement
  const e_main_form = $('#main_form') as HTMLFormElement
  const e_input_area = $('#input_area') as HTMLElement
  const e_fragment = d.createDocumentFragment()
  const e_clear_all = d.getElementById('clear_all')
  const e_remove_all = d.getElementById('remove_all')
  const e_play_all = d.getElementById('play_all')
  const e_hidden_button = d.getElementById('hidden_button')
  const e_sounds_dialog = d.getElementById('sounds') as HTMLDialogElement
  const searchParams = new URLSearchParams(window.location.search)
  const prefilledText = searchParams.get('text')?.trim()

  d.getElementById('back_to_site')?.addEventListener('click', e => {
    location.href = '/'
  })

  d.getElementById('add_sound')?.addEventListener('click', e => {
    e_sounds_dialog.showModal()
  })

  data.sort((a, b) => {
    const hasA = Array.isArray(a.StyleList) ? 1 : 0
    const hasB = Array.isArray(b.StyleList) ? 1 : 0
    return hasB - hasA
  })

  data.forEach(item => {
    const element = d.createElement('wc-talker-azure')
    element.setAttribute('data-info', JSON.stringify(item))
    element.setAttribute('data-preview', '1')
    e_fragment.appendChild(element)
  })

  e_list.append(e_fragment)

  if (prefilledText && data[0]) {
    const element = d.createElement('wc-talker-azure')
    element.setAttribute('data-info', JSON.stringify(data[0]))
    e_input_area.appendChild(element)
    element.querySelector('textarea')?.setAttribute('rows', '4')
    const textarea = element.querySelector('textarea') as HTMLTextAreaElement | null

    if (textarea) {
      textarea.value = prefilledText
      textarea.dispatchEvent(new Event('input', {bubbles: true}))
    }
  }

  e_play_all?.addEventListener('click', async () => {
    const e_reversed = $('input[name="reversed"]') as HTMLInputElement
    const e_textreversed = $('input[name="textreversed"]') as HTMLInputElement
    const e_gap_percent = $('input[name="gap_percent"]') as HTMLInputElement
    const is_reversed = e_reversed?.checked
    const is_textreversed = e_textreversed?.checked
    const gapPercentRaw = e_gap_percent?.value?.trim?.() || ''
    const hasGapPercent = gapPercentRaw.length > 0
    const parsedGapPercent = Number(gapPercentRaw)

    if (hasGapPercent && !Number.isFinite(parsedGapPercent)) {
      alert('Gap % must be a number from 0 to 100')
      return
    }

    const gapPercent = hasGapPercent
      ? Math.max(0, Math.min(100, parsedGapPercent))
      : null

    e_hidden_button?.click()
    const audios: HTMLAudioElement[] = []
    const all_talkers = e_input_area.querySelectorAll(
      'wc-talker-azure, wc-meme-item'
    )
    const fields: VoiceDetails[] = []
    const uncheckedSounds: string[] = []
    const inconclusiveSounds: string[] = []
    const rankedSounds: Array<{name: string; ranks: number[]}> = []

    all_talkers.forEach(item => {
      if (item.tagName === 'WC-MEME-ITEM') {
        try {
          const memeElement = item as HTMLElement
          const obj = JSON.parse(memeElement.dataset.item || '{}') as MemeType
          const preferredCheck = getPreferredAudioCheck(obj)

          if (preferredCheck) {
            obj.audioCheckStatus = preferredCheck.audioCheckStatus
            obj.badWordRanks = preferredCheck.badWordRanks
            obj.audioFingerprint = preferredCheck.audioFingerprint
            obj.audioCheckedAt = new Date(
              preferredCheck.checkedAt
            ).toISOString()
            memeElement.dataset.item = JSON.stringify(obj)
          }
          const hasValidRanks =
            Array.isArray(obj.badWordRanks) &&
            obj.badWordRanks.every(
              rank => Number.isInteger(rank) && rank >= 1 && rank <= 40
            ) &&
            new Set(obj.badWordRanks).size === obj.badWordRanks.length
          const hasValidFingerprint =
            typeof obj.audioFingerprint === 'string' &&
            /^sha256-[a-f0-9]{64}$/.test(obj.audioFingerprint)

          if (obj.audioCheckStatus === 'inconclusive') {
            if (hasValidFingerprint) {
              inconclusiveSounds.push(obj.name)
            } else {
              uncheckedSounds.push(obj.name)
            }
          } else if (
            obj.audioCheckStatus !== 'checked' ||
            !hasValidRanks ||
            !hasValidFingerprint
          ) {
            uncheckedSounds.push(obj.name)
          } else if (obj.badWordRanks.length) {
            rankedSounds.push({name: obj.name, ranks: obj.badWordRanks})
          }

          // let audio = new Audio(obj.audio)
          const fakeField: VoiceDetails = {is_meme: true, ...obj}
          fields.push(fakeField)
          return
        } catch (error) {
          console.error(error)
        }
      }

      const thing: VoiceDetails = {}
      fields.push(thing)
      item
        .querySelectorAll('input[name], textarea[name], select[name]')
        .forEach(item => {
          // @ts-ignore
          thing[item.name] = item.value
        })
    })

    if (uncheckedSounds.length || inconclusiveSounds.length) {
      const reasons: string[] = []
      if (uncheckedSounds.length) {
        reasons.push(
          `check these sounds first: ${uncheckedSounds.join(', ')}`
        )
      }
      if (inconclusiveSounds.length) {
        reasons.push(
          `no clear words could be verified in: ${inconclusiveSounds.join(
            ', '
          )}; play those individually or remove them`
        )
      }
      alert(
        `Play All stopped because audio safety is unknown — ${reasons.join(
          '; '
        )}.`
      )
      return
    }

    if (rankedSounds.length) {
      alert(
        `Play All stopped because these sounds have bad-word numbers: ${rankedSounds
          .map(item => `${item.name} (${item.ranks.join(', ')})`)
          .join('; ')}. You can still use Play on a sound by itself.`
      )
      return
    }

    if (!fields.length) {
      alert("No text to play")
      return
    }

    /*
    const moderation = await fetch('/api/openai/openai_moderation', {
        method: 'POST',
        body: JSON.stringify({text: fields.map(item => item.text).join('. ')}),
    })

    const moderationData = await moderation.json()

    if (moderationData.results[0].flagged) {
      alert("Text contains flagged language, please stop doing this!")
      location.reload()
      return
    }
    */

    if (is_reversed) {
      fields.reverse()
    }

    for (let x = 0; x < fields.length; x++) {
      let field = fields[x]

      if (field.is_meme) {
        if (!field.audio || !field.audioFingerprint) continue
        try {
          const audio = await playMeme({
            audio: field.audio,
            audioFingerprint: field.audioFingerprint,
          })
          audios.push(audio)
        } catch (error) {
          console.error('Could not safely load a sound for Play All', error)
          alert(
            `Could not safely load ${field.name || 'a sound'}. Check its audio again.`
          )
          return
        }
        // audios.push(field.audio)
      } else {
        let text_to_say = swapBadWordRanksForPlayback(field.text || '')

        if (is_textreversed) {
          text_to_say = text_to_say.split(" ").reverse().join(" ")
        }

        let audio = await playTextAzure(
          {
            values: {
              text: text_to_say,
              ShortName: field.ShortName,
              Gender: field.Gender,
              Locale: field.Locale,
              express_as: field.express_as,
            },
          },
          false
        )

        if (gapPercent !== null) {
          audio = await compressWordGaps(audio, {percent: gapPercent})
        }

        audios.push(audio)
      }
    }
    playThenNext(audios)
  })

  e_remove_all?.addEventListener('click', () => {
    const all = e_input_area.querySelectorAll('wc-talker-azure')
    all.forEach(item => {
      e_input_area.removeChild(item)
    })
  })

  e_clear_all?.addEventListener('click', () => {
    const all = e_input_area.querySelectorAll('textarea')
  })

  e_list.addEventListener('clicked_add', e => {
    // @ts-ignore
    const detail = e.detail as Voice
    const element = d.createElement('wc-talker-azure')
    element.setAttribute('data-info', JSON.stringify(detail))
    e_input_area.appendChild(element)
  })

  d.addEventListener('add_meme_sound', e => {
    console.count('add_meme_sound')
    const detail = e.detail as MemeType
    const e_child = d.createElement('wc-meme-item')
    e_child.setAttribute('data-item', JSON.stringify(detail))
    e_child.setAttribute('data-is_display', 'true')
    e_input_area.appendChild(e_child)
    e_sounds_dialog.close()
  })
})

function playThenNext(audios: HTMLAudioElement[]) {
  const audio = audios.shift()
  if (!audio) return

  audio?.play?.()
  audio?.addEventListener('ended', () => {
    playThenNext(audios)
  })
}
