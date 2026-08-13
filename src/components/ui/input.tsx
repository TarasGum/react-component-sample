import { Input as InputPrimitive } from '@base-ui/react/input'
import type * as React from 'react'

import { cn } from '@/lib/cn'

const Input = ({ className, type, ...props }: React.ComponentProps<'input'>) => (
  <InputPrimitive
    type={type}
    data-slot='input'
    className={cn(
      // `text-base` below `md` is not a style choice: iOS Safari zooms into any
      // field under 16px on focus and never zooms back out. `coarse:h-11` is the
      // thumb target, applied by pointer rather than by width.
      'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 coarse:h-11 coarse:text-base h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
      className
    )}
    {...props}
  />
)

export { Input }
