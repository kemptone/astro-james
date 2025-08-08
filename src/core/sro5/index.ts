class Sro5 extends HTMLElement {
  private shadow: ShadowRoot
  private mediaRecorder: MediaRecorder | null = null
  private recordedChunks: Blob[] = []
  private stream: MediaStream | null = null
  private isRecording: boolean = false
  private recordedVideos: Array<{id: string, originalBlob: Blob, reversedBlob: Blob | null, name: string}> = []

  private reverseWorker: Worker | null = null
private supportsWebCodecs: boolean = 'VideoDecoder' in window && 'OffscreenCanvas' in window


  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  connectedCallback() {
    this.render()
    this.attachEventListeners()
    this.loadStoredVideos()

    if (this.supportsWebCodecs) {
  // Build worker from a URL; adjust path as needed
  this.reverseWorker = new Worker(new URL('./reverse-worker.js', import.meta.url), { type: 'module' })
}

  }

  disconnectedCallback() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
    }
  }

  private render() {
    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 2rem;
          font-family: system-ui, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .container {
          background: #f8f9fa;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        h1 {
          color: #2c3e50;
          text-align: center;
          margin-bottom: 1rem;
          font-size: 2.5rem;
        }
        
        .subtitle {
          text-align: center;
          color: #7f8c8d;
          margin-bottom: 2rem;
          font-size: 1.2rem;
        }
        
        .video-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }
        
        .video-container {
          position: relative;
          background: #000;
          border-radius: 12px;
          overflow: hidden;
        }
        
        video {
          width: 100%;
          height: 300px;
          object-fit: cover;
          border-radius: 12px;
        }
        
        .video-placeholder {
          width: 100%;
          height: 300px;
          background: linear-gradient(45deg, #3498db, #9b59b6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.2rem;
          border-radius: 12px;
        }
        
        .controls {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        
        button {
          background: #3498db;
          color: white;
          padding: 1rem 2rem;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 140px;
        }
        
        button:hover {
          background: #2980b9;
          transform: translateY(-2px);
        }
        
        button:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
          transform: none;
        }
        
        .record-btn {
          background: #e74c3c;
        }
        
        .record-btn:hover {
          background: #c0392b;
        }
        
        .record-btn.recording {
          background: #27ae60;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        
        .reverse-btn {
          background: #9b59b6;
        }
        
        .reverse-btn:hover {
          background: #8e44ad;
        }
        
        .save-btn {
          background: #27ae60;
        }
        
        .save-btn:hover {
          background: #229954;
        }
        
        .menu-section {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 2px solid #ecf0f1;
        }
        
        .menu-title {
          text-align: center;
          color: #34495e;
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
        }
        
        .video-library {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        
        .video-item {
          background: white;
          border-radius: 12px;
          padding: 1rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.3s ease;
        }
        
        .video-item:hover {
          transform: translateY(-4px);
        }
        
        .video-item video {
          height: 150px;
          margin-bottom: 1rem;
        }
        
        .video-item-controls {
          display: flex;
          gap: 0.5rem;
          justify-content: space-between;
          align-items: center;
        }
        
        .video-item button {
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
          min-width: auto;
        }
        
        .video-name {
          font-weight: bold;
          margin-bottom: 0.5rem;
          color: #2c3e50;
        }
        
        .status-message {
          text-align: center;
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
          font-weight: bold;
        }
        
        .status-success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .status-error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        .status-info {
          background: #cce7ff;
          color: #004085;
          border: 1px solid #b8daff;
        }
        
        @media (max-width: 768px) {
          .video-section {
            grid-template-columns: 1fr;
          }
          
          .controls {
            flex-direction: column;
            align-items: center;
          }
          
          .video-library {
            grid-template-columns: 1fr;
          }
        }
      </style>
      
      <div class="container">
        <h1>SRO5 🎬</h1>
        <p class="subtitle">The funnest video reverser game on Astro!</p>
        
        <div class="video-section">
          <div class="video-container">
            <video id="liveVideo" autoplay muted playsinline style="display: none;"></video>
            <div id="videoPlaceholder" class="video-placeholder">
              📹 Click "Start Camera" to begin
            </div>
          </div>
          
          <div class="video-container">
            <video id="reversedVideo" controls style="display: none;"></video>
            <div id="reversedPlaceholder" class="video-placeholder">
              ↩️ Reversed video will appear here
            </div>
          </div>
        </div>
        
        <div class="controls">
          <button id="startCamera">Start Camera</button>
          <button id="recordBtn" class="record-btn" disabled>Start Recording</button>
          <button id="reverseBtn" class="reverse-btn" disabled>Reverse Video</button>
          <button id="saveBtn" class="save-btn" disabled>Save to Photos</button>
        </div>
        
        <div id="statusMessage"></div>
        
        <div class="menu-section">
          <h2 class="menu-title">Video Library 📚</h2>
          <div id="videoLibrary" class="video-library">
            <div class="video-placeholder">No videos yet. Record your first video above!</div>
          </div>
        </div>
      </div>
    `
  }

  private attachEventListeners() {
    const startCameraBtn = this.shadow.querySelector('#startCamera') as HTMLButtonElement
    const recordBtn = this.shadow.querySelector('#recordBtn') as HTMLButtonElement
    const reverseBtn = this.shadow.querySelector('#reverseBtn') as HTMLButtonElement
    const saveBtn = this.shadow.querySelector('#saveBtn') as HTMLButtonElement

    startCameraBtn?.addEventListener('click', () => this.startCamera())
    recordBtn?.addEventListener('click', () => this.toggleRecording())
    reverseBtn?.addEventListener('click', () => this.reverseVideo())
    saveBtn?.addEventListener('click', () => this.saveToPhotos())
  }

  private async startCamera() {
    try {
      this.showStatus('Starting camera...', 'info')
      
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: true 
      })
      
      const liveVideo = this.shadow.querySelector('#liveVideo') as HTMLVideoElement
      const placeholder = this.shadow.querySelector('#videoPlaceholder')
      const recordBtn = this.shadow.querySelector('#recordBtn') as HTMLButtonElement
      
      if (liveVideo && placeholder) {
        liveVideo.srcObject = this.stream
        liveVideo.style.display = 'block'
        placeholder.style.display = 'none'
        recordBtn.disabled = false
        
        this.showStatus('Camera ready! You can start recording now.', 'success')
      }
    } catch (error) {
      this.showStatus('Failed to access camera. Please check permissions.', 'error')
      console.error('Camera access error:', error)
    }
  }

  private toggleRecording() {
    if (this.isRecording) {
      this.stopRecording()
    } else {
      this.startRecording()
    }
  }

  private startRecording() {
    if (!this.stream) return

    this.recordedChunks = []

    const mimeCandidates = [
    'video/mp4', // Safari/iOS
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm'
  ]
  const mimeType = mimeCandidates.find(t => MediaRecorder.isTypeSupported(t)) || ''


    // this.mediaRecorder = new MediaRecorder(this.stream)
    this.mediaRecorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined)
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data)
      }
    }
    
    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' })
      this.handleRecordedVideo(blob)
    }
    
    this.mediaRecorder.start()
    this.isRecording = true
    
    const recordBtn = this.shadow.querySelector('#recordBtn') as HTMLButtonElement
    recordBtn.textContent = 'Stop Recording'
    recordBtn.classList.add('recording')
    
    this.showStatus('Recording... Click "Stop Recording" when done!', 'info')
  }

  private stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop()
      this.isRecording = false
      
      const recordBtn = this.shadow.querySelector('#recordBtn') as HTMLButtonElement
      recordBtn.textContent = 'Start Recording'
      recordBtn.classList.remove('recording')
      
      this.showStatus('Recording stopped! Now you can reverse it.', 'success')
    }
  }

  private handleRecordedVideo(blob: Blob) {
    const videoId = Date.now().toString()
    const videoName = `Video ${new Date().toLocaleTimeString()}`
    
    this.recordedVideos.push({
      id: videoId,
      originalBlob: blob,
      reversedBlob: null,
      name: videoName
    })
    
    this.saveToLocalStorage()
    
    const reverseBtn = this.shadow.querySelector('#reverseBtn') as HTMLButtonElement
    reverseBtn.disabled = false
    reverseBtn.dataset.videoId = videoId
  }

private async reverseVideo() {
  const reverseBtn = this.shadow.querySelector('#reverseBtn') as HTMLButtonElement
  const videoId = reverseBtn.dataset.videoId
  if (!videoId) return
  const video = this.recordedVideos.find(v => v.id === videoId)
  if (!video) return

  this.showStatus('Reversing video...', 'info')
  reverseBtn.disabled = true

  try {
    let reversedBlob: Blob
    try {
      reversedBlob = await this.processVideoReversalFast(video.originalBlob)
    } catch {
      // fallback to your existing canvas/seek method
      reversedBlob = await this.processVideoReversal(video.originalBlob)
    }

    video.reversedBlob = reversedBlob

    const reversedVideo = this.shadow.querySelector('#reversedVideo') as HTMLVideoElement
    const placeholder = this.shadow.querySelector('#reversedPlaceholder')
    const saveBtn = this.shadow.querySelector('#saveBtn') as HTMLButtonElement

    if (reversedVideo && placeholder) {
      reversedVideo.src = URL.createObjectURL(reversedBlob)
      reversedVideo.style.display = 'block'
      placeholder.style.display = 'none'
      saveBtn.disabled = false
      saveBtn.dataset.videoId = videoId
    }

    this.saveToLocalStorage()
    this.updateVideoLibrary()
    this.showStatus('Video reversed successfully! 🎉', 'success')
  } catch (err) {
    console.error(err)
    this.showStatus('Failed to reverse video. Try recording a new one!', 'error')
  } finally {
    reverseBtn.disabled = false
  }
}


  private async processVideoReversalFast(blob: Blob): Promise<Blob> {
  if (!this.supportsWebCodecs || !this.reverseWorker) {
    throw new Error('No WebCodecs path')
  }

  // Hidden canvas that we’ll record from
  const canvas = document.createElement('canvas')
  // Decide target dims (same logic you had, but we’ll compute once)
  const dims = await this.getVideoDims(blob, 640, 480)
  canvas.width = dims.width
  canvas.height = dims.height

  // Detect source frame rate and use it for output
  const tempVideo = document.createElement('video')
  tempVideo.src = URL.createObjectURL(blob)
  tempVideo.muted = true
  await tempVideo.play().catch(() => {})
  await new Promise<void>(r => {
    if (tempVideo.readyState >= 1) r()
    else tempVideo.onloadedmetadata = () => r()
  })
  
  const fps = await this.detectVideoFrameRate(tempVideo) || 30
  URL.revokeObjectURL(tempVideo.src)
  
  const stream = canvas.captureStream(fps)
  const mimeCandidates = [
    'video/mp4', // Safari/iOS
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm'
  ]
  const mimeType = mimeCandidates.find(t => MediaRecorder.isTypeSupported(t)) || ''
  const mr = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2_000_000 })
  const chunks: Blob[] = []
  mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }

  const offscreen = canvas.transferControlToOffscreen()
  const done = new Promise<void>((resolve, reject) => {
    const onMsg = (ev: MessageEvent) => {
      const { type, message } = ev.data || {}
      if (type === 'done') {
        this.reverseWorker?.removeEventListener('message', onMsg)
        setTimeout(() => mr.stop(), 100) // small tail to flush
        resolve()
      } else if (type === 'fallback') {
        this.reverseWorker?.removeEventListener('message', onMsg)
        mr.stop()
        reject(new Error('fallback'))
      } else if (type === 'error') {
        this.reverseWorker?.removeEventListener('message', onMsg)
        mr.stop()
        reject(new Error(message || 'worker error'))
      }
    }
    this.reverseWorker?.addEventListener('message', onMsg)
  })

  mr.start()

  // init worker with canvas
  this.reverseWorker.postMessage({ type: 'init', canvas: offscreen }, [offscreen])

  // send reversal job - no length limit
  const bytes = new Uint8Array(await blob.arrayBuffer())
  this.reverseWorker.postMessage({
    type: 'reverse',
    blob: bytes.buffer,
    fps,
    width: dims.width,
    height: dims.height,
  }, [bytes.buffer])

  await done

  await new Promise(r => { mr.onstop = () => r(null) })
  const out = new Blob(chunks, { type: mimeType || 'video/webm' })
  return out
}

private async getVideoDims(blob: Blob, maxWidth: number, maxHeight: number) {
  const video = document.createElement('video')
  video.src = URL.createObjectURL(blob)
  await video.play().catch(() => {}) // kick metadata on some UAs
  await new Promise<void>(r => {
    if (video.readyState >= 1) r()
    else video.onloadedmetadata = () => r()
  })
  const ar = video.videoWidth / video.videoHeight
  let w = video.videoWidth, h = video.videoHeight
  if (w > maxWidth) { w = maxWidth; h = Math.round(maxWidth / ar) }
  if (h > maxHeight) { h = maxHeight; w = Math.round(maxHeight * ar) }
  URL.revokeObjectURL(video.src)
  return { width: w, height: h }
}


  private async processVideoReversal(blob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }
      
      video.src = URL.createObjectURL(blob)
      video.muted = true
      
      video.onloadedmetadata = async () => {
        // Limit canvas size to prevent memory issues
        const maxWidth = 640
        const maxHeight = 480
        const aspectRatio = video.videoWidth / video.videoHeight
        
        if (video.videoWidth > maxWidth) {
          canvas.width = maxWidth
          canvas.height = maxWidth / aspectRatio
        } else if (video.videoHeight > maxHeight) {
          canvas.height = maxHeight
          canvas.width = maxHeight * aspectRatio
        } else {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
        }
        
        // Detect source video frame rate
        const frameRate = await this.detectVideoFrameRate(video) || 30 // Fallback to 30fps
        const duration = video.duration
        const totalFrames = Math.floor(duration * frameRate)
        
        this.processVideoInChunks(video, canvas, ctx, totalFrames, frameRate, duration)
          .then(resolve)
          .catch(reject)
      }
      
      video.onerror = () => reject(new Error('Video processing failed'))
    })
  }

  private async processVideoInChunks(
    video: HTMLVideoElement, 
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D, 
    totalFrames: number, 
    frameRate: number, 
    duration: number
  ): Promise<Blob> {
    const stream = canvas.captureStream(frameRate)
    const mediaRecorder = new MediaRecorder(stream, { 
      mimeType: 'video/webm',
      videoBitsPerSecond: 2000000 // 2 Mbps for better quality
    })
    const chunks: Blob[] = []
    
    mediaRecorder.ondataavailable = (event) => chunks.push(event.data)
    
    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        URL.revokeObjectURL(video.src)
        resolve(new Blob(chunks, { type: 'video/webm' }))
      }
      
      mediaRecorder.onerror = () => reject(new Error('Recording failed'))
      
      mediaRecorder.start()
      
      // Process frames in reverse order at correct speed
      let currentFrame = totalFrames - 1
      const frameInterval = 1000 / frameRate // Target output timing
      
      const renderNextFrame = () => {
        if (currentFrame < 0) {
          setTimeout(() => mediaRecorder.stop(), 100)
          return
        }
        
        // Calculate exact timestamp for this frame
        const timeStamp = Math.max(0, Math.min((currentFrame / totalFrames) * duration, duration - 0.01))
        video.currentTime = timeStamp
        
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked)
          
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            currentFrame--
            
            // Immediate processing for correct timing - let MediaRecorder handle the frame rate
            requestAnimationFrame(renderNextFrame)
          } catch (error) {
            reject(new Error('Frame processing failed: ' + error))
          }
        }
        
        video.addEventListener('seeked', onSeeked)
      }
      
      renderNextFrame()
    })
  }

  private async detectVideoFrameRate(video: HTMLVideoElement): Promise<number | null> {
    return new Promise((resolve) => {
      try {
        // Try to detect frame rate by measuring frame times
        const startTime = performance.now()
        let frameCount = 0
        const maxSamples = 10
        const sampleDuration = 0.5 // Sample for 0.5 seconds
        
        const checkFrame = () => {
          frameCount++
          
          if (frameCount >= maxSamples || (performance.now() - startTime) > sampleDuration * 1000) {
            const elapsed = (performance.now() - startTime) / 1000
            const estimatedFps = frameCount / elapsed
            
            // Round to common frame rates
            const commonRates = [24, 25, 30, 50, 60]
            const closest = commonRates.reduce((prev, curr) => 
              Math.abs(curr - estimatedFps) < Math.abs(prev - estimatedFps) ? curr : prev
            )
            
            resolve(closest)
          } else {
            requestAnimationFrame(checkFrame)
          }
        }
        
        // Start sampling when video plays
        video.currentTime = 1 // Start from 1 second to avoid initial loading
        video.play().then(() => {
          requestAnimationFrame(checkFrame)
        }).catch(() => {
          // If play fails, fallback to common frame rates based on duration heuristics
          if (video.duration) {
            // Most mobile recordings are 30fps, most cinema is 24fps
            resolve(30)
          } else {
            resolve(null)
          }
        })
        
        // Timeout after 2 seconds
        setTimeout(() => {
          video.pause()
          resolve(30) // Default fallback
        }, 2000)
        
      } catch (error) {
        resolve(null)
      }
    })
  }

private async saveToPhotos() {
  const saveBtn = this.shadow.querySelector('#saveBtn') as HTMLButtonElement
  const videoId = saveBtn?.dataset.videoId
  if (!videoId) return
  const video = this.recordedVideos.find(v => v.id === videoId)
  if (!video?.reversedBlob) return

  // Prefer a Photos-friendly extension (mp4 on iOS if we got it)
  const ext = video.reversedBlob.type.includes('mp4') ? 'mp4' : 'webm'
  const file = new File([video.reversedBlob], `${video.name}_reversed.${ext}`, { type: video.reversedBlob.type })

  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Reversed Video' })
      this.showStatus('Shared — use “Save Video” to put it in Photos 📱', 'success')
      return
    }
  } catch (err) {
    // fall through to download
  }

  // Fallback: download
  const link = document.createElement('a')
  link.href = URL.createObjectURL(file)
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  this.showStatus('Video saved to downloads! 💾', 'success')
}


  private updateVideoLibrary() {
    const library = this.shadow.querySelector('#videoLibrary')
    if (!library) return
    
    if (this.recordedVideos.length === 0) {
      library.innerHTML = '<div class="video-placeholder">No videos yet. Record your first video above!</div>'
      return
    }
    
    library.innerHTML = this.recordedVideos.map(video => `
      <div class="video-item">
        <div class="video-name">${video.name}</div>
        <video src="${URL.createObjectURL(video.originalBlob)}" controls></video>
        <div class="video-item-controls">
          <button onclick="this.getRootNode().host.reverseStoredVideo('${video.id}')">
            ${video.reversedBlob ? 'Re-reverse' : 'Reverse'}
          </button>
          ${video.reversedBlob ? `<button onclick="this.getRootNode().host.downloadVideo('${video.id}')">Download</button>` : ''}
          <button onclick="this.getRootNode().host.deleteVideo('${video.id}')" style="background: #e74c3c;">Delete</button>
        </div>
      </div>
    `).join('')
  }

  reverseStoredVideo(videoId: string) {
    const reverseBtn = this.shadow.querySelector('#reverseBtn') as HTMLButtonElement
    reverseBtn.dataset.videoId = videoId
    this.reverseVideo()
  }

  downloadVideo(videoId: string) {
    const video = this.recordedVideos.find(v => v.id === videoId)
    if (!video || !video.reversedBlob) return
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(video.reversedBlob)
    link.download = `${video.name}_reversed.webm`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  deleteVideo(videoId: string) {
    this.recordedVideos = this.recordedVideos.filter(v => v.id !== videoId)
    this.saveToLocalStorage()
    this.updateVideoLibrary()
    this.showStatus('Video deleted!', 'info')
  }

  private showStatus(message: string, type: 'success' | 'error' | 'info') {
    const statusDiv = this.shadow.querySelector('#statusMessage')
    if (!statusDiv) return
    
    statusDiv.className = `status-message status-${type}`
    statusDiv.textContent = message
    
    setTimeout(() => {
      statusDiv.textContent = ''
      statusDiv.className = ''
    }, 5000)
  }

  private saveToLocalStorage() {
    // Convert blobs to base64 for storage (simplified approach)
    const videosForStorage = this.recordedVideos.map(video => ({
      id: video.id,
      name: video.name,
      hasReversed: !!video.reversedBlob
    }))
    localStorage.setItem('sro5-videos', JSON.stringify(videosForStorage))
  }

  private loadStoredVideos() {
    try {
      const stored = localStorage.getItem('sro5-videos')
      if (stored) {
        // For simplicity, we'll start fresh each session
        // In a real app, you'd want to persist the actual video data
        this.updateVideoLibrary()
      }
    } catch (error) {
      console.error('Failed to load stored videos:', error)
    }
  }
}

if (typeof window !== 'undefined') {
  customElements.define('sro5-app', Sro5)
}