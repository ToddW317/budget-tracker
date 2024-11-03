import { addDays, addWeeks, addMonths, addYears, parseISO, isBefore } from 'date-fns';
import { Bill, Income, FrequencyType } from '@/types/bills';
import { formatDateForDB } from './dates';

// Calculate next date based on frequency
export const calculateNextDate = (
  currentDate: string,
  frequency: FrequencyType,
  customDays?: number
): string => {
  const date = parseISO(currentDate);
  
  switch (frequency) {
    case 'weekly':
      return formatDateForDB(addWeeks(date, 1));
    case 'biweekly':
      return formatDateForDB(addWeeks(date, 2));
    case 'monthly':
      return formatDateForDB(addMonths(date, 1));
    case 'quarterly':
      return formatDateForDB(addMonths(date, 3));
    case 'yearly':
      return formatDateForDB(addYears(date, 1));
    case 'custom':
      return formatDateForDB(addDays(date, customDays || 0));
    default:
      return currentDate;
  }
};

// Generate future occurrences for a bill
export const generateFutureBillOccurrences = (
  bill: Bill,
  monthsAhead: number = 3
): Bill[] => {
  if (!bill.isRecurring || !bill.frequency) return [bill];

  const occurrences: Bill[] = [];
  let currentDate = bill.lastPaid || bill.dueDate;
  const endDate = addMonths(new Date(), monthsAhead);
  
  while (isBefore(parseISO(currentDate), endDate)) {
    const nextDate = calculateNextDate(currentDate, bill.frequency, bill.customFrequencyDays);
    
    occurrences.push({
      ...bill,
      id: `${bill.id}_${nextDate}`, // Temporary ID for UI purposes
      dueDate: nextDate,
      isPaid: false,
      lastPaid: null,
      nextDueDate: calculateNextDate(nextDate, bill.frequency, bill.customFrequencyDays)
    });
    
    currentDate = nextDate;
  }

  return occurrences;
};

// Generate future occurrences for income
export const generateFutureIncomeOccurrences = (
  income: Income,
  monthsAhead: number = 3
): Income[] => {
  if (!income.isRecurring || !income.frequency) return [income];

  const occurrences: Income[] = [];
  let currentDate = income.receiveDate;
  const endDate = addMonths(new Date(), monthsAhead);
  
  while (isBefore(parseISO(currentDate), endDate)) {
    const nextDate = calculateNextDate(currentDate, income.frequency, income.customFrequencyDays);
    
    occurrences.push({
      ...income,
      id: `${income.id}_${nextDate}`, // Temporary ID for UI purposes
      receiveDate: nextDate,
      nextReceiveDate: calculateNextDate(nextDate, income.frequency, income.customFrequencyDays)
    });
    
    currentDate = nextDate;
  }

  return occurrences;
};

// Get all recurring items for a date range
export const getRecurringItemsForRange = (
  items: (Bill | Income)[],
  startDate: Date,
  endDate: Date
): (Bill | Income)[] => {
  const allOccurrences = items.flatMap(item => {
    if ('dueDate' in item && item.isRecurring) {
      // It's a recurring bill
      return generateFutureBillOccurrences(item as Bill, 12);
    } else if ('receiveDate' in item && item.isRecurring) {
      // It's a recurring income
      return generateFutureIncomeOccurrences(item as Income, 12);
    }
    // Non-recurring items are returned as-is
    return [item];
  });

  return allOccurrences.filter(item => {
    const itemDate = parseISO(
      'dueDate' in item ? item.dueDate : (item as Income).receiveDate
    );
    return isBefore(itemDate, endDate) && isBefore(startDate, itemDate);
  });
};

// Helper to check if a bill/income needs attention
export const needsAttention = (item: Bill | Income): boolean => {
  const today = new Date();
  const itemDate = parseISO('dueDate' in item ? item.dueDate : item.receiveDate);
  
  // If it's within the next 7 days
  const sevenDaysFromNow = addDays(today, 7);
  return isBefore(itemDate, sevenDaysFromNow) && 
    ('isPaid' in item ? !item.isPaid : true);
}; 