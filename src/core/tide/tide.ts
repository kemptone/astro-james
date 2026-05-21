import {buildTideDashboard} from './dashboard'
import {getData, type Predictions} from './getData'

const DISPLAY_DAYS = 14
const UPDATE_INTERVAL_MS = 60 * 1000

let tideData: Predictions | null = null
let updateTimer: number | undefined

document.addEventListener('DOMContentLoaded', () => {
  void loadTideDashboard()
})

async function loadTideDashboard() {
  const forecast = document.getElementById('tideForecast')
  const summary = document.getElementById('tideTodaySummary')

  forecast?.classList.add('is-loading')

  try {
    tideData = await getData(new Date(), DISPLAY_DAYS)
    render()

    if (updateTimer) {
      window.clearInterval(updateTimer)
    }

    updateTimer = window.setInterval(render, UPDATE_INTERVAL_MS)
  } catch (error) {
    console.error('Unable to load tide dashboard.', error)

    if (forecast) {
      forecast.innerHTML = `
        <div class="tide-empty-state">
          Tide predictions could not be loaded. Please try again in a minute.
        </div>
      `
    }

    if (summary) {
      summary.textContent =
        'Tide predictions could not be loaded. Please try again in a minute.'
    }
  } finally {
    forecast?.classList.remove('is-loading')
  }
}

function render() {
  if (!tideData) {
    return
  }

  const dashboard = buildTideDashboard(tideData, new Date(), DISPLAY_DAYS)
  const forecast = document.getElementById('tideForecast')
  const title = document.getElementById('tideTodayTitle')
  const summary = document.getElementById('tideTodaySummary')
  const liveCard = document.getElementById('tideLiveCard')
  const todayTable = document.getElementById('tideTodayTable')

  if (forecast) {
    forecast.innerHTML = dashboard.forecastHtml
  }

  if (title) {
    title.textContent = dashboard.todayTitle
  }

  if (summary) {
    summary.textContent = dashboard.todaySummary
  }

  if (liveCard) {
    liveCard.innerHTML = dashboard.liveCardHtml
  }

  if (todayTable) {
    todayTable.innerHTML = dashboard.todayTableHtml
  }
}
