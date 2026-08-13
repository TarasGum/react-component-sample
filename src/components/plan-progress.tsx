import { cn } from '@/lib/cn'
import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress'

type PlanProgressProps = {
  /** Done so far. */
  done: number
  /** The agreed target, or zero when none was set. */
  plan: number
  label?: string
  className?: string
}

/**
 * "23 / 30" — how far through an agreed plan something is.
 *
 * Renders nothing without a plan: a bar out of zero reads as no progress at all,
 * which is the opposite of what an unset target means. The accent colour is
 * reserved for progress and nothing else, which is what keeps it legible as a
 * reward rather than as chrome.
 */
export const PlanProgress = ({ done, plan, label = 'Progress', className }: PlanProgressProps) => {
  if (plan <= 0) return null

  const value = Math.min(100, Math.round((done / plan) * 100))

  return (
    <div className={cn('space-y-2', className)}>
      <div className='flex justify-between gap-3 text-sm font-semibold'>
        <span>{label}</span>
        <span className='text-muted-foreground tabular-nums'>
          {done} / {plan}
        </span>
      </div>
      <Progress value={value}>
        <ProgressTrack className='h-2.5'>
          <ProgressIndicator className='bg-progress rounded-full' />
        </ProgressTrack>
      </Progress>
    </div>
  )
}
