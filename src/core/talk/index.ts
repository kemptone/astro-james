import './wc-prosody'
import './wc-emphasis'
import './wc-break'
import './wc-say-as'
import './wc-voice'
import { getMicrosoftVoices } from './helpers'
import { playTextAzure, playSSMLAzure } from '../talkers2/wc-talkers.helpers'

let savedRange: Range | null = null

const d = document

d.addEventListener('DOMContentLoaded', async e => {
  const $ = (selectors: string) => d.querySelector(selectors)
  const $$ = (selectors: string) => d.querySelectorAll(selectors)

  const e_main_input = $('#main_input') as HTMLDivElement
  const e_edit_area = $('#edit_area')

  const voices = await getMicrosoftVoices()

  const updateCaretPosition = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      savedRange = selection.getRangeAt(0) // Save the current range
    }
  }

  const initialVoice = voices[0]

  e_main_input.innerHTML = `
    <wc-voice name="${initialVoice.LocalName }">
    <img src="${ initialVoice.Face }">
    Turkey ate a salad</wc-voice>
  `

  e_main_input.addEventListener('click', updateCaretPosition)
  e_main_input.addEventListener('keyup', updateCaretPosition)

  e_main_input.addEventListener('click', e => {
    if (e_edit_area) e_edit_area.innerHTML = ''
  })

  $("#clear_all")?.addEventListener('click', () => {
    e_main_input.innerHTML = ''
  })

  $("#play_all")?.addEventListener('click', () => {
    const ssml = e_main_input.innerHTML
      .replaceAll('<div>', '')
      .replaceAll('</div>', '')
      .replaceAll('<br>', '')
      .replaceAll('<wc-', '<')
      .replaceAll('</wc-', '</')
      .replaceAll('&nbsp;', ' ')
      .replaceAll('\n', '')
      .replaceAll('𛲣', '')
      .replaceAll('</break>', '')
      .replaceAll(/<img[^>]*>/g, "")

      playSSMLAzure({ values : {
        ssml
      }}, true)
  })

  $$('.buttons .add_tag')?.forEach(item => {
    item.addEventListener('click', e => {
      const target = e.target as HTMLButtonElement
      const {type = 'wc-prosody'} = target?.dataset || {}
      const element = d.createElement(type)
      if (type === 'wc-break')
        element.append('𛲣')
      else
        element.append(' turkey ')

      if (savedRange) {
        const selection = window.getSelection()

        if (!selection) return

        selection.removeAllRanges()
        selection.addRange(savedRange)

        // Insert the text at the caret position
        savedRange.insertNode(element)

        // Add a space after the inserted element
        const spaceNode = document.createTextNode(' ')
        savedRange.setStartAfter(element) // Move range to after the element
        savedRange.insertNode(spaceNode)

        // Move the caret after the space
        savedRange.setStartAfter(spaceNode)
        savedRange.setEndAfter(spaceNode)
        selection.removeAllRanges()
        selection.addRange(savedRange)
      } else {
        alert('Click inside the editor to set a position first.')
      }

      // e_main_input?.appendChild(element)
    })
  })

  d.addEventListener('clicked_edit', e => {
    e?.detail?.element?.renderEdit?.(e_edit_area, voices)
  })
})
