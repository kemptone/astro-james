const State = {
  rows: 2,
  boxes: 10,
}

const $ = (a: string) => document.querySelector(a)
const e_boxes = $(`input[name="boxes"]`) as HTMLInputElement
const e_rows = $(`input[name="rows"]`) as HTMLInputElement
const e_all_of_the_boxes = $('.all-of-the-boxes') as HTMLDivElement

function updateGridLayout() {
  const rows = State.rows
  const boxes = State.boxes

  const gridContainer = document.getElementById(
    'all_of_the_boxes'
  ) as HTMLDivElement

  // Calculate the number of columns based on rows and totalBoxes
  const columns = Math.ceil(boxes / rows)

  // Set the grid-template-rows and grid-template-columns properties
  gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`
  gridContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`

  // Clear existing grid items
  gridContainer.innerHTML = ''

  // Add the grid items
  for (let i = 0; i < boxes; i++) {
    const e_box = document.createElement('label')
    const e_inner = document.createElement('span')
    const e_input = document.createElement('input')
    e_box.appendChild(e_input)
    e_box.appendChild(e_inner)
    e_input.type = 'checkbox'
    e_box.className = 'grid-item'
    e_inner.textContent = i + 1
    gridContainer.appendChild(e_box)
  }
}

function render() {
  e_all_of_the_boxes.innerHTML = ''
}

e_boxes?.addEventListener('input', e => {
  const target = e?.target as HTMLInputElement
  State.boxes = parseInt(target.value)
  updateGridLayout()
})

e_rows?.addEventListener('input', e => {
  const target = e?.target as HTMLInputElement
  State.rows = parseInt(target.value)
  updateGridLayout()
})

document.addEventListener('readystatechange', () => {
  updateGridLayout()
})
