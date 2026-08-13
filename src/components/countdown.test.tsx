import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

import { Countdown } from '@/components/countdown'

const NOW = Date.parse('2026-08-13T09:00:00Z')

const inSeconds = (seconds: number) => new Date(NOW + seconds * 1000).toISOString()

const clock = () => screen.getByText(/\d/)

beforeEach(() => {
  vi.useFakeTimers({ now: NOW })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('the clock on a timed session', () => {
  // "119:51" reads as two different numbers depending on who is looking, and a
  // session runs two hours — so the hour is its own field as soon as there is one.
  it('gives the hour a field of its own, and drops it inside the last hour', () => {
    render(<Countdown deadlineAt={inSeconds(2 * 3600 - 9)} />)

    expect(clock()).toHaveTextContent('1:59:51')

    act(() => vi.advanceTimersByTime(3600_000))

    expect(clock()).toHaveTextContent('59:51')
  })

  // The server closes the attempt on the first request after the deadline; until
  // that request, a browser left open must not count into negative time.
  it('stops at zero rather than counting past the deadline', () => {
    render(<Countdown deadlineAt={inSeconds(2)} />)

    act(() => vi.advanceTimersByTime(10_000))

    expect(clock()).toHaveTextContent('00:00')
  })

  it('turns red for the last five minutes', () => {
    render(<Countdown deadlineAt={inSeconds(5 * 60 + 1)} />)

    expect(clock()).not.toHaveClass('text-destructive')

    act(() => vi.advanceTimersByTime(2000))

    expect(clock()).toHaveClass('text-destructive')
  })
})
