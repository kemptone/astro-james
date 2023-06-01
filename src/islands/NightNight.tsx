import {
  MutableRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "preact/hooks";
import { loadSoundFile } from "../utils/loadSoundFile.tsx"; // A helper function to load the sound file using Web Audio API
import Draggable from "../components/CustomDraggable.tsx";
import type { SoundItem } from "../types/NightNight.ts";
import { AllSounds } from "../utils/AllNightNightSounds.ts";
import NightNightButton from "../components/nightNight/NightNightButton.tsx";
import NightNightItem from "../components/nightNight/NightNightItem.tsx";
import { ClassAttributes } from "https://esm.sh/v113/preact@10.13.2/src/index.js";
import { isDarkHexColor } from "../helpers/helpers.ts";

type ItemsType = {
  [key: string]: ClassAttributes<HTMLDivElement>["ref"] | undefined;
};

export default function () {
  const [sounds, setSounds] = useState<SoundItem[]>([]);
  const [allOn, setAllOn] = useState(false);
  const [pageKey, setPageKey] = useState(123);
  const items = useRef<ItemsType>({});
  const saveRef =
    (key: string) => (r: ClassAttributes<HTMLDivElement>["ref"]) => {
      items.current[key] = r;
    };

  const setAllOnCallback = () => {
    setAllOn(!allOn);

    setPageKey(pageKey + 1);

    const yOffset = !allOn ? 208 : 10;
    let jogger = 0;
    let yjogger = 1;

    const newSounds = [...sounds];

    Object.keys(items.current).forEach((key, index) => {
      const width = 80;
      const item: HTMLDivElement = items.current[key];

      if (!item) {
        return;
      }

      const x = (index - jogger) * width;
      const y = !allOn ? (yjogger * 100) + yOffset : (yjogger * 80) + yOffset;

      newSounds[index].x = x;
      newSounds[index].y = y;

      item.style.top = `${y}px`;
      item.style.left = `${x}px`;

      if (x > outerWidth - width) {
        jogger = index + 1;
        yjogger++;
      }
    });

    setSounds(newSounds);
  }; // , [allOn, sounds]);

  // Load the sound files when the component mounts
  useEffect(() => {
    const soundUrls = AllSounds.map((s) => `/night_night/${s}.wav`);
    const loadSounds = async () => {
      const audioContext = new (AudioContext || window.webKitAudioContext)();
      const buffers = await Promise.all(
        soundUrls.map((url) => loadSoundFile(audioContext, url)),
      );

      const yOffset = 10;
      let jogger = 0;
      let yjogger = 1;

      const newSounds: SoundItem[] = buffers.map((buffer, index) => {
        const width = 80;
        const { outerHeight, outerWidth } = window;

        const y = (yjogger * 80) + yOffset;
        const x = (index - jogger) * width;

        if (x > outerWidth - width) {
          jogger = index + 1;
          yjogger++;
        }

        const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`; // Generate a random color for each box

        return ({
          buffer,
          x,
          y,
          color,
          textColor: isDarkHexColor(color) ? "#fff" : "#000",
          name: String(index + 1),
        });
      });
      setSounds(newSounds);
    };
    loadSounds();
  }, []);

  function handleBoxMove(index: number, newX: number, newY: number) {
    setSounds((prevSounds) =>
      prevSounds.map((sound, i) =>
        i === index ? { ...sound, x: newX, y: newY } : sound
      )
    );
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
      className="night-night"
    >
      <h1>Night Night, Sleep Tight</h1>
      <div className="playBox"></div>
      <div className="playBox2"></div>
      <div>
        {sounds.map((sound, i) => (
          <Draggable
            key={i}
            positionX={sound.x}
            positionY={sound.y}
            onMove={(newX, newY) => handleBoxMove(i, newX, newY)}
            wrapRef={saveRef(String(i))}
          >
            <NightNightItem
              {...{
                symbol: sound.name,
                color: sound.color,
                textColor: sound.textColor,
              }}
            />
          </Draggable>
        ))}
      </div>
      <NightNightButton {...{ sounds, setAllOnCallback, allOn }} />
    </div>
  );
}
