import { MutableRef, useId, useRef } from "preact/hooks";
import { HTMLAttributes } from "preact/compat";
import { persist, populate } from "../helpers/localStorage.ts";

// NOTES on Event Handlers
// the onInput event handler type can also be created this way
// import { ChangeEventHandler, forwardRef, Ref } from "preact/compat";
// onInput?: ChangeEventHandler<HTMLInputElement>; // also works

// Using Ref instead of MutableRef also works
// inputRef?: Ref<HTMLInputElement>; // also works

// creates as simple array from 1 to 10
const range = Array.from({ length: 10 }, (_, i) => i);

export default (
  props: Pick<HTMLAttributes<HTMLInputElement>, "onInput" | "defaultValue"> & {
    inputRef?: MutableRef<HTMLInputElement | null>;
    legendText: string;
    // This is the key to use for localStorage
    // if it's here, then it will store the value of the input in localStorage
    lskey?: string;
  },
) => {
  const markersId = useId();
  const r_value = useRef<HTMLElement | null>(null);

  return (
    <fieldset className="range-with-ticks">
      <legend>
        {props.legendText}
        <code ref={r_value} style={{ padding: "0 .5em" }} />
      </legend>
      <input
        type="range"
        list={markersId}
        ref={props.inputRef}
        onInput={(e) => {
          props.onInput && props.onInput(e);
          if (props.lskey) {
            persist(props.lskey, e.currentTarget.value);
          }
          if (r_value.current) {
            r_value.current.innerText = e.currentTarget.value;
          }
        }}
        step="0.001"
        defaultValue={props.defaultValue}
      />
      <datalist id={markersId}>
        {range.map((i) => <option key={i} value={i * 10} />)}
      </datalist>
    </fieldset>
  );
};
