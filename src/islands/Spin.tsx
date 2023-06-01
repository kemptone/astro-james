import { useEffect, useState } from "preact/hooks";
import SpinSounds from "./spin.sounds.tsx";
import Dialog from "../components/Dialog.tsx";
import Recorder from "./Recorder.tsx";
import _localStorage from "../helpers/localStorage.js";

const { persist, populate } = _localStorage("spin");

const Fans =
  "Dumpy.png Fardo.png Lark.svg Orange.svg Cross.png Rat.png Metal_Girl.png colorfull.png dewalt.jpeg hote.jpeg makita1.jpg saw123.svg specialized.jpeg cactus.png flower.jpeg rose-glass.jpg triangles.webp cuaei.gif wheel.jpeg 2ff.gif circles.gif city.png cuaei.gif design.svg drawing-39.jpeg drawing2.jpeg drawing3.jpeg flower2.svg FUI.gif moving_wheel.gif radial.jpeg radial2.jpeg radial3.jpeg radial4.jpeg radial5.jpeg steer.svg symmetrical2.jpeg twist.gif wheel.jpeg Cowardly_lion2.jpeg dorothy.jpeg abstract-colorful.jpeg arrows.png circle-08.svg dewalt2.jpeg glinda.jpeg woz-group.jpeg tin-man.jpeg glinda2.avif IMG_1334.jpeg IMG_5390.JPG original.svg"
    .split(" ");

const FanSounds = (function () {
  let x = 0;
  const LIMIT = 20;
  const ret = [];

  while (x < LIMIT) {
    if (String(x).length > 1) {
      ret.push(`${x}.wav`);
    } else {
      ret.push(`0${x}.wav`);
    }
    x++;
  }

  return ret;
}());

console.log({ FanSounds });

interface Recording {
  audioURL: string;
  timestamp: number;
  id: number;
}

/*
{
    "transitionType": "ease-out",
    "currentFan": "radial5.jpeg",
    "darkmode": true,
    "darkmode2": false,
    "whitemode": true,
    "zoomlevel": "13.3828362516837",
    "zoommode": true,
    "totalRotations": 34,
    "totalTime": 38,
    "rotationRatio": 26.8978247065615
}
*/

export default (props: {}) => {
  const p = populate("spin") || {};

  const [state, setState] = useState("");
  const [totalTime, setTotalTime] = useState(p.totalTime ?? 38);
  const [totalRotations, setTotalRotations] = useState(p.totalRotations ?? 34);
  const [rotationRatio, setRotationRatio] = useState(
    p.rotationRatio ?? 26.8978247065615,
  );
  const [transitionType, setTransitionType] = useState(
    p.transitionType ?? "ease-out",
  );
  const [currentFan, setCurrentFan] = useState(p.currentFan ?? "IMG_1334.jpeg");
  const [currentSound, setCurrentSound] = useState(
    p.currentSound ?? "01.wav",
  );
  const [currentSound2, setCurrentSound2] = useState(
    p.currentSound2 ?? "00.wav",
  );
  const [volume, setVolume] = useState(50);
  const [darkmode, setDarkmode] = useState(p.darkmode ?? true);
  const [darkmode2, setDarkmode2] = useState(p.darkmode2 ?? false);
  const [whitemode, setWhitemode] = useState(p.whitemode ?? true);
  const [zoommode, setZoommode] = useState(p.zoommode ?? true);
  const [zoomlevel, setZoomlevel] = useState(p.zoomlevel ?? "13.38283");
  const [playSounds, setPlaySounds] = useState<() => void>(() => {});
  const [stopSounds, setStopSounds] = useState<() => void>(() => {});
  const [instance, setInstance] = useState(0);
  const [allstop, setAllStop] = useState(0);
  const [customAudio1, setCustomAudio1] = useState<string>();
  const [customAudio2, setCustomAudio2] = useState<string>();

  useEffect(() => {
    console.log(persist("spin", {
      transitionType,
      currentFan,
      currentSound,
      currentSound2,
      darkmode,
      darkmode2,
      whitemode,
      zoomlevel,
      zoommode,
      totalRotations,
      totalTime,
      rotationRatio,
    }));

    (function () {
      const thing = document.querySelector("input[name='total-time']");
      if (thing) {
        thing.value = totalTime;
      }
    })();

    (function () {
      const thing = document.querySelector("input[name='volume-number']");
      if (thing) {
        thing.value = volume;
      }
    })();

    // thing?.value = totalTime;
  }, [
    transitionType,
    currentFan,
    currentSound,
    currentSound2,
    darkmode,
    darkmode2,
    whitemode,
    zoomlevel,
    zoommode,
    totalTime,
    totalRotations,
    rotationRatio,
  ]);

  useEffect(() => {
    setState("return");
    setTimeout((e) => {
      setState("");
      // stopSounds();
    }, 100);
  }, [allstop]);

  useEffect(() => {
    const audioContext =
      new (window.AudioContext || window.webkitAudioContext)();
    const Spins = SpinSounds(
      Math.min(2000, volume),
      audioContext,
      totalTime,
      totalRotations,
      customAudio1,
      customAudio2,
      "/spin/fans/" + currentSound,
      "/spin/fans/" + currentSound2,
    );
    setPlaySounds(() => Spins.playSounds);
    setStopSounds(() => Spins.stopSounds);
    return () => {
      audioContext.close();
    };
  }, [
    totalRotations,
    totalTime,
    instance,
    allstop,
    customAudio1,
    customAudio2,
    volume,
    currentSound,
  ]);

  useEffect(() => {
    if (darkmode) {
      document?.body?.classList?.add("darkmode");
    } else {
      document?.body?.classList?.remove("darkmode");
    }
    if (darkmode2) {
      document?.body?.classList?.add("darkmode2");
    } else {
      document?.body?.classList?.remove("darkmode2");
    }
    if (whitemode) {
      document?.body?.classList?.add("whitemode");
    } else {
      document?.body?.classList?.remove("whitemode");
    }
    if (zoommode) {
      document?.body?.classList?.add("zoommode");
    } else {
      document?.body?.classList?.remove("zoommode");
    }
  }, [darkmode, darkmode2, whitemode, zoommode]);

  useEffect(() => {
    const num = Math.floor(totalTime * (rotationRatio / 30));
    setTotalRotations(num);
  }, [rotationRatio, totalTime]);

  useEffect(() => {
    document?.body?.style?.setProperty?.(
      "--spintimer",
      totalTime + "s",
    );
    document?.body?.style?.setProperty?.(
      "--totalrotations",
      (360 * totalRotations) + "deg",
    );
    document?.body?.style?.setProperty?.(
      "--transitionType",
      transitionType,
    );
    setInstance((prev) => prev + 1);
    setState("");
  }, [totalTime, totalRotations, transitionType]);

  useEffect(() => {
    document?.body?.style?.setProperty?.(
      "--zoomlevel",
      `${(4 * Number(zoomlevel))}`,
    );
  }, [zoomlevel]);

  return (
    <>
      <div className={`spinner ${state}`}>
        <img
          src={`/spin/${currentFan}`}
          onTransitionEnd={(e) => {
            setState("return");
            setTimeout((e) => {
              setState("");
              stopSounds();
            }, 100);
            setTimeout((e) => {
              setInstance((prev) => prev + 1);
            }, 1900);
          }}
          onClick={(e) => {
            if (state) {
              // setState("");
            } else {
              setState("spin");
              playSounds();
            }
          }}
        />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setState("spin");
          playSounds();
        }}
      >
        <details className="control" open>
          <summary>Settings</summary>

          <fieldset>
            <legend>Fan</legend>
            <select
              onChange={(e) => setCurrentFan(e.currentTarget.value)}
              defaultValue={currentFan}
            >
              {Fans.map((fan) => <option value={fan}>{fan}</option>)}
            </select>
          </fieldset>
          <fieldset>
            <legend>Sounds</legend>
            <select
              onChange={(e) => setCurrentSound(e.currentTarget.value)}
              defaultValue={currentSound}
            >
              {FanSounds.map((fan) => <option value={fan}>{fan}</option>)}
            </select>
            <select
              onChange={(e) => setCurrentSound2(e.currentTarget.value)}
              defaultValue={currentSound2}
            >
              {FanSounds.map((fan) => <option value={fan}>{fan}</option>)}
            </select>
          </fieldset>
          <fieldset>
            <legend>Time, in seconds</legend>
            <input
              type="number"
              defaultValue={totalTime}
              onChange={(e) => setTotalTime(Number(e.currentTarget.value))}
              name="total-time"
            />
          </fieldset>
          <fieldset>
            <legend>Speed</legend>
            <input
              type="range"
              value={rotationRatio}
              onChange={(e) => setRotationRatio(Number(e.currentTarget.value))}
              min=".01"
              step="any"
            />
          </fieldset>

          <details>
            <summary>More</summary>

            <fieldset className="modes">
              <legend>modes</legend>
              <input
                type="checkbox"
                title="dark mode"
                checked={darkmode === true ? true : undefined}
                onChange={(e) => setDarkmode(e?.currentTarget?.checked)}
              />
              <input
                type="checkbox"
                title="invert fan"
                checked={darkmode2 === true ? true : undefined}
                onChange={(e) => setDarkmode2(e?.currentTarget?.checked)}
              />
              <input
                type="checkbox"
                title="white mode"
                checked={whitemode === true ? true : undefined}
                onChange={(e) => setWhitemode(e?.currentTarget?.checked)}
              />
              <input
                type="checkbox"
                title="zoom fan"
                checked={zoommode === true ? true : undefined}
                onChange={(e) => setZoommode(e?.currentTarget?.checked)}
                name="zoommode"
              />
            </fieldset>

            <fieldset>
              <legend>Rotations</legend>
              <input
                type="number"
                value={totalRotations}
                onChange={(e) =>
                  setTotalRotations(Number(e.currentTarget.value))}
              />
            </fieldset>

            <fieldset>
              <legend>Easing</legend>

              <select
                onChange={(e) => setTransitionType(e.currentTarget.value)}
                defaultValue={transitionType}
              >
                {[
                  "ease",
                  "linear",
                  "ease-in",
                  "ease-out",
                  "ease-in-out",
                  "cubic-bezier(0.075, 0.82, 0.165, 1)",
                  "cubic-bezier(0.23, 1, 0.320, 1)",
                  "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  "cubic-bezier(1, 0, 0, 1)",
                  "cubic-bezier(0.6, -0.28, 0.735, 0.045)",
                  "cubic-bezier(0.77, 0, 0.175, 1)",
                  "cubic-bezier(0.42, 0, 0.58, 1)",
                  "linear(1, .5, .4, .3, .2, .1, .01, 0)",
                ].map((
                  type,
                ) => <option value={type}>{type}</option>)}
              </select>
            </fieldset>
            <fieldset>
              <legend>Zoom</legend>
              <input
                type="range"
                value={zoomlevel}
                onChange={(e) => {
                  setZoommode(true);
                  setZoomlevel(e.currentTarget.value);
                }}
                min=".1"
                step="any"
              />
            </fieldset>
            <fieldset>
              <legend>Volume ({(2 * volume).toFixed(2)}%)</legend>
              <input
                type="number"
                name="volume-number"
                defaultValue={`${volume}`}
                onChange={(e) => setVolume(Number(e.currentTarget.value))}
                min=".01"
                step="any"
              />
            </fieldset>
          </details>

          <Dialog>
            {(D) => (
              <fieldset className="more-actions">
                <button type="submit" children="Go" />
                <button
                  type="button"
                  onClick={(e) => {
                    setAllStop((prev) => prev + 1);
                    setState("return");
                    setTimeout(() => {
                      setState("");
                    }, 100);
                  }}
                  children="Stop"
                />
                <button
                  type="button"
                  onClick={D.openDialog}
                  children="Sounds"
                />
                <D.Dialog ref={D.ref}>
                  <Recorder
                    setAsSound={setCustomAudio1}
                    setAsSound2={setCustomAudio2}
                  />
                </D.Dialog>
              </fieldset>
            )}
          </Dialog>
        </details>
      </form>
    </>
  );
};
