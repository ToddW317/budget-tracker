import { 
    addDays, 
    addWeeks, 
    addMonths, 
    addYears, 
    parseISO, 
    isBefore,
    getDate,
    setDate,
    endOfMonth,
    format 
  } from 'date-fns';
import { Bill, Income, FrequencyType } from '@/types/bills';
import { formatDateForDB } from './dates';

// Calculate next date based on frequency
export const calculateNextDate = (
  currentDate: string,
  frequency: FrequencyType,
  customDays?: number
): string => {
  // Add one day to the initial date to account for timezone conversion
  const date = addDays(parseISO(currentDate), 1);
  const dayOfMonth = getDate(date);
  
  let nextDate: Date;
  
  switch (frequency) {
    case 'weekly':
      nextDate = addWeeks(date, 1);
      break;
      
    case 'biweekly':
      nextDate = addWeeks(date, 2);
      break;
      
    case 'monthly': {
      // First add a month
      nextDate = addMonths(date, 1);
      
      // Explicitly set the same day of month
      const lastDayOfMonth = endOfMonth(nextDate).getDate();
      const targetDay = Math.min(dayOfMonth, lastDayOfMonth);
      nextDate = setDate(nextDate, targetDay);
      break;
    }
      
    case 'quarterly': {
      // First add three months
      nextDate = addMonths(date, 3);
      
      // Explicitly set the same day of month
      const lastDayOfMonth = endOfMonth(nextDate).getDate();
      const targetDay = Math.min(dayOfMonth, lastDayOfMonth);
      nextDate = setDate(nextDate, targetDay);
      break;
    }
      
    case 'yearly':
      nextDate = addYears(date, 1);
      break;
      
    case 'custom':
      nextDate = addDays(date, customDays || 0);
      break;
      
    default:
      return currentDate;
  }

  return formatDateForDB(nextDate);
};

// Generate future occurrences for a bill
export const generateFutureBillOccurrences = (
  bill: Bill,
  monthsAhead: number = 12
): Bill[] => {
  if (!bill.isRecurring || !bill.frequency) return [bill];

  const occurrences: Bill[] = [bill]; // Include the original bill
  const startDate = parseISO(bill.dueDate);
  const originalDayOfMonth = getDate(startDate);
  const endDate = addMonths(new Date(), monthsAhead);
  let currentDate = startDate;
  
  while (isBefore(currentDate, endDate)) {
    let nextDate: Date;
    
    switch (bill.frequency) {
      case 'monthly': {
        // Add one month and preserve the day
        nextDate = addMonths(currentDate, 1);
        const nextDayOfMonth = getDate(nextDate);
        
        // If the day changed (due to month length differences), adjust it
        if (nextDayOfMonth !== originalDayOfMonth) {
          const lastDayOfMonth = endOfMonth(nextDate).getDate();
          const targetDay = Math.min(originalDayOfMonth, lastDayOfMonth);
          nextDate = setDate(nextDate, targetDay);
        }
        break;
      }
      case 'biweekly':
        nextDate = addWeeks(currentDate, 2);
        break;
      case 'weekly':
        nextDate = addWeeks(currentDate, 1);
        break;
      case 'quarterly': {
        nextDate = addMonths(currentDate, 3);
        const nextDayOfMonth = getDate(nextDate);
        
        if (nextDayOfMonth !== originalDayOfMonth) {
          const lastDayOfMonth = endOfMonth(nextDate).getDate();
          const targetDay = Math.min(originalDayOfMonth, lastDayOfMonth);
          nextDate = setDate(nextDate, targetDay);
        }
        break;
      }
      case 'yearly':
        nextDate = addYears(currentDate, 1);
        break;
      case 'custom':
        nextDate = addDays(currentDate, bill.customFrequencyDays || 0);
        break;
      default:
        nextDate = currentDate;
    }

    if (isBefore(startDate, nextDate)) {
      const nextDateString = formatDateForDB(nextDate); // nextDate is already a Date object
      const nextNextDate = calculateNextDate(nextDateString, bill.frequency, bill.customFrequencyDays);
      
      occurrences.push({
        ...bill,
        virtualId: `${bill.id}_${nextDateString}`,
        id: bill.id,
        dueDate: nextDateString,
        isPaid: false,
        lastPaid: null,
        nextDueDate: nextNextDate
      });
    }
    
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