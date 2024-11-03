import { format, parseISO, startOfDay } from 'date-fns'

export function formatDateForDB(date: Date | string): string {
  // Ensure we're working with a Date object
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  // Remove time component and convert to ISO string
  return startOfDay(dateObj).toISOString().split('T')[0]
}

export function formatDateForDisplay(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'MMM d, yyyy')
}

export function isSameDate(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2
  return startOfDay(d1).getTime() === startOfDay(d2).getTime()
} 