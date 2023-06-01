import { useCallback, useEffect, useRef } from "preact/hooks";

function useLoopSounds() {
  const ref_audioContext = useRef<AudioContext | null>(null);
  const ref_convolver = useRef<ConvolverNode | null>(null);
  const ref_source = useRef<AudioBufferSourceNode | null>(null);
  const ref_gain = useRef<GainNode | null>(null);
  const ref_sound1 = useRef<AudioBufferSourceNode | null>(null);
  const ref_sound2 = useRef<AudioBufferSourceNode | null>(null);

  const loadSound = useCallback(
    function loadSound(
      url: string,
      callback: (buffer: AudioBuffer) => void,
    ) {
      const request = new XMLHttpRequest();
      request.open("GET", url, true);
      request.responseType = "arraybuffer";
      request.onload = function () {
        // audioContext.decodeAudioData(request.response, function (buffer) {
        ref_audioContext?.current?.decodeAudioData(
          request.response,
          function (buffer: AudioBuffer) {
            callback(buffer);
          },
        );
      };
      request.send();
    },
    [ref_audioContext],
  );

  useEffect(() => {
    // context
    const audioContext =
      new (window.AudioContext || window.webkitAudioContext)();
    ref_audioContext.current = audioContext;

    // Reverb
    const convolver = audioContext.createConvolver();
    const reverbTime = .7; // the duration of the reverb effect, in seconds
    const reverbBufferLength = Math.ceil(reverbTime * audioContext.sampleRate);
    const reverbBuffer = audioContext.createBuffer(
      2,
      reverbBufferLength,
      audioContext.sampleRate,
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

    // sets it for export
    ref_convolver.current = convolver;
  }, []);

  return {
    ref_audioContext,
    ref_convolver,
    ref_gain,
    ref_sound1,
    ref_sound2,
    ref_source,
  };
}

export default useLoopSounds;
