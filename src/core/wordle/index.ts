import {
  MAX_GUESSES,
  WORD_LENGTH,
  calculateStats,
  choosePracticeAnswerIndex,
  formatCountdown,
  formatShareText,
  getDailyAnswerIndex,
  getGameStatus,
  getKeyboardStates,
  getLocalDateKey,
  getTimeUntilNextLocalDay,
  normalizeWord,
  scoreGuess,
  validateHardModeGuess,
  type GameMode,
  type GameSnapshot,
} from './game.ts'
import {
  STORAGE_KEY,
  createDefaultState,
  parseStoredState,
  reconcileGame,
  type PersistedWordleState,
  type PracticeSnapshot,
} from './storage.ts'
import {ANSWERS, VALID_GUESSES} from './word-data.ts'

const app = document.querySelector<HTMLElement>('#wordle-app')

if (app) {
  const validGuesses = new Set(VALID_GUESSES)
  const tiles = Array.from(document.querySelectorAll<HTMLElement>('.wordle-tile'))
  const keyButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-key]'))
  const modeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-mode]'))
  const modeLabel = document.querySelector<HTMLElement>('#mode-label')
  const hardModeLabel = document.querySelector<HTMLElement>('#hard-mode-label')
  const newPracticeButton = document.querySelector<HTMLButtonElement>('#new-practice')
  const toast = document.querySelector<HTMLElement>('#wordle-toast')
  const statsDialog = document.querySelector<HTMLDialogElement>('#stats-dialog')
  const settingsDialog = document.querySelector<HTMLDialogElement>('#settings-dialog')
  const helpDialog = document.querySelector<HTMLDialogElement>('#help-dialog')
  const resetPracticeDialog = document.querySelector<HTMLDialogElement>('#reset-practice-dialog')
  const shareFallbackDialog = document.querySelector<HTMLDialogElement>('#share-fallback-dialog')
  const hardModeSetting = document.querySelector<HTMLInputElement>('#hard-mode-setting')
  const hardModeNote = document.querySelector<HTMLElement>('#hard-mode-note')
  const themeSetting = document.querySelector<HTMLSelectElement>('#theme-setting')
  const contrastSetting = document.querySelector<HTMLInputElement>('#contrast-setting')
  const shareResultButton = document.querySelector<HTMLButtonElement>('#share-result')
  const resultSummary = document.querySelector<HTMLElement>('#result-summary')
  const resultMessage = document.querySelector<HTMLElement>('#result-message')
  const countdownWrap = document.querySelector<HTMLElement>('#countdown-wrap')
  const countdown = document.querySelector<HTMLElement>('#daily-countdown')
  const shareFallbackText = document.querySelector<HTMLTextAreaElement>('#share-fallback-text')

  let state: PersistedWordleState
  try {
    state = parseStoredState(window.localStorage.getItem(STORAGE_KEY), ANSWERS.length)
  } catch {
    state = createDefaultState()
  }

  let mode: GameMode = 'daily'
  let dateKey = getLocalDateKey()
  let currentInput = ''
  let isRevealing = false
  let toastTimer = 0
  let lastDialogOpener: HTMLElement | null = null
  let currentShareText = ''

  function saveState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      showToast('Progress could not be saved on this device.')
    }
  }

  function getRandomValue() {
    const values = new Uint32Array(1)
    window.crypto.getRandomValues(values)
    return values[0] / 4_294_967_296
  }

  function getDailySolutionIndex() {
    return getDailyAnswerIndex(new Date(), ANSWERS.length)
  }

  function ensureDailyGame() {
    const answerIndex = getDailySolutionIndex()
    const solution = ANSWERS[answerIndex]
    const existing = state.daily[dateKey]
    if (existing) {
      state.daily[dateKey] = reconcileGame(existing, solution)
    } else {
      state.daily[dateKey] = {
        guesses: [],
        status: 'playing',
        hardMode: state.settings.hardMode,
      }
    }
    return state.daily[dateKey]
  }

  function startNewPractice() {
    if (state.practice) state.lastPracticeAnswerIndex = state.practice.answerIndex
    const answerIndex = choosePracticeAnswerIndex(
      ANSWERS.length,
      [getDailySolutionIndex(), state.lastPracticeAnswerIndex ?? -1],
      getRandomValue()
    )
    state.practice = {
      answerIndex,
      guesses: [],
      status: 'playing',
      hardMode: state.settings.hardMode,
    }
    currentInput = ''
    isRevealing = false
    saveState()
  }

  function ensurePracticeGame() {
    if (!state.practice) startNewPractice()
    const practice = state.practice as PracticeSnapshot
    state.practice = {
      ...reconcileGame(practice, ANSWERS[practice.answerIndex]),
      answerIndex: practice.answerIndex,
    }
    return state.practice
  }

  function getCurrentGame(): GameSnapshot {
    return mode === 'daily' ? ensureDailyGame() : ensurePracticeGame()
  }

  function getCurrentSolution() {
    return mode === 'daily'
      ? ANSWERS[getDailySolutionIndex()]
      : ANSWERS[ensurePracticeGame().answerIndex]
  }

  function updateCurrentGame(game: GameSnapshot) {
    if (mode === 'daily') {
      state.daily[dateKey] = game
    } else {
      state.practice = {...game, answerIndex: ensurePracticeGame().answerIndex}
    }
  }

  function showToast(message: string, duration = 1800) {
    if (!toast) return
    window.clearTimeout(toastTimer)
    toast.textContent = message
    toast.classList.add('is-visible')
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('is-visible')
    }, duration)
  }

  function shakeCurrentRow() {
    const row = Math.min(getCurrentGame().guesses.length, MAX_GUESSES - 1)
    tiles.slice(row * WORD_LENGTH, row * WORD_LENGTH + WORD_LENGTH).forEach(tile => {
      tile.classList.remove('is-shaking')
      void tile.offsetWidth
      tile.classList.add('is-shaking')
      window.setTimeout(() => tile.classList.remove('is-shaking'), 450)
    })
  }

  function setTile(
    tile: HTMLElement,
    letter: string,
    row: number,
    column: number,
    stateName?: 'absent' | 'present' | 'correct',
    animate = false
  ) {
    tile.className = 'wordle-tile'
    tile.style.removeProperty('--reveal-delay')
    tile.style.removeProperty('--win-delay')
    const span = tile.querySelector('span')
    if (span) span.textContent = letter
    if (letter) tile.classList.add('is-filled')
    if (stateName) tile.classList.add(`state-${stateName}`)
    if (animate) {
      tile.classList.add('is-revealing')
      tile.style.setProperty('--reveal-delay', `${column * 115}ms`)
    }
    const clue = stateName ? `, ${stateName}` : ''
    tile.setAttribute(
      'aria-label',
      `Row ${row + 1}, column ${column + 1}, ${letter ? `letter ${letter}${clue}` : 'empty'}`
    )
  }

  function renderBoard(animatedRow = -1) {
    const game = getCurrentGame()
    const solution = getCurrentSolution()
    for (let row = 0; row < MAX_GUESSES; row += 1) {
      const acceptedGuess = game.guesses[row]
      const typedGuess =
        !acceptedGuess && row === game.guesses.length && game.status === 'playing'
          ? currentInput
          : ''
      const letters = acceptedGuess ?? typedGuess
      const states = acceptedGuess ? scoreGuess(solution, acceptedGuess) : []

      for (let column = 0; column < WORD_LENGTH; column += 1) {
        const tile = tiles[row * WORD_LENGTH + column]
        setTile(
          tile,
          letters[column] ?? '',
          row,
          column,
          states[column],
          animatedRow === row
        )
      }
    }
  }

  function renderKeyboard() {
    const keyboardStates = getKeyboardStates(getCurrentSolution(), getCurrentGame().guesses)
    keyButtons.forEach(button => {
      const key = button.dataset.key ?? ''
      if (key.length !== 1) return
      const stateName = keyboardStates[key]
      if (stateName) button.dataset.state = stateName
      else delete button.dataset.state
    })
  }

  function renderMode() {
    modeButtons.forEach(button => {
      const selected = button.dataset.mode === mode
      button.classList.toggle('is-active', selected)
      button.setAttribute('aria-selected', String(selected))
      button.tabIndex = selected ? 0 : -1
    })
    if (newPracticeButton) newPracticeButton.hidden = mode !== 'practice'

    const game = getCurrentGame()
    if (modeLabel) {
      if (mode === 'daily') {
        const friendlyDate = new Intl.DateTimeFormat(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }).format(new Date())
        modeLabel.textContent = game.status === 'playing' ? `Daily puzzle · ${friendlyDate}` : 'Daily puzzle complete'
      } else {
        modeLabel.textContent = game.status === 'playing' ? 'Unlimited practice' : 'Practice game complete'
      }
    }
    if (hardModeLabel) hardModeLabel.hidden = !game.hardMode
  }

  function renderStats() {
    const stats = calculateStats(state.daily, dateKey)
    const values: Record<string, number> = {
      'stat-played': stats.played,
      'stat-win': stats.winPercentage,
      'stat-current': stats.currentStreak,
      'stat-max': stats.maxStreak,
    }
    Object.entries(values).forEach(([id, value]) => {
      const element = document.querySelector<HTMLElement>(`#${id}`)
      if (element) element.textContent = String(value)
    })

    const maximum = Math.max(1, ...stats.distribution)
    const currentDaily = state.daily[dateKey]
    document.querySelectorAll<HTMLElement>('[data-distribution-index]').forEach(bar => {
      const index = Number(bar.dataset.distributionIndex)
      const value = stats.distribution[index] ?? 0
      bar.textContent = String(value)
      bar.style.width = `${Math.max(8, (value / maximum) * 100)}%`
      bar.classList.toggle(
        'is-current',
        Boolean(currentDaily?.status === 'won' && currentDaily.guesses.length === index + 1)
      )
    })

    const game = getCurrentGame()
    const complete = game.status !== 'playing'
    if (resultSummary) resultSummary.hidden = !complete
    if (countdownWrap) countdownWrap.hidden = mode !== 'daily'
    if (resultMessage && complete) {
      resultMessage.textContent =
        game.status === 'won'
          ? `Solved in ${game.guesses.length} ${game.guesses.length === 1 ? 'guess' : 'guesses'}!`
          : `The word was ${getCurrentSolution()}.`
    }
  }

  function renderSettings() {
    const game = getCurrentGame()
    const hardModeLocked = game.status === 'playing' && game.guesses.length > 0
    if (hardModeSetting) {
      hardModeSetting.checked = hardModeLocked ? game.hardMode : state.settings.hardMode
      hardModeSetting.disabled = hardModeLocked
    }
    if (hardModeNote) hardModeNote.hidden = !hardModeLocked
    if (themeSetting) themeSetting.value = state.settings.theme
    if (contrastSetting) contrastSetting.checked = state.settings.highContrast
  }

  function renderAll() {
    renderBoard()
    renderKeyboard()
    renderMode()
    renderStats()
    renderSettings()
  }

  function applyAppearance() {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const resolvedTheme =
      state.settings.theme === 'system' ? (systemDark ? 'dark' : 'light') : state.settings.theme
    document.documentElement.dataset.wordleTheme = resolvedTheme
    document.documentElement.dataset.wordleContrast = state.settings.highContrast ? 'high' : 'standard'
  }

  function openDialog(dialog: HTMLDialogElement | null, opener?: HTMLElement | null) {
    if (!dialog || dialog.open) return
    document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(openDialogElement => {
      if (openDialogElement !== dialog) openDialogElement.close()
    })
    lastDialogOpener = opener ?? (document.activeElement as HTMLElement | null)
    if (dialog === statsDialog) renderStats()
    if (dialog === settingsDialog) renderSettings()
    dialog.showModal()
  }

  function closeDialog(dialog: HTMLDialogElement) {
    if (dialog.open) dialog.close()
  }

  function celebrateWinningRow(row: number) {
    tiles.slice(row * WORD_LENGTH, row * WORD_LENGTH + WORD_LENGTH).forEach((tile, index) => {
      tile.classList.remove('is-revealing')
      tile.classList.add('is-winning')
      tile.style.setProperty('--win-delay', `${index * 90}ms`)
    })
  }

  function finishReveal(game: GameSnapshot, row: number) {
    isRevealing = false
    renderKeyboard()
    renderMode()
    renderStats()
    if (game.status === 'won') {
      celebrateWinningRow(row)
      showToast('Brilliant!')
    } else if (game.status === 'lost') {
      showToast(`The word was ${getCurrentSolution()}.`, 3000)
    }

    if (game.status !== 'playing') {
      window.setTimeout(() => openDialog(statsDialog), 520)
    }
  }

  function submitGuess() {
    const game = getCurrentGame()
    if (game.status !== 'playing' || isRevealing) return
    if (currentInput.length !== WORD_LENGTH) {
      shakeCurrentRow()
      showToast('Not enough letters')
      return
    }

    const guess = normalizeWord(currentInput)
    if (!validGuesses.has(guess.toLowerCase())) {
      shakeCurrentRow()
      showToast('Not in the word list')
      return
    }

    if (game.hardMode) {
      const hardModeResult = validateHardModeGuess(getCurrentSolution(), game.guesses, guess)
      if (!hardModeResult.valid) {
        shakeCurrentRow()
        showToast(hardModeResult.message ?? 'Use every revealed hint.', 2600)
        return
      }
    }

    const row = game.guesses.length
    const guesses = [...game.guesses, guess]
    const nextGame: GameSnapshot = {
      ...game,
      guesses,
      status: getGameStatus(getCurrentSolution(), guesses),
    }
    updateCurrentGame(nextGame)
    currentInput = ''
    isRevealing = true
    saveState()
    renderBoard(row)

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.setTimeout(() => finishReveal(nextGame, row), reducedMotion ? 40 : 1080)
  }

  function handleKey(keyValue: string) {
    if (isRevealing || document.querySelector('dialog[open]')) return
    const game = getCurrentGame()
    const key = keyValue.toUpperCase()

    if (key === 'ENTER') {
      submitGuess()
      return
    }
    if (game.status !== 'playing') return
    if (key === 'BACKSPACE') {
      currentInput = currentInput.slice(0, -1)
      renderBoard()
      return
    }
    if (/^[A-Z]$/.test(key) && currentInput.length < WORD_LENGTH) {
      currentInput += key
      renderBoard()
    }
  }

  function switchMode(nextMode: GameMode) {
    if (isRevealing || nextMode === mode) return
    mode = nextMode
    currentInput = ''
    renderAll()
  }

  function requestNewPractice() {
    const practice = ensurePracticeGame()
    if (practice.status === 'playing' && (practice.guesses.length > 0 || currentInput.length > 0)) {
      openDialog(resetPracticeDialog, newPracticeButton)
      return
    }
    startNewPractice()
    renderAll()
    showToast('New practice word ready')
  }

  function getShareText() {
    const game = getCurrentGame()
    return formatShareText({
      mode,
      dateKey: mode === 'daily' ? dateKey : undefined,
      guesses: game.guesses,
      solution: getCurrentSolution(),
      status: game.status,
      highContrast: state.settings.highContrast,
    })
  }

  async function shareResult() {
    const game = getCurrentGame()
    if (game.status === 'playing') return
    currentShareText = getShareText()

    if (navigator.share) {
      try {
        await navigator.share({title: 'Astro James Wordle', text: currentShareText})
        showToast('Result shared')
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(currentShareText)
      showToast('Result copied')
      return
    } catch {
      if (shareFallbackText) shareFallbackText.value = currentShareText
      openDialog(shareFallbackDialog, shareResultButton)
      window.setTimeout(() => shareFallbackText?.select(), 0)
    }
  }

  function updateCountdown() {
    const nextDateKey = getLocalDateKey()
    if (nextDateKey !== dateKey) {
      dateKey = nextDateKey
      currentInput = ''
      ensureDailyGame()
      saveState()
      renderAll()
      if (mode === 'daily') showToast('A new daily word is ready!')
    }
    if (countdown) countdown.textContent = formatCountdown(getTimeUntilNextLocalDay())
  }

  keyButtons.forEach(button => {
    button.addEventListener('click', () => handleKey(button.dataset.key ?? ''))
  })

  modeButtons.forEach(button => {
    button.addEventListener('click', () => switchMode(button.dataset.mode as GameMode))
    button.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      switchMode(mode === 'daily' ? 'practice' : 'daily')
      modeButtons.find(candidate => candidate.dataset.mode === mode)?.focus()
    })
  })

  document.addEventListener('keydown', event => {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    if (event.key === 'Enter' || event.key === 'Backspace' || /^[a-zA-Z]$/.test(event.key)) {
      event.preventDefault()
      handleKey(event.key)
    }
  })

  document.querySelectorAll<HTMLElement>('[data-open-dialog]').forEach(button => {
    button.addEventListener('click', () => {
      const dialog = document.querySelector<HTMLDialogElement>(`#${button.dataset.openDialog}`)
      openDialog(dialog, button)
    })
  })

  document.querySelectorAll<HTMLDialogElement>('.wordle-dialog').forEach(dialog => {
    dialog.querySelectorAll<HTMLElement>('[data-close-dialog]').forEach(button => {
      button.addEventListener('click', () => closeDialog(dialog))
    })
    dialog.addEventListener('click', event => {
      if (event.target === dialog) closeDialog(dialog)
    })
    dialog.addEventListener('close', () => {
      const opener = lastDialogOpener
      lastDialogOpener = null
      opener?.focus()
    })
  })

  newPracticeButton?.addEventListener('click', requestNewPractice)
  document.querySelector('#confirm-new-practice')?.addEventListener('click', () => {
    closeDialog(resetPracticeDialog as HTMLDialogElement)
    startNewPractice()
    renderAll()
    showToast('New practice word ready')
  })

  hardModeSetting?.addEventListener('change', () => {
    const game = getCurrentGame()
    if (game.status === 'playing' && game.guesses.length > 0) return
    state.settings.hardMode = hardModeSetting.checked
    if (game.status === 'playing') updateCurrentGame({...game, hardMode: hardModeSetting.checked})
    saveState()
    renderAll()
  })

  themeSetting?.addEventListener('change', () => {
    if (
      themeSetting.value === 'system' ||
      themeSetting.value === 'light' ||
      themeSetting.value === 'dark'
    ) {
      state.settings.theme = themeSetting.value
      saveState()
      applyAppearance()
    }
  })

  contrastSetting?.addEventListener('change', () => {
    state.settings.highContrast = contrastSetting.checked
    saveState()
    applyAppearance()
  })

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (state.settings.theme === 'system') applyAppearance()
  })

  shareResultButton?.addEventListener('click', shareResult)
  document.querySelector('#copy-fallback-result')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(currentShareText)
      closeDialog(shareFallbackDialog as HTMLDialogElement)
      showToast('Result copied')
    } catch {
      shareFallbackText?.select()
      showToast('Select the text and copy it')
    }
  })

  ensureDailyGame()
  applyAppearance()
  renderAll()
  updateCountdown()
  window.setInterval(updateCountdown, 1000)
  saveState()

  if (!state.hasSeenHelp) {
    state.hasSeenHelp = true
    saveState()
    window.setTimeout(() => openDialog(helpDialog), 260)
  }
}
