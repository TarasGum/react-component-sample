import { useEffect, useRef } from 'react'

import { cn } from '@/lib/cn'
import { addDays, formatDayNumber, startOfDay, weekdayIndex } from '@/lib/calendar'
import type { DayMark } from '@/lib/days'

const DAY_LABEL = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

/**
 * The dates, as a strip that scrolls sideways.
 *
 * This replaced a week grid: seven columns of hours told somebody with two
 * entries a week almost nothing, and it was the widest thing on the screen. A
 * strip is what a phone is shaped like — the thumb flicks through weeks, the
 * selected day comes to the middle, and a dot says which days are worth looking
 * at before anything is tapped.
 */
export const DayStrip = ({
  from,
  days,
  selected,
  today,
  marks,
  timeZone,
  onSelect
}: {
  /** First day of the strip; it runs `days` days from here. */
  from: Date
  days: number
  selected: Date
  today: Date
  marks: Map<number, DayMark>
  /** The calendar's own timezone, never the browser's. */
  timeZone: string
  onSelect: (day: Date) => void
}) => {
  const activeRef = useRef<HTMLButtonElement>(null)
  const selectedDay = startOfDay(selected, timeZone).getTime()
  const todayDay = startOfDay(today, timeZone).getTime()

  // The selection is followed rather than left where it was: picking a date in
  // the month view can land weeks away, and a highlight off-screen reads as
  // nothing having happened. `block: 'nearest'` keeps the page still — only the
  // strip moves.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [selectedDay])

  return (
    <div
      className='-mx-1 flex snap-x snap-mandatory gap-1.5 overflow-x-auto px-1 pb-1'
      role='group'
      aria-label='Dates'
    >
      {Array.from({ length: days }, (_, index) => {
        const date = startOfDay(addDays(from, index, timeZone), timeZone)
        const key = date.getTime()
        const mark = marks.get(key)
        const isSelected = key === selectedDay
        const isToday = key === todayDay
        // The calendar's weekday, not the browser's: two people in different
        // zones must see the same letter above the same number.
        const weekday = DAY_LABEL[weekdayIndex(date, timeZone)]

        return (
          <button
            key={key}
            ref={isSelected ? activeRef : undefined}
            type='button'
            aria-pressed={isSelected}
            aria-current={isToday ? 'date' : undefined}
            onClick={() => onSelect(date)}
            className={cn(
              'coarse:w-14 coarse:py-2.5 flex w-12 shrink-0 snap-center flex-col items-center gap-0.5 rounded-xl border py-2 text-sm font-bold tabular-nums',
              isSelected
                ? 'border-accent bg-accent text-paper'
                : isToday
                  ? 'border-accent bg-card'
                  : mark
                    ? 'border-border bg-muted'
                    : 'border-border bg-card text-muted-foreground'
            )}
          >
            <span
              className={cn(
                'text-[11px] leading-none font-semibold',
                isSelected ? 'text-paper/70' : 'text-muted-foreground'
              )}
            >
              {weekday}
            </span>
            {formatDayNumber(date, timeZone)}
            {/* A dot rather than a count: the number of entries on one day is one
                or two, and the question the strip answers is "is there anything
                that day at all". Red when one of them needs attention. */}
            <span
              className={cn(
                'size-1.5 rounded-full',
                !mark
                  ? 'bg-transparent'
                  : mark.warn
                    ? 'bg-destructive'
                    : isSelected
                      ? 'bg-paper'
                      : 'bg-accent'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
