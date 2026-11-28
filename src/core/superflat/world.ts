import {javaBlockIds} from './java-blocks.ts'

export const presets = {
  'Classic flat': {layers: '-60 = grass block\n-61 = dirt\n-63 = bedrock', biome: 'plains'},
  'Snowy kingdom': {layers: '1 = snow\n1 = grass block\n0 = dirt\n-4 = stone\n-62 = bedrock', biome: 'snowy_plains'},
  'Water world': {layers: '106 = water\n17 = gravel\n12 = dirt\n7 = stone\n2 = deepslate\n-62 = bedrock', biome: 'deep_ocean'},
} as const
const bottomY = -64
const maxLayerBoundary = Number.MAX_SAFE_INTEGER - 1024
// A stored layer's Y is its highest occupied block.
export type Layer = {y: number; block: string}
export type World = {layers: Layer[]; edits: Record<string, string>; level: number; name: string; biome: string}
export const normalize = (name: string) => name.trim().replace(/^minecraft:/i, '').replace(/[_ ]+/g, '_').toLowerCase()
export function parseLayers(source: string): Layer[] {
  const layers: Layer[] = []
  for (const line of source.split(/[\n,]/).filter(line => line.trim())) {
    const match = line.trim().match(/^([-−]?\d+)(?:\s*=\s*|\s+)([\p{L}\p{M}\p{N}_ :./-]+)$/u)
    if (!match) throw new Error('Enter one layer per line, like -60 = grass block.')
    const boundary = Number(match[1].replace('−', '-'))
    const y = boundary - 1
    const block = normalize(match[2])
    if (!Number.isSafeInteger(boundary) || y < bottomY || boundary > maxLayerBoundary) throw new Error('Enter a whole-number layer boundary from -63 within the browser’s safe number range.')
    if (!block) throw new Error('Enter a block name for each layer.')
    const duplicate = layers.find(layer => layer.y === y)
    if (duplicate) {
      if ([duplicate.block, block].includes('snow') && [duplicate.block, block].includes('grass_block')) duplicate.block = 'snow'
      else throw new Error(`Give each layer a different boundary. Two layers end at ${boundary}.`)
    } else layers.push({y, block})
  }
  if (!layers.length) throw new Error('Add at least one layer.')
  return layers.sort((a, b) => b.y - a.y)
}
export function formatLayers(layers: Layer[]) {
  return layers.map(({y, block}) => `${y + 1} = ${block}`).join('\n')
}
export function layerBlockEdit(source: string, caret: number, block: string) {
  const before = source.slice(0, caret)
  const start = Math.max(before.lastIndexOf('\n'), before.lastIndexOf(',')) + 1
  const nextSeparator = source.slice(caret).search(/[\n,]/)
  const end = nextSeparator === -1 ? source.length : caret + nextSeparator
  const boundary = source.slice(start, end).match(/^\s*([-−]?\d+)(?=\s|=|$)/)?.[1] ?? ''
  return {start, end, text: `${boundary} = ${block}`, caret: start + boundary.length}
}
export function formatJavaLayers(layers: Layer[]) {
  let nextY = bottomY
  return [...layers].reverse().map(({y, block}) => {
    const count = y + 1 - nextY
    nextY = y + 1
    const id = block.includes(':') ? block : `minecraft:${block}`
    return `${count}*${id}`
  }).join(',')
}
export function parseJavaLayers(source: string): Layer[] {
  const [layerCode] = source.split(';', 1)
  let boundary = bottomY
  return layerCode.split(',').map(entry => {
    const match = entry.trim().match(/^(?:(\d+)\s*\*\s*)?([\p{L}\p{M}\p{N}_ :./-]+)$/u)
    if (!match) throw new Error('Enter comma-separated blocks, like 4*minecraft:chicken.')

    const count = Number(match[1] ?? '1')
    const block = normalize(match[2])
    if (!block) throw new Error('Enter a block name for each layer.')
    if (!Number.isSafeInteger(count) || count < 1 || boundary + count > maxLayerBoundary) {
      throw new Error('Use positive whole-number layer counts within the browser’s safe number range.')
    }
    boundary += count
    return {y: boundary - 1, block}
  }).reverse()
}
export function formatJavaPreset(layers: Layer[], biome: string) {
  if (layers[0].y > 319) throw new Error('For Java Edition, use a top layer boundary of 320 or lower.')
  for (const {block} of layers) {
    if (!javaBlockIds.includes(block)) throw new Error(`“${block}” is outside the Java Edition 26.3 catalog. Choose a Minecraft block for this preset.`)
  }
  return `${formatJavaLayers(layers)};minecraft:${biome}`
}
export function blockAt(world: World, x: number, y: number, z: number): string {
  if (y < bottomY) return 'air'
  const edited = world.edits[`${x},${y},${z}`]
  if (edited !== undefined) return edited
  for (let i = world.layers.length - 1; i >= 0; i--) {
    if (y <= world.layers[i].y) return world.layers[i].block
  }
  return 'air'
}
export function put(world: World, x: number, y: number, z: number, block: string) {
  if (!Number.isSafeInteger(y) || y < bottomY || y >= Number.MAX_SAFE_INTEGER - 1024) throw new Error('That Y position is outside the supported number range.')
  world.edits[`${x},${y},${z}`] = normalize(block)
}
export const palette: Record<string, string> = {
  grass_block: '#7fa84a', dirt: '#926648', bedrock: '#414651', stone: '#8a9292',
  snow: '#ecf7fa', water: '#4c9bc4', gravel: '#b8afa3', deepslate: '#4c5363',
  oak_planks: '#c79d62', glass: '#ade4dd', cake: '#f4a5b1', ice_crystals: '#94d8f4',
  bricks: '#bc6b51', gold_block: '#eaca5e', cherry_leaves: '#e6a1ba', sand: '#e5d39e',
}
export function color(block: string) {
  if (Object.hasOwn(palette, block)) return palette[block]
  let hash = 0
  for (const char of block) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return `hsl(${Math.abs(hash) % 360} 38% 62%)`
}
export const packs = [
  {name: 'Cherry garden', description: 'A pink canopy and a little wooden pavilion.', icon: '🌸', block: 'cherry_leaves', kind: 'garden'},
  {name: 'Crystal grove', description: 'Glowing blue spires for a frozen kingdom.', icon: '💎', block: 'ice_crystals', kind: 'crystal'},
  {name: 'Cake party', description: 'A picnic of cakes on a golden platform.', icon: '🍰', block: 'cake', kind: 'party'},
] as const
export function addPack(world: World, index: number, cx: number, cz: number) {
  const pack = packs[index]
  if (!pack) return
  const y = world.level
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const x = cx + dx, z = cz + dz
    if (x < 0 || x >= 16 || z < 0 || z >= 16) continue
    put(world, x, y, z, pack.kind === 'party' ? 'gold_block' : 'oak_planks')
    if (pack.kind === 'garden') {
      if (Math.abs(dx) === 2 && Math.abs(dz) === 2) for (let h = 1; h <= 3; h++) put(world, x, y + h, z, 'oak_planks')
      put(world, x, y + 4, z, 'cherry_leaves')
    } else if ((dx + dz) % 2 === 0) {
      const height = pack.kind === 'crystal' ? 4 - Math.abs(dx) : 1
      for (let h = 1; h <= height; h++) put(world, x, y + h, z, pack.block)
    }
  }
  world.level += pack.kind === 'party' ? 1 : 4
}
