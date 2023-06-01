import { useEffect, useRef, useState } from "preact/hooks";

function constantRateReduction(rate, time, finalRate) {
  return -Math.log(finalRate / rate) / time;
}

const INTERVAL_SPEED = 3;
const baseRateOfRotation = 4;
const baseThreshold = .03;

export default () => {
  const [resetTimeleft, setResetTimeleft] = useState(0);
  const [timeleft, setTimeleft] = useState(0);
  const [Sounds, setSounds] = useState(null);
  const [animationState, setAnimation] = useState("");
  const [rateOfSlowdown, setRateOfSlowdown] = useState(.005);
  const [userRateofRotation, setUserRateofRotation] = useState(
    baseRateOfRotation,
  );

  let rotation = 0;
  // let userRateofRotation = baseRateOfRotation;
  let rateOfRotation = userRateofRotation;

  console.log({
    userRateofRotation,
  });

  const intervals = {
    animation: null,
    animation2: null,
    interval: null,
  };

  function countDown() {
    clearInterval(intervals.interval);
    clearInterval(intervals.animation);
    clearInterval(intervals.animation2);

    setAnimation("spin");

    rateOfRotation = userRateofRotation;
    rotation = 0;

    const bottom = Sounds?.bottom?.play();
    const middle = Sounds?.middle?.play();
    const e_image = document.querySelector("img#spinner");

    // Main rotation
    intervals.animation = setInterval((e) => {
      rotation += userRateofRotation;
      e_image.style.transform = `rotate(${rotation}deg)`;
    }, INTERVAL_SPEED);

    intervals.interval = setInterval((e) => {
      setTimeleft((prev) => {
        if (prev === 1 || !prev) {
          setAnimation("");
          clearInterval(intervals.interval);
          clearInterval(intervals.animation);
          clearInterval(intervals.animation2);
          Sounds?.middle?.fade(1, 0, 2800, middle);
          Sounds?.bottom?.fade(1, 0, 4000, bottom);

          intervals.animation2 = setInterval((e) => {
            if (rateOfRotation < baseThreshold) {
              setTimeleft(resetTimeleft);
              return clearInterval(intervals.animation2);
            }
            rotation += rateOfRotation;
            e_image.style.transform = `rotate(${rotation}deg)`;
            rateOfRotation = rateOfRotation - rateOfSlowdown;

            console.log({
              rotation,
              rateOfRotation,
            });
          }, INTERVAL_SPEED);
        }

        return Math.max(0, prev - 1);
      });
    }, 1000);
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
  }, []);

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
              <div>Speed of Fan:</div>
              <input
                type="number"
                onChange={(e) => {
                  const value = Number(e?.currentTarget?.value ?? 2) ?? 2;
                  setUserRateofRotation(value / 20);
                }}
              />
            </div>

            <div>
              <div>Time to Slow Down:</div>
              <input
                type="number"
                onChange={(e) => {
                  const value = Number(e?.currentTarget?.value ?? 2) ?? 2;
                  setRateOfSlowdown(
                    constantRateReduction(
                      userRateofRotation,
                      value * (1000 / INTERVAL_SPEED),
                      .02,
                    ),
                  );

                  rateOfRotation = userRateofRotation;
                }}
              />
            </div>

            <div>
              <div>Time for Motor:</div>
              <input
                type="number"
                onChange={(e) => {
                  const value = Number(e?.currentTarget?.value ?? 0) ?? 0;
                  setResetTimeleft(value);
                  setTimeleft(value);
                }}
              />
            </div>

            <button
              onClick={animationState
                ? ((e) => {
                  clearInterval(intervals.interval);
                  clearInterval(intervals.animation);
                  clearInterval(intervals.animation2);
                  setAnimation("");
                  rateOfRotation = userRateofRotation;
                })
                : countDown}
              children={animationState === "spin" ? "Stop" : `Start`}
            />
          </div>
        </footer>
      </main>
    </>
  );
};
