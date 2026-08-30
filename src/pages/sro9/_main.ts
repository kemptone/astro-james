import {
  formatHourOfDay,
  formatTimeOfDay,
  hoursLeftToTimeOfDay,
  parseFullTime,
  parseHoursOnly,
  timeLeftToTimeOfDay,
} from '@/helpers/timeHelpers'

const form = document.getElementById('time-form') as HTMLFormElement | null
const boundarySelect = document.getElementById(
  'boundary-select',
) as HTMLSelectElement | null
const modeSwitch = document.getElementById(
  'mode-switch',
) as HTMLButtonElement | null
const switchImage = modeSwitch?.querySelector('img') ?? null
const switchLabel = modeSwitch?.querySelector('span') ?? null
const modeTitle = document.getElementById('mode-title')
const modeDescription = document.getElementById('mode-description')
const timeInput = document.getElementById('time-input') as HTMLInputElement | null
const inputHelp = document.getElementById('input-help')
const inputError = document.getElementById('input-error')
const timeResult = document.getElementById('time-result')
const timeDisplay = document.getElementById('time-display')

let fullTimeMode = true

function clearResult() {
  if (timeInput) timeInput.removeAttribute('aria-invalid')
  if (inputError) inputError.textContent = ''
  if (timeDisplay) timeDisplay.textContent = '--:--'
  timeResult?.classList.remove('has-result')
}

function updateMode() {
  if (!modeSwitch || !timeInput) return

  modeSwitch.setAttribute('aria-checked', String(fullTimeMode))
  modeSwitch.classList.toggle('is-on', fullTimeMode)

  if (switchImage) {
    switchImage.setAttribute(
      'src',
      fullTimeMode ? '/lights/light_on2.png' : '/lights/light_off2.png',
    )
  }

  if (fullTimeMode) {
    if (modeTitle) modeTitle.textContent = 'Full time'
    if (modeDescription) {
      modeDescription.textContent = 'Type hours and minutes from 0:00 to 23:59.'
    }
    if (switchLabel) switchLabel.textContent = 'Switch to hours only'
    if (inputHelp) inputHelp.textContent = 'Use a value from 0:00 through 23:59.'
    timeInput.type = 'text'
    timeInput.inputMode = 'numeric'
    timeInput.placeholder = '0:00'
    timeInput.removeAttribute('min')
    timeInput.removeAttribute('max')
    timeInput.removeAttribute('step')
  } else {
    if (modeTitle) modeTitle.textContent = 'Hours only'
    if (modeDescription) {
      modeDescription.textContent = 'Type one whole hour from 0 through 23.'
    }
    if (switchLabel) switchLabel.textContent = 'Switch to full time'
    if (inputHelp) inputHelp.textContent = 'Use a whole number from 0 through 23.'
    timeInput.type = 'number'
    timeInput.inputMode = 'numeric'
    timeInput.placeholder = '0'
    timeInput.min = '0'
    timeInput.max = '23'
    timeInput.step = '1'
  }

  timeInput.value = ''
  clearResult()
  timeInput.focus()
}

function showError(message: string) {
  if (!timeInput || !inputError) return
  inputError.textContent = message
  timeInput.setAttribute('aria-invalid', 'true')
  timeInput.focus()
}

function convertTime() {
  if (!timeInput || !boundarySelect || !timeDisplay) return

  clearResult()
  const boundaryMinutes = Number(boundarySelect.value)
  const parsed = fullTimeMode
    ? parseFullTime(timeInput.value)
    : parseHoursOnly(timeInput.value)

  if (!parsed.ok) {
    showError(parsed.error)
    return
  }

  timeDisplay.textContent = fullTimeMode
    ? formatTimeOfDay(timeLeftToTimeOfDay(parsed.value, boundaryMinutes))
    : formatHourOfDay(hoursLeftToTimeOfDay(parsed.value, boundaryMinutes))
  timeResult?.classList.add('has-result')
}

modeSwitch?.addEventListener('click', () => {
  fullTimeMode = !fullTimeMode
  updateMode()
})

boundarySelect?.addEventListener('change', clearResult)
timeInput?.addEventListener('input', () => {
  if (inputError) inputError.textContent = ''
  timeInput.removeAttribute('aria-invalid')
})
form?.addEventListener('submit', event => {
  event.preventDefault()
  convertTime()
})
