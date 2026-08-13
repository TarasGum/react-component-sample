import { Minus } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Formula } from '@/components/formula'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/cn'
import type { Option, Question } from '@/types'

const KIND_LABEL = {
  single: 'One answer',
  matching: 'Matching',
  numeric: 'Numeric answer'
} as const

type QuestionViewProps = {
  question: Question
  /** Read-only once the quiz is submitted; the key is shown instead. */
  finished: boolean
  onAnswer: (value: string | Record<string, string>) => void
}

export const QuestionView = ({ question, finished, onAnswer }: QuestionViewProps) => (
  <div className='space-y-4'>
    <div className='text-muted-foreground text-xs font-bold tracking-[0.08em] uppercase'>
      {KIND_LABEL[question.kind]}
      {question.maxPoints > 1 && ` · ${question.maxPoints} points`}
    </div>

    <Formula className='block leading-relaxed'>{question.text}</Formula>

    {question.imageUrls.map(url => (
      <img key={url} src={url} alt='' className='max-w-full rounded-lg' />
    ))}

    {question.kind === 'single' && (
      <SingleChoice question={question} finished={finished} onAnswer={onAnswer} />
    )}
    {question.kind === 'matching' && (
      <Matching question={question} finished={finished} onAnswer={onAnswer} />
    )}
    {question.kind === 'numeric' && (
      // Keyed: the field holds what is being typed, and that has to start over
      // on the next question rather than follow the user to it.
      <Numeric key={question.id} question={question} finished={finished} onAnswer={onAnswer} />
    )}
  </div>
)

/**
 * How one option looks on the results screen.
 *
 * Only two options are ever coloured: the one that was picked and the right one.
 * Reddening every option the user did not pick says "four mistakes" about a
 * question with one answer, and buries the single line that matters.
 */
type OptionState = 'plain' | 'chosen' | 'correct' | 'wrong'

const optionStateOf = ({
  finished,
  chosen,
  isKey
}: {
  finished: boolean
  chosen: boolean
  isKey: boolean
}): OptionState => {
  // Before the quiz is submitted nothing is right or wrong yet — a highlight
  // would answer the question for the user.
  if (!finished) return chosen ? 'chosen' : 'plain'
  if (isKey) return 'correct'

  return chosen ? 'wrong' : 'plain'
}

const OPTION_ROW: Record<OptionState, string> = {
  plain: 'border-border bg-card',
  chosen: 'border-accent bg-muted',
  correct: 'border-sage bg-sage/10',
  wrong: 'border-destructive bg-destructive/10'
}

const optionRow = (state: OptionState) =>
  cn(
    'coarse:min-h-14 flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left',
    OPTION_ROW[state]
  )

const marker = (label: string) => (
  <span className='bg-muted flex size-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold'>
    {label}
  </span>
)

/** The answer as a record, whatever shape the field arrived in. */
const asRecord = (value: string | Record<string, string> | null) =>
  typeof value === 'object' && value !== null ? value : null

function SingleChoice({ question, finished, onAnswer }: QuestionViewProps) {
  const options = (question.options ?? []) as Option[]
  const given = typeof question.given === 'string' ? question.given : null
  const key = typeof question.answer === 'string' ? question.answer : null

  return (
    <div className='space-y-2'>
      {options.map(option => {
        const chosen = given === option.label
        const state = optionStateOf({
          finished,
          chosen,
          isKey: key !== null && option.label === key
        })

        return (
          <button
            key={option.label}
            disabled={finished}
            onClick={() => onAnswer(option.label)}
            className={optionRow(state)}
          >
            {marker(option.label)}
            <Formula className='flex-1'>{option.text}</Formula>
            {chosen && !finished && <span className='text-muted-foreground text-xs'>chosen</span>}
            {/* Which of the two coloured rows is theirs, for anyone who cannot
                tell the colours apart. */}
            {finished && chosen && (
              <span className='text-muted-foreground shrink-0 text-xs'>your answer</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function Matching({ question, finished, onAnswer }: QuestionViewProps) {
  const columns = question.options as { left: Option[]; right: Option[] } | null
  const given = asRecord(question.given) ?? {}
  const key = asRecord(question.answer)

  if (!columns) return null

  return (
    <div className='space-y-4'>
      <div className='space-y-1.5'>
        {columns.right.map(option => (
          <div key={option.label} className='flex items-start gap-3 text-sm'>
            {marker(option.label)}
            <Formula className='flex-1 pt-1'>{option.text}</Formula>
          </div>
        ))}
      </div>

      <div className='space-y-3'>
        {columns.left.map(row => (
          <div key={row.label} className='space-y-1.5'>
            <div className='flex items-start gap-3'>
              {marker(row.label)}
              <Formula className='flex-1 pt-1'>{row.text}</Formula>
            </div>

            <div className='flex flex-wrap gap-1.5 pl-10'>
              {columns.right.map(option => {
                const chosen = given[row.label] === option.label
                const state = optionStateOf({
                  finished,
                  chosen,
                  isKey: key !== null && option.label === key[row.label]
                })

                return (
                  <button
                    key={option.label}
                    disabled={finished}
                    aria-label={`${row.label} → ${option.label}`}
                    onClick={() => onAnswer({ ...given, [row.label]: option.label })}
                    className={cn(
                      'coarse:size-11 size-9 rounded-lg border text-sm font-bold',
                      OPTION_ROW[state]
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Long enough that "228" is one save rather than three, short enough that
 * somebody who types and immediately reaches for the submit button has already
 * had their answer sent.
 */
const TYPING_PAUSE_MS = 400

function Numeric({ question, finished, onAnswer }: QuestionViewProps) {
  const given = typeof question.given === 'string' ? question.given : ''
  const key = typeof question.answer === 'string' ? question.answer : null

  // Typed locally and sent on a pause: a request per keystroke is three writes
  // for a three-digit answer, and three writes can land out of order — which
  // would record "22" as the answer to a question answered "228".
  //
  // Reset by remounting rather than by an effect: the caller keys this on the
  // question, so moving to the next one starts from that question's own answer.
  const [typed, setTyped] = useState(given)

  // A lone "-" is a number half typed, not an answer.
  const flush = (value: string) => {
    if (value !== given && value !== '-') onAnswer(value)
  }

  useEffect(() => {
    if (typed === given || typed === '-') return

    const timer = setTimeout(() => onAnswer(typed), TYPING_PAUSE_MS)
    return () => clearTimeout(timer)
    // `onAnswer` is a fresh closure on every render; the answer is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed, given])

  const shown = finished ? given : typed

  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-2'>
        {/* iOS gives the decimal keypad a comma and no minus, so a negative
            answer is impossible to type — this is the minus. Always shown, for
            every numeric question: offering it only where the key is negative
            would give the answer away. */}
        <Button
          variant='secondary'
          size='icon'
          aria-label='Minus'
          aria-pressed={shown.startsWith('-')}
          disabled={finished}
          onClick={() =>
            setTyped(current => (current.startsWith('-') ? current.slice(1) : `-${current}`))
          }
          className={cn(shown.startsWith('-') && 'border-accent border')}
        >
          <Minus />
        </Button>

        <Input
          inputMode='decimal'
          value={shown}
          disabled={finished}
          placeholder='Answer'
          onChange={event => setTyped(event.target.value)}
          // Leaving the field is a stronger signal than a pause; tapping any
          // button blurs first, so the answer is on its way before the tap lands.
          onBlur={event => flush(event.target.value)}
          // The same two colours as the options: their own answer, right or wrong.
          className={cn(
            'max-w-40',
            finished && given !== '' && (given === key ? 'border-sage' : 'border-destructive')
          )}
        />
      </div>
      {finished && key && given !== key && (
        <p className='text-muted-foreground text-sm'>
          Correct answer: <span className='text-sage font-bold'>{key}</span>
        </p>
      )}
    </div>
  )
}
