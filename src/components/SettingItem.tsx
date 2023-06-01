import { MutableRef } from "preact/hooks";
import { HTMLAttributes } from "preact/compat";
import { persist, populate } from "../helpers/localStorage.ts";

// NOTES on Event Handlers
// the onInput event handler type can also be created this way
// import { ChangeEventHandler, forwardRef, Ref } from "preact/compat";
// onInput?: ChangeEventHandler<HTMLInputElement>; // it also works
// Using Ref instead of MutableRef also works
// inputRef?: Ref<HTMLInputElement>; // also works

export const SettingItem = (
  props:
    & Pick<
      HTMLAttributes<HTMLInputElement>,
      "onInput" | "type" | "defaultValue" | "defaultChecked" | "step"
    >
    & {
      inputRef?: MutableRef<HTMLInputElement | null>;
      name: string;
      // This is the key to use for localStorage
      // if it's here, then it will store the value of the input in localStorage
      lskey?: string;
      isNameAfter?: boolean;
    },
) => {
  const {
    name = "",
    type = "number",
    inputRef,
    onInput,
    defaultChecked,
    defaultValue,
    step: _step,
  } = props;

  const step = _step ? _step : type === "number" ? "0.001" : undefined;
  const clean_name = name.replace(/_/g, " ");
  return (
    <label class="setting-item">
      {props.isNameAfter ? "" : <span>{clean_name}</span>}
      <input
        {...{ name, type, step, defaultChecked, defaultValue }}
        onInput={(e) => {
          props.onInput && props.onInput(e);
          if (props.lskey) {
            if (type === "checkbox") {
              persist(props.lskey, e.currentTarget.checked);
            } else {
              persist(props.lskey, e.currentTarget.value);
            }
          }
        }}
        ref={inputRef}
      />
      {props.isNameAfter ? <span>{clean_name}</span> : ""}
    </label>
  );
};
