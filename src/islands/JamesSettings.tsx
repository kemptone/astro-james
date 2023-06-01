import Dialog from "../components/Dialog.tsx";

import _LS from "../helpers/localStorage.js";
import { useEffect, useRef, useState } from "preact/hooks";
const LS = _LS("James");

// interface IQuestion {
//   name: string;
//   type: "range" | "text" | "select" | "number";
// }

// interface IRange extends IQuestion {
//   min?: number;
//   max?: number;
// }

// interface ISelect extends IQuestion {
//   options: string[];
// }

// interface IText extends IQuestion {
//   validation(): void;
// }

type QuestionItem = {
  name: string;
  type: "range" | "text" | "select" | "number";
  longName?: string;
  options?: string[];
  min?: number;
  max?: number;
};

const SettingsFormItems: QuestionItem[] = [
  {
    name: "pee",
    type: "range",
  },
  {
    name: "tittle",
    type: "range",
  },
  {
    name: "domino",
    type: "range",
  },
  {
    name: "best_friend",
    type: "text",
  },
  {
    name: "completely_dark_at",
    type: "text",
  },
];

function GenerateFieldState(
  SettingsFormItems: QuestionItem[],
) {
  const [values, setValues] = useState([]);
}

const SettingsMap = (
  item: QuestionItem,
  index: number,
  arr: QuestionItem[],
) => {
  return (
    <div key={item.name + index}>
      <label>
        <div>{item.name}</div>
        {item.type === "range" && <input type="range" />}
        {item.type === "text" && <input type="text" />}
        {item.type === "select" && (
          <select>
            {item.options?.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        )}
      </label>
    </div>
  );
};

export default () => {
  const [values, setValues] = useState({});
  const ref_button = useRef<HTMLButtonElement | undefined>();

  useEffect(() => {
    if (ref_button && ref_button.current) {
      ref_button?.current?.click?.();
    }
  }, []);

  return (
    <Dialog>
      {(D) => (
        <>
          <button ref={ref_button} onClick={D.openDialog}>
            Hello Mr Kempton
          </button>
          <D.Dialog ref={D.ref}>
            <div className="jamesSettings">
              {SettingsFormItems.map(SettingsMap)}
            </div>
          </D.Dialog>
        </>
      )}
    </Dialog>
  );
};
