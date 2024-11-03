export type FrequencyType = 'daily' | 'bi-weekly' | 'monthly' | 'quarterly' | 'semi-annually' | 'annually' | 'custom'

export interface Bill {
  id: string
  title: string
  amount: number
  dueDate: string
  frequency: FrequencyType
  category: string
  description?: string
  customRepeatDays?: number
  lastPaid?: string
  isPaid?: boolean
}

export interface Income {
  id: string
  source: string
  amount: number
  frequency: FrequencyType
  receiveDate: string
  description?: string
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