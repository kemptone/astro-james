import assert from 'node:assert/strict'
import test from 'node:test'

import {buildCityMapUrl} from './city-map.ts'

test('city link targets the native Maps app at the supplied latitude and longitude', () => {
  const url = new URL(buildCityMapUrl({latitude: 40.71427, longitude: -74.00597}))

  assert.equal(url.protocol, 'maps:')
  assert.equal(url.hostname, '')
  assert.equal(url.pathname, '')
  assert.deepEqual([...url.searchParams], [['ll', '40.71427,-74.00597']])
  assert.equal(url.hash, '')
  assert.equal(url.username, '')
  assert.equal(url.password, '')
})

test('western and southern coordinates keep their signs and exact precision', () => {
  const url = new URL(buildCityMapUrl({latitude: -33.8688197, longitude: -151.2092955}))
  assert.equal(url.searchParams.get('ll'), '-33.8688197,-151.2092955')
})

test('zero and coordinate boundary values are valid locations', () => {
  for (const [latitude, longitude] of [[0, 0], [90, 180], [-90, -180]]) {
    const url = new URL(buildCityMapUrl({latitude, longitude}))
    assert.equal(url.searchParams.get('ll'), `${latitude},${longitude}`)
  }
})

test('invalid coordinates cannot produce a Maps link', () => {
  for (const [latitude, longitude] of [
    [NaN, 0], [0, NaN], [Infinity, 0], [0, -Infinity],
    [90.01, 0], [-90.01, 0], [0, 180.01], [0, -180.01],
  ]) {
    assert.throws(() => buildCityMapUrl({latitude, longitude}), /Valid city coordinates/)
  }
})
