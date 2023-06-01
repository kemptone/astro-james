import Select from "./Select.tsx";

// NOTES on Event Handlers
// the onInput event handler type can also be created this way
// import { ChangeEventHandler, forwardRef, Ref } from "preact/compat";
// onInput?: ChangeEventHandler<HTMLInputElement>; // also works

// Using Ref instead of MutableRef also works
// inputRef?: Ref<HTMLInputElement>; // also works

export default (
  props: Parameters<typeof Select>[0] & {
    legendText?: string;
  },
) => {
  return (
    <fieldset className="select">
      {props.legendText && <legend>{props.legendText}</legend>}
      <Select {...props} />
    </fieldset>
  );
};
