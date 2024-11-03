export type FrequencyType = 
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'custom';

export interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  lastPaid: string | null;
  isRecurring: boolean;
  frequency?: FrequencyType;
  customFrequencyDays?: number; // For custom frequency in days
  category?: string; // Optional category for the bill
  nextDueDate?: string; // Calculated next due date
  notes?: string;
}

export interface Income {
  id: string;
  source: string;
  amount: number;
  receiveDate: string;
  isRecurring: boolean;
  frequency?: FrequencyType;
  customFrequencyDays?: number;
  nextReceiveDate?: string;
  notes?: string;
}

export interface Category {
  id: string
  name: string
  budget: number
  spent: number
}

export interface Expense {
  id: string
  categoryId: string
  amount: number
  description: string
  date: string
  billId?: string // Reference to the bill if this expense was created from a bill payment
} 