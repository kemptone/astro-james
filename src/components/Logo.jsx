import { Problem } from "../components/Problem.tsx";
import {
  CurrentAnimation,
  CurrentMathProblem,
  // MenuOpen,
  Number1MultiplyBy,
  Number2MultiplyBy,
  Step,
} from "../data/State.ts";

export default function NumberGame() {
  const $logo = (
    <lottie-player
      src={CurrentAnimation.value}
      key={CurrentAnimation.value}
      background="transparent"
      speed=".25"
      style="width: 300px; height: 300px;"
      loop
      autoplay
    />
  );

  const $logoBottom = (
    <lottie-player
      // src={ animations[0] }
      src={CurrentAnimation.value}
      key={CurrentAnimation.value}
      background="transparent"
      speed=".25"
      style="width: 200px; height: 200px;"
      loop
      autoplay
    />
  );

  return (
    <div>
      <div>
        <span className="animation top">
          {$logo}
        </span>
        <span className="animation bottom">
          {$logoBottom}
        </span>
        <section class="math-problems">
          <Problem
            {...CurrentMathProblem.value}
            step={Step.value}
            onSubmit={() => Step.value += 1}
            act="÷"
            // onFocus={e => {
            //   MenuOpen.value = false
            // }}
          />
        </section>
        <span id="divisible">
          [ {Number2MultiplyBy.value} ] [ {Number1MultiplyBy.value} ]
        </span>
      </div>
    </div>
  );
}
