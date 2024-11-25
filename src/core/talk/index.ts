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
    console.count("updateCaretPosition")
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      savedRange = selection.getRangeAt(0) // Save the current range
    }
  }

  e_main_input.innerHTML = `<wc-voice></wc-voice>`

  e_main_input.addEventListener('click', updateCaretPosition)
  e_main_input.addEventListener('keyup', updateCaretPosition)
  e_main_input.addEventListener('clicked_edit', updateCaretPosition)

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


      if (type === 'wc-voice') {
        e_main_input.appendChild(element)
        element?.renderEdit?.(e_edit_area, voices)
        return
      }


      if (savedRange) {
        const selection = window.getSelection()

        if (!selection) return

        selection.removeAllRanges()
        selection.addRange(savedRange)

        // Insert the text at the caret position
        savedRange.insertNode(element)

        element?.renderEdit?.(e_edit_area, voices)

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

    })
  })

  d.addEventListener('clicked_edit', e => {
    e?.detail?.element?.renderEdit?.(e_edit_area, voices)
  })
})
