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

await rm(stagedDirectory, {recursive: true, force: true})
await mkdir(path.join(stagedClientDirectory, 'star'), {recursive: true})
await mkdir(path.join(stagedDirectory, 'server'), {recursive: true})

await cp(
  path.join(clientDirectory, 'star', 'index.html'),
  path.join(stagedClientDirectory, 'star', 'index.html')
)
await cp(
  path.join(clientDirectory, 'star', 'index.html'),
  path.join(stagedClientDirectory, 'index.html')
)
await cp(
  path.join(clientDirectory, '_astro'),
  path.join(stagedClientDirectory, '_astro'),
  {recursive: true}
)

for (const filename of [
  'externalEval.js',
  'favicon.svg',
  'manifest.json',
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
  'Astro James Star Narrator — Cloudflare Workers-compatible Sites build\n'
)

await rm(distDirectory, {recursive: true, force: true})
await rename(stagedDirectory, distDirectory)
