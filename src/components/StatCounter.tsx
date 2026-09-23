import { formatCompactNumber } from '@/lib/utils'

export function StatCounter({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-extrabold text-primary sm:text-4xl">
        {formatCompactNumber(value)}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  )
}
