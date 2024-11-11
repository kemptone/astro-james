export const Format = new Intl.DateTimeFormat('en-CA', {
  dateStyle : 'short'
})

export async function getData(today = new Date(), addedDays = 7) {
  const futureDate = new Date()
  futureDate.setDate(today.getDate() + addedDays)

  const begin_date = Format.format(today).replace(/-/g, '')
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
      const json = JSON.parse(cached)
      if (Object.keys(json).length) {
        return json
      }
    }
  } catch (error) {
    debugger
  }

  const results = await fetch(urlWithParams)
  const json = await results.json()
  localStorage.setItem(urlWithParams, JSON.stringify(json))
  return json
}

export interface Prediction {
  t: string
  v: number
  type: 'H' | 'L'
}

export interface Predictions {
  predictions: Prediction[]
}
