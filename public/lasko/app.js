// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker
//     .register('/worker2.js')
//     .then(function() {
//       console.log("Service Worker Registered")
//     })
// }

import S from "./state.js";
import run from "./index.js";
import Step from "./step.js";
import "./device.orientation.js";

const s = [
  "lidcreak.mp3",
  "rollerdoorup.mp3",
  "lab.mp3",
  "EMotorDoor.mp3",
  "707.mp3",
];

const i = [
  "/lasko/photos/eggs.jpeg",
  "/lasko/photos/IMG_1173.jpeg",
  "/lasko/photos/IMG_3108.jpeg",
  "/lasko/photos/IMG_2956.jpeg",
];

S.assign({
  all_codes: [
    Step(s[0], i[0], "#FFF", "momskob"),
    Step(s[1], i[1], "#FFF", "dadsko"),
    Step(s[3], i[3], "#FFF", "6665434423451123"),
    Step(s[4], i[2], "green", "115566554433221"),
    Step(s[1], i[1], "#FFF", "lasko"),
    Step(s[2], i[0], "#FFF", "rasko"),
    Step(s[3], i[1], "#FFF", "wasko"),
    Step(s[4], i[1], "yellow", "3319#*6649#7"),
    Step(s[1], i[0], "white", "431907431907"),
    Step(s[3], i[1], "blue", "78976566000**998"),
  ],
  step: 0,
  audio: new Audio("./lasko/sounds/707.mp3"),
});

S.get(run);
