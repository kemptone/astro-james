import {test} from 'node:test'
import assert from 'node:assert/strict'
import {parseLayers, presets, blockAt, put, addPack, type World} from './world.ts'
const make = (source = presets['Classic flat']): World => ({layers: parseLayers(source), edits: {}, level: -59, name: 'Test'})
test('classic layer boundaries fill intervals, with void below -64', () => {
  const world = make()
  for (const [y, block] of [[-59, 'air'], [-60, 'grass_block'], [-61, 'dirt'], [-62, 'dirt'], [-63, 'bedrock'], [-64, 'bedrock'], [-65, 'air']] as const) assert.equal(blockAt(world, 0, y, 0), block)
})
test('bedrock at -64 is only the bottom plane', () => {
  const world = make('-64 Bedrock')
  assert.equal(blockAt(world, 0, -64, 0), 'bedrock'); assert.equal(blockAt(world, 0, -63, 0), 'air')
})
test('snow covering grass at zero and water world use the supplied presets', () => {
  assert.equal(blockAt(make(presets['Snowy kingdom']), 0, 0, 0), 'snow')
  const world = make(presets['Water world'])
  assert.equal(blockAt(world, 0, 105, 0), 'water'); assert.equal(blockAt(world, 0, 17, 0), 'water')
  assert.equal(blockAt(world, 0, 16, 0), 'gravel'); assert.equal(blockAt(world, 0, 0, 0), 'deepslate')
})
test('arbitrary blocks and very high edits are sparse and removable', () => {
  const world = make('1000000000 Ice_crystals\n-64 Bedrock')
  put(world, 1, 2000000000, 1, 'Cake')
  assert.equal(blockAt(world, 1, 2000000000, 1), 'cake')
  assert.equal(Object.keys(world.edits).length, 1)
  put(world, 1, 2000000000, 1, 'air'); assert.equal(blockAt(world, 1, 2000000000, 1), 'air')
})
test('bad layer syntax, conflicting Y and invalid heights are rejected', () => {
  for (const source of ['', '-65 Stone', 'Infinity Stone', '1 Stone\n1 Dirt', '1.5 Cake', '9007199254740992 Stone']) assert.throws(() => parseLayers(source))
})
test('free packs place editable blocks and stay within the horizontal board', () => {
  for (let index = 0; index < 3; index++) {
    const world = make(); addPack(world, index, 0, 0)
    assert.ok(Object.keys(world.edits).length > 0)
    for (const key of Object.keys(world.edits)) {const [x,, z] = key.split(',').map(Number); assert.ok(x >= 0 && x < 16 && z >= 0 && z < 16)}
    const [x, y, z] = Object.keys(world.edits)[0].split(',').map(Number)
    put(world, x, y, z, 'air'); assert.equal(blockAt(world, x, y, z), 'air')
  }
})
