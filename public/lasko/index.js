import buildPad from "./components/buildPad.js";
import S from "./state.js";
import buildDisplay from "./components/buildDisplay.js";
import buildClear from "./components/buildClear.js";
import buildPlayer from "./components/buildPlayer.js";
import buildCodePlayer from "./components/buildCodePlayer.js";
import numPad from "./numPad.js";
import events from "./events.js";

// trying to clean this

export default function run({ all_codes, step, audio, bg = "white" }) {
  const { password, reward } = all_codes[step];

  document.querySelector("body").style.backgroundColor = bg;

  const e_base = document.getElementById("base");

  e_base.innerHTML = "";

  const z_display = buildDisplay(
    e_base,
    password.length,
    password,
  );

  const pad = buildPad(
    e_base,
    ({ val }) => S.set("code_click", val),
  );

  buildPlayer(
    e_base,
    !!audio,
    () => audio.play(),
  );

  buildCodePlayer(
    e_base,
    () => {
      S.get(({ current_code }) => {
        const sequence = String(password || "").substr(
          String(current_code || "").length,
        ).split("");

        const interval = setInterval(() => {
          const note = sequence.shift();
          S.set("play_note", note);
          if (!sequence.length) {
            clearInterval(interval);
          }
        }, 600);
      });
    },
  );

  buildClear(
    e_base,
    () => {
      S.get(({ current_code = "" }) => {
        S.set(
          "current_code",
          (current_code || "").substr(0, current_code.length - 1),
        );
      });
    },
  );

  events({ pad, z_display, all_codes, step, numPad, e_base, run });
}
