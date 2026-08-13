import { addDays, startOfDay } from '@/lib/calendar'
import type { CalendarEntry, Question } from '@/types'

/** One configured zone for the whole calendar, never the browser's. */
export const CALENDAR_TIME_ZONE = 'Europe/Berlin'

/**
 * The sample runs off a fixed "now" so the page looks the same every time it is
 * opened — including to the Playwright run that checks it.
 */
export const NOW = new Date('2026-08-13T09:20:00Z')

const at = (dayOffset: number, hour: number, minute = 0) => {
  const day = startOfDay(addDays(NOW, dayOffset, CALENDAR_TIME_ZONE), CALENDAR_TIME_ZONE)

  return new Date(day.getTime() + (hour * 60 + minute) * 60_000).toISOString()
}

const entry = (over: Partial<CalendarEntry> & { id: string }): CalendarEntry => ({
  startsAt: at(0, 17),
  format: 'onsite',
  title: null,
  status: 'scheduled',
  flagged: false,
  ...over
})

export const ENTRIES: CalendarEntry[] = [
  entry({ id: 'e1', startsAt: at(-2, 14), status: 'done', title: 'Intake call' }),
  entry({ id: 'e2', startsAt: at(-1, 14), status: 'done', title: 'Review', flagged: true }),
  entry({ id: 'e3', startsAt: at(0, 14), title: 'Working session' }),
  entry({ id: 'e4', startsAt: at(0, 17), format: 'remote', title: 'Follow-up' }),
  entry({ id: 'e5', startsAt: at(2, 14), title: 'Workshop', flagged: true }),
  entry({ id: 'e6', startsAt: at(3, 14), format: 'remote', title: 'Retro', status: 'cancelled' }),
  entry({ id: 'e7', startsAt: at(6, 11), title: 'Planning' }),
  entry({ id: 'e8', startsAt: at(9, 14), title: 'Handover' })
]

export const QUESTIONS: Question[] = [
  {
    id: 'q1',
    position: 1,
    kind: 'single',
    text: 'The sequence $a_n$ is arithmetic with $a_1 = 3$ and $d = 4$. What is $a_{12}$?',
    imageUrls: [],
    maxPoints: 1,
    options: [
      { label: 'A', text: '$44$' },
      { label: 'B', text: '$47$' },
      { label: 'C', text: '$48$' },
      { label: 'D', text: '$51$' }
    ],
    given: 'A',
    answer: 'B',
    pointsAwarded: 0
  },
  {
    id: 'q2',
    position: 2,
    kind: 'matching',
    text: 'Match each function to the value it takes at $x = 0$.',
    imageUrls: [],
    maxPoints: 2,
    options: {
      left: [
        { label: '1', text: '$\\sin x$' },
        { label: '2', text: '$\\cos x$' },
        { label: '3', text: '$e^{x}$' }
      ],
      right: [
        { label: 'A', text: '$0$' },
        { label: 'B', text: '$1$' },
        { label: 'C', text: '$-1$' }
      ]
    },
    given: { '1': 'A', '2': 'C' },
    answer: { '1': 'A', '2': 'B', '3': 'B' },
    pointsAwarded: 1
  },
  {
    id: 'q3',
    position: 3,
    kind: 'numeric',
    text: 'A price of 1 200 was cut by $30\\ \\text{%}$, then by a further 25 %. Write the total discount as a per cent.',
    imageUrls: [],
    maxPoints: 1,
    given: null,
    options: null,
    answer: '47.5',
    pointsAwarded: null
  }
]
