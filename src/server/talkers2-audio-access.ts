const AUDIO_ACCESS_HEADER = 'x-talkers2-audio-key'
const AUDIO_ACCESS_KEY = import.meta.env.TALKERS2_AUDIO_CHECK_ACCESS_KEY

export type AudioAccessFailure = {
  error: string
  status: 401 | 503
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false

  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

export function getAudioAccessFailure(
  request: Request
): AudioAccessFailure | null {
  // A configured key keeps audio checking private. Deployments without one
  // remain usable and rely on the endpoints' same-origin, rate, size, and
  // concurrency limits instead.
  if (!import.meta.env.PROD || !AUDIO_ACCESS_KEY) return null

  const providedKey = request.headers.get(AUDIO_ACCESS_HEADER) || ''
  if (!constantTimeEqual(providedKey, AUDIO_ACCESS_KEY)) {
    return {
      error: 'Talkers2 audio access is required',
      status: 401,
    }
  }

  return null
}
