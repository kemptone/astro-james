import buildTimeleftMod from "./buildTimeleft.mod.js";
import BuildSoundMod from "./buildSound.mod.js";

// First we check if you support touch, otherwise it's click:
// let touchEvent = 'ontouchstart' in window ? 'touchstart' : 'click'

export default (All) => {
  let start, middle, end;

  const buildTimeLeftHtml = buildTimeleftMod(All);

  const soundMod = BuildSoundMod(All);

  function setAlarm() {
    let alarm = Number(All.e_hours.value) * 3600;
    alarm += Number(All.e_minutes.value) * 60;
    alarm += Number(All.e_seconds.value);
    All.alarm = alarm;
    All.set_alarm = alarm;
    All.e_timeleft.innerHTML = buildTimeLeftHtml();
  }

  All.e_hours.addEventListener("change", setAlarm);
  All.e_minutes.addEventListener("change", setAlarm);
  All.e_seconds.addEventListener("change", setAlarm);

  let className = "";

  All.e_image.addEventListener("animationend", (e) => {
    if (className) {
      All.e_outer.className = className;
    }

    if (className === "spin") {
      middle.play();
    }

    console.log("animation-end");
  });

  function startAlarm() {
    debugger;

    start = All.sounds.start();
    middle = All.sounds.middle();
    end = All.sounds.end();

    const soundId = start.play();
    start.fade(0, 1, 1000);
    soundMod.slideUp(start, soundId);

    let goingOut = false;
    let goingOutSound = false;

    All.elapsed_time = 0;
    All.e_outer.className = "start";
    className = "spin";
    setAlarm();
    window.clearInterval(All.interval);
    All.interval = window.setInterval(function () {
      if (All.alarm === 0) {
        All.e_outer.className = ""; // clears
        All.elapsed_time = 0;
        return window.clearInterval(All.interval);
      }

      if (!goingOutSound && All.elapsed_time > (All.set_alarm - 12)) {
        start.fade(1, 0, 7000);
        middle.fade(1, 0, 6000);
        let endId = end.play();
        soundMod.slideDown(end, endId);
        goingOutSound = true;
      }

      if (!goingOut && All.elapsed_time > (All.set_alarm - 4)) {
        console.log("end");
        All.e_outer.className = "end";
        goingOut = true;
        className = "";
      }

      All.elapsed_time++;
      All.alarm = All.alarm - 1;
      All.e_timeleft.innerHTML = buildTimeLeftHtml();
    }, 1000);
  }

  debugger;

  All.e_start.addEventListener("click", startAlarm);

  return {
    setAlarm,
    startAlarm,
  };
};
