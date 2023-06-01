export default function createLoopedBufferSource(
  buffer: AudioBuffer,
  audioContext: AudioContext,
  spliceLoop = true,
  totalRotations: number,
  totalTime: number,
) {
  const {
    sampleRate,
    numberOfChannels,
    length,
  } = buffer;

  // we build our samples perfect like this
  const loopLength = !spliceLoop ? length : Math.floor(length / 8);
  // should be in the middle
  const loopStart = !spliceLoop ? 0 : loopLength * 2;
  // const loopStart = loopLength * 2;

  // Create a new AudioBuffer to hold the looped section
  const loopBuffer = audioContext.createBuffer(
    numberOfChannels,
    loopLength,
    sampleRate,
  );

  // Copy the looped section from the original audio buffer to the new buffer
  // Does this actually do anything???
  // for (let channel = 0; channel < numberOfChannels; channel++) {
  //   const channelData = buffer.getChannelData(channel);
  //   const loopData = loopBuffer.getChannelData(channel);
  //   for (let i = 0; i < loopLength; i++) {
  //     loopData[i] = channelData[Math.floor(loopStart) + i];
  //   }
  // }

  const source = audioContext.createBufferSource();
  source.buffer = loopBuffer;
  source.loop = true;

  const RATE = (totalRotations / totalTime);

  source.playbackRate.setValueAtTime(0.0, audioContext.currentTime);
  source.playbackRate.linearRampToValueAtTime(RATE, totalTime / 4);
  source.playbackRate.setValueAtTime(
    RATE,
    audioContext.currentTime + ((totalTime / 2) - totalTime / 8),
  );
  source.playbackRate.linearRampToValueAtTime(
    0,
    totalTime,
  );

  return source;
}
