import { Moon, Sun } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'

import { Countdown } from '@/components/countdown'
import { DayStrip } from '@/components/day-strip'
import { PlanProgress } from '@/components/plan-progress'
import { QuestionView } from '@/components/question-view'
import { Button } from '@/components/ui/button'
import { CALENDAR_TIME_ZONE as TZ, ENTRIES, NOW, QUESTIONS } from '@/demo-data'
import { addDays, formatDayLong, formatTime, startOfDay } from '@/lib/calendar'
import { cn } from '@/lib/cn'
import { entriesOn, marksOf } from '@/lib/days'
import type { CalendarEntry, Question } from '@/types'

const STRIP_START = addDays(NOW, -2, TZ)
const STRIP_DAYS = 21

export const App = () => (
  <div className='mx-auto max-w-2xl px-4 py-8 sm:py-12'>
    <Header />

    <div className='mt-10 space-y-10'>
      <Section
        title='Date strip'
        note='A week grid of hours told somebody with two entries a week almost nothing, and it was
              the widest thing on the screen. The thumb flicks through weeks; a dot says which days
              are worth a tap. Every date is computed in the calendar’s own timezone, so two people
              in different zones see the same day.'
      >
        <Schedule />
      </Section>

      <Section
        title='Question'
        note='One component for the three kinds of question, in both states: open, and submitted.
              On the results screen only two rows are ever coloured — the answer given and the right
              one. Formulas stay LaTeX rather than becoming pictures, so they reflow on a phone and
              stay legible in the dark.'
      >
        <Quiz />
      </Section>

      <Section
        title='Clock and progress'
        note='Both are renderings of something the server already decided: the deadline, and the
              agreed target. Neither invents a number of its own.'
      >
        <Summary />
      </Section>
    </div>

    <footer className='text-muted-foreground mt-12 text-sm'>
      Four components taken out of a production app, with their tests. The data on this page is
      fixtures; there is no server behind it.
    </footer>
  </div>
)

const Header = () => {
  const [dark, setDark] = useState(false)

  const toggle = () => {
    setDark(!dark)
    document.documentElement.classList.toggle('dark', !dark)
  }

  return (
    <header className='flex items-start justify-between gap-4'>
      <div>
        <h1 className='text-2xl sm:text-3xl'>Component sample</h1>
        <p className='text-muted-foreground mt-2 text-sm'>
          React, TypeScript, Tailwind — four components and the tests that guard them.
        </p>
      </div>
      <Button
        variant='outline'
        size='icon'
        aria-label={dark ? 'Switch to light' : 'Switch to dark'}
        onClick={toggle}
      >
        {dark ? <Sun /> : <Moon />}
      </Button>
    </header>
  )
}

const Section = ({
  title,
  note,
  children
}: {
  title: string
  note: string
  children: ReactNode
}) => (
  <section className='space-y-3'>
    <h2 className='text-lg'>{title}</h2>
    <p className='text-muted-foreground max-w-prose text-sm'>{note}</p>
    <div className='bg-card rounded-2xl border p-4 shadow-sm sm:p-5'>{children}</div>
  </section>
)

const Schedule = () => {
  const [selected, setSelected] = useState(() => startOfDay(NOW, TZ))
  const marks = useMemo(() => marksOf(ENTRIES, TZ), [])
  const entries = useMemo(() => entriesOn(ENTRIES, selected, TZ), [selected])

  return (
    <div className='space-y-4'>
      <DayStrip
        from={STRIP_START}
        days={STRIP_DAYS}
        selected={selected}
        today={NOW}
        marks={marks}
        timeZone={TZ}
        onSelect={setSelected}
      />

      <div className='space-y-2'>
        <h3 className='text-sm font-bold'>{formatDayLong(selected, TZ)}</h3>

        {entries.length === 0 ? (
          <p className='text-muted-foreground text-sm'>Nothing on this day.</p>
        ) : (
          entries.map(entry => <EntryRow key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  )
}

const EntryRow = ({ entry }: { entry: CalendarEntry }) => {
  const cancelled = entry.status === 'cancelled'

  return (
    <div className='bg-muted/60 flex items-center gap-3 rounded-xl px-3 py-2.5'>
      <span className={cn('text-sm font-bold tabular-nums', cancelled && 'line-through')}>
        {formatTime(new Date(entry.startsAt), TZ)}
      </span>
      <span className={cn('flex-1 text-sm', cancelled && 'text-muted-foreground line-through')}>
        {entry.title ?? 'Session'}
      </span>
      {entry.flagged && (
        <span className='text-destructive text-xs font-bold whitespace-nowrap'>
          needs attention
        </span>
      )}
      <span
        className={cn(
          'rounded-md px-2 py-0.5 text-xs font-bold whitespace-nowrap',
          entry.format === 'remote'
            ? 'bg-remote text-remote-foreground'
            : 'bg-onsite text-onsite-foreground'
        )}
      >
        {entry.format === 'remote' ? 'remote' : 'on site'}
      </span>
    </div>
  )
}

const Quiz = () => {
  const [current, setCurrent] = useState(0)
  const [finished, setFinished] = useState(false)
  const [given, setGiven] = useState<Record<string, Question['given']>>(() =>
    Object.fromEntries(QUESTIONS.map(question => [question.id, question.given]))
  )

  const question = QUESTIONS[current]!

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-3'>
        <div className='flex gap-1.5'>
          {QUESTIONS.map((item, index) => (
            <button
              key={item.id}
              type='button'
              aria-label={`Question ${item.position}`}
              aria-pressed={index === current}
              onClick={() => setCurrent(index)}
              className={cn(
                'coarse:size-11 size-8 shrink-0 rounded-lg border text-sm font-bold tabular-nums',
                index === current
                  ? 'border-accent bg-accent text-paper'
                  : given[item.id] !== null
                    ? 'border-border bg-muted'
                    : 'border-border bg-card text-muted-foreground'
              )}
            >
              {item.position}
            </button>
          ))}
        </div>

        <Button variant='secondary' size='sm' onClick={() => setFinished(!finished)}>
          {finished ? 'Reopen' : 'Submit'}
        </Button>
      </div>

      <QuestionView
        // Keyed so the numeric field starts from this question's own answer.
        key={question.id}
        question={{ ...question, given: given[question.id] ?? null }}
        finished={finished}
        onAnswer={value => setGiven(all => ({ ...all, [question.id]: value }))}
      />
    </div>
  )
}

const Summary = () => (
  <div className='space-y-5'>
    <div className='flex items-center justify-between gap-3'>
      <span className='text-sm font-bold'>Quiz · 22 questions</span>
      <span className='flex items-center gap-2'>
        <span className='text-muted-foreground text-xs font-semibold uppercase'>left</span>
        <Countdown deadlineAt={new Date(Date.now() + 115 * 60_000).toISOString()} />
      </span>
    </div>

    <PlanProgress done={23} plan={30} label='Sessions completed' />

    {/* The same component with `plan={0}` renders nothing at all — an empty
        track reads as "no progress", which is the opposite of "no target set". */}
    <PlanProgress done={4} plan={0} label='No agreed target' />

    <p className='text-muted-foreground text-xs'>
      A second bar is mounted under this one, for a plan with no agreed target. It draws nothing on
      purpose: an empty track reads as “no progress”, which is not what “no target” means.
    </p>
  </div>
)
