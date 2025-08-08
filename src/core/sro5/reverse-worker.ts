// reverse-worker.js
// Receives: { blob:ArrayBuffer, fps:number, maxSeconds:number, width:number, height:number }
// Also receives: an OffscreenCanvas via transfer list
// Draws reversed frames onto the OffscreenCanvas (owned by main thread canvas)
// Main thread captures the canvas stream to MediaRecorder and stops when worker posts "done"

let canvas, ctx;

self.onmessage = async (e) => {
  const { type } = e.data || {};
  try {
    if (type === 'init') {
      canvas = e.data.canvas; // OffscreenCanvas
      ctx = canvas.getContext('2d', { desynchronized: true, alpha: false });
      return;
    }

    if (type === 'reverse') {
      const { blob, fps, maxSeconds, width, height } = e.data;
      if (!canvas || !ctx) throw new Error('Worker canvas not initialized');

      // Resize the OffscreenCanvas to target dims
      canvas.width = width;
      canvas.height = height;

      const bytes = new Uint8Array(blob);
      const src = new Blob([bytes], { type: 'video/*' }); // container type doesn't matter, decoder sniffs by content
      const arrayBuffer = await src.arrayBuffer();

      // -- Decode to frames with WebCodecs --
      const chunks = [];
      // Use a simple demux via a MediaSource + HTMLVideoElement? Nope (not available).
      // Let WebCodecs sniff by using a built-in demuxer through createImageBitmap? Not valid for video.
      // We rely on VideoDecoder handling common containers it supports on the platform.

      // Helper to enqueue and await decoded frames
      const decodedFrames = [];

      const decoder = new VideoDecoder({
        output: (frame) => decodedFrames.push(frame),
        error: (err) => postMessage({ type: 'error', message: String(err) }),
      });

      // Configure decoder; we can omit codec to let UA choose, but some require it.
      // Most camera/MediaRecorder outputs will be h264 or vp8. Try h264 first; fall back if needed.
      const tryConfigs = [
        { codec: 'avc1.42E01E' }, // h264 baseline-ish
        { codec: 'vp8' },
        { codec: 'vp09.00.10.08' }, // vp9
      ];

      let configured = false;
      for (const cfg of tryConfigs) {
        try {
          decoder.configure(cfg);
          configured = true;
          break;
        } catch (_) { /* try next */ }
      }
      if (!configured) {
        postMessage({ type: 'fallback' });
        return;
      }

      // Feed the decoder with a single EncodedVideoChunk container.
      // In practice you’d parse container → samples. For simplicity, many UAs accept whole file chunks.
      // If the platform doesn't accept, we’ll signal fallback.
      try {
        const chunk = new EncodedVideoChunk({
          type: 'key', // best effort
          timestamp: 0,
          data: new Uint8Array(arrayBuffer),
        });
        decoder.decode(chunk);
        await decoder.flush();
      } catch {
        // If demuxing is required on this UA, punt to fallback
        postMessage({ type: 'fallback' });
        return;
      }

      // Limit frames for memory, keep highest perf
      const targetFps = fps || 24;
      const maxFrames = Math.max(1, Math.floor((maxSeconds || 8) * targetFps));
      const frames = decodedFrames.slice(0, maxFrames);

      // Draw frames in reverse at ~targetFps
      const frameIntervalMs = 1000 / targetFps;

      // Scale draw to fit canvas while preserving aspect
      const draw = (vf) => {
        // fast path to bitmap; many UAs can draw VideoFrame directly
        // Center-fit
        const scale = Math.min(canvas.width / vf.displayWidth, canvas.height / vf.displayHeight);
        const dw = Math.round(vf.displayWidth * scale);
        const dh = Math.round(vf.displayHeight * scale);
        const dx = Math.floor((canvas.width - dw) / 2);
        const dy = Math.floor((canvas.height - dh) / 2);
        // Clear frame
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw
        // @ts-ignore drawImage supports VideoFrame in modern browsers
        ctx.drawImage(vf, dx, dy, dw, dh);
      };

      const sleep = (ms) => new Promise(r => setTimeout(r, ms));

      for (let i = frames.length - 1; i >= 0; i--) {
        draw(frames[i]);
        await sleep(frameIntervalMs);
        frames[i].close();
      }

      postMessage({ type: 'done' });
    }
  } catch (err) {
    postMessage({ type: 'error', message: String(err) });
  }
};
