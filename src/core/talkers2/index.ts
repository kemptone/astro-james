import {playTextAzure, getMicrosoftVoices, playMeme} from './wc-talkers.helpers'
import type {Talkers2VoiceDetails as VoiceDetails} from './types'
import './wc-talker-azure'
import '../../components/wc-meme-item'
import {$, $$, d} from '../grok/grok.helpers'
import type {MemeType} from '@/components/wc-meme-item'

d.addEventListener('DOMContentLoaded', async e => {
  const data = await getMicrosoftVoices()
  const e_list = $('#list') as HTMLFormElement
  const e_input_area = $('#input_area') as HTMLFormElement
  const e_fragment = d.createDocumentFragment()
  const e_clear_all = d.getElementById('clear_all')
  const e_remove_all = d.getElementById('remove_all')
  const e_play_all = d.getElementById('play_all')
  const e_hidden_button = d.getElementById('hidden_button')
  const e_sounds_dialog = d.getElementById('sounds') as HTMLDialogElement

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

  e_play_all?.addEventListener('click', async () => {
    e_hidden_button?.click()
    const audios: HTMLAudioElement[] = []
    const all_talkers = e_input_area.querySelectorAll(
      'wc-talker-azure, wc-meme-item'
    )
    const fields: VoiceDetails[] = []

    all_talkers.forEach(item => {
      if (item.tagName === 'WC-MEME-ITEM') {
        try {
          let obj = JSON.parse(item?.dataset?.item || '{}')
          // let audio = new Audio(obj.audio)
          let fakeField: VoiceDetails = {is_meme: true, ...obj}
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

    for (let x = 0; x < fields.length; x++) {
      let field = fields[x]

      if (field.is_meme) {
        let audio = await playMeme(field)
        audios.push(audio)
        // audios.push(field.audio)
      } else {
        let audio = await playTextAzure(
          {
            values: {
              text: field.text,
              ShortName: field.ShortName,
              Gender: field.Gender,
              Locale: field.Locale,
              express_as: field.express_as,
            },
          },
          false
        )
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
