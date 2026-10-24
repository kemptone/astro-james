export const presets = {
  'Classic flat': '-60 Grass_block\n-61 Dirt\n-63 Bedrock',
  'Snowy kingdom': '0 Snow\n0 Grass_block\n-1 Dirt\n-5 Stone\n-63 Bedrock',
  'Water world': '105 Water\n16 Gravel\n11 Dirt\n6 Stone\n1 Deepslate\n-63 Bedrock',
}
export type Layer = {y: number; block: string}
export type World = {layers: Layer[]; edits: Record<string, string>; level: number; name: string}
export const normalize = (name: string) => name.trim().replace(/^minecraft:/i, '').replace(/[_ ]+/g, '_').toLowerCase()
export function parseLayers(source: string): Layer[] {
  const layers: Layer[] = []
  for (const line of source.split('\n').filter(line => line.trim())) {
    const match = line.trim().match(/^(-?\d+)\s+([\w :.-]+)$/)
    if (!match) throw new Error('Use one Y position and block per line, for example: -60 Grass_block.')
    const y = Number(match[1]), block = normalize(match[2])
    if (!Number.isSafeInteger(y) || y < -64 || y >= Number.MAX_SAFE_INTEGER - 1024) throw new Error('Y must be a whole number from -64 within the browser’s safe number range.')
    const duplicate = layers.find(layer => layer.y === y)
    if (duplicate) {
      if ([duplicate.block, block].includes('snow') && [duplicate.block, block].includes('grass_block')) duplicate.block = 'snow'
      else throw new Error(`Y=${y} has two blocks. Give each layer a different Y position.`)
    } else layers.push({y, block})
  }
  if (!layers.length) throw new Error('Add at least one layer.')
  return layers.sort((a, b) => b.y - a.y)
}
export function blockAt(world: World, x: number, y: number, z: number): string {
  if (y < -64) return 'air'
  const edited = world.edits[`${x},${y},${z}`]
  if (edited !== undefined) return edited
  for (let i = world.layers.length - 1; i >= 0; i--) {
    if (y <= world.layers[i].y) return world.layers[i].block
  }
  return 'air'
}
export function put(world: World, x: number, y: number, z: number, block: string) {
  if (!Number.isSafeInteger(y) || y < -64 || y >= Number.MAX_SAFE_INTEGER - 1024) throw new Error('That Y position is outside the supported number range.')
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
