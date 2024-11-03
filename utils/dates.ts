import { format, parse, parseISO, startOfDay, addDays } from 'date-fns';

// Convert local date to UTC (stored in DB)
export const localToUTC = (dateString: string): string => {
  // Parse the local date string to a Date object
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Create date with UTC noon (12:00) and add a day
  const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  const adjustedDate = addDays(utcDate, 1);
  
  // Return ISO string
  return adjustedDate.toISOString();
};

// Convert UTC to local display date
export const utcToLocal = (utcString: string): string => {
  const date = new Date(utcString);
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
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
export const formatDateForDB = (date: Date): string => {
  const utcDate = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12, // Set to noon UTC
    0,
    0,
    0
  ));
  const adjustedDate = addDays(utcDate, 1); // Add a day to adjust the display
  return adjustedDate.toISOString();
};

export function isSameDate(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2
  return startOfDay(d1).getTime() === startOfDay(d2).getTime()
} 