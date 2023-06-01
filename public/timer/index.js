import setAlarmMod from "./setAlarm.mod.js";
import buildOptionsMod from "./buildOptions.mod.js";

const buildRange = (limit) => {
  let v = 0;
  let ret = [];
  while (v < limit) {
    ret.push(v++);
  }
  return ret;
};

const All = {
  e_start: document.getElementById("start"),
  e_outer: document.getElementById("jamestimer"),
  e_hours: document.getElementById("hours"),
  e_minutes: document.getElementById("minutes"),
  e_seconds: document.getElementById("seconds"),
  e_timeleft: document.getElementById("timeleft"),
  e_image: document.querySelector("header img"),
  set_alarm: 0,
  alarm: 0,
  elapsed_time: 0,
  max: {
    hours: buildRange(24),
    minutes: buildRange(60),
    seconds: buildRange(60),
  },
  interval: undefined,
  sounds: {
    start: (e) =>
      new Howl({
        src: ["/timer/Sounds/middle.mp3"],
        rate: .1,
        loop: true,
      }),
    middle: (e) =>
      new Howl({
        src: ["/timer/Sounds/middle.mp3"],
        rate: .5,
        loop: true,
      }),
    end: (e) =>
      new Howl({
        src: ["/timer/Sounds/end.mp3"],
        rate: .4,
      }),
  },
};

setAlarmMod(All);
buildOptionsMod(All)();

console.log({ All });
