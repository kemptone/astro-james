import { fileURLToPath } from "node:url"
import path from "node:path"

export function outputPath(url: string) {
  // Absolute path to THIS .astro file
  const absPath = fileURLToPath(url)

  // Nice relative path from your project root
  const relPath = path.relative(process.cwd(), absPath)

  // Short label like "components/Card.astro"
  const shortName = relPath.split(path.sep).slice(-2).join(path.sep)

  // fragment path
  const fragmentPath = "/" + shortName.replace(".astro", "")

  function setPathWithParams(paramObj: Record<string, string>) {
    const params = new URLSearchParams()
    Object.entries(paramObj).forEach(([key, value]) => {
      params.set(key, value.toString())
    })
    return `${fragmentPath}?${params.toString()}`
  }

  return {
    absPath,
    relPath,
    shortName,
    fragmentPath,
    setPathWithParams
  }
}
