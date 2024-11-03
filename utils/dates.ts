import { format, parse, parseISO, startOfDay, addDays } from 'date-fns';

// Convert local date to UTC (stored in DB)
export const localToUTC = (dateString: string): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  return utcDate.toISOString();
};

// Convert UTC to local display date
export const utcToLocal = (utcString: string): string => {
  const date = parseISO(utcString);
  return format(date, 'yyyy-MM-dd');
};

// Get month string from UTC date
export const getMonthFromUTC = (utcString: string): string => {
  const date = new Date(utcString);
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

// Format date for display
export const formatDisplayDate = (utcString: string): string => {
  const date = new Date(utcString);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
};

// Format date for database
export const formatDateForDB = (date: Date | string): string => {
  // If date is a string, convert it to Date object
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  // Create a new date at midnight UTC for the given date
  const utcDate = new Date(Date.UTC(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate(),
    0, // Set to midnight UTC
    0,
    0,
    0
  ));
  return utcDate.toISOString();
};

export function isSameDate(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2
  return startOfDay(d1).getTime() === startOfDay(d2).getTime()
} 