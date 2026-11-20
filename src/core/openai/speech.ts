export const openAISpeechVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const

export function requestOpenAISpeech(text: string, voice: string, signal?: AbortSignal) {
  return fetch('/api/openai/openai_texttospeech', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({text, voice}),
    signal,
  })
}
