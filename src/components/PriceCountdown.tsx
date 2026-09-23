import { useEffect, useState } from 'react'

const DEADLINE = import.meta.env.VITE_EARLY_BIRD_DEADLINE || '2026-12-31T23:59:59+07:00'

function getRemaining() {
  const diff = new Date(DEADLINE).getTime() - Date.now()
  if (diff <= 0) return null
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

export function PriceCountdown() {
  const [remaining, setRemaining] = useState(getRemaining)

  useEffect(() => {
    const interval = setInterval(() => setRemaining(getRemaining()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!remaining) return null

  const units = [
    { value: remaining.days, label: 'Hari' },
    { value: remaining.hours, label: 'Jam' },
    { value: remaining.minutes, label: 'Menit' },
    { value: remaining.seconds, label: 'Detik' },
  ]

  return (
    <div className="flex justify-center gap-3">
      {units.map((u) => (
        <div key={u.label} className="flex w-16 flex-col items-center rounded-lg bg-secondary py-2">
          <span className="font-mono text-xl font-bold tabular-nums">
            {String(u.value).padStart(2, '0')}
          </span>
          <span className="text-[10px] uppercase text-muted-foreground">{u.label}</span>
        </div>
      ))}
    </div>
  )
}
