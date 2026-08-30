import assert from 'node:assert/strict'
import test from 'node:test'

import {
  formatHourOfDay,
  formatTimeOfDay,
  hoursLeftToTimeOfDay,
  parseFullTime,
  parseHoursOnly,
  timeLeftToTimeOfDay,
} from './timeHelpers.ts'

const MIDNIGHT = 0
const TWO_TWENTY_PM = 14 * 60 + 20

test('parses full time values and rejects malformed or out-of-range values', () => {
  assert.deepEqual(parseFullTime('0:00'), {ok: true, value: 0})
  assert.deepEqual(parseFullTime('23:59'), {ok: true, value: 1439})
  assert.equal(parseFullTime('').ok, false)
  assert.equal(parseFullTime('2:3').ok, false)
  assert.equal(parseFullTime('24:00').ok, false)
  assert.equal(parseFullTime('23:60').ok, false)
})

test('parses hours-only values and rejects blanks, decimals, and values over 23', () => {
  assert.deepEqual(parseHoursOnly('0'), {ok: true, value: 0})
  assert.deepEqual(parseHoursOnly('23'), {ok: true, value: 23})
  assert.equal(parseHoursOnly('').ok, false)
  assert.equal(parseHoursOnly('1.5').ok, false)
  assert.equal(parseHoursOnly('-1').ok, false)
  assert.equal(parseHoursOnly('24').ok, false)
})

test('converts full time against the Midnight boundary', () => {
  assert.equal(formatTimeOfDay(timeLeftToTimeOfDay(0, MIDNIGHT)), '11:59 PM')
  assert.equal(formatTimeOfDay(timeLeftToTimeOfDay(59, MIDNIGHT)), '11:00 PM')
  assert.equal(formatTimeOfDay(timeLeftToTimeOfDay(60, MIDNIGHT)), '10:59 PM')
  assert.equal(formatTimeOfDay(timeLeftToTimeOfDay(1439, MIDNIGHT)), '12:00 AM')
})

test('converts full time against the 2:20 PM boundary', () => {
  assert.equal(
    formatTimeOfDay(timeLeftToTimeOfDay(0, TWO_TWENTY_PM)),
    '2:19 PM',
  )
  assert.equal(
    formatTimeOfDay(timeLeftToTimeOfDay(59, TWO_TWENTY_PM)),
    '1:20 PM',
  )
  assert.equal(
    formatTimeOfDay(timeLeftToTimeOfDay(1439, TWO_TWENTY_PM)),
    '2:20 PM',
  )
})

test('converts hours-only values in both boundary versions', () => {
  assert.equal(formatHourOfDay(hoursLeftToTimeOfDay(0, MIDNIGHT)), '11 PM')
  assert.equal(formatHourOfDay(hoursLeftToTimeOfDay(1, MIDNIGHT)), '10 PM')
  assert.equal(formatHourOfDay(hoursLeftToTimeOfDay(23, MIDNIGHT)), '12 AM')
  assert.equal(formatHourOfDay(hoursLeftToTimeOfDay(0, TWO_TWENTY_PM)), '1 PM')
  assert.equal(formatHourOfDay(hoursLeftToTimeOfDay(1, TWO_TWENTY_PM)), '12 PM')
  assert.equal(formatHourOfDay(hoursLeftToTimeOfDay(23, TWO_TWENTY_PM)), '2 PM')
})
