import assert from 'node:assert/strict'
import test from 'node:test'

import {
  SUPPORTED_CHECKBOX_COUNTS,
  formatState,
  generateCombinations,
  getStateLabel,
} from './states.ts'

test('one through four switches follow the specified game order', () => {
  const expected = {
    1: ['O', 'X'],
    2: ['OX', 'OO', 'XO', 'XX'],
    3: ['OOX', 'OOO', 'OXO', 'OXX', 'XOX', 'XOO', 'XXO', 'XXX'],
    4: [
      'OXOX', 'OXOO', 'OXXO', 'OXXX',
      'OOOX', 'OOOO', 'OOXO', 'OOXX',
      'XOOX', 'XOOO', 'XOXO', 'XOXX',
      'XXOX', 'XXOO', 'XXXO', 'XXXX',
    ],
  }

  for (const [count, patterns] of Object.entries(expected)) {
    const combinations = generateCombinations(Number(count))
    assert.deepEqual(combinations.map(formatState), patterns)
    assert.deepEqual(combinations.map(getStateLabel), patterns.map((_, index) => String(index + 1)))
  }
})

test('six switches use two three-switch groups with the right group changing first', () => {
  const combinations = generateCombinations(6)
  const triples = ['OOX', 'OOO', 'OXO', 'OXX', 'XOX', 'XOO', 'XXO', 'XXX']

  for (let left = 0; left < 8; left++) {
    for (let right = 0; right < 8; right++) {
      const combination = combinations[left * 8 + right]
      assert.equal(formatState(combination), `${triples[left]} ${triples[right]}`)
      assert.equal(getStateLabel(combination), `${left + 1} ${right + 1}`)
    }
  }

  assert.equal(getStateLabel('111111'), '2 2')
  assert.equal(getStateLabel('000000'), '8 8')
})

test('every supported game includes each binary state exactly once', () => {
  assert.deepEqual(SUPPORTED_CHECKBOX_COUNTS, [1, 2, 3, 4, 6])
  for (const count of SUPPORTED_CHECKBOX_COUNTS) {
    const combinations = generateCombinations(count)
    assert.equal(combinations.length, 2 ** count)
    assert.equal(new Set(combinations).size, 2 ** count)
    assert.ok(combinations.every(state => state.length === count && /^[01]+$/.test(state)))
  }
})

test('callers cannot change the ordering by mutating a generated list', () => {
  const combinations = generateCombinations(2)
  combinations.reverse()
  combinations[0] = 'invalid'
  assert.deepEqual(generateCombinations(2), ['10', '11', '01', '00'])
  assert.equal(getStateLabel('10'), '1')
})

test('unsupported checkbox counts are rejected explicitly', () => {
  for (const count of [-1, 0, 5, 7, 1.5, NaN, Infinity]) {
    assert.throws(() => generateCombinations(count), {
      name: 'RangeError',
      message: /Unsupported checkbox count/,
    })
  }
})

test('formatting and state labels reject invalid states', () => {
  for (const helper of [getStateLabel, formatState]) {
    for (const state of ['', 'OX', '102', ' 10', '10 ', '101\n', '101 101']) {
      assert.throws(() => helper(state), {
        name: 'TypeError',
        message: /nonempty binary string/,
      })
    }
    for (const state of ['11111', '1111111']) {
      assert.throws(() => helper(state), {
        name: 'RangeError',
        message: /Unsupported checkbox count/,
      })
    }
  }
})
