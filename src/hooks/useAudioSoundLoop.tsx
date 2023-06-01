import { IS_BROWSER } from "https://deno.land/x/fresh@1.1.4/runtime.ts";
import {
  MutableRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "preact/hooks";

type SoundSettings = {
  frequency: number;
  length: number;
  type?: "sine" | "square" | "sawtooth" | "triangle" | "custom";
};

export default ({
  frequency = 261.63,
  length = 0.5,
  type = "sine",
}: SoundSettings) => {
  if (!IS_BROWSER) {
    return { start: () => {}, stop: () => {} };
  }

  function play(audioCtx: AudioContext) {
  }

  const start = useCallback((
    audioCtx: AudioContext,
    tweakLength?: number,
    tweakFrequency?: number,
  ) => {
    // const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const gain = audioCtx.createGain();
    gain.connect(audioCtx.destination);

    const oscillator = audioCtx.createOscillator();
    oscillator.frequency.value = tweakFrequency || frequency;
    oscillator.type = type;
    // oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    oscillator.connect(gain);

    gain.gain.setValueCurveAtTime(
      [0, .25, .35, .3, .2, .35, .1, .2, .2, 0],
      audioCtx.currentTime,
      tweakLength || length,
    );
    // gain.gain.setValueAtTime(0, audioCtx.currentTime + 0.5);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + (tweakLength || length));
  }, []);

  const stop = useCallback(() => {
    // oscillator.stop();
  }, []);

  return { start, stop };
};
