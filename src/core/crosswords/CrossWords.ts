import ProtoForm from '../../components/ProtoForm/ProtoForm'
import {persist, populate} from '../../helpers/localStorage'
const stored_values = populate('crosswords-values')
type OtherSettings = 'is_uppercase' | 'is_squared'

const values: {
  width: number
  height: number
  words: string
  placed_words: string[]
  grid: string[][]
  other_settings: OtherSettings[]
} = stored_values || {
  width: 9,
  height: 9,
  words: '𓂾 𓄁 𓃰 𓃽 𓅮 james kempton',
  placed_words: [''],
  grid: new Array(9),
  other_settings: [],
}

function buildX(height = 9, width = 9) {
  // have to do it this way, or it will be a reference to the same array
  for (let i = 0; i < height; i++) {
    values.grid[i] = new Array(width).fill(' ')
  }
}

function buildOtherSettings () {
  e_body.className = ''
    values.other_settings?.forEach(setting => {
      e_body.classList.add(setting)
    })
}

const e_body = document.body
const e_reset = document.querySelector('#reset') as HTMLButtonElement
const e_grid = document.querySelector('#crosswordgrid') as HTMLDivElement
const e_words_list = document.querySelector(
  '#words-to-find-list'
) as HTMLDivElement
const e_width = document.querySelector(
  'input[name="width"]'
) as HTMLInputElement
const e_height = document.querySelector(
  'input[name="height"]'
) as HTMLInputElement
const e_words = document.querySelector(
  'textarea[name="words"]'
) as HTMLTextAreaElement
const e_form = document.querySelector('form#crosswords') as HTMLFormElement
const e_dialog = document.querySelector('dialog#settings') as HTMLDialogElement
const e_settings = document.querySelector('#showsettings') as HTMLButtonElement

function printFindTheWords() {
  values.placed_words.forEach(word => {
    if (word.codePointAt(0) > 500) return
    const e_word = document.createElement('span')
    e_word.innerText = word
    e_words_list.appendChild(e_word)
  })
}

function changeGrid() {
  const width = parseInt(e_width.value)
  const height = parseInt(e_height.value)
  const grid = new Array(height)
  values.width = width
  values.height = height
  values.words = e_words.value
  values.grid = grid
  buildX(height, width)
}

function addWord(word: string, tries = 0): void {
  const direction = Math.random() < 0.5 ? 'horizontal' : 'vertical'
  const x = Math.floor(Math.random() * values.width)
  const y = Math.floor(Math.random() * values.height)

  function tryAgain() {
    if (tries > 300) {
      return
    }
    return addWord(word, tries + 1)
  }

  if (direction === 'horizontal') {
    if (x + word.length > values.width) {
      return tryAgain()
    }
    for (let i = 0; i < word.length; i++) {
      if (values.grid[y][x + i] !== ' ') {
        return tryAgain()
      }
    }

    values.placed_words.push(word)

    let chars = word.match(/./gu) as RegExpMatchArray
    let i = 0
    for (let char of chars) {
      values.grid[y][x + i] = char
      i++
    }
  }

  if (direction === 'vertical') {
    if (y + word.length > values.height) {
      return tryAgain()
    }
    for (let i = 0; i < word.length; i++) {
      if (values.grid[y + i][x] !== ' ') {
        return tryAgain()
      }
    }

    values.placed_words.push(word)

    let chars = word.match(/./gu) as RegExpMatchArray
    let i = 0
    for (let char of chars) {
      values.grid[y + i][x] = char
      i++
    }
  }
}

function buildGrid() {
  e_grid.innerHTML = ''
  for (let y = 0; y < values.height; y++) {
    const e_row = document.createElement('div')
    e_row.classList.add('row')
    for (let x = 0; x < values.width; x++) {
      const e_cell = document.createElement('div')
      e_cell.classList.add('cell')
      e_cell.innerText = values.grid[y][x]
      e_row.appendChild(e_cell)
    }
    e_grid.appendChild(e_row)
  }
}

function fillGrid() {
  for (let y = 0; y < values.height; y++) {
    for (let x = 0; x < values.width; x++) {
      if (values.grid[y][x] === ' ') {
        values.grid[y][x] = String.fromCharCode(
          Math.floor(Math.random() * 26) + 97
        )
      }
    }
  }
}

function buildFromWords() {
  buildX(values.height, values.width)
  values.placed_words.length = 0
  ;(e_words.value || '')
    .split(new RegExp('[\n ,.]'))
    .filter(Boolean)
    .forEach(word => {
      addWord(word)
    })

  fillGrid()
  e_words_list.innerHTML = ''
  printFindTheWords()
  persist('crosswords-values', values)
  buildGrid()
}

function init() {
  ProtoForm<{
    height: string
    width: string
    words: string
    other_settings: OtherSettings[]
  }>({
    e_form,
    onChange: args => {
      values.other_settings = args.values.other_settings
      persist('crosswords-values', values)
      buildOtherSettings()
    },
    onBlur: args => {
      values.other_settings = args.values.other_settings
      persist('crosswords-values', values)
      buildOtherSettings()
      if (
        args.values.words === values.words &&
        Number(args.values.width) === values.width &&
        Number(args.values.height) === values.height
      ) {
        e_form.classList.add('is-dirty')
        // e_button.setAttribute('disabled', 'disabled')
      } else {
        e_form.classList.remove('is-dirty')
        // e_button.removeAttribute('disabled')
      }
    },
    onSubmit: args => {
      e_form.classList.add('is-dirty')
      // e_button.setAttribute('disabled', 'disabled')
      if (
        args.values.words === values.words &&
        Number(args.values.width) === values.width &&
        Number(args.values.height) === values.height
      )
        return
      changeGrid()
      buildFromWords()
    },
  })

  e_settings.addEventListener('click', e => {
    e.preventDefault()
    e_dialog.showModal()
  })

  e_dialog.addEventListener('click', e => {
    e.stopPropagation()
    const target = e.target as HTMLDialogElement

    if (target.nodeName === 'DIALOG' || target.nodeName === 'BUTTON') {
      if (
        e.offsetX < 0 ||
        e.offsetX > target.offsetWidth ||
        e.offsetY < 0 ||
        e.offsetY > target.offsetHeight
      ) {
        e_dialog.close()
      }
    }
  })

  e_words.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // changeGrid()
      // buildFromWords()
      e_form.querySelector('button[type="submit"]')?.click()
    }
  })

  e_reset.addEventListener('click', e => {
    e.preventDefault()
    if (confirm('Are you sure you want to reset?')) {
      localStorage.clear()
      location.reload()
    }
  })

  if (stored_values) {
    e_words.value = values.words
    e_height.value = values.height.toString()
    e_width.value = values.width.toString()
    buildGrid()
    e_form.classList.add('is-dirty')
    // e_button.setAttribute('disabled', 'disabled')
  } else {
    buildFromWords()
    e_form.classList.add('is-dirty')
    // e_button.setAttribute('disabled', 'disabled')
  }

  e_words_list.innerHTML = ''
  printFindTheWords()
  buildOtherSettings()

  e_form.querySelectorAll("input[name='other_settings']").forEach((e:HTMLInputElement) => {
    e.checked = values.other_settings?.includes(e.value as OtherSettings)
  })

}

init()
