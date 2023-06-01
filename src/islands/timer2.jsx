import { useEffect, useRef, useState } from "preact/hooks";
import { buildTimeleftHtml, max } from "../helpers/timer.js";

export default () => {
  const [maxTime, setMaxtime] = useState(0);
  const [timeleft, setTimeleft] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [Sounds, setSounds] = useState(null);
  const [animationState, setAnimation] = useState("");
  const [offtimer, setOffTimer] = useState(2);
  const [spintimer, setSpinTimer] = useState(.5);
  // const [startTime, setStartTime] = useState(new Date());
  const animatedImage = useRef(null);

  const OnAnimationIteration = (startTime) => (e) => {
    console.count("animation");
    const currentTime = new Date();
    const elapsedTime = (currentTime - startTime) / 1000;

    setSpinTimer((prev) => {
      console.log({
        elapsedTime,
        spintimer: prev,
        offtimer,
      });

      const stimer = prev * 1.2;

      document?.body?.style?.setProperty?.("--spintimer", stimer + "s");
      // document?.body?.style?.setProperty?.("--offtimer", offtimer + "s");

      return stimer;
    });

    // setSpinTimer(spintimer * 1.2);
  };

  function countDown() {
    if (animationState) {
      return stopAll();
    }

    const bottom = Sounds?.bottom?.play();
    const middle = Sounds?.middle?.play();
    // setStartTime(new Date());
    const startTime = new Date();

    const onAnimationIteration = OnAnimationIteration(startTime, timeleft);

    const interval = setInterval((e) => {
      setTimeleft((prev) => {
        if (prev === 1 || !prev) {
          clearInterval(interval);
          Sounds?.middle?.fade(1, 0, 2800, middle);
          Sounds?.bottom?.fade(1, 0, 4000, bottom);

          // setAnimation("spin-end");
          // setTimeout(() => {
          //   // setAnimation("end");
          //   // setTimeout(() => {
          //   setAnimation("");
          //   // }, 3000);
          // }, offtimer * 1000);

          const e_image = document.querySelector("img#spinner");
          e_image.removeEventListener(
            "animationiteration",
            onAnimationIteration,
          );

          e_image.addEventListener(
            "animationiteration",
            onAnimationIteration,
          );
        }
        return Math.max(0, prev - 1);
      });
    }, 1000);

    setAnimation("spin");
    // player.play();
  }

  function stopAll() {
    setTimeleft(1);
  }

  useEffect(() => {
    const _sounds = {
      top: new Howl({
        src: ["/timer/Sounds/middle.mp3"],
        rate: 1,
        loop: true,
      }),
      middle: new Howl({
        src: ["/timer/Sounds/middle.mp3"],
        rate: .2,
        loop: true,
      }),
      bottom: new Howl({
        src: ["/timer/Sounds/middle.mp3"],
        rate: .3,
      }),
    };

    setSounds(_sounds);

    _sounds.top?.on?.("end", (e) => {
      debugger;
    });
  }, []);

  useEffect(() => {
    let alarm = Number(hours) * 3600;
    alarm += Number(minutes) * 60;
    alarm += Number(seconds);
    setTimeleft(alarm);
    setMaxtime(alarm);

    document?.body?.style?.setProperty?.("--spintimer", spintimer + "s");
    document?.body?.style?.setProperty?.("--offtimer", offtimer + "s");

    // document.querySelector("img#spinner").addEventListener(
    //   "animationiteration",
    //   (e) => {
    //     console.count("iteration");
    //   },
    // );
  }, [hours, minutes, seconds]);

  return (
    <>
      <main id="jamestimer" className={animationState}>
        <header>
          <div class="controls">
            <img id="spinner" src="/timer/spinners/25428-200.png" />
            <div>
            </div>
          </div>
        </header>
        <footer>
          <div className="new-timer-section">
            <div>
              <span>Go Off:&nbsp;&nbsp;</span>
              <input
                type="number"
                name="tilloff"
                onChange={(e) => {
                  const value = e?.currentTarget?.value ?? 2;
                  setOffTimer(value);
                  // document?.body?.setProperty?.("--slow-down", value);
                }}
              />
            </div>
            <div>
              <span>Slow Down:&nbsp;&nbsp;</span>
              <span children={buildTimeleftHtml(timeleft)} />
            </div>
            <button
              onClick={countDown}
              children={animationState ? "Stop" : `Start`}
            />
          </div>
          <div>
            <select
              onChange={(e) => {
                setHours(e.target.value);
              }}
            >
              {max.hours.map((value) => (
                <option
                  children={value + (value === 1 ? " hour" : " hours")}
                  value={value}
                />
              ))}
            </select>
            <select
              onChange={(e) => {
                setMinutes(e.target.value);
              }}
            >
              {max.minutes.map((value) => (
                <option
                  children={value + (value === 1 ? " minute" : " minutes")}
                  value={value}
                />
              ))}
            </select>
            <select
              onChange={(e) => {
                setSeconds(e.target.value);
              }}
            >
              {max.seconds.map((value) => (
                <option
                  children={value + (value === 1 ? " second" : " seconds")}
                  value={value}
                />
              ))}
            </select>
          </div>
        </footer>
      </main>
    </>
  );
};
