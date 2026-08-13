import { render, screen } from '@testing-library/react'

import { PlanProgress } from '@/components/plan-progress'

const bar = () => document.querySelector('[data-slot="progress"]')

describe('the progress bar', () => {
  // A bar out of zero draws an empty track, which reads as "no progress" — the
  // opposite of what an unset target means. Nothing is the honest rendering.
  it('draws nothing when no target has been agreed', () => {
    render(<PlanProgress done={7} plan={0} />)

    expect(bar()).toBeNull()
    expect(screen.queryByText(/7/)).not.toBeInTheDocument()
  })

  it('shows the two numbers as well as the fill', () => {
    render(<PlanProgress done={23} plan={30} />)

    expect(screen.getByText('23 / 30')).toBeInTheDocument()
    expect(bar()).toHaveAttribute('aria-valuenow', '77')
  })

  // Past the plan the bar has nowhere further to go, and an overfilled track
  // would spill out of its corner radius — but the real count still has to show.
  it('caps the fill once the plan is passed, without hiding the real count', () => {
    render(<PlanProgress done={34} plan={30} />)

    expect(bar()).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByText('34 / 30')).toBeInTheDocument()
  })
})
