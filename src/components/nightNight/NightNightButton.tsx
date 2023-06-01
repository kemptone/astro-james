import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import type { SoundItem } from "../../types/NightNight.ts";

type PlayButtonProps = {
  sounds: SoundItem[];
  setAllOnCallback: () => void;
  allOn: boolean;
};

export default function ({ sounds, setAllOnCallback, allOn }: PlayButtonProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  // Create the audio context when the component mounts
  useEffect(() => {
    audioContextRef.current = new AudioContext();
  }, []);

  function handlePlay() {
    if (isPlaying) return;

    sourceNodesRef.current = [];

    // Create a new buffer source node for each sound and connect it to the audio context

    const chunky1 = sounds.filter((a) => {
      return a.y > 300 && a.y < 400;
    }).sort((a, b) => {
      return a.x - b.x;
    });

    const chunky2 = sounds.filter((a) => {
      return a.y > 400 && a.y < 500;
    }).sort((a, b) => {
      return a.x - b.x;
    });

    [...chunky1, ...chunky2].forEach((sound) => {
      // sounds.forEach((sound) => {
      const sourceNode = audioContextRef.current?.createBufferSource();
      if (!sourceNode) return;

      sourceNode.buffer = sound.buffer;

      if (audioContextRef.current?.destination) {
        sourceNode.connect(audioContextRef.current?.destination);
        sourceNodesRef.current.push(sourceNode);
      }
    });

    // Schedule each buffer source node to play in sequence
    sourceNodesRef.current.forEach((current, index, arr) => {
      const next = arr[index + 1];
      if (next) {
        current.onended = () => {
          next.start();
        };
      } else {
        current.onended = () => {
          handleStop();
        };
      }
    });

    sourceNodesRef.current[0]?.start?.();

    if (sourceNodesRef.current[0]) {
      setIsPlaying(true);
    }
  }

  function handleStop() {
    setIsPlaying(false);
    if (!isPlaying) return;

    // Stop all buffer source nodes
    sourceNodesRef.current.forEach((node) => {
      // node?.stop?.();
      node?.disconnect?.();
    });
  }

  return (
    <div className="game-button">
      <div style={{ marginTop: "1em" }}>
        {isPlaying
          ? <button onClick={handleStop}>Stop 🕳</button>
          : <button onClick={handlePlay}>Play 🗣</button>}
        <button
          onClick={setAllOnCallback}
          children={allOn ? `All Off 🕳` : `All On 😎`}
        />
      </div>
    </div>
  );
}
