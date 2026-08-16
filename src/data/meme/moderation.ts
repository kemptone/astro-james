export type MemeModerationManifestLike = {
  decisions?: Record<string, {status?: string}>
}

export function getBlockedAudioPaths(
  manifest: MemeModerationManifestLike | null | undefined
) {
  const blocked = new Set<string>()

  for (const [audioPath, decision] of Object.entries(
    manifest?.decisions ?? {}
  )) {
    if (decision?.status === 'block') blocked.add(audioPath)
  }

  return blocked
}
