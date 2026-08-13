import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

import { QuestionView } from '@/components/question-view'
import type { Question } from '@/types'

const question = (over: Partial<Question> = {}): Question => ({
  id: 'q1',
  position: 1,
  kind: 'single',
  text: 'How many?',
  imageUrls: [],
  maxPoints: 1,
  options: [
    { label: 'A', text: '7' },
    { label: 'B', text: '9' },
    { label: 'C', text: '14' }
  ],
  given: null,
  answer: 'B',
  pointsAwarded: null,
  ...over
})

/** Rows carry their verdict in the border colour; this reads it back. */
const colours = () =>
  screen
    .getAllByRole('button')
    .map(row =>
      row.className.includes('border-sage')
        ? 'green'
        : row.className.includes('border-destructive')
          ? 'red'
          : 'plain'
    )

const show = (over: Partial<Question>) =>
  render(<QuestionView question={question(over)} finished onAnswer={() => {}} />)

describe('the results screen colours only what matters', () => {
  // The bug this exists for: every option the user did not pick was
  // reddened, which says "three mistakes" about a question with one answer.
  it('reddens the wrong answer they gave and greens the right one', () => {
    show({ given: 'A' })

    expect(colours()).toEqual(['red', 'green', 'plain'])
  })

  it('greens their answer when it was right, and reddens nothing', () => {
    show({ given: 'B' })

    expect(colours()).toEqual(['plain', 'green', 'plain'])
  })

  it('shows only the key when they answered nothing', () => {
    show({ given: null })

    expect(colours()).toEqual(['plain', 'green', 'plain'])
  })

  it('says which row was theirs, for anyone who cannot tell the colours apart', () => {
    show({ given: 'A' })

    expect(screen.getByText('your answer')).toBeInTheDocument()
  })
})

describe('while the quiz is still open', () => {
  it('marks the chosen option without saying whether it is right', () => {
    render(
      <QuestionView question={question({ given: 'A' })} finished={false} onAnswer={() => {}} />
    )

    expect(colours()).toEqual(['plain', 'plain', 'plain'])
    expect(screen.getByText('chosen')).toBeInTheDocument()
  })
})

const matching = (over: Partial<Question> = {}) =>
  question({
    kind: 'matching',
    maxPoints: 2,
    options: {
      left: [
        { label: '1', text: 'sine' },
        { label: '2', text: 'cosine' }
      ],
      right: [
        { label: 'A', text: '$0$' },
        { label: 'B', text: '$1$' }
      ]
    },
    given: null,
    answer: { '1': 'A', '2': 'B' },
    ...over
  })

const cellState = (label: string) => {
  const cell = screen.getByLabelText(label)

  return cell.className.includes('border-sage')
    ? 'green'
    : cell.className.includes('border-destructive')
      ? 'red'
      : 'plain'
}

describe('a matching question', () => {
  it('keeps the rows already answered when they answer another', async () => {
    const answers: unknown[] = []
    render(
      <QuestionView
        question={matching({ given: { '1': 'A' } })}
        finished={false}
        onAnswer={value => answers.push(value)}
      />
    )

    await userEvent.click(screen.getByLabelText('2 → B'))

    // The whole map goes back, not the one pair that changed: the server stores
    // the answer to the question, and a half-map would erase row 1.
    expect(answers).toEqual([{ '1': 'A', '2': 'B' }])
  })

  // Two rows, two verdicts on the same screen — a question worth two points can
  // be half right, and colouring it one way or the other would be a lie.
  it('scores each row on its own', () => {
    render(
      <QuestionView
        question={matching({ given: { '1': 'B', '2': 'B' } })}
        finished
        onAnswer={() => {}}
      />
    )

    expect(cellState('1 → A')).toBe('green')
    expect(cellState('1 → B')).toBe('red')
    expect(cellState('2 → B')).toBe('green')
    expect(cellState('2 → A')).toBe('plain')
  })
})

/** The parent the real screen is: an answer goes to the server and comes back. */
const Quiz = ({
  onAnswer,
  answer = '-3.5'
}: {
  onAnswer: (value: string) => void
  answer?: string
}) => {
  const [given, setGiven] = useState<string | null>(null)

  return (
    <QuestionView
      question={question({ kind: 'numeric', options: null, answer, given })}
      finished={false}
      onAnswer={value => {
        setGiven(value as string)
        onAnswer(value as string)
      }}
    />
  )
}

const field = () => screen.getByPlaceholderText('Answer')

describe('a numeric answer', () => {
  // The keypad iOS gives `inputMode="decimal"` has a comma and no minus, so
  // without this button a negative answer cannot be typed on a phone at all.
  it('can be made negative without a minus key', async () => {
    render(<Quiz onAnswer={() => {}} />)

    await userEvent.type(field(), '3.5')
    await userEvent.click(screen.getByLabelText('Minus'))

    expect(field()).toHaveValue('-3.5')

    await userEvent.click(screen.getByLabelText('Minus'))
    expect(field()).toHaveValue('3.5')
  })

  it('is not sent while it is only a minus sign', async () => {
    const answers: string[] = []
    render(<Quiz onAnswer={value => answers.push(value)} answer='-7' />)

    await userEvent.click(screen.getByLabelText('Minus'))
    await userEvent.click(document.body)

    expect(answers).toEqual([])
  })

  // Three keystrokes were three writes, and three writes can land out of order —
  // which is how "228" was once recorded as "22".
  it('sends the number once the typing stops, not once per digit', async () => {
    const answers: string[] = []
    render(<Quiz onAnswer={value => answers.push(value)} answer='228' />)

    await userEvent.type(field(), '228')
    // Leaving the field is the stronger signal; tapping any button blurs first,
    // so the answer is on its way before the tap lands.
    await userEvent.click(document.body)

    expect(answers).toEqual(['228'])
  })
})
