import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n)
}

export function formatCompactNumber(n: number): string {
  return new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

export function formatPercent(n: number, digits = 2): string {
  return `${n.toFixed(digits)}%`
}

export function formatDateId(dateStr: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr))
}
