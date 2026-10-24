import {presets, parseLayers, blockAt, put, palette, color, packs, addPack, normalize, type World} from './world'

const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const canvas = get<HTMLCanvasElement>('world'), ctx = canvas.getContext('2d')!
const layers = get<HTMLTextAreaElement>('layers'), level = get<HTMLInputElement>('level')
const block = get<HTMLInputElement>('block'), name = get<HTMLInputElement>('world-name')
const status = get('status'), preset = get<HTMLSelectElement>('preset')
let world: World = {layers: parseLayers(presets['Classic flat']), edits: {}, level: -59, name: name.value}
let selected = {x: 8, z: 8}, tool = 'place'
let hits: {x: number; z: number; points: number[][]}[] = []
let width = 0, height = 0
const message = (text: string) => {status.textContent = text}

function polygon(points: number[][], fill: string) {
  ctx.beginPath()
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y))
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill()
  ctx.strokeStyle = '#263d3420'; ctx.lineWidth = .65; ctx.stroke()
}
function draw() {
  const bounds = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1
  width = bounds.width; height = bounds.height
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height)
  const tw = Math.min(width / 35, (height - 115) / 13), th = tw * .48, bh = tw * .78
  const ox = width / 2, oy = 78
  hits = []
  // Render a bounded slice near the chosen Y. Height never controls memory usage.
  for (let sum = 0; sum <= 30; sum++) for (let x = 0; x < 16; x++) {
    const z = sum - x
    if (z < 0 || z >= 16) continue
    let depth = 0, material = 'air'
    while (depth < 7) {
      material = blockAt(world, x, world.level - depth, z)
      if (material !== 'air') break
      depth++
    }
    const px = ox + (x - z) * tw, py = oy + (x + z) * th + Math.min(depth, 2) * bh
    const top = [[px, py], [px + tw, py + th], [px, py + th * 2], [px - tw, py + th]]
    if (material !== 'air') {
      // The visible sides are actual strata, including edits and holes.
      for (let below = 4; below >= 0; below--) {
        const sideMaterial = blockAt(world, x, world.level - depth - below, z)
        if (sideMaterial === 'air') continue
        const sy = py + below * bh, c = color(sideMaterial)
        polygon([[px, sy + th * 2], [px + tw, sy + th], [px + tw, sy + th + bh], [px, sy + th * 2 + bh]], c)
        polygon([[px - tw, sy + th], [px, sy + th * 2], [px, sy + th * 2 + bh], [px - tw, sy + th + bh]], c)
        polygon([[px - tw, sy + th], [px, sy + th * 2], [px, sy + th * 2 + bh], [px - tw, sy + th + bh]], '#162a282c')
      }
      polygon(top, color(material))
      if ((x * 13 + z * 7) % 5 === 0) polygon([[px - tw * .3, py + th * .7], [px + tw * .15, py + th * .6], [px + tw * .45, py + th], [px, py + th * 1.1]], '#ffffff15')
    } else {
      polygon(top, '#b9c9ac28')
    }
    if (x === selected.x && z === selected.z) {
      ctx.beginPath(); top.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath()
      ctx.strokeStyle = '#f3ba63'; ctx.lineWidth = 2.5; ctx.stroke()
    }
    hits.push({x, z, points: top})
  }
  get('height').textContent = `Y ${world.level.toLocaleString()}`
  get('void').textContent = `${(world.level + 64).toLocaleString()} blocks`
  get('position').textContent = `Selected tile · X ${selected.x} / Z ${selected.z}`
  get('display-name').textContent = world.name
  level.value = String(world.level)
}
function act(remove = tool === 'remove') {
  try {
    const material = normalize(block.value)
    if (!remove && !/^[\w.-]+$/.test(material)) throw new Error('Enter a block name, such as Cake or Ice_crystals.')
    const previous = blockAt(world, selected.x, world.level, selected.z)
    put(world, selected.x, world.level, selected.z, remove ? 'air' : material)
    message(remove ? (previous === 'air' ? `Already empty at Y ${world.level}. Lower Y to remove terrain below.` : `Removed ${previous.replaceAll('_', ' ')} at Y ${world.level}.`) : `Placed ${material.replaceAll('_', ' ')} at X ${selected.x}, Y ${world.level}, Z ${selected.z}.`)
    draw()
  } catch (error) {message((error as Error).message)}
}
function inside(px: number, py: number, points: number[][]) {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j]
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
function pick(event: MouseEvent, remove?: boolean) {
  const bounds = canvas.getBoundingClientRect()
  const hit = [...hits].reverse().find(hit => inside(event.clientX - bounds.left, event.clientY - bounds.top, hit.points))
  if (!hit) return
  selected = {x: hit.x, z: hit.z}; act(remove)
}
canvas.addEventListener('click', event => pick(event))
canvas.addEventListener('contextmenu', event => {event.preventDefault(); pick(event, true)})
canvas.addEventListener('keydown', event => {
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Delete', 'Backspace'].includes(event.key)) return
  event.preventDefault()
  if (event.key === 'Enter') act()
  else if (['Delete', 'Backspace'].includes(event.key)) act(true)
  else {
    if (event.key === 'ArrowUp') selected.z = Math.max(0, selected.z - 1)
    if (event.key === 'ArrowDown') selected.z = Math.min(15, selected.z + 1)
    if (event.key === 'ArrowLeft') selected.x = Math.max(0, selected.x - 1)
    if (event.key === 'ArrowRight') selected.x = Math.min(15, selected.x + 1)
    draw()
  }
})
function changeLevel(y: number) {
  if (!Number.isSafeInteger(y) || y < -64 || y >= Number.MAX_SAFE_INTEGER - 1024) {message('Choose a whole Y position of −64 or above, within browser number precision.'); level.value = String(world.level); return}
  world.level = y; draw()
}
level.addEventListener('change', () => changeLevel(Number(level.value)))
get('up').addEventListener('click', () => changeLevel(world.level + 1))
get('down').addEventListener('click', () => changeLevel(world.level - 1))
for (const id of ['place', 'remove']) get(id).addEventListener('click', () => {
  tool = id
  for (const candidate of ['place', 'remove']) {get(candidate).classList.toggle('active', id === candidate); get(candidate).setAttribute('aria-pressed', String(id === candidate))}
})
preset.addEventListener('change', () => {layers.value = presets[preset.value as keyof typeof presets]; message('Preset loaded into the editor. Create a fresh world to apply it.')})
get('generate').addEventListener('click', () => {
  try {
    const parsed = parseLayers(layers.value)
    world = {layers: parsed, edits: {}, level: parsed[0].y + 1, name: name.value.trim() || 'Untitled world'}
    draw(); message('Fresh world created. Choose a block and click a tile to start building.')
  } catch (error) {message((error as Error).message)}
})
name.addEventListener('input', () => {world.name = name.value.trim() || 'Untitled world'; draw()})
get('save').addEventListener('click', () => {
  try {localStorage.setItem('superflat-world-v1', JSON.stringify(world)); message('World saved on this device, including all your blocks and free packs.')}
  catch {message('Could not save. Browser storage may be full or unavailable. Your current world is still open.')}
})
get('load').addEventListener('click', () => {
  try {
    const stored = localStorage.getItem('superflat-world-v1')
    if (!stored) {message('No saved world yet. Use Save world to keep your creation.'); return}
    const loaded: World = JSON.parse(stored)
    if (!Array.isArray(loaded.layers) || !loaded.layers.length || !loaded.edits || typeof loaded.edits !== 'object' || Array.isArray(loaded.edits) || typeof loaded.name !== 'string' || !Number.isSafeInteger(loaded.level) || loaded.level < -64 || loaded.level >= Number.MAX_SAFE_INTEGER - 1024) throw new Error()
    const validated = parseLayers(loaded.layers.map(layer => `${layer.y} ${layer.block}`).join('\n'))
    for (const [key, value] of Object.entries(loaded.edits)) {
      const [x,y,z] = key.split(',').map(Number)
      if (key.split(',').length !== 3 || !Number.isInteger(x) || x < 0 || x >= 16 || !Number.isInteger(z) || z < 0 || z >= 16 || !Number.isSafeInteger(y) || y < -64 || y >= Number.MAX_SAFE_INTEGER - 1024 || typeof value !== 'string' || !/^[\w.-]+$/.test(value)) throw new Error()
    }
    world = {...loaded, layers: validated}; name.value = world.name; layers.value = validated.map(layer => `${layer.y} ${layer.block}`).join('\n'); draw(); message('Saved world loaded. Keep creating!')
  } catch {message('Could not load the saved world. Your current creation has been kept.')}
})
function updateSwatches() {
  for (const button of get('swatches').querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.block === normalize(block.value)))
}
for (const [material, fill] of Object.entries(palette)) {
  const button = document.createElement('button'); button.type = 'button'; button.style.background = fill
  button.title = material.replaceAll('_', ' '); button.setAttribute('aria-label', button.title); button.dataset.block = material
  button.addEventListener('click', () => {block.value = material; updateSwatches()})
  get('swatches').append(button)
}
block.addEventListener('input', updateSwatches); updateSwatches()
packs.forEach((pack, index) => {
  const card = document.createElement('article'); card.className = 'pack'
  const art = document.createElement('div'); art.className = 'pack-art'; art.textContent = pack.icon; art.setAttribute('aria-hidden', 'true')
  const body = document.createElement('div'); body.className = 'pack-body'
  const title = document.createElement('h3'); title.textContent = pack.name
  const description = document.createElement('p'); description.textContent = pack.description
  const button = document.createElement('button'); button.type = 'button'; button.textContent = '＋ Add to world'
  button.setAttribute('aria-label', `Add ${pack.name} to world for free`)
  const free = document.createElement('span'); free.textContent = 'FREE'; button.append(free)
  button.addEventListener('click', () => {
    if (world.level + 4 >= Number.MAX_SAFE_INTEGER - 1024) {message('Lower Y slightly before adding this pack.'); return}
    addPack(world, index, selected.x, selected.z); draw(); message(`${pack.name} added for free around X ${selected.x}, Z ${selected.z}. Every block can be changed or removed.`)
  })
  body.append(title, description, button); card.append(art, body); get('packs').append(card)
})
new ResizeObserver(draw).observe(canvas)
draw()
