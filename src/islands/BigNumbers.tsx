import { useState } from "preact/hooks";
import { firstFive } from "../helpers/bignumbers/firstFive.js";
import { buildCardinals } from "../helpers/bignumbers/buildCardinals.ts";
import useVoices from "../effects/useVoices.ts";
// import { ChangeEvent } from "preact/compat";

const First = [
  {
    "builder": [1],
    "y": 0,
    "powerNumber": 0,
    "stringArray": ["zero"],
    "index": 0,
  },
  {
    "builder": [1],
    "y": 1,
    "powerNumber": 0,
    "stringArray": ["ten"],
    "index": 1,
  },
  {
    "builder": [1],
    "y": 1,
    "powerNumber": 0,
    "stringArray": ["one", "hundred"],
    "index": 2,
  },
  {
    "builder": [1],
    "y": 1,
    "powerNumber": 1,
    "stringArray": ["one", "thousand"],
    "index": 3,
  },
  {
    "builder": [1],
    "y": 1,
    "powerNumber": 1,
    "stringArray": ["ten", "thousand"],
    "index": 4,
  },
  {
    "builder": [1],
    "y": 1,
    "powerNumber": 1,
    "stringArray": ["one", "hundred", "thousand"],
    "index": 5,
  },
];

// const Cardinals = [null, null, null, null, null, null];
const Cardinals = [...First];
buildCardinals(Cardinals);

export default () => {
  const [name, setName] = useState("");
  const [pronounce, setPronounce] = useState("");

  const {
    // synth,
    // voices,
    // englishOnly,
    // changeEnglishOnly,
    voice_name,
    // read,
    Speak,
  } = useVoices();

  return (
    <main>
      <fieldset>
        <legend>🙋 Power of Ten</legend>
        <input
          type="number"
          name=""
          placeholder="0"
          id="input"
          autocomplete="off"
          min="0"
          max="1e5"
          pattern="\d{1, 5}"
          onChange={(e: Event) => {
            const target = e.target as HTMLInputElement;

            const key = Number(target.value);

            if (key < 6) {
              setName(firstFive(key));
              setPronounce(firstFive(key));
              return;
            }

            if (key > 1e4 * 10) {
              const msg = "😜 NUMBER TOO BIG! 😜";
              setName(msg);
              setPronounce(msg);
              return alert(msg);
            }

            const value = Cardinals[key];

            const name = value.stringArray.join("");
            const pro = value.stringArray.join(" ").replace(
              /  /g,
              " ",
            );

            setName(name);
            setPronounce(pro);

            Speak({
              read: pro,
              voice_name,
            });
          }}
        />
      </fieldset>
      <fieldset
        onClick={() => {
          Speak({
            read: pronounce,
            voice_name,
          });
        }}
      >
        <legend>English name</legend>
        <textarea
          name="name"
          id="name"
          cols={30}
          rows={2}
          placeholder="ten"
          autocomplete="off"
          value={name}
        >
        </textarea>
        <textarea
          cols={30}
          rows={2}
          placeholder="pronounce"
          id="pronounce"
          autocomplete="off"
          value={pronounce}
        >
        </textarea>
      </fieldset>
    </main>
  );
};
