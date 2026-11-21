import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'

import {directReplacementReply, replaceRankedNumbers, RUDE_WORDS} from './replacements.ts'
import {DEFAULT_GAME_NAME, normalizeGameName, normalizeReplacementMode} from './settings.ts'
import {STATES_BY_POPULATION} from './states.ts'
import {buildInstructions, formatKevinReply, JAMES_NICKNAME, validatedLocalTurns} from './conversation.ts'

const {cities} = JSON.parse(readFileSync(
  new URL('../../../public/data/us-city-ranking-2025.json', import.meta.url),
  'utf8',
)) as {cities: {name: string}[]}

test('the 40-word game replaces ranked numbers but keeps the typed text available', () => {
  assert.equal(RUDE_WORDS.length, 40)
  assert.equal(replaceRankedNumbers('40', 'rude'), 'cow')
  assert.equal(replaceRankedNumbers('Hello, 1 and 40!', 'rude'), 'Hello, silly and cow!')
  assert.equal(replaceRankedNumbers('0, 41 and 19484', 'rude'), '0, 41 and 19484')
  assert.equal(replaceRankedNumbers('40', 'none'), '40')
})

test('the city game uses the actual population-ranked dataset and its boundaries', () => {
  assert.equal(cities.length, 19_483)
  assert.equal(replaceRankedNumbers('1', 'cities', cities), 'New York City, New York')
  assert.equal(replaceRankedNumbers('Tell me about 1 and 2.', 'cities', cities),
    'Tell me about New York City, New York and Los Angeles city, California.')
  assert.equal(replaceRankedNumbers('19,483', 'cities', cities), cities.at(-1)?.name)
  assert.equal(replaceRankedNumbers('19483', 'cities', cities), 'South Park View city, Kentucky')
  assert.equal(replaceRankedNumbers('19484', 'cities', cities), '19484')
})

test('the state game ranks the 50 states by the 2025 Census estimates', () => {
  assert.equal(STATES_BY_POPULATION.length, 50)
  assert.equal(new Set(STATES_BY_POPULATION).size, 50)
  assert.equal(replaceRankedNumbers('1, 2, 8, 49 and 50', 'states'),
    'California, Texas, Georgia, Vermont and Wyoming')
  assert.equal(replaceRankedNumbers('0, 51, -1, 1.5, .5 and a1', 'states'),
    '0, 51, -1, 1.5, .5 and a1')
})

test('multiply-by-eight mode handles decimals, negatives, and large numbers exactly', () => {
  assert.equal(replaceRankedNumbers('0.125', 'multiply'), '1')
  assert.equal(replaceRankedNumbers('-.125 and 1,000.25', 'multiply'), '-1 and 8002')
  assert.equal(replaceRankedNumbers('0.1, 0.00000000000000000001 and 9007199254740993', 'multiply'),
    '0.8, 0.00000000000000000008 and 72057594037927944')
  assert.equal(replaceRankedNumbers('0, -0, 5. and 2-3', 'multiply'), '0, 0, 40. and 16-24')
  assert.equal(replaceRankedNumbers('a1, 40th, 1e3 and 1.2.3', 'multiply'),
    'a1, 40th, 1e3 and 1.2.3')
})

test('standalone inputs have immediate answers in the new modes', () => {
  assert.equal(directReplacementReply('0.125', 'multiply', '1'), '1')
  assert.equal(directReplacementReply('6', 'multiply', '48'), '48')
  assert.equal(directReplacementReply('1', 'states', 'California'), 'California.')
  assert.equal(directReplacementReply('1', 'cities', 'New York City, New York'), 'New York City, New York.')
  assert.equal(directReplacementReply('51', 'states', '51'), null)
  assert.equal(directReplacementReply('What is 1?', 'multiply', 'What is 8?'), null)
  assert.equal(directReplacementReply('40', 'rude', 'cow'), null)
})

test('replacement leaves decimals, negative numbers, and parts of words alone', () => {
  assert.equal(replaceRankedNumbers('1.5, -1, a1, 40th, 40_ and 40.', 'rude'),
    '1.5, -1, a1, 40th, 40_ and cow.')
})

test('multiply-by-eight is the default without discarding saved mode choices', () => {
  assert.equal(normalizeReplacementMode(null), 'multiply')
  assert.equal(normalizeReplacementMode('unexpected'), 'multiply')
  for (const mode of ['multiply', 'none', 'rude', 'states', 'cities']) {
    assert.equal(normalizeReplacementMode(mode), mode)
  }
})

test('Kevin consistently calls James Guleio Delados and keeps the chosen game name', () => {
  assert.match(buildInstructions('Clover'), /Clover/)
  assert.match(buildInstructions('Clover'), /James is called Guleio Delados/)
  assert.equal(formatKevinReply('Hello, James!'), 'Hello, Guleio Delados!')
  assert.equal(formatKevinReply('That is James’s cat, not Jamestown or astro.james.'),
    'That is Guleio Delados’s cat, not Jamestown or astro.james.')
  assert.equal(formatKevinReply('Hello!'), `${JAMES_NICKNAME}, Hello!`)
})

test('locally answered numbers can be passed into a later chat turn', () => {
  const turns = [
    {role: 'user', content: 'What is 0.125 times 8?'},
    {role: 'assistant', content: '1'},
  ]
  assert.deepEqual(validatedLocalTurns([...turns, {role: 'system', content: 'ignored'}]), turns)
  assert.deepEqual(validatedLocalTurns(null), [])
})

test('game names are normalized and limited to short names', () => {
  assert.equal(DEFAULT_GAME_NAME, 'Clover')
  assert.equal(normalizeGameName('  Mrs.  O’Neill  '), 'Mrs. O’Neill')
  assert.equal(normalizeGameName('Clover'), 'Clover')
  assert.equal(normalizeGameName('19484'), '19484')
  assert.equal(normalizeGameName(''), null)
  assert.equal(normalizeGameName('A'.repeat(41)), null)
  assert.equal(normalizeGameName('<instructions>'), null)
  assert.equal(normalizeGameName(null), null)
})
