import './wc-prosody'

let savedRange: Range | null = null

const d = document

d.addEventListener('DOMContentLoaded', async e => {
  const $ = (selectors: string) => d.querySelector(selectors)
  const $$ = (selectors: string) => d.querySelectorAll(selectors)

  const e_main_input = $('#main_input') as HTMLDivElement
  const e_edit_area = $('#edit_area')

  const updateCaretPosition = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      savedRange = selection.getRangeAt(0) // Save the current range
    }
  }

  e_main_input.addEventListener('click', updateCaretPosition)
  e_main_input.addEventListener('keyup', updateCaretPosition)

  $$('.buttons .add_tag')?.forEach(item => {
    item.addEventListener('click', e => {
      const target = e.target as HTMLButtonElement
      const {type = 'wc-prosody'} = target?.dataset || {}
      const element = d.createElement(type)
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
    e?.detail?.element?.renderEdit?.(e_edit_area)
  })
})
