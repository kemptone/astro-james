import { PAST_DAYS } from "./helpers"
export const Format = new Intl.DateTimeFormat('en-CA', {
  dateStyle : 'short'
})

export async function getData(today = new Date(), addedDays = 7) {
  const startDate = new Date(today)
  const futureDate = new Date(today)

  futureDate.setDate(today.getDate() + addedDays)
  startDate.setDate(today.getDate() - PAST_DAYS)

  const begin_date = Format.format(startDate).replace(/-/g, '')
  const end_date = Format.format(futureDate).replace(/-/g, '')

  const params = {
    product: 'predictions',
    application: 'NOS.COOPS.TAC.WL',
    begin_date,
    end_date,
    datum: 'MLLW',
    station: '9415102',
    time_zone: 'lst_ldt',
    units: 'english',
    interval: 'hilo',
    format: 'json',
  }
  const baseUrl = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter'
  const urlWithParams = `${baseUrl}?${new URLSearchParams(params).toString()}`

  try {
    const cached = localStorage.getItem(urlWithParams)
    if (cached) {
      const parsed = JSON.parse(cached)
      const cacheAge = Date.now() - parsed.cachedAt
      const maxCacheAge = 1000 * 60 * 60 * 6

      if (cacheAge < maxCacheAge && Object.keys(parsed.data ?? {}).length) {
        return parsed.data
      }
    }
  } catch (error) {
    console.warn('Unable to read cached tide data.', error)
  }

  const results = await fetch(urlWithParams)
  const json = await results.json()
  localStorage.setItem(
    urlWithParams,
    JSON.stringify({
      cachedAt: Date.now(),
      data: json,
    })
  )
  return json
}

export interface Prediction {
  t: string
  v: number | string
  type: 'H' | 'L'
}

export interface Predictions {
  predictions: Prediction[]
}
