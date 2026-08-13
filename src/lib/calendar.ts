import { TZDate } from '@date-fns/tz'

export const DAY_MS = 24 * 60 * 60 * 1000

/**
 * All calendar arithmetic happens in one configured timezone, not the browser's:
 * everyone looking at the same calendar has to see the same week, wherever they
 * are reading it from.
 *
 * Shared rather than copied into each screen: two calendars can look different
 * on purpose, but an entry has to land in the same cell in both, and a duplicated
 * clock-change rule would be wrong in one of them within a year.
 */
const zoned = (instant: Date, timeZone: string) => new TZDate(instant, timeZone)

export const startOfDay = (instant: Date, timeZone: string) => {
  const local = zoned(instant, timeZone)

  return new Date(
    new TZDate(
      local.getFullYear(),
      local.getMonth(),
      local.getDate(),
      0,
      0,
      0,
      0,
      timeZone
    ).getTime()
  )
}

/** Adds whole local days, so a clock change never shifts the boundary. */
export const addDays = (instant: Date, days: number, timeZone: string) => {
  const local = zoned(instant, timeZone)

  return new Date(
    new TZDate(
      local.getFullYear(),
      local.getMonth(),
      local.getDate() + days,
      local.getHours(),
      local.getMinutes(),
      0,
      0,
      timeZone
    ).getTime()
  )
}

/** 0 = Monday … 6 = Sunday, in the calendar's timezone. */
export const weekdayIndex = (instant: Date, timeZone: string) =>
  (zoned(instant, timeZone).getDay() + 6) % 7

/**
 * Formatters are built once per timezone, not once per call.
 *
 * `new Intl.DateTimeFormat` is one of the more expensive things in the platform,
 * and `formatTime` runs on every chip of a week grid — so a fresh formatter per
 * cell was the most costly line in the calendar. They hold no state, so reusing
 * one is exactly equivalent; the cache is keyed by timezone because the
 * configured one is the only value in practice, and a second one simply adds an
 * entry.
 */
const formatterFor = (options: Intl.DateTimeFormatOptions) => {
  const byTimeZone = new Map<string, Intl.DateTimeFormat>()

  return (timeZone: string) => {
    const known = byTimeZone.get(timeZone)
    if (known) return known

    const made = new Intl.DateTimeFormat('en-GB', { timeZone, ...options })
    byTimeZone.set(timeZone, made)

    return made
  }
}

const timeFormat = formatterFor({ hour: '2-digit', minute: '2-digit', hour12: false })
const dayLongFormat = formatterFor({ weekday: 'long', day: 'numeric', month: 'long' })
const dayNumberFormat = formatterFor({ day: 'numeric' })

export const formatTime = (instant: Date, timeZone: string) => timeFormat(timeZone).format(instant)

export const formatDayLong = (instant: Date, timeZone: string) =>
  dayLongFormat(timeZone).format(instant)

/** Just the day of the month — the number on a date button. */
export const formatDayNumber = (instant: Date, timeZone: string) =>
  dayNumberFormat(timeZone).format(instant)

/** Whether this instant falls inside a range, both ends included. */
export const within = (instant: Date, from: Date, to: Date) =>
  instant.getTime() >= from.getTime() && instant.getTime() <= to.getTime()
