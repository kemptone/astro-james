/** The Checkbox Game narrator uses the same Joey voice as Talkers1. */
export class CheckboxNarrator {
  private generation = 0
  private controller?: AbortController
  private timeout?: ReturnType<typeof setTimeout>
  private audio?: HTMLAudioElement
  private audioUrl?: string

  async speak(text: string, report: (message: string) => void): Promise<void> {
    this.stop()
    const narration = text.trim()
    if (!narration) return

    const generation = this.generation
    const controller = new AbortController()
    this.controller = controller
    const timeout = setTimeout(() => {
      if (generation !== this.generation) return
      this.stop()
      report('Joey took too long to respond. Please try again.')
    }, 30_000)
    this.timeout = timeout

    let failureMessage = 'Joey couldn’t load the narration. Please try again.'
    report('Loading Joey…')

    try {
      const response = await fetch('/api/polly/say', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text: narration, voiceId: 'Joey', engine: 'standard'}),
        signal: controller.signal,
      })
      if (generation !== this.generation) return
      if (!response.ok) {
        failureMessage = `Joey couldn’t load the narration (${response.status}). Please try again.`
        throw new Error('Narration request failed')
      }

      failureMessage = 'Joey returned no playable audio. Please try again.'
      if (!response.headers.get('Content-Type')?.toLowerCase().startsWith('audio/')) {
        throw new Error('Narration response was not audio')
      }
      const blob = await response.blob()
      if (generation !== this.generation) return
      if (!blob.size || !blob.type.toLowerCase().startsWith('audio/')) {
        throw new Error('Narration audio was empty or invalid')
      }

      this.audioUrl = URL.createObjectURL(blob)
      failureMessage = 'Joey couldn’t play the narration. Please try again.'
      const audio = new Audio(this.audioUrl)
      this.audio = audio
      audio.onended = () => {
        if (generation !== this.generation) return
        this.stop()
        report('Joey finished speaking.')
      }
      audio.onerror = () => {
        if (generation !== this.generation) return
        this.stop()
        report('Joey couldn’t play the narration. Please try again.')
      }
      await audio.play()
      if (generation !== this.generation) return
      report('Joey is speaking…')
    } catch {
      if (generation !== this.generation) return
      this.stop()
      report(failureMessage)
    } finally {
      clearTimeout(timeout)
      if (generation === this.generation) {
        this.timeout = undefined
        this.controller = undefined
      }
    }
  }

  stop(): void {
    this.generation++
    this.controller?.abort()
    this.controller = undefined
    clearTimeout(this.timeout)
    this.timeout = undefined
    if (this.audio) {
      this.audio.onended = null
      this.audio.onerror = null
      this.audio.pause()
      this.audio.removeAttribute('src')
      this.audio.load()
      this.audio = undefined
    }
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl)
      this.audioUrl = undefined
    }
  }
}
