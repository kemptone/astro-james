import showHidePicture from "./components/showHidePicture.js";

const Step = (audioUrl, src, color, password) => ({
  password,
  password_hint: password,
  type: "number",
  reward: (state, e_base, S) => {
    const audio = new Audio("./lasko/sounds/" + audioUrl);
    S.set("audio", audio);
    S.set("bg", color);

    setTimeout(() => {
      showHidePicture(
        e_base,
        src,
        (removeChild) => removeChild(),
      );
    }, 500);
  },
});

export { Step as default };
