import './wc-mina.ts'
import {playNotes, type Key, type ScaleType} from './play-notes'
import type {GridGameElement} from './wc-mina'

const notes: number[] = []

const gridGame = document.querySelector('grid-game') as GridGameElement
const inputForm = document.querySelector('.mina-form') as HTMLFormElement
const inputEl = inputForm.querySelector('input') as HTMLInputElement
const keySelect = document.getElementById('key-select') as HTMLSelectElement
const scaleSelect = document.getElementById(
  'scale-select',
) as HTMLSelectElement
const playButton = document.querySelector('.play-button') as HTMLButtonElement

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
  }
}

function playCurrentNotes() {
  const {key, scaleType} = getCurrentSettings()
  playNotes(notes, {key, scaleType})
}

gridGame?.addEventListener('game-over', () => {
  const shapesArray = gridGame?.getShapes?.()
  if (shapesArray) {
    notes.push(...shapesArray)
    playCurrentNotes()
  }
})

playButton?.addEventListener('click', () => {
  playCurrentNotes()
})