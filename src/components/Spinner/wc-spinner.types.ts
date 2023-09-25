import type { TCurveType } from "./AdjustableBlades"


export type State = {
  blade_count: number
  run_time: number
  slow_down: number
  speed_up: number
  wait: number
  blade_scale: number
  rate: number
  opacity: number
  audio_rate: number
  blade_line_width: number
  timer_state: 'started' | 'middle' | 'ending' | ''
  rotations_speedup?: number
  rotations_runtime?: number
  rotations_slowdown?: number
  running: boolean
  edit_mode: boolean
  curve_type: TCurveType
}
