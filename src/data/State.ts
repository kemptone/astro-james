import { computed, effect, signal, useSignal } from "@preact/signals";
import _LS from "../helpers/localStorage.js";
// import { initial, MathProblem } from '../helpers/smartMathGuy.ts'
import Animations from "./Animations.ts";

const LS = _LS("Game");

const animationsLength = Animations.length;

export interface MathProblem {
  num1: number;
  num2: number;
  answer: number;
  answerDivide: number;
  answerMultiply: number;
}

export function divdeBigNumber(p: {
  num1?: number;
  num2?: number;
  isNum2DerivedFromNum1: boolean;
  num1MultiplyBy?: number;
  num2MultiplyBy?: number;
  num1IsRandom?: boolean;
}): MathProblem {
  const rand1 = Math.ceil(Math.random() * 10);
  const rand2 = Math.ceil(Math.random() * 10);

  const num1 = p.num1IsRandom
    ? Math.floor(rand1 * (p.num1MultiplyBy || 10))
    : p.num1 || 1;
  const num2 = p.isNum2DerivedFromNum1
    ? num1 * Math.floor(rand2 * (p.num2MultiplyBy || 10))
    : p.num2 || 1;

  return {
    num1: num2,
    num2: num1,
    answer: (num2 / num1),
    answerDivide: (num2 / num1),
    answerMultiply: (num2 * num1),
  };
}

export const Number1MultiplyBy = signal(LS.populate("Number1MultiplyBy") ?? 1);
export const Number2MultiplyBy = signal(LS.populate("Number2MultiplyBy") ?? 10);
export const Number1IsRandom = signal(LS.populate("Number1IsRandom") ?? true);
export const IsNum2DerivedFromNum1 = signal(
  LS.populate("IsNum2DerivedFromNum1") ?? true,
);
export const Step = signal(LS.populate("Step") ?? 0);
// export const MenuOpen = signal(false)

export const CurrentMathProblem = computed(() => {
  // Keeps this here, to allow refresh on Step change
  Step.value;

  return divdeBigNumber({
    num1MultiplyBy: Number1MultiplyBy.value,
    isNum2DerivedFromNum1: IsNum2DerivedFromNum1.value,
    num1IsRandom: Number1IsRandom.value,
    num2MultiplyBy: Number2MultiplyBy.value,
  });
});

export const CurrentAnimation = computed(() => {
  let animationStep = Step.value;

  while (animationStep >= animationsLength) {
    animationStep = animationStep - animationsLength;
  }

  return Animations[animationStep] || Animations[0];
});

effect(() => {
  LS.persist("Number1MultiplyBy", Number1MultiplyBy.value);
  LS.persist("Number2MultiplyBy", Number2MultiplyBy.value);
  LS.persist("Number1IsRandom", Number1IsRandom.value);
  LS.persist("IsNum2DerivedFromNum1", IsNum2DerivedFromNum1.value);
  LS.persist("Step", Step.value);
  // LS.persist("MenuOpen", MenuOpen.value)
});
