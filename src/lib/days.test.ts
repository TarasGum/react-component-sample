import { entriesOn, marksOf } from '@/lib/days'
import { startOfDay } from '@/lib/calendar'
import type { CalendarEntry } from '@/types'

const TZ = 'Europe/Berlin'

const entry = (startsAt: string, over: Partial<CalendarEntry> = {}): CalendarEntry => ({
  id: startsAt,
  startsAt,
  format: 'onsite',
  title: 'Working session',
  status: 'scheduled',
  flagged: false,
  ...over
})

const on = (entries: CalendarEntry[], day: string) =>
  entriesOn(entries, new Date(day), TZ).map(found => found.id)

const markOn = (entries: CalendarEntry[], day: string) =>
  marksOf(entries, TZ).get(startOfDay(new Date(day), TZ).getTime())

describe('the entries of a day', () => {
  // Central Europe moves to summer time on 29 March 2026, so the same
  // wall-clock booking is 16:00 UTC one week and 15:00 UTC the next. Bucketing
  // by a UTC day would put one of them on the wrong date.
  it('keeps a 17:00 entry on its own date on both sides of the clock change', () => {
    const winter = entry('2026-03-23T16:00:00Z')
    const summer = entry('2026-03-30T15:00:00Z')

    expect(on([winter, summer], '2026-03-23T12:00:00Z')).toEqual([winter.id])
    expect(on([winter, summer], '2026-03-30T12:00:00Z')).toEqual([summer.id])
  })

  // 00:30 in Berlin is the previous day in UTC.
  it('counts an entry just after midnight as that day’s', () => {
    const late = entry('2026-08-05T22:30:00Z')

    expect(on([late], '2026-08-06T09:00:00Z')).toEqual([late.id])
    expect(on([late], '2026-08-05T09:00:00Z')).toEqual([])
  })

  it('puts the day in order whatever order it arrived in', () => {
    const evening = entry('2026-08-06T16:00:00Z')
    const morning = entry('2026-08-06T07:00:00Z')

    expect(on([evening, morning], '2026-08-06T12:00:00Z')).toEqual([morning.id, evening.id])
  })
})

describe('the dots on the strip', () => {
  // The entry stays in the day's list, struck through — the viewer wants to know
  // it was called off — but a dot saying "something is happening" would lie.
  it('leaves no dot for a cancelled entry', () => {
    const cancelled = entry('2026-08-06T14:00:00Z', { status: 'cancelled' })

    expect(markOn([cancelled], '2026-08-06T12:00:00Z')).toBeUndefined()
  })

  it('warns on a day where one of two entries is flagged', () => {
    const plain = entry('2026-08-06T07:00:00Z')
    const flagged = entry('2026-08-06T14:00:00Z', { flagged: true })

    expect(markOn([plain, flagged], '2026-08-06T12:00:00Z')).toEqual({
      day: startOfDay(new Date('2026-08-06T12:00:00Z'), TZ).getTime(),
      entries: 2,
      warn: true
    })
  })

  // A flag on an entry that was called off is not a reason to warn: the flag went
  // away with the entry, and the day may have nothing else on it.
  it('ignores a flag on a cancelled entry', () => {
    const cancelled = entry('2026-08-06T14:00:00Z', { status: 'cancelled', flagged: true })
    const plain = entry('2026-08-06T07:00:00Z')

    expect(markOn([cancelled, plain], '2026-08-06T12:00:00Z')).toMatchObject({
      entries: 1,
      warn: false
    })
  })
})
