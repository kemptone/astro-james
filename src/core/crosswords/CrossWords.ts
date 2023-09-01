import ProtoForm from '../../components/ProtoForm/ProtoForm'

const values = {
  width: 9,
  height: 9,
  words: ['hello', 'world'],
  grid: new Array(9)
}

// have to do it this way, or it will be a reference to the same array
for (let i = 0; i < values.height; i++) {
    values.grid[i] = new Array(values.width).fill(' ')
}

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
  },
})

function changeGrid() {
  const width = parseInt(e_width.value)
  const height = parseInt(e_height.value)
  const words = e_words.value.split(new RegExp('[\n ]')).filter(Boolean)
  const grid = new Array(height).fill(new Array(width).fill(''))
  values.width = width
  values.height = height
  values.words = words
  values.grid = grid
  console.log(values)
}

function addWord(word: string, tries = 0) {
  const direction = Math.random() < 0.5 ? 'horizontal' : 'vertical'
  const x = Math.floor(Math.random() * values.width)
  const y = Math.floor(Math.random() * values.height)

  console.log({
    x,
    y,
    word,
    tries,
    direction,
  })

  function tryAgain() {
    if (tries > 100) {
      return false
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

    // add word
    for (let i = 0; i < word.length; i++) {
        values.grid[y][x + i] = word[i]
    }

  }

  if (direction === 'vertical') {
    if (y + word.length > values.height) {
      return tryAgain()
    }
    for (let i = 0; i < word.length; i++) {
      if (values.grid[y + 1][x] !== ' ') {
        return tryAgain()
      }
    }

    // add word
    for (let i = 0; i < word.length; i++) {
        values.grid[y + i][x] = word[i]
    }
  }

}

addWord('fardo')
console.log(values)