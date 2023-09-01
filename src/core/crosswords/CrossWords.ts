import ProtoForm from '../../components/ProtoForm/ProtoForm'

const values = {
  width: 9,
  height: 9,
  words: ['fardo', 'the', 'lop', 'was', 'here'],
  grid: new Array(9),
}

function buildX(height = 9, width = 9) {
  // have to do it this way, or it will be a reference to the same array
  for (let i = 0; i < height; i++) {
    values.grid[i] = new Array(width).fill(' ')
  }
}

buildX(values.height, values.width)

const e_grid = document.querySelector('#crosswordgrid') as HTMLDivElement
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
const protoForm = ProtoForm<{
  height: string
  width: string
  words: string
}>({
  e_form,
  onSubmit: e => {
    changeGrid()
    buildFromWords()
  },
})

function changeGrid() {
  const width = parseInt(e_width.value)
  const height = parseInt(e_height.value)
  const words = e_words.value.split(new RegExp('[\n ,.]')).filter(Boolean)
  const grid = new Array(height)
  values.width = width
  values.height = height
  values.words = words
  values.grid = grid
  buildX(height, width)
  console.log(values)
}

function addWord(word: string, tries = 0): void {
  const direction = Math.random() < 0.5 ? 'horizontal' : 'vertical'
  const x = Math.floor(Math.random() * values.width)
  const y = Math.floor(Math.random() * values.height)

  function tryAgain() {
    if (tries > 100) {
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

    let chars = word.match(/./ug) as RegExpMatchArray
    let i = 0
    for (let char of chars) {
      values.grid[y][x + i] = char
      i++
    }

  }

  if (direction === 'vertical') {
    if (y + word.length >= values.height) {
      return tryAgain()
    }
    for (let i = 0; i < word.length; i++) {
      if (values.grid[y + i][x] !== ' ') {
        return tryAgain()
      }
    }

    let chars = word.match(/./ug) as RegExpMatchArray
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
  ;(e_words.value || '')
    .split(new RegExp('[\n ,.]'))
    .filter(Boolean)
    .forEach(word => {
      addWord(word)
    })
  fillGrid()
  buildGrid()
}

buildFromWords()
