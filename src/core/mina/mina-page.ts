import {playTextAzure} from '../talkers2/wc-talkers.helpers'
import type {AzureVoiceInfo} from '../talkers2/types'

type SentenceEntry = {
  word: string
  title: string
}

type SentenceGroup = {
  title: string
  words: string[]
  spokenText: string
  startChar: number
  endChar: number
}

const exampleRows: SentenceEntry[] = [{word: "that's", title: 'Reading'}]

const rowsContainer = document.getElementById('mina-rows') as HTMLDivElement | null
const rowTemplate = document.getElementById(
  'mina-row-template',
) as HTMLTemplateElement | null
const addRowButton = document.getElementById(
  'add-row-button',
) as HTMLButtonElement | null
const resetButton = document.getElementById('reset-button') as HTMLButtonElement | null
const playButton = document.getElementById('play-button') as HTMLButtonElement | null
const stopButton = document.getElementById('stop-button') as HTMLButtonElement | null
const statusEl = document.getElementById('mina-status') as HTMLParagraphElement | null
const sentencePreview = document.getElementById(
  'sentence-preview',
) as HTMLParagraphElement | null
const groupPreview = document.getElementById('group-preview') as HTMLDivElement | null
const nowPlayingTitle = document.getElementById(
  'now-playing-title',
) as HTMLHeadingElement | null
const playbackStage = document.getElementById(
  'mina-playback-stage',
) as HTMLDivElement | null
const playbackTitle = document.getElementById(
  'mina-playback-title',
) as HTMLParagraphElement | null

const JENNY_VOICE: AzureVoiceInfo = {
  Name: 'Microsoft Server Speech Text to Speech Voice (en-US, JennyNeural)',
  DisplayName: 'Jenny',
  LocalName: 'Jenny',
  ShortName: 'en-US-JennyNeural',
  Gender: 'Female',
  Locale: 'en-US',
  LocaleName: 'English (United States)',
  SecondaryLocaleList: [],
  SampleRateHertz: '24000',
  VoiceType: 'Neural',
  Status: 'GA',
}

let currentGroups: SentenceGroup[] = []
let currentSentence = ''
let isPlaying = false
let playbackToken = 0
let currentAudio: HTMLAudioElement | null = null

function getWordSeparator(sentence: string, word: string): string {
  if (!sentence) return ''
  if (/^[,.;:!?)]/.test(word)) return ''
  if (/^['"]/.test(word)) return ''
  return ' '
}

function joinWords(words: string[]): string {
  return words.reduce((sentence, word) => {
    const separator = getWordSeparator(sentence, word)
    return `${sentence}${separator}${word}`
  }, '')
}

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase()
}

function pluralize(count: number, single: string, plural: string): string {
  return count === 1 ? single : plural
}

function getRows(): HTMLElement[] {
  return Array.from(rowsContainer?.querySelectorAll('.mina-row') ?? [])
}

function setStatus(message: string) {
  if (statusEl) {
    statusEl.textContent = message
  }
}

function setDisplayedTitle(group?: SentenceGroup | null) {
  const title = group?.title ?? 'Waiting for a title card'

  if (nowPlayingTitle) {
    nowPlayingTitle.textContent = title
  }

  if (playbackTitle) {
    playbackTitle.textContent = group?.title ?? ''
  }
}

function highlightGroup(activeIndex: number) {
  const cards = Array.from(groupPreview?.querySelectorAll('.mina-group') ?? [])

  cards.forEach((card, index) => {
    card.classList.toggle('is-active', index === activeIndex)
  })
}

function activateGroup(index: number) {
  if (index < 0) {
    highlightGroup(-1)
    setDisplayedTitle(currentGroups[0] ?? null)
    return
  }

  const group = currentGroups[index]

  highlightGroup(index)
  setDisplayedTitle(group ?? null)
}

function updateRowNumbers() {
  const rows = getRows()

  rows.forEach((row, index) => {
    const numberEl = row.querySelector('.mina-row-number') as HTMLDivElement | null
    const removeButton = row.querySelector('.mina-remove') as HTMLButtonElement | null

    if (numberEl) {
      numberEl.textContent = `${index + 1}`
    }

    if (removeButton) {
      removeButton.disabled = rows.length === 1
    }
  })
}

function createRow(entry?: SentenceEntry): HTMLElement | null {
  if (!rowTemplate) return null

  const row = rowTemplate.content.firstElementChild?.cloneNode(true) as HTMLElement | null
  if (!row) return null

  const wordInput = row.querySelector('input[name="word"]') as HTMLInputElement | null
  const titleInput = row.querySelector('input[name="title"]') as HTMLInputElement | null
  const removeButton = row.querySelector('.mina-remove') as HTMLButtonElement | null

  if (wordInput) {
    wordInput.value = entry?.word ?? ''
    wordInput.addEventListener('input', () => syncView(true))
  }

  if (titleInput) {
    titleInput.value = entry?.title ?? ''
    titleInput.addEventListener('input', () => syncView(true))
  }

  removeButton?.addEventListener('click', () => {
    const rows = getRows()

    if (rows.length === 1) {
      if (wordInput) wordInput.value = ''
      if (titleInput) titleInput.value = ''
      wordInput?.focus()
    } else {
      row.remove()
    }

    syncView(true)
  })

  return row
}

function resetRows(entries: SentenceEntry[]) {
  if (!rowsContainer) return

  rowsContainer.innerHTML = ''

  entries.forEach(entry => {
    const row = createRow(entry)
    if (row) rowsContainer.appendChild(row)
  })

  updateRowNumbers()
}

function collectState() {
  const rows = getRows()
  const entries: SentenceEntry[] = []
  let partialCount = 0
  let missingWordCount = 0
  let missingTitleCount = 0

  rows.forEach(row => {
    const wordInput = row.querySelector('input[name="word"]') as HTMLInputElement | null
    const titleInput = row.querySelector('input[name="title"]') as HTMLInputElement | null
    const word = wordInput?.value.trim() ?? ''
    const title = titleInput?.value.trim() ?? ''
    const hasPartial = Boolean(word) !== Boolean(title)

    row.classList.toggle('is-partial', hasPartial)

    if (hasPartial) {
      partialCount += 1

      if (word && !title) {
        missingTitleCount += 1
      }

      if (!word && title) {
        missingWordCount += 1
      }
    }

    if (word && title) {
      entries.push({word, title})
    }
  })

  let sentence = ''
  const groups: SentenceGroup[] = []

  entries.forEach(entry => {
    const separator = getWordSeparator(sentence, entry.word)
    const startChar = sentence.length + separator.length
    sentence = `${sentence}${separator}${entry.word}`

    const lastGroup = groups.at(-1)

    if (lastGroup && normalizeTitle(lastGroup.title) === normalizeTitle(entry.title)) {
      lastGroup.words.push(entry.word)
      lastGroup.spokenText = joinWords(lastGroup.words)
      lastGroup.endChar = sentence.length
      return
    }

    groups.push({
      title: entry.title,
      words: [entry.word],
      spokenText: entry.word,
      startChar,
      endChar: sentence.length,
    })
  })

  return {entries, groups, partialCount, sentence, missingWordCount, missingTitleCount}
}

function renderGroups(groups: SentenceGroup[]) {
  if (!groupPreview) return

  groupPreview.innerHTML = ''

  if (groups.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'mina-empty'
    empty.textContent = 'Complete a word and title to build the first reading card.'
    groupPreview.appendChild(empty)
    return
  }

  groups.forEach((group, index) => {
    const card = document.createElement('article')
    const title = document.createElement('h4')
    const words = document.createElement('p')
    const meta = document.createElement('p')

    card.className = 'mina-group'
    card.dataset.index = `${index}`

    title.textContent = group.title
    words.textContent = group.spokenText
    meta.className = 'mina-group-meta'
    meta.textContent = `${group.words.length} ${pluralize(group.words.length, 'word', 'words')}`

    card.append(title, words, meta)
    groupPreview.appendChild(card)
  })
}

function showPlaybackStage() {
  playbackStage?.classList.add('is-visible')
  document.body.classList.add('playback-active')
}

function hidePlaybackStage() {
  playbackStage?.classList.remove('is-visible')
  document.body.classList.remove('playback-active')

  if (playbackTitle) {
    playbackTitle.textContent = ''
  }
}

function stopPlayback(message?: string) {
  const {groups, partialCount, missingTitleCount} = collectState()

  playbackToken += 1

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }

  isPlaying = false

  if (playButton) {
    playButton.disabled =
      groups.length === 0 || partialCount > 0 || missingTitleCount > 0
  }

  if (stopButton) {
    stopButton.disabled = true
  }

  hidePlaybackStage()
  activateGroup(-1)

  if (message) {
    setStatus(message)
  }
}

function playAudioClip(audio: HTMLAudioElement, token: number) {
  return new Promise<void>((resolve, reject) => {
    audio.onended = () => {
      if (token === playbackToken && currentAudio === audio) {
        currentAudio = null
      }
      resolve()
    }

    audio.onerror = () => {
      if (token === playbackToken && currentAudio === audio) {
        currentAudio = null
      }
      reject(new Error('Audio playback failed'))
    }

    audio.play().catch(error => {
      if (token === playbackToken && currentAudio === audio) {
        currentAudio = null
      }
      reject(error)
    })
  })
}

async function playSequence() {
  const {entries, groups, partialCount, sentence, missingTitleCount} = collectState()

  currentGroups = groups
  currentSentence = sentence
  renderGroups(groups)

  if (missingTitleCount > 0) {
    setStatus('Every word needs a title before Mina can read.')
    return
  }

  if (partialCount > 0) {
    setStatus('Finish the incomplete rows before Mina can read.')
    return
  }

  if (groups.length === 0 || !sentence) {
    setStatus('Add at least one complete word and title before submitting.')
    return
  }

  playbackToken += 1
  const token = playbackToken
  isPlaying = true

  if (playButton) {
    playButton.disabled = true
  }

  if (stopButton) {
    stopButton.disabled = false
  }

  showPlaybackStage()
  activateGroup(0)

  const voiceNotice = 'Jenny is reading the sentence.'

  if (groups.length < entries.length) {
    setStatus(`${voiceNotice} Matching titles are staying grouped together.`)
  } else {
    setStatus(`${voiceNotice} Each finished row is getting its own title change.`)
  }

  try {
    for (let index = 0; index < groups.length; index += 1) {
      if (token !== playbackToken) return

      const group = groups[index]
      activateGroup(index)

      const audio = await playTextAzure(
        {
          values: {
            ...JENNY_VOICE,
            text: group.spokenText,
          },
        },
        false,
      )

      if (token !== playbackToken) {
        audio.pause()
        return
      }

      currentAudio = audio
      await playAudioClip(audio, token)
    }

    if (token !== playbackToken) return
    stopPlayback('Finished reading the sentence.')
  } catch (error) {
    if (token !== playbackToken) return
    console.error(error)
    stopPlayback('Mina could not speak that sentence right now.')
  }
}

function syncView(stopAudio = false) {
  const {entries, groups, partialCount, sentence, missingTitleCount} = collectState()

  currentGroups = groups
  currentSentence = sentence

  if (stopAudio && isPlaying) {
    stopPlayback('Playback stopped because the sentence changed.')
  }

  updateRowNumbers()
  renderGroups(groups)

  if (sentencePreview) {
    sentencePreview.textContent = sentence || 'Your full sentence will appear here.'
  }

  activateGroup(-1)

  if (playButton) {
    playButton.disabled = groups.length === 0 || partialCount > 0 || missingTitleCount > 0
  }

  if (stopButton && !isPlaying) {
    stopButton.disabled = true
  }

  if (entries.length === 0) {
    setStatus('Start with a word and a title card.')
    return
  }

  if (missingTitleCount > 0) {
    setStatus('Every word needs a title before Mina can read.')
    return
  }

  if (partialCount > 0) {
    setStatus('Finish the incomplete rows before Mina can read.')
    return
  }

  if (groups.length === 1 && entries.length > 1) {
    setStatus('All of the words share one title, so Submit will show one title card while Mina reads.')
    return
  }

  if (groups.length < entries.length) {
    setStatus('Consecutive matching titles stay on the same title card while the sentence keeps reading.')
    return
  }

  setStatus('Each finished row becomes its own title card when you press Submit.')
}

addRowButton?.addEventListener('click', () => {
  const row = createRow()
  if (!row || !rowsContainer) return

  rowsContainer.appendChild(row)
  updateRowNumbers()

  const wordInput = row.querySelector('input[name="word"]') as HTMLInputElement | null
  wordInput?.focus()

  syncView(true)
})

resetButton?.addEventListener('click', () => {
  stopPlayback()
  resetRows(exampleRows)
  syncView(false)
})

playButton?.addEventListener('click', playSequence)
stopButton?.addEventListener('click', () => {
  stopPlayback('Playback stopped.')
})

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && isPlaying) {
    stopPlayback('Playback stopped.')
  }
})

window.addEventListener('beforeunload', () => {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }
})

resetRows(exampleRows)
syncView(false)
