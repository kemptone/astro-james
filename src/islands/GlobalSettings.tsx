import { useEffect } from "preact/hooks";
import { setClassListItem } from "../helpers/setBodyStyleProp.ts";
import { getState } from "../helpers/localStorage.ts";

export default function GlobalSettings() {
  const values = getState();

  useEffect(() => {
    if (values.darkmode) {
      setClassListItem("darkmode");
    }

    if (values.darkmode2) {
      setClassListItem("darkmode2");
    }

    if (values.whitemode) {
      setClassListItem("whitemode");
    }
  }, []);

  return <div></div>;
}
