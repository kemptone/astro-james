import { Problem } from "../components/Problem.tsx";
import {
  CurrentMathProblem,
  // MenuOpen,
  Number1MultiplyBy,
  Number2MultiplyBy,
  Step,
} from "../data/State.ts";
import { Logo, LogoBottom } from "../components/Logos.jsx";

export default function NumberGame() {
  return (
    <div>
      <div>
        <span className="animation top">
          <Logo />
        </span>
        <span className="animation bottom">
          <LogoBottom />
        </span>
        <section class="math-problems">
          <Problem
            {...CurrentMathProblem.value}
            step={Step.value}
            onSubmit={() => {
              // debugger;
              Step.value += 1;
            }}
            act="÷"
            onFocus={(e) => {
              //   MenuOpen.value = false
            }}
          />
        </section>
        <span id="divisible">
          [ {Number2MultiplyBy.value} ] [ {Number1MultiplyBy.value} ]
        </span>
      </div>
    </div>
  );
}
