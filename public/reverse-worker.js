// reverse-worker.js
// Contract (from main thread):
//  1) postMessage({ type: 'init', canvas: OffscreenCanvas }, [offscreen])
//  2) postMessage({ type: 'reverse', blob: ArrayBuffer, fps, maxSeconds, width, height }, [blob])
//
// Behavior:
//  - If input looks like MP4/WebM (i.e., in a container), we post {type:'fallback'} immediately.
//  - If (rare) raw elementary H.264/VP8/VP9 is detected, we try WebCodecs decode → draw reversed.
//  - Draw is paced to ~fps; memory is cleaned aggressively.
//  - On success: {type:'done'}; on error: {type:'error', message}.

let canvas = null;
let ctx = null;

self.onmessage = async (e) => {
  const msg = e.data || {};
  const { type } = msg;

  try {
    if (type === 'init') {
      canvas = msg.canvas;
      ctx = canvas.getContext('2d', { desynchronized: true, alpha: false });
      return;
    }

    if (type === 'reverse') {
      if (!canvas || !ctx) throw new Error('Worker canvas not initialized');

      const { blob, fps = 24, maxSeconds = 12, width, height } = msg;
      canvas.width = width;
      canvas.height = height;

      // Quick format sniff
      const u8 = new Uint8Array(blob);
      if (looksLikeMP4(u8) || looksLikeWebM(u8)) {
        // No demuxer here; tell main thread to run fallback path
        postMessage({ type: 'fallback' });
        return;
      }

      // Attempt raw elementary stream decode (Annex B H.264 or raw VP8/9).
      // This path is niche but fast when available.
      await decodeElementaryAndDrawReversed(u8, { fps, maxSeconds, width, height });

      postMessage({ type: 'done' });
    }
  } catch (err) {
    postMessage({ type: 'error', message: String(err && err.message || err) });
  }
};

// ---------- format sniffers ----------
function looksLikeMP4(u8) {
  // ISO BMFF: bytes 4-7 'ftyp' in the first box
  // e.g., 00000018 66747970 69736F6D ...
  if (u8.length < 12) return false;
  return u8[4] === 0x66 && u8[5] === 0x74 && u8[6] === 0x79 && u8[7] === 0x70;
}

function looksLikeWebM(u8) {
  // EBML header: 0x1A 0x45 0xDF 0xA3
  if (u8.length < 4) return false;
  return u8[0] === 0x1A && u8[1] === 0x45 && u8[2] === 0xDF && u8[3] === 0xA3;
}

function isAnnexB(u8) {
  // Very light check: look for repeating 00 00 00 01 start codes
  // Not bulletproof, but good enough to decide if we’ll even *try*.
  let hits = 0;
  for (let i = 0; i < u8.length - 4 && hits < 3; i++) {
    if (u8[i] === 0x00 && u8[i+1] === 0x00 && u8[i+2] === 0x00 && u8[i+3] === 0x01) hits++;
  }
  return hits >= 2;
}

// ---------- decode + draw (elementary streams only) ----------
async function decodeElementaryAndDrawReversed(u8, { fps, maxSeconds, width, height }) {
  // Try H.264 Annex B first
  const canH264 = isAnnexB(u8) && typeof VideoDecoder !== 'undefined';
  if (!canH264) throw new Error('Not a raw elementary stream (need demux).');

  const frames = [];
  const decoder = new VideoDecoder({
    output: (vf) => frames.push(vf),
    error: (e) => { throw e; }
  });

  // Prefer baseline profile to maximize support
  const h264Cfg = { codec: 'avc1.42E01E' };
  try {
    const { supported } = await VideoDecoder.isConfigSupported(h264Cfg);
    if (!supported) throw new Error('H.264 not supported in this context');
    decoder.configure(h264Cfg);
  } catch (e) {
    // Try a couple more common IDs
    const fallbacks = [{ codec: 'avc1.4D401E' }, { codec: 'avc1.64001E' }];
    let ok = false;
    for (const cfg of fallbacks) {
      try {
        const { supported } = await VideoDecoder.isConfigSupported(cfg);
        if (supported) { decoder.configure(cfg); ok = true; break; }
      } catch {}
    }
    if (!ok) throw e;
  }

  // Extremely naive chunker: feed the whole buffer as one key chunk and hope
  // NOTE: Realistically, you need a demuxer to extract encoded samples.
  // This will work only for very specific raw streams.
  const chunk = new EncodedVideoChunk({
    type: 'key',
    timestamp: 0,
    data: u8
  });

  decoder.decode(chunk);
  await decoder.flush();

  // Trim frame count to memory-friendly bounds
  const maxFrames = Math.max(1, Math.floor(maxSeconds * fps));
  const useFrames = frames.slice(0, maxFrames);

  // Draw reversed with pacing
  const frameInterval = 1000 / fps;
  for (let i = useFrames.length - 1; i >= 0; i--) {
    drawFrameFit(useFrames[i], width, height);
    await sleep(frameInterval);
    useFrames[i].close();
  }
}

function drawFrameFit(vf, W, H) {
  const scale = Math.min(W / vf.displayWidth, H / vf.displayHeight);
  const dw = Math.round(vf.displayWidth * scale);
  const dh = Math.round(vf.displayHeight * scale);
  const dx = (W - dw) >> 1;
  const dy = (H - dh) >> 1;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  // drawImage supports VideoFrame in modern browsers
  // @ts-ignore
  ctx.drawImage(vf, dx, dy, dw, dh);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
