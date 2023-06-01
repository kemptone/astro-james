import { MutableRef } from "https://esm.sh/v113/preact@10.13.2/hooks/src/index.js";

export const setBodyStyleProp = (prop: string, value: string) => {
  document.body.style.setProperty(prop, value);
};

export const setClassListItem = (
  className: string,
  element?: HTMLElement | MutableRef<HTMLElement | null>,
) => {
  if (element && typeof element === "object" && "current" in element) {
    return element?.current?.classList.add(className);
  }
  // otherwise it's a HTMLElement
  (element || document.body).classList.add(className);
};

export const removeClassListItem = (
  className: string,
  element?: HTMLElement | MutableRef<HTMLElement | null>,
) => {
  if (element && typeof element === "object" && "current" in element) {
    return element?.current?.classList.remove(className);
  }
  (element || document.body).classList.remove(className);
};

export const getValueFromRef = (
  element: MutableRef<HTMLInputElement | null>,
  def: string,
) => {
  if (element && typeof element === "object" && "current" in element) {
    return element?.current?.value || def;
  }
  return def;
};
