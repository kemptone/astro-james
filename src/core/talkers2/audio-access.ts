const AUDIO_ACCESS_HEADER = 'x-talkers2-audio-key'
const AUDIO_ACCESS_SESSION_KEY = 'talkers2_audio_access_key'

function getSavedAccessKey() {
  try {
    return sessionStorage.getItem(AUDIO_ACCESS_SESSION_KEY) || ''
  } catch {
    return ''
  }
}

function withAccessKey(init: RequestInit, accessKey: string) {
  const headers = new Headers(init.headers)
  if (accessKey) headers.set(AUDIO_ACCESS_HEADER, accessKey)
  return {...init, headers}
}

export async function fetchTalkers2Audio(
  input: RequestInfo | URL,
  init: RequestInit
) {
  let accessKey = getSavedAccessKey()
  let response = await fetch(input, withAccessKey(init, accessKey))
  if (response.status !== 401 || typeof window === 'undefined') return response

  accessKey =
    window.prompt('Enter the private Talkers2 audio-check access key:')?.trim() ||
    ''
  if (!accessKey) return response

  try {
    sessionStorage.setItem(AUDIO_ACCESS_SESSION_KEY, accessKey)
  } catch {
    // The request can still proceed when session storage is unavailable.
  }

  response = await fetch(input, withAccessKey(init, accessKey))
  return response
}
