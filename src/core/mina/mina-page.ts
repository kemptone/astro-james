import './wc-mina.ts'
import {playNotes, type Key, type ScaleType} from './play-notes'
import type {GridGameElement} from './wc-mina'

const notes: number[] = []

const gridGame = document.querySelector('grid-game') as GridGameElement
const keySelect = document.getElementById('key-select') as HTMLSelectElement
const scaleSelect = document.getElementById(
  'scale-select',
) as HTMLSelectElement
const playButton = document.querySelector('.play-button') as HTMLButtonElement

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