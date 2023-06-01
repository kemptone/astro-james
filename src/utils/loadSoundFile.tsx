type LoadSoundFileResult = {
  buffer: AudioBuffer | null;
  error?: Error;
};

export async function loadSoundFile(
  audioContext: AudioContext,
  url: string,
): Promise<AudioBuffer> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    // const audioContext = new AudioContext();
    const buffer = await audioContext.decodeAudioData(arrayBuffer);
    return buffer;
  } catch (error) {
    // return { buffer: null, error };
    // if (audioContext) {
    return new AudioBuffer({ length: 0, numberOfChannels: 0, sampleRate: 0 });
    // }
  }
}
