import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MAX_CITIES,
  getTemperaturePresentation,
  temperaturesAreOrdered,
  validateMapState,
  type City,
  type MapState,
} from './domain.ts'

function city(overrides: Partial<City> = {}): City {
  return {
    id: 'city_one',
    name: 'One',
    position: {x: 25, y: 75},
    temperatures: {
      heater: 80,
      normal: 70,
      'air-conditioner': 60,
    },
    ...overrides,
  }
}

function map(overrides: Partial<MapState> = {}): MapState {
  return {
    activeMode: 'normal',
    cities: [city()],
    connections: [],
    ...overrides,
  }
}

test('uses the corrected exact -40°F and 0°F blue stops', () => {
  assert.equal(getTemperaturePresentation(-40).color, 'rgb(0, 0, 128)')
  assert.equal(getTemperaturePresentation(0).color, 'rgb(0, 0, 255)')
})

test('keeps the original intermediate temperature stops', () => {
  const expected = new Map([
    [-100, 'rgb(0, 0, 0)'],
    [30, 'rgb(0, 255, 255)'],
    [60, 'rgb(0, 255, 0)'],
    [70, 'rgb(255, 255, 0)'],
    [80, 'rgb(255, 128, 0)'],
    [100, 'rgb(255, 0, 0)'],
    [130, 'rgb(100, 0, 0)'],
    [160, 'rgb(0, 0, 0)'],
  ])
  for (const [temperature, color] of expected) {
    assert.equal(getTemperaturePresentation(temperature).color, color)
  }
})

test('interpolates colors between stops', () => {
  assert.equal(getTemperaturePresentation(-70).color, 'rgb(0, 0, 64)')
  assert.equal(getTemperaturePresentation(-20).color, 'rgb(0, 0, 192)')
  assert.equal(getTemperaturePresentation(75).color, 'rgb(255, 192, 0)')
})

test('renders black from 160–164°F with the five fire opacity states', () => {
  for (const [temperature, opacity] of [
    [160, 0],
    [161, 0.25],
    [162, 0.5],
    [163, 0.75],
    [164, 1],
  ] as const) {
    assert.deepEqual(getTemperaturePresentation(temperature), {
      color: 'rgb(0, 0, 0)',
      fireOpacity: opacity,
    })
  }
})

test('requires Heater > Normal > Air Conditioner', () => {
  assert.equal(
    temperaturesAreOrdered({heater: 80, normal: 70, 'air-conditioner': 60}),
    true,
  )
  assert.equal(
    temperaturesAreOrdered({heater: 70, normal: 70, 'air-conditioner': 60}),
    false,
  )
  assert.equal(
    temperaturesAreOrdered({heater: 80, normal: 60, 'air-conditioner': 60}),
    false,
  )
})

test('rejects unauthorized Heater mode and connection state', () => {
  const heater = validateMapState(map({activeMode: 'heater'}), {
    heater: false,
    connections: true,
  })
  assert.equal(heater.ok, false)
  assert.match(heater.errors.join(' '), /Heater mode requires/)

  const connected = validateMapState(
    map({
      cities: [city(), city({id: 'city_two', name: 'Two'})],
      connections: [
        {id: 'connection_one', fromCityId: 'city_one', toCityId: 'city_two'},
      ],
    }),
    {heater: true, connections: false},
  )
  assert.equal(connected.ok, false)
  assert.match(connected.errors.join(' '), /Connect Lines purchase/)
})

test('rejects self-connections, duplicate pairs, and invalid city data', () => {
  const invalid = validateMapState(
    map({
      cities: [
        city({name: ' '.repeat(3)}),
        city({id: 'city_two', name: 'Two', position: {x: 101, y: 20}}),
      ],
      connections: [
        {id: 'connection_self', fromCityId: 'city_one', toCityId: 'city_one'},
        {id: 'connection_a', fromCityId: 'city_one', toCityId: 'city_two'},
        {id: 'connection_b', fromCityId: 'city_two', toCityId: 'city_one'},
      ],
    }),
  )
  assert.equal(invalid.ok, false)
  assert.match(invalid.errors.join(' '), /needs a name/)
  assert.match(invalid.errors.join(' '), /invalid map position/)
  assert.match(invalid.errors.join(' '), /cannot connect a city to itself/)
  assert.match(invalid.errors.join(' '), /duplicates another connection/)
})

test('enforces the 100-city limit', () => {
  const cities = Array.from({length: MAX_CITIES + 1}, (_, index) =>
    city({id: `city_${index}`, name: `City ${index}`}),
  )
  const result = validateMapState(map({cities}))
  assert.equal(result.ok, false)
  assert.match(result.errors.join(' '), /at most 100 cities/)
})
