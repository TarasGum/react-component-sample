import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/cn'

const buttonVariants = cva(
  "group/button focus-visible:border-ring focus-visible:ring-ring/50 inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        outline: 'border-border bg-background hover:bg-muted hover:text-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
        ghost: 'hover:bg-muted hover:text-foreground'
      },
      // `coarse:` heights apply on touch pointers only, so the compact desktop
      // proportions this system was drawn with survive a narrow window.
      //
      // Padding stays symmetric even with an icon. The optical trim this came
      // with assumed icons that carry their own whitespace; lucide glyphs fill
      // their box, so the trim just moved the label off centre — 6px against
      // 10px on a fine pointer, 6px against 14px on a touch one.
      size: {
        default: 'coarse:h-11 coarse:px-4 h-8 gap-1.5 px-2.5',
        sm: 'coarse:h-10 coarse:px-3.5 h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem]',
        icon: 'coarse:size-11 size-8'
      }
    },
    defaultVariants: { variant: 'default', size: 'default' }
  }
)

const Button = ({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) => (
  <ButtonPrimitive
    data-slot='button'
    className={cn(buttonVariants({ variant, size, className }))}
    {...props}
  />
)

export { Button, buttonVariants }
