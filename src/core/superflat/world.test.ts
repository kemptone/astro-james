import {test} from 'node:test'
import assert from 'node:assert/strict'
import {javaBlockIds} from './java-blocks.ts'
import {parseLayers, parseJavaLayers, formatLayers, formatJavaLayers, formatJavaPreset, layerBlockEdit, presets, blockAt, put, addPack, type World} from './world.ts'
const make = (source: string = presets['Classic flat'].layers): World => ({layers: parseLayers(source), edits: {}, level: -60, name: 'Test', biome: 'plains'})
test('classic layer boundaries fill intervals, with void below -64', () => {
  const world = make()
  for (const [y, block] of [[-60, 'air'], [-61, 'grass_block'], [-62, 'dirt'], [-63, 'dirt'], [-64, 'bedrock'], [-65, 'air']] as const) assert.equal(blockAt(world, 0, y, 0), block)
})
test('bedrock at -64 is only the bottom plane', () => {
  const world = make('-63 = bedrock')
  assert.equal(blockAt(world, 0, -64, 0), 'bedrock'); assert.equal(blockAt(world, 0, -63, 0), 'air')
})
test('snow covering grass at zero and water world use the supplied presets', () => {
  assert.equal(blockAt(make(presets['Snowy kingdom'].layers), 0, 0, 0), 'snow')
  const world = make(presets['Water world'].layers)
  assert.equal(blockAt(world, 0, 105, 0), 'water'); assert.equal(blockAt(world, 0, 17, 0), 'water')
  assert.equal(blockAt(world, 0, 16, 0), 'gravel'); assert.equal(blockAt(world, 0, 0, 0), 'deepslate')
})
test('arbitrary blocks and very high edits are sparse and removable', () => {
  const world = make('1000000000 Ice_crystals\n-63 Bedrock')
  put(world, 1, 2000000000, 1, 'Cake')
  assert.equal(blockAt(world, 1, 2000000000, 1), 'cake')
  assert.equal(Object.keys(world.edits).length, 1)
  put(world, 1, 2000000000, 1, 'air'); assert.equal(blockAt(world, 1, 2000000000, 1), 'air')
})
test('bad layer syntax, conflicting Y and invalid heights are rejected', () => {
  for (const source of ['', '-64 Stone', 'Infinity Stone', '1 Stone\n1 = Dirt', '1.5 Cake', '9007199254740992 Stone']) assert.throws(() => parseLayers(source))
})
test('Java presets list layer counts bottom up and end with the chosen biome', () => {
  const world = make('-61 = Minecraft:Dirt, −60=Grass block, -63 = bedrock')
  assert.equal(formatJavaPreset(world.layers, 'flower_forest'), '1*minecraft:bedrock,2*minecraft:dirt,1*minecraft:grass_block;minecraft:flower_forest')
})
test('layer code accepts invented names and contains only layer entries', () => {
  assert.equal(formatJavaLayers(parseLayers('-60 chicken')), '4*minecraft:chicken')
  assert.equal(
    formatJavaLayers(parseLayers('-60 Moon Fluff\n-63 = Glimmerdüst')),
    '1*minecraft:glimmerdüst,3*minecraft:moon_fluff',
  )
})
test('Java layer counts convert back to boundaries starting at Y -64', () => {
  assert.equal(formatLayers(parseJavaLayers('4*minecraft:chicken')), '-60 = chicken')
  const layers = parseJavaLayers('minecraft:bedrock, 2*minecraft:dirt, minecraft:grass_block;minecraft:plains')
  assert.equal(formatLayers(layers), '-60 = grass_block\n-61 = dirt\n-63 = bedrock')
  assert.equal(formatJavaLayers(layers), '1*minecraft:bedrock,2*minecraft:dirt,1*minecraft:grass_block')
  const custom = parseLayers('-60 Moon Fluff\n-63 Glimmerdüst')
  assert.deepEqual(parseJavaLayers(formatJavaLayers(custom)), custom)
  for (const code of ['0*dirt', '1.5*dirt', '9007199254740992*dirt', '2*', 'stone,,dirt']) {
    assert.throws(() => parseJavaLayers(code))
  }
})
test('every catalog block exports with its registry ID', () => {
  assert.equal(new Set(javaBlockIds).size, 1286)
  for (const id of javaBlockIds) {
    assert.equal(formatJavaPreset(parseLayers(`-63 = minecraft:${id}`), 'plains'), `1*minecraft:${id};minecraft:plains`)
  }
  const custom = make('-63 = ice crystals')
  assert.equal(blockAt(custom, 0, -64, 0), 'ice_crystals')
  assert.throws(() => formatJavaPreset(custom.layers, 'plains'), /26\.3 catalog/)
})
test('picking a block replaces the current layer and preserves the other rows', () => {
  const source = '-60 = grass block, -61 = dirt\n-63 = bedrock'
  const edit = layerBlockEdit(source, source.indexOf('dirt'), 'cherry_planks')
  assert.equal(source.slice(0, edit.start) + edit.text + source.slice(edit.end), '-60 = grass block,-61 = cherry_planks\n-63 = bedrock')
  const blank = layerBlockEdit(source + '\n', source.length + 1, 'air')
  assert.equal(blank.text, ' = air')
  assert.equal(blank.caret, source.length + 1)
})
test('old worlds retain their original block heights when reopened in the layer editor', () => {
  const saved = [{y: -60, block: 'grass_block'}, {y: -61, block: 'dirt'}, {y: -63, block: 'bedrock'}]
  assert.deepEqual(parseLayers(formatLayers(saved)), saved)
})
test('Java presets fit the Overworld height while the playground supports higher layers', () => {
  assert.equal(formatJavaPreset(make('320 = stone').layers, 'plains'), '384*minecraft:stone;minecraft:plains')
  const world = make('321 = stone')
  assert.equal(blockAt(world, 0, 320, 0), 'stone')
  assert.throws(() => formatJavaPreset(world.layers, 'plains'), /320/)
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
