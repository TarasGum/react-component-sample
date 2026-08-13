import { useEffect, useState } from 'react'

import { cn } from '@/lib/cn'

const pad = (value: number) => String(value).padStart(2, '0')

/**
 * Counts down to the server's deadline.
 *
 * Purely a rendering of what the server already decided: the session closes on
 * the next request after the deadline whatever this shows, so a stopped clock in
 * the browser buys nothing.
 */
export function Countdown({ deadlineAt }: { deadlineAt: string }) {
  const [left, setLeft] = useState(() => Date.parse(deadlineAt) - Date.now())

  useEffect(() => {
    const timer = setInterval(() => setLeft(Date.parse(deadlineAt) - Date.now()), 1000)
    return () => clearInterval(timer)
  }, [deadlineAt])

  const total = Math.max(0, Math.floor(left / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)

  // An hour shown as "119:51" reads as two different numbers depending on who
  // is looking; these run two hours, so the hour has to be its own field.
  const shown =
    hours > 0 ? `${hours}:${pad(minutes)}:${pad(total % 60)}` : `${pad(minutes)}:${pad(total % 60)}`

  return (
    <span
      className={cn(
        'text-sm font-bold tabular-nums',
        total < 5 * 60 ? 'text-destructive' : 'text-muted-foreground'
      )}
    >
      {shown}
    </span>
  )
}
