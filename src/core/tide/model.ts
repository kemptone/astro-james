import type {Predictions} from './getData'

export const STATION_NAME = 'Napa, Napa River, Carquinez Strait, California'
export const STATION_SHORT_NAME = 'Napa'

export type TideType = 'H' | 'L'

export interface TidePoint {
  time: Date
  timeMs: number
  heightFt: number
  type: TideType
  rawTime: string
  dayKey: string
}

export interface TideDay {
  date: Date
  dateKey: string
  label: string
  shortLabel: string
  weekday: string
  highs: TidePoint[]
  lows: TidePoint[]
  points: TidePoint[]
}

export interface LiveTideState {
  now: Date
  previousPoint: TidePoint | null
  nextPoint: TidePoint | null
  nextHigh: TidePoint | null
  nextLow: TidePoint | null
  currentHeightFt: number
  isRising: boolean
}

export function parseNoaaTime(value: string) {
  const [datePart, timePart] = value.split(' ')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)

  return new Date(year, month - 1, day, hour, minute)
}

export function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function toDayKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function normalizePredictions(data: Predictions): TidePoint[] {
  if (!data?.predictions?.length) {
    return []
  }

  return data.predictions
    .map(item => {
      const time = parseNoaaTime(item.t)

      return {
        time,
        timeMs: time.getTime(),
        heightFt: Number(item.v),
        type: item.type,
        rawTime: item.t,
        dayKey: toDayKey(time),
      }
    })
    .filter(item => Number.isFinite(item.heightFt) && item.type)
    .sort((a, b) => a.timeMs - b.timeMs)
}

export function buildTideDays(
  points: TidePoint[],
  startDate: Date,
  count: number
): TideDay[] {
  const start = startOfLocalDay(startDate)

  return Array.from({length: count}, (_, index) => {
    const date = addDays(start, index)
    const dateKey = toDayKey(date)
    const dayPoints = points.filter(item => item.dayKey === dateKey)
    const highs = dayPoints.filter(item => item.type === 'H')
    const lows = dayPoints.filter(item => item.type === 'L')

    return {
      date,
      dateKey,
      label: formatFullDayLabel(date),
      shortLabel: formatShortDayLabel(date),
      weekday: formatWeekday(date),
      highs,
      lows,
      points: dayPoints,
    }
  })
}

export function getLiveTideState(
  points: TidePoint[],
  now = new Date()
): LiveTideState {
  const nowMs = now.getTime()
  const previousPoint =
    [...points].reverse().find(item => item.timeMs <= nowMs) ?? null
  const nextPoint = points.find(item => item.timeMs > nowMs) ?? null
  const nextHigh =
    points.find(item => item.timeMs > nowMs && item.type === 'H') ?? null
  const nextLow =
    points.find(item => item.timeMs > nowMs && item.type === 'L') ?? null

  const currentHeightFt =
    previousPoint && nextPoint
      ? interpolateHeight(previousPoint, nextPoint, now)
      : previousPoint?.heightFt ?? nextPoint?.heightFt ?? 0

  return {
    now,
    previousPoint,
    nextPoint,
    nextHigh,
    nextLow,
    currentHeightFt,
    isRising:
      previousPoint && nextPoint
        ? nextPoint.heightFt > previousPoint.heightFt
        : false,
  }
}

export function interpolateHeight(
  previousPoint: TidePoint,
  nextPoint: TidePoint,
  time: Date
) {
  const duration = nextPoint.timeMs - previousPoint.timeMs

  if (duration <= 0) {
    return previousPoint.heightFt
  }

  const progress = clamp(
    (time.getTime() - previousPoint.timeMs) / duration,
    0,
    1
  )
  const easedProgress = (1 - Math.cos(progress * Math.PI)) / 2

  return (
    previousPoint.heightFt +
    (nextPoint.heightFt - previousPoint.heightFt) * easedProgress
  )
}

export function getPointAtTime(points: TidePoint[], time: Date): TidePoint {
  const timeMs = time.getTime()
  const previousPoint =
    [...points].reverse().find(item => item.timeMs <= timeMs) ?? points[0]
  const nextPoint =
    points.find(item => item.timeMs >= timeMs) ?? points[points.length - 1]

  const heightFt =
    previousPoint && nextPoint && previousPoint !== nextPoint
      ? interpolateHeight(previousPoint, nextPoint, time)
      : previousPoint?.heightFt ?? nextPoint?.heightFt ?? 0

  return {
    time,
    timeMs,
    heightFt,
    type: nextPoint?.type ?? previousPoint?.type ?? 'H',
    rawTime: '',
    dayKey: toDayKey(time),
  }
}

export function formatTime(date: Date, lowercase = false) {
  const value = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(date)
    .replace(' ', '')

  return lowercase ? value.toLowerCase() : value
}

export function formatClock(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date)
}

export function formatFeet(value: number, compact = false) {
  const normalized = Math.abs(value) < 0.005 ? 0 : value
  const feet = normalized.toFixed(2)

  return compact ? `${feet}ft` : `${feet} ft`
}

export function formatAxisFeet(value: number) {
  const normalized = Math.abs(value) < 0.05 ? 0 : value

  return `${normalized.toFixed(1)}ft`
}

export function formatFullDayLabel(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(date)
}

export function formatShortDayLabel(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}

export function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
  }).format(date)
}

export function formatSummaryDate(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatTableDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date)
}

export function formatTimeZone(date: Date) {
  const part = new Intl.DateTimeFormat('en-US', {
    timeZoneName: 'short',
  })
    .formatToParts(date)
    .find(item => item.type === 'timeZoneName')

  return part?.value ?? 'local'
}

export function formatDuration(milliseconds: number) {
  const totalMinutes = Math.max(0, Math.round(milliseconds / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0 && minutes > 0) {
    return `${hours}hr ${minutes}min`
  }

  if (hours > 0) {
    return `${hours}hr`
  }

  return `${minutes}min`
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
