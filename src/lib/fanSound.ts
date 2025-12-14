interface FanSoundParams {
  url: string
  accelTime: number
  fullSpeedTime: number
  decelTime: number
  maxSpeed: number
  adjustedPitch?: number
  reverbAmount?: number
}

interface AudioSections {
  start: AudioBuffer
  middle: AudioBuffer
  end: AudioBuffer
}

async function createReverb(
  audioContext: AudioContext,
  impulseResponseUrl?: string,
): Promise<ConvolverNode> {
  const convolver = audioContext.createConvolver()

  if (impulseResponseUrl) {
    try {
      // Load impulse response from file
      const response = await fetch(impulseResponseUrl)
      const arrayBuffer = await response.arrayBuffer()
      const impulseBuffer = await audioContext.decodeAudioData(arrayBuffer)
      convolver.buffer = impulseBuffer
      console.log(`Loaded impulse response: ${impulseResponseUrl}`)
      return convolver
    } catch (error) {
      console.warn(
        `Failed to load impulse response: ${impulseResponseUrl}`,
        error,
      )
      // Fall back to synthetic reverb
    }
  }

  // Fallback: Create synthetic reverb buffer
  const reverbTime = 0.3
  const reverbBufferLength = Math.ceil(reverbTime * audioContext.sampleRate)
  const reverbBuffer = audioContext.createBuffer(
    2,
    reverbBufferLength,
    audioContext.sampleRate,
  )

  const leftChannel = reverbBuffer.getChannelData(0)
  const rightChannel = reverbBuffer.getChannelData(1)

  // Create an impulse response that simulates a room
  for (let i = 0; i < reverbBufferLength; i++) {
    const decay = Math.pow(1 - i / reverbBufferLength, 2)
    leftChannel[i] = (Math.random() * 2 - 1) * decay
    rightChannel[i] = (Math.random() * 2 - 1) * decay
  }

  convolver.buffer = reverbBuffer
  console.log("Using synthetic reverb (fallback)")
  return convolver
}

class FanSoundManager {
  private audioContext: AudioContext
  private masterGainNode: GainNode
  private reverbNode: ConvolverNode | null = null
  private dryGainNode: GainNode
  private wetGainNode: GainNode
  private activeSounds: Set<AudioBufferSourceNode> = new Set()
  private reverbInitialized: boolean = false

  constructor() {
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)()

    // Create audio nodes
    this.masterGainNode = this.audioContext.createGain()
    this.dryGainNode = this.audioContext.createGain()
    this.wetGainNode = this.audioContext.createGain()

    // Set up dry path immediately
    this.dryGainNode.connect(this.audioContext.destination)

    // Set mix levels (30% wet, 70% dry)
    this.dryGainNode.gain.value = 0.7
    this.wetGainNode.gain.value = 0.5
    this.masterGainNode.gain.value = 1.0

    // Initialize reverb asynchronously
    this.initializeReverb()
  }

  private async initializeReverb(impulseResponseUrl?: string) {
    try {
      this.reverbNode = await createReverb(
        this.audioContext,
        impulseResponseUrl,
      )

      // Set up wet path once reverb is ready
      this.wetGainNode.connect(this.reverbNode)
      this.reverbNode.connect(this.audioContext.destination)

      this.reverbInitialized = true
      console.log("Reverb initialized successfully")
    } catch (error) {
      console.error("Failed to initialize reverb:", error)
      this.reverbInitialized = false
    }
  }

  async loadImpulseResponse(impulseResponseUrl: string): Promise<void> {
    try {
      // Disconnect existing reverb if present
      if (this.reverbNode) {
        this.wetGainNode.disconnect(this.reverbNode)
        this.reverbNode.disconnect(this.audioContext.destination)
      }

      // Load new impulse response
      this.reverbNode = await createReverb(
        this.audioContext,
        impulseResponseUrl,
      )

      // Reconnect with new reverb
      this.wetGainNode.connect(this.reverbNode)
      this.reverbNode.connect(this.audioContext.destination)

      this.reverbInitialized = true
      console.log(`Successfully loaded impulse response: ${impulseResponseUrl}`)
    } catch (error) {
      console.error(
        `Failed to load impulse response: ${impulseResponseUrl}`,
        error,
      )
      // Fall back to synthetic reverb
      await this.initializeReverb()
    }
  }

  private async loadAudioFile(url: string): Promise<AudioBuffer> {
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    return await this.audioContext.decodeAudioData(arrayBuffer)
  }

  private createSourceNode(
    buffer: AudioBuffer,
    playbackRate: number = 1,
  ): AudioBufferSourceNode {
    const source = this.audioContext.createBufferSource()
    source.buffer = buffer
    source.playbackRate.value = playbackRate

    // Connect to both dry and wet paths
    source.connect(this.dryGainNode)
    source.connect(this.wetGainNode)

    // Clean up when done
    source.addEventListener("ended", () => {
      this.activeSounds.delete(source)
    })

    this.activeSounds.add(source)
    return source
  }

  async loadPlayLoop(params: FanSoundParams): Promise<void> {
    const {
      url,
      accelTime,
      fullSpeedTime,
      decelTime,
      maxSpeed,
      adjustedPitch = 0,
      reverbAmount = 0.5,
    } = params

    // Calculate total time from the three phases
    const totalTime = accelTime + fullSpeedTime + decelTime

    // Resume audio context if suspended (required by browsers)
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume()
    }

    // Load audio file
    const audioBuffer = await this.loadAudioFile(url)
    const { sampleRate, numberOfChannels, length } = audioBuffer

    console.log(
      `Audio file: ${audioBuffer.duration}s, total time: ${totalTime}s`,
    )

    // Extract just the middle loop section (like your example)
    const loopLength = Math.floor(length / 3) // 1/3 of the file
    const loopStart = loopLength // Start at 1/3 (middle section)

    // Create loop buffer
    const loopBuffer = this.audioContext.createBuffer(
      numberOfChannels,
      loopLength,
      sampleRate,
    )

    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel)
      const loopData = loopBuffer.getChannelData(channel)
      for (let i = 0; i < loopLength; i++) {
        loopData[i] = channelData[loopStart + i]
      }
    }

    // Create source with loop
    const source = this.createSourceNode(loopBuffer, 1 + adjustedPitch)
    source.loop = true

    // Adjust reverb mix based on reverbAmount (0 = all dry, 1 = all wet)
    const wetLevel = reverbAmount
    const dryLevel = 1 - reverbAmount
    this.setReverbMix(wetLevel, dryLevel)

    // Set up speed ramping
    const startTime = this.audioContext.currentTime
    const rampUpStartTime = startTime
    const rampDownStartTime = startTime + accelTime + fullSpeedTime

    console.log(`Ramp up: ${rampUpStartTime} for ${accelTime}s`)
    console.log(`Ramp down: ${rampDownStartTime} for ${decelTime}s`)

    // Apply speed ramping (like your commented example)
    source.playbackRate.setValueAtTime(1 + adjustedPitch, rampUpStartTime)
    source.playbackRate.linearRampToValueAtTime(
      maxSpeed + adjustedPitch,
      rampUpStartTime + accelTime,
    )
    source.playbackRate.linearRampToValueAtTime(
      maxSpeed + adjustedPitch,
      rampDownStartTime,
    )
    source.playbackRate.linearRampToValueAtTime(
      1 + adjustedPitch,
      rampDownStartTime + decelTime,
    )

    // Start playing and stop after totalTime
    source.start(startTime)
    source.stop(startTime + totalTime)

    console.log(
      `Playing looped middle section for ${totalTime}s with speed ramping`,
    )
  }

  stopAll(): void {
    this.activeSounds.forEach((source) => {
      try {
        source.stop()
      } catch (e) {
        // Source may already be stopped
      }
    })
    this.activeSounds.clear()
  }

  setMasterVolume(volume: number): void {
    this.masterGainNode.gain.value = Math.max(0, Math.min(1, volume))
  }

  setReverbMix(wetLevel: number, dryLevel: number): void {
    this.wetGainNode.gain.value = Math.max(0, Math.min(1, wetLevel))
    this.dryGainNode.gain.value = Math.max(0, Math.min(1, dryLevel))
  }
}

// Global instance for easy use
let globalFanSoundManager: FanSoundManager | null = null

export function getFanSoundManager(): FanSoundManager {
  if (!globalFanSoundManager) {
    globalFanSoundManager = new FanSoundManager()
  }
  return globalFanSoundManager
}

export async function loadPlayLoop(params: FanSoundParams): Promise<void> {
  const manager = getFanSoundManager()
  return await manager.loadPlayLoop(params)
}

export async function loadImpulseResponse(
  impulseResponseUrl: string,
): Promise<void> {
  const manager = getFanSoundManager()
  return await manager.loadImpulseResponse(impulseResponseUrl)
}

export { FanSoundManager }
export type { FanSoundParams }
