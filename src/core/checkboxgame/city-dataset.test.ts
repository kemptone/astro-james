import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'

import {lookupCityRank, type RankedCity} from './city-ranking.ts'

type CensusCity = RankedCity & {placeFips: string; latitude: number; longitude: number}
const dataset = JSON.parse(readFileSync(
  new URL('../../../public/data/us-city-ranking-2025.json', import.meta.url),
  'utf8',
)) as {
  year: number
  geographyYear: number
  geographySourceUrl: string
  geographyDownloadUrl: string
  geographySource: string
  cities: CensusCity[]
}

test('the complete 2025 Census city snapshot has unique places and a consistent ranking', () => {
  assert.equal(dataset.year, 2025)
  assert.equal(dataset.cities.length, 19_483)
  assert.equal(dataset.geographyYear, 2025)
  assert.equal(new URL(dataset.geographySourceUrl).hostname, 'www.census.gov')
  assert.equal(new URL(dataset.geographyDownloadUrl).hostname, 'www2.census.gov')
  assert.match(dataset.geographySource, /U\.S\. Census Bureau.*2025 National Places Gazetteer/)
  const identifiers = new Set<string>()

  for (const [index, city] of dataset.cities.entries()) {
    assert.match(city.placeFips, /^\d{7}$/)
    assert.ok(!identifiers.has(city.placeFips), `Duplicate place FIPS: ${city.placeFips}`)
    identifiers.add(city.placeFips)
    assert.equal(city.country, 'United States')
    assert.match(city.name, /^.+, [A-Za-z ]+$/, `Missing state in ${city.name}`)
    assert.ok(Number.isInteger(city.population) && city.population >= 0, city.name)
    assert.ok(Number.isFinite(city.latitude) && city.latitude >= -90 && city.latitude <= 90,
      `Latitude for ${city.name}`)
    assert.ok(Number.isFinite(city.longitude) && city.longitude >= -180 && city.longitude <= 180,
      `Longitude for ${city.name}`)

    const previous = dataset.cities[index - 1]
    if (previous) {
      assert.ok(previous.population >= city.population, `Population order at ${city.name}`)
      if (previous.population === city.population) {
        assert.ok(previous.name <= city.name, `Alphabetical tie order at ${city.name}`)
      }
    }
  }
})

test('the actual ranking reaches the largest and smallest Census places at its boundaries', () => {
  const total = dataset.cities.length
  assert.deepEqual(lookupCityRank('1', dataset.cities), {
    ok: true,
    rank: 1,
    city: {
      name: 'New York city, New York', country: 'United States', population: 8_584_629,
      placeFips: '3651000', latitude: 40.662712, longitude: -73.938677,
    },
  })
  assert.deepEqual(lookupCityRank(String(total), dataset.cities), {
    ok: true,
    rank: 19_483,
    city: {
      name: 'South Park View city, Kentucky', country: 'United States', population: 0,
      placeFips: '2172138', latitude: 38.118416, longitude: -85.719954,
    },
  })
  assert.deepEqual(lookupCityRank(String(total + 1), dataset.cities), {
    ok: false, error: 'Enter a whole number from 1 to 19483.',
  })
})
