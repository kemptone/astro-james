export type ParsedWaves = {values: number[]; error: string}

export type WavePoint = {x: number; y: number}

export type WavePlot = {
  left: number
  top: number
  width: number
  height: number
}

export function parseWaves(raw: string): ParsedWaves {
  const pieces = raw
    .split(',')
    .map(piece => piece.trim())
    .filter(Boolean)

  if (!pieces.length) {
    return {values: [], error: 'Write at least two numbers to make a wave.'}
  }

  const invalid = pieces.find(piece => !Number.isFinite(Number(piece)))
  if (invalid !== undefined) {
    return {
      values: [],
      error: `“${invalid}” is not a number. Use commas between every point.`,
    }
  }

  const values = pieces.map(Number)
  const outside = values.find(value => value < 0 || value > 100)
  if (outside !== undefined) {
    return {
      values: [],
      error: `${outside} is outside the board. Use a number from 0 to 100.`,
    }
  }

  if (values.length < 2) {
    return {
      values: [],
      error: 'Add one more number so the points can make a wave.',
    }
  }

  return {values, error: ''}
}

export function waveShouldBeRed(values: number[]): boolean {
  return values.some(value => value > 90)
}

export function positionWavePoints(
  values: number[],
  plot: WavePlot,
): WavePoint[] {
  return values.map((value, index) => ({
    x:
      values.length === 1
        ? plot.left + plot.width / 2
        : plot.left + (index / (values.length - 1)) * plot.width,
    y: plot.top + (value / 100) * plot.height,
  }))
}

export function buildLinearPath(points: WavePoint[]): string {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
}
