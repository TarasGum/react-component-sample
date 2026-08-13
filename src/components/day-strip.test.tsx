import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { DayStrip } from '@/components/day-strip'
import { marksOf } from '@/lib/days'
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

type StripOptions = {
  from?: string
  days?: number
  selected?: string
  today?: string
  entries?: CalendarEntry[]
  onSelect?: (day: Date) => void
}

const strip = ({
  from = '2026-08-05T22:00:00Z',
  days = 3,
  selected = from,
  today = from,
  entries = [],
  onSelect = () => {}
}: StripOptions = {}) =>
  render(
    <DayStrip
      from={new Date(from)}
      days={days}
      selected={new Date(selected)}
      today={new Date(today)}
      marks={marksOf(entries, TZ)}
      timeZone={TZ}
      onSelect={onSelect}
    />
  )

/** The dot is the only thing the strip says before anything is tapped. */
const dotOf = (button: HTMLElement) => {
  const dot = button.lastElementChild
  if (!dot) throw new Error('a date button always ends with its dot')

  return dot.className.includes('bg-destructive')
    ? 'red'
    : dot.className.includes('bg-transparent')
      ? 'none'
      : 'plain'
}

describe('the dates come from the calendar’s timezone, not the browser’s', () => {
  // 22:00 UTC on 5 August is already 6 August in Berlin. A strip built from the
  // browser's own clock would open on Wednesday the 5th for one viewer and on
  // Thursday the 6th for another — the same tap, two different days.
  it('opens on the calendar’s date when the two disagree', () => {
    strip({ from: '2026-08-05T22:00:00Z' })

    const first = screen.getAllByRole('button')[0]

    expect(first).toHaveTextContent('Thu')
    expect(first).toHaveTextContent('6')
  })

  it('hands back local midnight of the day that was tapped', async () => {
    const picked: Date[] = []
    strip({ from: '2026-08-05T22:00:00Z', onSelect: day => picked.push(day) })

    await userEvent.click(screen.getAllByRole('button')[1]!)

    // Midnight on 7 August in Berlin, which is 22:00 on the 6th in UTC.
    expect(picked.map(day => day.toISOString())).toEqual(['2026-08-06T22:00:00.000Z'])
  })
})

describe('what a date button shows', () => {
  it('marks today and the selection apart', () => {
    strip({ from: '2026-08-05T22:00:00Z', selected: '2026-08-07T09:00:00Z' })

    const [today, selected] = screen.getAllByRole('button')

    expect(today).toHaveAttribute('aria-current', 'date')
    expect(today).toHaveAttribute('aria-pressed', 'false')
    expect(selected).toHaveAttribute('aria-pressed', 'true')
    expect(selected).not.toHaveAttribute('aria-current')
  })

  it('reddens the dot on a flagged day and leaves the rest plain', () => {
    strip({
      from: '2026-08-05T22:00:00Z',
      entries: [entry('2026-08-06T14:00:00Z'), entry('2026-08-07T14:00:00Z', { flagged: true })]
    })

    expect(screen.getAllByRole('button').map(dotOf)).toEqual(['plain', 'red', 'none'])
  })
})
