export async function loadReverb(
  audioFile: string,
  context: AudioContext,
) {
  const convolver = context.createConvolver();

  // load impulse response from file
  const response = await fetch(audioFile);
  const arraybuffer = await response.arrayBuffer();
  convolver.buffer = await context.decodeAudioData(arraybuffer);

  return convolver;
}

const CONST1 = 2;

export function buildReverb(
  context: AudioContext,
) {
  const convolver = context.createConvolver();

  // Reverb
  const reverbTime = .2; // the duration of the reverb effect, in seconds
  const reverbBufferLength = Math.ceil(reverbTime * context.sampleRate);
  const reverbBuffer = context.createBuffer(
    2,
    reverbBufferLength,
    context.sampleRate,
  );
  const leftChannel = reverbBuffer.getChannelData(0);
  const rightChannel = reverbBuffer.getChannelData(1);
  // Create an impulse response that simulates a small room
  for (let i = 0; i < reverbBufferLength; i++) {
    leftChannel[i] = (Math.random() * CONST1 - 1) *
      Math.pow(1 - i / reverbBufferLength, CONST1);
    rightChannel[i] = (Math.random() * CONST1 - 1) *
      Math.pow(1 - i / reverbBufferLength, CONST1);
  }
  convolver.buffer = reverbBuffer;

  return convolver;
}

export default loadReverb;
