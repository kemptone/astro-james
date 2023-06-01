import { MutableRef, useRef } from "preact/hooks";
import { SettingItem } from "./SettingItem.tsx";
import Select from "./Select.tsx";

type Note = {
  name: string;
  frequency: number;
};

type Group = {
  key: number;
  notes: Note[];
};

const Notes: Note[] = [];
// const Groups: Group = {};
const Groups = new Set<Group>();

const notes = "A A# B C C# D D# E F F# G G#".split(" ");

// creates an array of note frequencies
// from the given base frequency
const createFrequencies = (base: number, number: number) => {
  const frequencies: Note[] = [];
  for (let i = 0; i < 12; i++) {
    frequencies.push({
      frequency: base * Math.pow(2, i / 12),
      name: number + ":" + notes[i],
    });
  }
  return frequencies;
};

{
  let x = 0;
  let start = 27.5 / 8;
  while (x < 13) {
    const thing = createFrequencies(start, x - 3);
    Notes.push(...thing);
    Groups.add({ key: x, notes: thing });
    start *= 2;
    x++;
  }
}

export default ({
  e_frequency,
  r_frequency,
}: {
  e_frequency: MutableRef<HTMLInputElement | null>;
  r_frequency: MutableRef<number>;
}) => {
  const e_octave = useRef<HTMLSelectElement | null>(null);
  const e_note = useRef<HTMLSelectElement | null>(null);

  const on_input = () => {
    if (!e_note.current || !e_octave.current) return;
    const v_octave = Number(e_octave.current.value);
    const v_note = e_note.current.value;
    const note = Notes.find((item) => item.name === `${v_octave}:${v_note}`);

    if (!note || !e_frequency.current) return;

    e_frequency.current.value = String(
      note.frequency,
    );

    r_frequency.current = note.frequency;
  };

  return (
    <>
      <label className="setting-item">
        <span>Octave</span>
        <Select
          options={[...Groups].map((item) => String(item.key - 3))}
          selected="1"
          inputRef={e_octave}
          onInput={on_input}
        />
      </label>
      <label className="setting-item">
        <span>Note</span>
        <Select
          options={notes}
          selected="A"
          inputRef={e_note}
          onInput={on_input}
        />
      </label>
    </>
  );
};
