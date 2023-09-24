export const CurveTypes = {
  normal: 'm 14 15 q 0 5 -2 10 q 3 2 6 0 q -2 -5 -2 -10 z', // 60 x 60
  pointy: 'm 14 15 q 0 5 -2 10 q 3 -2 6 0 q -2 -5 -2 -10 z', // 60 x 60
  middle: 'm 14 15 q 0 9 -2 10 q 3 2 6 0 q -2 -1 -2 -10 z', // 60 x 60
  daisy: 'm 14 15 q -2 6 -2 10 q 3 2 6 0 q 0 -4 -2 -10 z',
  twisty: 'm 14 15 q -4 7 -2 9 q 3 2 6 0 q -3 -2 -2 -9 z',
  twisty2: 'm 14 15 q -4 7 -2 9 q 3 2 6 -2 q -3 -2 -2 -7 z',
  skinny: 'm 14 15 q -4 7 -2 13 q 4 2 5 -1 q -5 -2 -2 -12 z',
  skinny2: 'm 14 15 q -3 7 -2 12 q 2 1 2 -1 q -2 -2 1 -11 z',
  skinny3: 'm 14 15 q 0 5 -1 10 q 1.506 1.271 3 0 q -1 -5 -1 -10 z',
  skinny4: 'm 14.5 15 q 0 5 -2 10 q 2.5 2 5 0 q -2 -5 -2 -10 z',
  bybygone: 'm 14.5 15 q -1.5 5 -2 10 q 2.5 1 5 0 q -0.5 -5 -2 -10 z',
  paddle: 'm 14.75 15 q -1 5 -0.75 10 q 1 0.5 2 0 q 0.25 -5 -0.75 -10 z',
  paddleSpacer:
    'm 14.75 15.5 q -1 5 -0.75 10 q 1 0.5 2 0 q 0.25 -5 -0.75 -10 z',
} as const

export type TCurveType = keyof typeof CurveTypes

interface FanProps {
  blade_count: number
  curve_type?: TCurveType
}

export function Blade(props: {
  bg: boolean
  rotation: number
  curve_type?: TCurveType
}) {
  return `
        <path 
          d="${CurveTypes[props.curve_type || 'normal']}"
          class=${props.bg ? 'background-blade' : 'forground-blade'}
          transform="rotate(${props.rotation}, 15, 15)"
        />
        `
}

export function AdjustableBlades(props: FanProps) {
  const Arr: number[] = []

  for (let x = 0; x < props.blade_count; x++) {
    Arr.push(x * (360 / props.blade_count))
  }

  return `
        <svg
          width="30"
          height="30"
          className="blades"
          viewBox="0 0 30 30"
        >
          ${
            props.blade_count > 500
              ? null
              : Arr.map((r, index, arr) => {
                  return Blade({
                    bg: true,
                    rotation: r,
                    curve_type: props.curve_type,
                  })
                })
          }
          ${
            props.blade_count > 500
              ? null
              : Arr.map((r, index, arr) => {
                  return Blade({
                    bg: false,
                    rotation: r,
                    curve_type: props.curve_type,
                  })
                })
          }
        </svg>
      `
}
