import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number, currency = 'UGX') {
  if (currency === 'UGX') {
    return `${amount.toLocaleString()} UGX`
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-UG', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-UG', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))
}

export function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + '...' : str
}
