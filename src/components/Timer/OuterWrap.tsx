import { useCallback, useEffect, useRef, useState } from "preact/hooks";
// import type { AudioThing } from "../hooks/useAudioLoop.tsx";
import type { AudioThing } from "../../hooks/useAudioLoop.tsx";

export default (Props : {
  InnerCore : any
}) => () => {
  const Sounds: AudioThing[] = [
    {
      audioFile: "/spin/fans/00.wav",
      initialPlaybackRate: .5,
      refSourceNode: useRef<AudioBufferSourceNode | null>(),
      refPlaying: useRef(false),
      refPlay: useRef(() => undefined),
      refStop: useRef(() => undefined),
      refLoaded: useRef(false),
    },
    {
      audioFile: "/spin/fans/01.wav",
      initialPlaybackRate: 1,
      refSourceNode: useRef<AudioBufferSourceNode | null>(),
      refPlaying: useRef(false),
      refPlay: useRef(() => undefined),
      refStop: useRef(() => undefined),
      refLoaded: useRef(false),
    },
    {
      audioFile: "/spin/fans/08.wav",
      initialPlaybackRate: .25,
      refSourceNode: useRef<AudioBufferSourceNode | null>(),
      refPlaying: useRef(false),
      refPlay: useRef(() => undefined),
      refStop: useRef(() => undefined),
      refLoaded: useRef(false),
    },
  ];

  return <Props.InnerCore {...{ Sounds }} />;
};