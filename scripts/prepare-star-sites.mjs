import {cp, mkdir, rename, rm, writeFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import path from 'node:path'

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
)
const distDirectory = path.join(projectRoot, 'dist')
const clientDirectory = path.join(distDirectory, 'client')
const stagedDirectory = path.join(projectRoot, '.sites-star-dist')
const stagedClientDirectory = path.join(stagedDirectory, 'client')
const staticRoutes = ['star', 'wordle', 'wavegame', 'sro9']

await rm(stagedDirectory, {recursive: true, force: true})
await mkdir(path.join(stagedDirectory, 'server'), {recursive: true})

for (const route of staticRoutes) {
  await mkdir(path.join(stagedClientDirectory, route), {recursive: true})
  await cp(
    path.join(clientDirectory, route, 'index.html'),
    path.join(stagedClientDirectory, route, 'index.html')
  )
}

await cp(
  path.join(clientDirectory, 'star', 'index.html'),
  path.join(stagedClientDirectory, 'index.html')
)
await cp(
  path.join(clientDirectory, '_astro'),
  path.join(stagedClientDirectory, '_astro'),
  {recursive: true}
)

await mkdir(path.join(stagedClientDirectory, 'lights'), {recursive: true})
for (const filename of ['light_off2.png', 'light_on2.png']) {
  await cp(
    path.join(clientDirectory, 'lights', filename),
    path.join(stagedClientDirectory, 'lights', filename)
  )
}

for (const filename of [
  'externalEval.js',
  'favicon.svg',
  'manifest.json',
  'wordle-og.png',
]) {
  await cp(
    path.join(clientDirectory, filename),
    path.join(stagedClientDirectory, filename)
  )
}

await writeFile(
  path.join(stagedClientDirectory, 'loadserviceworker.js'),
  '// Service worker intentionally disabled for the standalone Star Narrator deployment.\n'
)

await cp(
  path.join(projectRoot, 'sites', 'star-worker.js'),
  path.join(stagedDirectory, 'server', 'index.js')
)

await writeFile(
  path.join(stagedDirectory, 'BUILD.txt'),
  'Astro James Star Narrator, Wordle, Wave Game, and SRO9 — Cloudflare Workers-compatible Sites build\n'
)

await rm(distDirectory, {recursive: true, force: true})
await rename(stagedDirectory, distDirectory)
