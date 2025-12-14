interface SoundLayer {
  url: string
  initialPlaybackRate: number
}

interface FanSoundParams {
  url?: string // For backward compatibility
  soundLayers?: SoundLayer[] // For layered approach
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
  private activeSounds: Set<AudioBufferSourceNode> = new Set()
  private reverbInitialized: boolean = false

  constructor() {
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)()

    // Create audio nodes - 100% wet signal like timer4
    this.masterGainNode = this.audioContext.createGain()
    this.masterGainNode.gain.value = 0.125 // Match timer4's low gain

    // Initialize reverb asynchronously
    this.initializeReverb()
  }

  private async initializeReverb(impulseResponseUrl?: string) {
    try {
      this.reverbNode = await createReverb(
        this.audioContext,
        impulseResponseUrl,
      )

      // Set up signal path: masterGain → reverb → destination (100% wet)
      this.masterGainNode.connect(this.reverbNode)
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
        this.masterGainNode.disconnect(this.reverbNode)
        this.reverbNode.disconnect(this.audioContext.destination)
      }

      // Load new impulse response
      this.reverbNode = await createReverb(
        this.audioContext,
        impulseResponseUrl,
      )

      // Reconnect with new reverb: masterGain → reverb → destination
      this.masterGainNode.connect(this.reverbNode)
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

    // Connect to master gain (100% wet, all through reverb like timer4)
    source.connect(this.masterGainNode)

    // Clean up when done
    source.addEventListener("ended", () => {
      this.activeSounds.delete(source)
    })

    this.activeSounds.add(source)
    return source
  }

  private async loadAndPlaySingleLayer(
    url: string,
    initialPlaybackRate: number,
    params: {
      accelTime: number
      fullSpeedTime: number
      decelTime: number
      maxSpeed: number
      adjustedPitch: number
      startTime: number
      totalTime: number
    }
  ): Promise<void> {
    const {
      accelTime,
      fullSpeedTime,
      decelTime,
      maxSpeed,
      adjustedPitch,
      startTime,
      totalTime,
    } = params

    // Load audio file
    const audioBuffer = await this.loadAudioFile(url)
    const { sampleRate, numberOfChannels, length } = audioBuffer

    console.log(
      `Layer [${url}] ${initialPlaybackRate}x: ${audioBuffer.duration}s`,
    )

    // Extract just the middle loop section
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
    const source = this.createSourceNode(loopBuffer, initialPlaybackRate)
    source.loop = true

    // Set up speed ramping
    const rampUpStartTime = startTime
    const rampDownStartTime = startTime + accelTime + fullSpeedTime

    // Apply speed ramping with the initial playback rate as the base
    const baseRate = initialPlaybackRate + adjustedPitch
    source.playbackRate.setValueAtTime(baseRate, rampUpStartTime)
    source.playbackRate.linearRampToValueAtTime(
      maxSpeed * initialPlaybackRate + adjustedPitch,
      rampUpStartTime + accelTime,
    )
    source.playbackRate.linearRampToValueAtTime(
      maxSpeed * initialPlaybackRate + adjustedPitch,
      rampDownStartTime,
    )
    source.playbackRate.linearRampToValueAtTime(
      baseRate,
      rampDownStartTime + decelTime,
    )

    // Start playing and stop after totalTime
    source.start(startTime)
    source.stop(startTime + totalTime)
  }

  async loadPlayLoop(params: FanSoundParams): Promise<void> {
    const {
      url,
      soundLayers,
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

    // Note: reverbAmount parameter is kept for backward compatibility but not used
    // Signal is now 100% wet (all through reverb) like timer4

    const startTime = this.audioContext.currentTime

    console.log(`Ramp up: ${startTime} for ${accelTime}s`)
    console.log(`Ramp down: ${startTime + accelTime + fullSpeedTime} for ${decelTime}s`)

    // If soundLayers is provided, use layered approach
    if (soundLayers && soundLayers.length > 0) {
      console.log(`Playing ${soundLayers.length} layered sounds`)

      // Load and play all layers in parallel
      await Promise.all(
        soundLayers.map((layer) =>
          this.loadAndPlaySingleLayer(layer.url, layer.initialPlaybackRate, {
            accelTime,
            fullSpeedTime,
            decelTime,
            maxSpeed,
            adjustedPitch,
            startTime,
            totalTime,
          })
        )
      )

      console.log(
        `Playing ${soundLayers.length} layered sounds for ${totalTime}s with speed ramping`,
      )
    } else if (url) {
      // Backward compatibility: single sound approach
      await this.loadAndPlaySingleLayer(url, 1.0, {
        accelTime,
        fullSpeedTime,
        decelTime,
        maxSpeed,
        adjustedPitch,
        startTime,
        totalTime,
      })

      console.log(
        `Playing single sound for ${totalTime}s with speed ramping`,
      )
    } else {
      throw new Error('Either url or soundLayers must be provided')
    }
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
export type { FanSoundParams, SoundLayer }
