import { useEffect, useState } from "preact/hooks";
import Dialog from "../components/Dialog.tsx";

// Creates a range of times that has ranges that correspond to times
const Times = [
  [0, (60 * 4) + 30, "dark night"],
  [(60 * 4) + 31, 60 * 5, "early-sunrise"],
  [(60 * 5) + 1, 60 * 6, "sunrise"],
  [(60 * 6) + 1, 60 * 7, "sunrise-early-morning"],
  [(60 * 7) + 1, 60 * 9, "early-morning"],
  [(60 * 9) + 1, 60 * 10, "morning"],
  [(60 * 10) + 1, 60 * 12, "before-noon"],
  [(60 * 12) + 1, 60 * 13, "noon"],
  [(60 * 13) + 1, 60 * 14, "post-noon"],
  [(60 * 14) + 1, 60 * 16, "after-noon"],
  [(60 * 16) + 1, 60 * 17, "post-after-noon"],
  [(60 * 17) + 1, 60 * 18, "pre-sunset"],
  [(60 * 18) + 1, 60 * 19, "sunset"],
  [(60 * 19) + 1, (60 * 19) + 30, "sunset-end"],
  [(60 * 19) + 31, 60 * 20, "after-sunset"],
  [(60 * 20) + 1, 60 * 21, "early-evening"],
  [(60 * 21) + 1, 60 * 24, "dark evening"],
];

// This uses Internation number formatting to pad the number with a leading zero
// if it's less than 10. This is a bit of a hack, but it works.
const pad = (n: number) =>
  n.toLocaleString("en-US", { minimumIntegerDigits: 2 });

export default () => {
  useEffect(() => {
    document.documentElement.className = "dark night";
    document.documentElement.classList.add("ampm-game");
  }, []);

  return (
    <main class={"ampm"}>
      <form
        action="javascript:void(0)"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const formData = new FormData(form);

          const hour = Number(formData.get("hour"));
          const minute = Number(formData.get("minute"));
          // const seconds = Number(formData.get("seconds"));
          const ampm = Number(formData.get("ampm"));

          let time = 0;

          if (hour === 12) {
            if (ampm === 0) {
              time = minute;
            } else {
              time = hour * 60 + minute;
            }
          } else {
            time = (hour + ampm) * 60 + minute;
          }

          // const time = (hour === 12 && ampm === 0)
          //   ? minute
          //   : (hour + ampm) * 60 + minute;

          const [start, end, name] = Times.find(([start, end]) => {
            return time >= start && time <= end;
          });

          // sets a classname on on the html element
          document.documentElement.className = name;
          document.documentElement.classList.add("ampm-game");

          // const time = formData.get("time") as string;
          // const ampm = formData.get("ampm") as string;
        }}
      >
        <select name="hour">
          {[...Array(12).keys()].map((i) => (
            <option value={i + 1}>{pad(i + 1)}</option>
          ))}
        </select>
        <select name="minute">
          {[...Array(60).keys()].map((i) => <option value={i}>{pad(i)}
          </option>)}
        </select>
        <select name="seconds">
          {[...Array(60).keys()].map((i) => <option value={i}>{pad(i)}
          </option>)}
        </select>
        <select name="ampm">
          <option value="0">AM</option>
          <option value="12">PM</option>
        </select>
        <button type="submit">SET</button>
      </form>
      <Dialog>
        {(D) => (
          <>
            <button onClick={D.openDialog}>☕</button>
            <D.Dialog ref={D.ref}>
              <ol>
                <li>
                  <a href="https://pacificaview.net/livecam/sharp_triptych.php">
                    Beach Cam
                  </a>
                </li>
              </ol>
            </D.Dialog>
          </>
        )}
      </Dialog>
    </main>
  );
};
