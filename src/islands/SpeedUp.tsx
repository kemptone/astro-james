import { useCallback, useRef, useState } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";
import useAudioSoundLoop from "../hooks/useAudioSoundLoop.tsx";
import Dialog from "../components/Dialog.tsx";
import { SettingItem } from "../components/SettingItem.tsx";
import { formatTimer } from "../helpers/number.helpers.ts";
import SpeedUpChangeFrequency from "../components/SpeedUpChangeFrequency.tsx";
// SpeedUpChangeFrequency

const Cs = 32.70;
const C = 261.63;

let LastContext: AudioContext;

export default () => {
  const [running, setRunning] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const [delay, setDelay] = useState<number>(0);
  const r_frequency = useRef<number>(Cs);
  const r_timeout = useRef<number>();
  const r_delay = useRef<number>();
  const r_length = useRef<number>();
  const e_frequency = useRef<HTMLInputElement | null>(null);

  const WaitingSound = useAudioSoundLoop({
    frequency: r_frequency.current * 1,
    length: 5,
    type: "sine",
  });

  const WaitingSound2 = useAudioSoundLoop({
    frequency: r_frequency.current * 1.5,
    length: 5,
    type: "sine",
  });

  const CounterSound = useAudioSoundLoop({
    frequency: r_frequency.current * 3,
    length: 0.5,
    type: "sine",
  });

  const StartSound = useAudioSoundLoop({
    frequency: r_frequency.current * 2,
    length: 1,
    type: "sine",
  });

  const EndingSound = useAudioSoundLoop({
    frequency: r_frequency.current * 1,
    length: 1,
    type: "sine",
  });

  const EndingSound2 = useAudioSoundLoop({
    frequency: r_frequency.current * 1.5,
    length: 1,
    type: "sine",
  });

  // formats a number as a timer string, with hours, minutes, and seconds

  const onFormSubmit = useCallback(
    (e: JSX.TargetedEvent<HTMLFormElement, Event>) => {
      e.preventDefault();

      if (LastContext?.state === "running") {
        LastContext?.close();
      }

      const audioCtx = LastContext =
        new (window.AudioContext || window.webkitAudioContext)();

      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const _delay = Number(formData.get("delay"));
      const _length = Number(formData.get("length"));

      setDelay(_delay);

      clearInterval(r_timeout.current);
      clearInterval(r_delay.current);
      clearInterval(r_length.current);

      if (running) {
        setRunning(false);
        return;
      }

      setRunning(true);

      if (_delay) {
        WaitingSound.start(audioCtx, _delay, r_frequency.current * 1);
        WaitingSound2.start(audioCtx, _delay, r_frequency.current * 1.5);
      }

      r_delay.current = setTimeout(() => {
        const startTime = Date.now();
        let lastSecond = 0;
        r_timeout.current = setInterval(function () {
          const elapsedTime = Date.now() - startTime;
          setTimer(elapsedTime);
          const rounded = Math.floor(elapsedTime / 1000);
          if (rounded !== lastSecond) {
            lastSecond = rounded;
            // console.log(lastSecond);
            CounterSound.start(audioCtx, undefined, r_frequency.current * 3);
          }
        }, 0);

        if (_length) {
          r_length.current = setTimeout(() => {
            clearInterval(r_timeout.current);
            setRunning(false);
            setTimer(_length * 1000);
            // CounterSound.stop();
            EndingSound.start(audioCtx, undefined, r_frequency.current * 1);
            EndingSound2.start(audioCtx, undefined, r_frequency.current * 1.5);
          }, _length * 1000);
        }
        StartSound.start(audioCtx, undefined, r_frequency.current * 2);
      }, _delay * 1000);
    },
    [running],
  );

  return (
    <Dialog>
      {(D) => (
        <main
          class={`speedup ${running ? "running" : ""} ${delay ? "delay" : ""}`}
        >
          <form
            action="javascript:void(0)"
            onSubmit={onFormSubmit}
          >
            <div className="timer">
              {formatTimer(timer)}
            </div>

            <section>
              <SettingItem name="length" />
            </section>
            <section>
              <SettingItem name="delay" />
            </section>
            <section>
              <button
                children={running ? "⏱ Stop" : "⏰ Start"}
              />
              <button
                type="reset"
                children="♻"
                onClick={() => {
                  setTimer(0);
                  setRunning(false);
                  setDelay(0);
                  LastContext?.close();
                  clearInterval(r_timeout.current);
                }}
              />
              <button
                type={"button"}
                onClick={D.openDialog}
                children="✺"
              />
            </section>
          </form>
          <D.Dialog ref={D.ref}>
            <main class="speedup-dialog">
              <form
                action="javascript:void(0)"
                onSubmit={(e) => {
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);
                  const _frequency = Number(formData.get("frequency"));
                  r_frequency.current = _frequency;
                  // D.closeDialog();
                }}
                style={{ marginTop: "130px" }}
              >
                <SpeedUpChangeFrequency
                  {...{
                    e_frequency,
                    r_frequency,
                  }}
                />
                <SettingItem
                  inputRef={e_frequency}
                  name="frequency"
                  type="text"
                />
                <section>
                  <button children="Set" />
                  <button
                    type="reset"
                    children="♻"
                    onClick={() => {
                      r_frequency.current = Cs;
                    }}
                  />
                </section>
              </form>
            </main>
          </D.Dialog>
        </main>
      )}
    </Dialog>
  );
};
