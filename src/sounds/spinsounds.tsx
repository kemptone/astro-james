export default (
  totalTime: number,
  totalRotations: number,
  context: AudioContext,
  audioBuffer: AudioBuffer,
) => {
  // Create an AudioContext object
  // const context = new AudioContext();

  // Load the audio file
  // fetch("/spin/main_206.mp3")
  //   .then((response) => response.arrayBuffer())
  //   .then((buffer) => context.decodeAudioData(buffer))
  //   .then((audioBuffer) => {
  // Get the sample rate and number of channels of the original audio file

  const {
    sampleRate,
    numberOfChannels,
    length,
    duration,
  } = audioBuffer;

  // we build our samples perfect like this
  const loopLength = Math.floor(length / 8);
  // should be in the middle
  const loopStart = loopLength * 2;

  // Create a new AudioBuffer to hold the looped section
  const loopBuffer = context.createBuffer(
    numberOfChannels,
    loopLength,
    sampleRate,
  );

  // Copy the looped section from the original audio buffer to the new buffer
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    const loopData = loopBuffer.getChannelData(channel);
    for (let i = 0; i < loopLength; i++) {
      loopData[i] = channelData[Math.floor(loopStart) + i];
    }
  }

  // Create a buffer source node to play the looped section
  const source = context.createBufferSource();
  source.buffer = loopBuffer;

  // Create a gain node to control the volume of the looped section
  const gainNode = context.createGain();
  gainNode.gain.value = 0.7; // set the initial volume to 50%

  const convolver = context.createConvolver();
  const reverbTime = 1.5; // the duration of the reverb effect, in seconds
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
    leftChannel[i] = (Math.random() * 2 - 1) *
      Math.pow(1 - i / reverbBufferLength, 2);
    rightChannel[i] = (Math.random() * 2 - 1) *
      Math.pow(1 - i / reverbBufferLength, 2);
  }
  convolver.buffer = reverbBuffer;
  source.connect(convolver);
  convolver.connect(gainNode);
  gainNode.connect(context.destination);

  // Connect the nodes together: source -> gain -> destination
  // source.connect(gainNode);
  // gainNode.connect(context.destination);

  // Loop the section
  source.loop = true;

  // const RATE = 2 * (totalRotations / totalTime);
  // const RATE = Math.min((totalRotations / totalTime) * 1.3, 10);
  const RATE = Math.max(
    Math.min((totalRotations / totalTime) * 1.3, 10),
    .5,
  );

  source.playbackRate.setValueAtTime(0.0, context.currentTime);
  source.playbackRate.linearRampToValueAtTime(RATE, totalTime / 8);
  source.playbackRate.setValueAtTime(
    RATE,
    context.currentTime + ((totalTime / 2) - totalTime / 3),
  );
  source.playbackRate.linearRampToValueAtTime(
    0,
    context.currentTime + ((totalTime / 2) - totalTime / 4) +
      (totalTime / 8),
  );

  // Start playing the section
  // source.start();
  // });

  return source;
};
