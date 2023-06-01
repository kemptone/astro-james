// import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { SettingItem } from "./SettingItem.tsx";
import {
  //   getValueFromRef,
  removeClassListItem,
  //   setBodyStyleProp,
  setClassListItem,
} from "../helpers/setBodyStyleProp.ts";
import { getState, populate } from "../helpers/localStorage.ts";

export default (props: {
  name: string;
  lskey: string;
}) => {
  const values = getState();

  return (
    <SettingItem
      type={"checkbox"}
      name={props.name}
      lskey={props.lskey}
      defaultChecked={values[props.lskey] ?? undefined}
      isNameAfter={true}
      onInput={(e) => {
        if (e.currentTarget.checked) {
          setClassListItem(props.lskey);
        } else {
          removeClassListItem(props.lskey);
        }
      }}
    />
  );
};
