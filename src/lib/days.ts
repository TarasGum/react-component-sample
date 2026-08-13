import { addDays, startOfDay, within } from '@/lib/calendar'
import type { CalendarEntry } from '@/types'

/** What a date button knows about its day. */
export type DayMark = {
  /** Local midnight of the day, as a timestamp — the key everything here uses. */
  day: number
  entries: number
  /** Something on this day is flagged, so the dot is a warning. */
  warn: boolean
}

/**
 * The entries of one day, earliest first.
 *
 * The day is a day in the calendar's own timezone, not a 24-hour slice of UTC: a
 * 17:00 booking belongs to the same date for a viewer in another zone, and the
 * boundary moves with the clock change rather than through it.
 */
export const entriesOn = (entries: CalendarEntry[], day: Date, timeZone: string) => {
  const from = startOfDay(day, timeZone)
  const to = new Date(addDays(from, 1, timeZone).getTime() - 1)

  return entries
    .filter(entry => within(new Date(entry.startsAt), from, to))
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
}

/**
 * Which days have something on them, keyed by local midnight.
 *
 * Built once for the whole loaded window rather than per day: the strip and the
 * month picker both read it, and a filter per date button would walk every entry
 * again for each of the forty-two buttons on screen.
 *
 * A cancelled entry leaves no dot. It is still in the list for its day — struck
 * through, because the viewer wants to know it was called off — but a dot that
 * says "something is happening" would be a lie.
 */
export const marksOf = (entries: CalendarEntry[], timeZone: string) => {
  const marks = new Map<number, DayMark>()

  for (const entry of entries) {
    if (entry.status === 'cancelled') continue

    const day = startOfDay(new Date(entry.startsAt), timeZone).getTime()
    const known = marks.get(day) ?? { day, entries: 0, warn: false }

    marks.set(day, {
      day,
      entries: known.entries + 1,
      warn: known.warn || entry.flagged
    })
  }

  return marks
}
