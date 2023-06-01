import { MutableRef } from "preact/hooks";
import { HTMLAttributes } from "preact/compat";
import { persist, populate } from "../helpers/localStorage.ts";

// NOTES on Event Handlers
// the onInput event handler type can also be created this way
// import { ChangeEventHandler, forwardRef, Ref } from "preact/compat";
// onInput?: ChangeEventHandler<HTMLInputElement>; // also works

// Using Ref instead of MutableRef also works
// inputRef?: Ref<HTMLInputElement>; // also works

export default (
  props: Pick<HTMLAttributes<HTMLSelectElement>, "onInput"> & {
    inputRef?: MutableRef<HTMLSelectElement | null>;
    legendText?: string;
    options: string[];
    optionValues?: string[];
    selected: string;
    // This is the key to use for localStorage
    // if it's here, then it will store the value of the input in localStorage
    lskey?: string;
  },
) => {
  return (
    <fieldset className="select">
      {props.legendText && <legend>{props.legendText}</legend>}
      <select
        ref={props.inputRef}
        onInput={(e) => {
          props.onInput && props.onInput(e);
          if (props.lskey) {
            persist(props.lskey, e.currentTarget.value);
          }
        }}
      >
        {props.options.map((key, index) => {
          return props.optionValues
            ? (
              <option
                value={props.optionValues[index]}
                selected={props.optionValues[index] === props.selected
                  ? true
                  : undefined}
              >
                {key}
              </option>
            )
            : (
              <option selected={key === props.selected ? true : undefined}>
                {key}
              </option>
            );
        })}
      </select>
    </fieldset>
  );
};
