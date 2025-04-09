import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(amount: number): string {
  if (amount >= 1000000000) {
    const value = (amount / 1000000000).toFixed(2);
    return `Rp. ${value.endsWith('.00') ? value.slice(0, -3) : value.replace(/\.?0+$/, '')}M`;
  } else if (amount >= 1000000) {
    const value = (amount / 1000000).toFixed(2);
    return `Rp. ${value.endsWith('.00') ? value.slice(0, -3) : value.replace(/\.?0+$/, '')}Jt`;
  } else if (amount >= 1000) {
    const value = (amount / 1000).toFixed(2);
    return `Rp. ${value.endsWith('.00') ? value.slice(0, -3) : value.replace(/\.?0+$/, '')}K`;
  }
  const value = amount.toFixed(2);
  return `Rp. ${value.endsWith('.00') ? value.slice(0, -3) : value.replace(/\.?0+$/, '')}`;
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
