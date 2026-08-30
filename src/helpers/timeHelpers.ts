const MINUTES_PER_DAY = 24 * 60
const HOURS_PER_DAY = 24

export type ParsedTime =
  | {ok: true; value: number}
  | {ok: false; error: string}

function wrap(value: number, size: number): number {
  return ((value % size) + size) % size
}

export function parseFullTime(raw: string): ParsedTime {
  const value = raw.trim()
  if (!value) {
    return {ok: false, error: 'Enter a time from 0:00 through 23:59.'}
  }

  const match = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!match) {
    return {ok: false, error: 'Use hours and two minute digits, like 0:00 or 14:25.'}
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) {
    return {ok: false, error: 'The time must be between 0:00 and 23:59.'}
  }

  return {ok: true, value: hours * 60 + minutes}
}

export function parseHoursOnly(raw: string): ParsedTime {
  const value = raw.trim()
  if (!value) {
    return {ok: false, error: 'Enter a whole hour from 0 through 23.'}
  }

  if (!/^\d{1,2}$/.test(value)) {
    return {ok: false, error: 'Hours-only mode accepts a whole number from 0 through 23.'}
  }

  const hours = Number(value)
  if (hours > 23) {
    return {ok: false, error: 'The hour must be between 0 and 23.'}
  }

  return {ok: true, value: hours}
}

export function timeLeftToTimeOfDay(
  inputMinutes: number,
  boundaryMinutes: number,
): number {
  return wrap(boundaryMinutes - inputMinutes - 1, MINUTES_PER_DAY)
}

export function hoursLeftToTimeOfDay(
  inputHours: number,
  boundaryMinutes: number,
): number {
  const boundaryHour = Math.floor(boundaryMinutes / 60)
  return wrap(boundaryHour - inputHours - 1, HOURS_PER_DAY)
}

export function formatTimeOfDay(totalMinutes: number): string {
  const wrappedMinutes = wrap(totalMinutes, MINUTES_PER_DAY)
  const hours24 = Math.floor(wrappedMinutes / 60)
  const minutes = wrappedMinutes % 60
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 || 12
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
}

export function formatHourOfDay(hours24: number): string {
  const wrappedHours = wrap(hours24, HOURS_PER_DAY)
  const period = wrappedHours >= 12 ? 'PM' : 'AM'
  const hours12 = wrappedHours % 12 || 12
  return `${hours12} ${period}`
}
