// gridModule.js
// This module uses Fabric.js for canvas rendering and interaction.
// Install Fabric.js via npm: npm install fabric
// Then, in your HTML: <script type="module" src="gridModule.js"></script>
// Or import and call setupGrid() in your own script.
// Assumes document.body to append elements.

import * as fabric from 'fabric'

// Type declarations for custom properties
interface Block {
  id: number
  cellWidth: number
  cellHeight: number
  row: number | null
  col: number | null
  obj?: fabric.Group & {_block?: Block}
  element: HTMLElement
}

interface FabricObjectWithBlock extends fabric.FabricObject {
  _block?: Block
}

let blocks: Block[] = []
let blockSize = 80
let gridSize = 5
let offsetX = 50
let offsetY = 50
let gridOccupied = Array(gridSize)
  .fill()
  .map(() => Array(gridSize).fill(null))
let cursorRow = 1
let cursorCol = 1
let canvas: fabric.Canvas
let cursorRect: fabric.Rect
let input: HTMLInputElement
let button: HTMLButtonElement

function setupGrid() {
  // Create canvas element
  const canvasEl = document.createElement('canvas')
  canvasEl.width = 500
  canvasEl.height = 500
  document.body.appendChild(canvasEl)

  // Initialize Fabric canvas
  canvas = new fabric.Canvas(canvasEl, {backgroundColor: 'rgb(220,220,220)'})

  // Draw grid lines
  for (let i = 0; i <= gridSize; i++) {
    canvas.add(
      new fabric.Line(
        [
          offsetX + i * blockSize,
          offsetY,
          offsetX + i * blockSize,
          offsetY + gridSize * blockSize,
        ],
        {
          stroke: 'black',
          selectable: false,
          evented: false,
        },
      ),
    )
    canvas.add(
      new fabric.Line(
        [
          offsetX,
          offsetY + i * blockSize,
          offsetX + gridSize * blockSize,
          offsetY + i * blockSize,
        ],
        {
          stroke: 'black',
          selectable: false,
          evented: false,
        },
      ),
    )
  }

  // Cursor highlight
  cursorRect = new fabric.Rect({
    left: offsetX,
    top: offsetY,
    width: blockSize,
    height: blockSize,
    fill: 'rgba(255, 255, 0, 0.4)',
    selectable: false,
    evented: false,
  })
  canvas.add(cursorRect)

  // Create input and button
  input = document.createElement('input')
  input.type = 'text'
  input.style.position = 'absolute'
  input.style.left = '10px'
  input.style.top = '10px'
  document.body.appendChild(input)

  button = document.createElement('button')
  button.innerText = 'Create Block'
  button.style.position = 'absolute'
  button.style.left = '150px'
  button.style.top = '10px'
  document.body.appendChild(button)
  button.onclick = createNewBlock

  // Drag end handler for snapping
  canvas.on('object:modified', e => {
    const obj = e.target as FabricObjectWithBlock
    if (!obj || !obj._block) return
    const block = obj._block
    const oldRow = block.row
    const oldCol = block.col
    clearBlock(block)
    // Calculate snap position
    let snapCol = Math.round((obj.left - offsetX) / blockSize) + 1
    let snapRow = Math.round((obj.top - offsetY) / blockSize) + 1
    snapCol = Math.max(1, Math.min(snapCol, gridSize - block.cellWidth + 1))
    snapRow = Math.max(1, Math.min(snapRow, gridSize - block.cellHeight + 1))
    if (placeBlock(block, snapRow, snapCol)) {
      obj.set({
        left: offsetX + (block.col! - 1) * blockSize,
        top: offsetY + (block.row! - 1) * blockSize,
      })
    } else {
      // Revert
      placeBlock(block, oldRow, oldCol)
      obj.set({
        left: offsetX + (block.col! - 1) * blockSize,
        top: offsetY + (block.row! - 1) * blockSize,
      })
    }
    obj.setCoords()
    canvas.renderAll()
  })

  // Initial cursor update
  updateCursor()
}

function updateCursor() {
  if (cursorRow === null) {
    canvas.remove(cursorRect)
  } else {
    cursorRect.set({
      left: offsetX + (cursorCol - 1) * blockSize,
      top: offsetY + (cursorRow - 1) * blockSize,
    })
    if (!canvas.contains(cursorRect)) {
      canvas.add(cursorRect)
    }
    canvas.bringObjectToFront(cursorRect) // Ensure above grid but below blocks if needed
  }
  canvas.renderAll()
}

function createNewBlock() {
  const n = parseInt(input.value)
  if (isNaN(n) || n < 1 || n > 25) {
    alert('Please enter a number between 1 and 25.')
    return
  }
  const cellWidth = ((n - 1) % 5) + 1
  const cellHeight = Math.ceil(n / 5)
  if (cursorRow === null) {
    alert('No empty squares left.')
    return
  }
  const newBlock = {
    id: n,
    cellWidth: cellWidth,
    cellHeight: cellHeight,
    row: null,
    col: null,
  }
  if (placeBlock(newBlock, cursorRow, cursorCol)) {
    const x = offsetX + (newBlock.col - 1) * blockSize
    const y = offsetY + (newBlock.row - 1) * blockSize
    const rect = new fabric.Rect({
      left: 0,
      top: 0,
      width: cellWidth * blockSize,
      height: cellHeight * blockSize,
      fill: 'rgb(150, 200, 150)',
    })
    const text = new fabric.Text(`${n}`, {
      left: (cellWidth * blockSize) / 2,
      top: (cellHeight * blockSize) / 2,
      fontSize: 20,
      originX: 'center',
      originY: 'center',
      fill: 'black',
    })
    const group = new fabric.Group([rect, text], {
      left: x,
      top: y,
      selectable: true,
      hasControls: false,
      hasBorders: false,
      lockRotation: true,
    })
    ;(group as fabric.Group & {_block: Block})._block = newBlock
    newBlock.obj = group as fabric.Group & {_block: Block}
    blocks.push(newBlock)
    canvas.add(group)
    // Move cursor
    const next = findNextEmpty(cursorRow, cursorCol)
    cursorRow = next ? next.row : null
    cursorCol = next ? next.col : null
    updateCursor()
  } else {
    alert('Cannot place block here: out of bounds or overlap.')
  }
  input.value = ''
}

function findNextEmpty(row, col) {
  // Check same row, next columns
  for (let c = col + 1; c <= gridSize; c++) {
    if (gridOccupied[row - 1][c - 1] === null) {
      return {row: row, col: c}
    }
  }
  // Check subsequent rows
  for (let r = row + 1; r <= gridSize; r++) {
    for (let c = 1; c <= gridSize; c++) {
      if (gridOccupied[r - 1][c - 1] === null) {
        return {row: r, col: c}
      }
    }
  }
  return null
}

function placeBlock(block, newRow, newCol) {
  // Check bounds
  if (
    newRow < 1 ||
    newRow + block.cellHeight - 1 > gridSize ||
    newCol < 1 ||
    newCol + block.cellWidth - 1 > gridSize
  ) {
    return false
  }
  // Check for overlap
  for (let r = 0; r < block.cellHeight; r++) {
    for (let c = 0; c < block.cellWidth; c++) {
      if (gridOccupied[newRow - 1 + r][newCol - 1 + c] !== null) {
        return false
      }
    }
  }
  // Place the block
  for (let r = 0; r < block.cellHeight; r++) {
    for (let c = 0; c < block.cellWidth; c++) {
      gridOccupied[newRow - 1 + r][newCol - 1 + c] = block
    }
  }
  block.row = newRow
  block.col = newCol
  return true
}

function clearBlock(block) {
  if (!block.row || !block.col) return
  for (let r = 0; r < block.cellHeight; r++) {
    for (let c = 0; c < block.cellWidth; c++) {
      gridOccupied[block.row - 1 + r][block.col - 1 + c] = null
    }
  }
}

// Call setupGrid() to initialize
// For module usage, you can call it on load or export it.
setupGrid() // Auto-init for simple usage; remove if you want to call manually

export {setupGrid}
