import type {RankedCity} from './city-ranking.ts'

export interface MappedCity extends RankedCity {
  latitude: number
  longitude: number
}

/** Send the Countries game's coordinate link directly to the installed Maps app. */
export function buildCityMapUrl(city: Pick<MappedCity, 'latitude' | 'longitude'>): string {
  const {latitude, longitude} = city
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
      !Number.isFinite(longitude) || Math.abs(longitude) > 180) {
    throw new RangeError('Valid city coordinates are required for Maps.')
  }

  const url = new URL('maps://')
  url.searchParams.set('ll', `${latitude},${longitude}`)
  return url.href
}
