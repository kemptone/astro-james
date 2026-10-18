import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildCityNarration,
  lookupCityRank,
  rankCities,
  type RankedCity,
} from './city-ranking.ts'

const cities: readonly RankedCity[] = [
  {name: 'First City', country: 'First Country', population: 3_000_000},
  {name: 'Middle City', country: 'Middle Country', population: 2_000_000},
  {name: 'Last City', country: 'Last Country', population: 1_000_000},
]

test('rank one, a middle rank, and the final rank use the supplied list order', () => {
  for (const rank of [1, 2, 3]) {
    assert.deepEqual(lookupCityRank(String(rank), cities), {
      ok: true, rank, city: cities[rank - 1],
    })
  }

  const reversed = [...cities].reverse()
  assert.deepEqual(lookupCityRank('1', reversed), {ok: true, rank: 1, city: cities[2]})
})

test('ranking input accepts trimmed whole digits and leading zeroes', () => {
  for (const input of ['2', ' 2 ', '\n2\t', '002']) {
    assert.deepEqual(lookupCityRank(input, cities), {ok: true, rank: 2, city: cities[1]})
  }
})

test('ranking input rejects blank, non-whole, unsafe, and out-of-range numbers', () => {
  for (const input of [
    '', ' \t\n', '0', '00', '-1', '+1', '1.0', '1.5', '1e0', '0x1',
    'one', 'NaN', 'Infinity', '1 2', '1,000', '４', '4',
    String(Number.MAX_SAFE_INTEGER + 1), '999999999999999999999999999999999999',
  ]) {
    assert.deepEqual(lookupCityRank(input, cities), {
      ok: false, error: 'Enter a whole number from 1 to 3.',
    }, input)
  }
})

test('an empty city list gives a useful error for every input', () => {
  for (const input of ['1', '', '-1']) {
    assert.deepEqual(lookupCityRank(input, []), {ok: false, error: 'No cities are available.'})
  }
})

test('cities sort by descending population without changing the original array or tied order', () => {
  const tiedCity = {name: 'Tied City', country: 'Another Country', population: 2_000_000}
  const input = Object.freeze([cities[2], cities[1], tiedCity, cities[0]])
  const ranked = rankCities(input)

  assert.deepEqual(ranked, [cities[0], cities[1], tiedCity, cities[2]])
  assert.deepEqual(input, [cities[2], cities[1], tiedCity, cities[0]])
  assert.notEqual(ranked, input)
  ranked.reverse()
  assert.deepEqual(input, [cities[2], cities[1], tiedCity, cities[0]])
  assert.deepEqual(rankCities([]), [])
})

test('sorting and rank lookup preserve coordinates on enriched city records', () => {
  const withCoordinates = cities.map((city, index) => ({...city, latitude: index, longitude: -index}))
  const ranked = rankCities([...withCoordinates].reverse())
  assert.equal(ranked[0].latitude, 0)
  const result = lookupCityRank('2', ranked)
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.city.latitude, 1)
    assert.equal(result.city.longitude, -1)
    assert.equal(result.city, withCoordinates[1])
  }
})

test('first and final city narration specify the list, population, and data year', () => {
  assert.equal(buildCityNarration(1, cities[0], 3, 2025),
    'First City, First Country is the most populous city in this list of 3 cities. Its estimated population was 3,000,000 in 2025.')
  assert.equal(buildCityNarration(3, cities[2], 3, 2025),
    'Last City, Last Country is the least populous city in this list of 3 cities. Its estimated population was 1,000,000 in 2025.')
})

test('middle city narration includes its exact rank and dataset context', () => {
  assert.equal(buildCityNarration(2, cities[1], 3, 2024),
    'Middle City, Middle Country is ranked number 2 out of these 3 cities. Its estimated population was 2,000,000 in 2024.')
})
