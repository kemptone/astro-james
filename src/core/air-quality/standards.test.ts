import assert from 'node:assert/strict'
import test from 'node:test'
import {
  airQualityStandards,
  buildAirQualityGradient,
  clampAirQualityValue,
  getAirQualityBand,
  getAirQualityPercentage,
} from './standards.ts'

test('every country scale covers its complete meter without gaps', () => {
  for (const standard of airQualityStandards) {
    assert.equal(standard.bands[0].min, standard.min, standard.country)
    assert.equal(standard.bands.at(-1)?.max, standard.max, standard.country)

    standard.bands.forEach((band, index) => {
      assert.ok(band.min <= band.max, `${standard.country}: ${band.label}`)
      if (index > 0) {
        assert.equal(
          band.min,
          standard.bands[index - 1].max + standard.step,
          `${standard.country}: gap before ${band.label}`,
        )
      }

      assert.equal(
        getAirQualityBand(standard, band.min),
        band,
        `${standard.country}: lower edge of ${band.label}`,
      )
      assert.equal(
        getAirQualityBand(standard, band.max),
        band,
        `${standard.country}: upper edge of ${band.label}`,
      )
    })
  }
})

test('Singapore uses the requested five PSI ranges', () => {
  const singapore = airQualityStandards.find(
    standard => standard.id === 'singapore',
  )!

  assert.deepEqual(
    singapore.bands.map(band => [band.min, band.max, band.label]),
    [
      [0, 50, 'Good'],
      [51, 100, 'Moderate'],
      [101, 200, 'Unhealthy'],
      [201, 300, 'Very unhealthy'],
      [301, 500, 'Extremely unhealthy'],
    ],
  )
})

test('meter helpers clamp values and produce a complete gradient', () => {
  const mexico = airQualityStandards.find(standard => standard.id === 'mexico')!

  assert.equal(clampAirQualityValue(mexico, -100), 1)
  assert.equal(clampAirQualityValue(mexico, 100), 5)
  assert.equal(getAirQualityPercentage(mexico, 1), 0)
  assert.equal(getAirQualityPercentage(mexico, 5), 100)
  assert.match(buildAirQualityGradient(mexico), /^linear-gradient\(90deg,/)
})
