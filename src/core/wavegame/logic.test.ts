import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildLinearPath,
  parseWaves,
  positionWavePoints,
  waveShouldBeRed,
} from './logic.ts'

const plot = {left: 72, top: 24, width: 600, height: 492}

test('parses valid wave sequences and rejects invalid entries', () => {
  assert.deepEqual(parseWaves('100, 0'), {values: [100, 0], error: ''})
  assert.deepEqual(parseWaves('0, 100, 0'), {values: [0, 100, 0], error: ''})
  assert.notEqual(parseWaves('100').error, '')
  assert.notEqual(parseWaves('101, 0').error, '')
  assert.notEqual(parseWaves('hello, 0').error, '')
})

test('positions exact 0 and 100 values on the chart edges', () => {
  const points = positionWavePoints([100, 0, 100], plot)
  assert.deepEqual(points, [
    {x: 72, y: 516},
    {x: 372, y: 24},
    {x: 672, y: 516},
  ])
  assert.ok(points.every(point => point.y >= plot.top))
  assert.ok(points.every(point => point.y <= plot.top + plot.height))
})

test('builds straight segments without curve control points', () => {
  const path = buildLinearPath(positionWavePoints([100, 0], plot))
  assert.equal(path, 'M 72 516 L 672 24')
  assert.equal(path.includes('C'), false)
})

test('red starts strictly above 90', () => {
  assert.equal(waveShouldBeRed([0, 90, 10]), false)
  assert.equal(waveShouldBeRed([0, 91, 10]), true)
  assert.equal(waveShouldBeRed([100, 0]), true)
})
