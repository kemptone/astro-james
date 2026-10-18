export interface RankedCity {
  name: string
  country: string
  population: number
}

export type CityRankResult<T extends RankedCity = RankedCity> =
  | {ok: true; rank: number; city: T}
  | {ok: false; error: string}

/** Return a new list from most to least populous, preserving source order for ties. */
export function rankCities<T extends RankedCity>(cities: readonly T[]): T[] {
  return [...cities].sort((first, second) => second.population - first.population)
}

/** Look up a one-based rank in the supplied list's order. */
export function lookupCityRank<T extends RankedCity>(input: string, cities: readonly T[]): CityRankResult<T> {
  if (cities.length === 0) return {ok: false, error: 'No cities are available.'}

  const value = input.trim()
  const rank = Number(value)
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(rank) || rank < 1 || rank > cities.length) {
    return {ok: false, error: `Enter a whole number from 1 to ${cities.length}.`}
  }

  return {ok: true, rank, city: cities[rank - 1]}
}

/** Keep spoken rankings specific to the selected dataset and its population year. */
export function buildCityNarration(rank: number, city: RankedCity, total: number, year: number): string {
  const position = rank === 1
    ? `the most populous city in this list of ${total} cities`
    : rank === total
      ? `the least populous city in this list of ${total} cities`
      : `ranked number ${rank} out of these ${total} cities`

  return `${city.name}, ${city.country} is ${position}. Its estimated population was ${city.population.toLocaleString('en-US')} in ${year}.`
}
