import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        local: 'border-transparent bg-[hsl(var(--local))] text-white',
        foreign: 'border-transparent bg-[hsl(var(--foreign))] text-white',
        gain: 'border-transparent bg-[hsl(var(--gain))] text-white',
        loss: 'border-transparent bg-[hsl(var(--loss))] text-white',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, className }))} {...props} />
}
