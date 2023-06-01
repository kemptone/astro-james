import Preact from "preact";
import { FunctionComponent } from "preact/compat";
import { useEffect, useRef, useState } from "preact/hooks";
import AdjustableBlades from "../components/AdjustableBlades.tsx";

const Fan: FunctionComponent = () => {
  const outerSVG = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [bladeCount, setBladeCount] = useState(5);

  useEffect(() => {
    outerSVG.current?.classList.add("rotate");
    if (inputRef.current) {
      inputRef.current.value = String(5);
    }
  }, []);

  return (
    <>
      <div ref={outerSVG}>
        <div className="blades-wrap">
          <AdjustableBlades bladeCount={bladeCount} />
        </div>
        <div className="blade-count">
          <input
            type="number"
            ref={inputRef}
            onChange={(e: Event) => {
              const target = e.currentTarget as HTMLInputElement;
              const count = Math.min(Math.ceil(Number(target.value)), 350);
              setBladeCount(count);
            }}
          />
        </div>
      </div>
    </>
  );
};

export default Fan;
