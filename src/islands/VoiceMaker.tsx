import useVoices from "../effects/useVoices.ts";
import { persist, populate } from "../helpers/localStorage.js";

export default (args) => {
  const {
    synth,
    voices,
    englishOnly,
    changeEnglishOnly,
    voice_name,
    read,
    Speak,
  } = useVoices();

  const clear = (e: Event) => {
    // THis is an odd pattern, why not use React logic here?
    const e_read = document.getElementById("read") as HTMLTextAreaElement;
    if (!e_read) {
      return;
    }
    e_read.value = "";
    e_read.click();
    e_read.focus();
    const { voice_name, read } = populate("voice") ?? {};
    persist("voice", { read: "", voice_name });
  };

  return (
    <form
      class="voice-maker"
      onSubmit={(e: Event) => {
        e.preventDefault();

        const form = e.currentTarget as HTMLFormElement;

        const {
          read,
          voice_name,
        } = Object.fromEntries(new FormData(form));

        Speak({
          read: String(read),
          voice_name: String(voice_name),
        });
      }}
    >
      <fieldset>
        <legend>Pick Voice</legend>
        <select name="voice_name" defaultValue={voice_name}>
          {voices.map(({
            name,
            lang,
          }) => (
            <option
              value={name}
              children={`${name} : ${lang.countryName} : ${lang.name}`}
            />
          ))}
        </select>
        <label>
          <input
            type="checkbox"
            checked={englishOnly}
            onChange={(e) => changeEnglishOnly(!englishOnly)}
          >
          </input>
          English only
        </label>
      </fieldset>
      <fieldset class="say-this">
        <legend>Say This</legend>
        <textarea id="read" name="read" defaultValue={read}></textarea>
        <div class="action">
          <button type="submit">Say this ⏎</button>
          <button type="button" onClick={clear}>Clear</button>
        </div>
      </fieldset>
    </form>
  );
};
