import './wc-mina.ts'
import {playNotes, stopLoop, setPlaybackFinishedCallback, type Key, type ScaleType} from './play-notes'
import type {GridGameElement} from './wc-mina'

const notes: number[] = []

const gridGame = document.querySelector('grid-game') as GridGameElement
const inputForm = document.querySelector('.mina-form') as HTMLFormElement
const inputEl = inputForm.querySelector('input') as HTMLInputElement
const keySelect = document.getElementById('key-select') as HTMLSelectElement
const scaleSelect = document.getElementById(
  'scale-select',
) as HTMLSelectElement
const loopCheckbox = document.getElementById('loop-checkbox') as HTMLInputElement
const playButton = document.querySelector('.play-button') as HTMLButtonElement
const stopButton = document.querySelector('.stop-button') as HTMLButtonElement

// Handle form submission
inputForm?.addEventListener('submit', (e) => {
  e.preventDefault()
  const value = parseInt(inputEl.value, 10)
  gridGame?.submitValue(value, inputEl)
})

// Clear custom validity when user starts typing
inputEl?.addEventListener('input', () => {
  inputEl.setCustomValidity('')
})

function getCurrentSettings() {
  return {
    key: keySelect.value as Key,
    scaleType: scaleSelect.value as ScaleType,
    loop: loopCheckbox.checked
  }
}

function playCurrentNotes() {
  const {key, scaleType, loop} = getCurrentSettings()
  // Show stop button when starting playback
  if (stopButton) {
    stopButton.style.display = 'inline-block'
  }
  playNotes(notes, {key, scaleType, loop})
}

// Update play button text based on loop state
function updatePlayButton() {
  if (loopCheckbox.checked) {
    playButton.textContent = 'Play Loop'
  } else {
    playButton.textContent = 'Play'
  }
}

// Listen for loop checkbox changes
loopCheckbox?.addEventListener('change', updatePlayButton)

// Hide stop button initially
if (stopButton) {
  stopButton.style.display = 'none'
}

// Set up callback for when playback finishes
setPlaybackFinishedCallback(() => {
  if (stopButton) {
    stopButton.style.display = 'none'
  }
})

gridGame?.addEventListener('game-over', () => {
  const shapesArray = gridGame?.getShapes?.()
  if (shapesArray) {
    notes.push(...shapesArray)
    playCurrentNotes()
  }
})

playButton?.addEventListener('click', () => {
  playCurrentNotes()
  stopButton.style.display = 'inline-block'
  playButton.style.display = 'none'
})

stopButton?.addEventListener('click', () => {
  stopLoop()
  playButton.style.display = 'inline-block'
  stopButton.style.display = 'none'
})