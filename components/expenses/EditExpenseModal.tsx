'use client'

import { useState } from 'react'
import { Expense, Category, Bill } from '@/components/BudgetDashboard'
import { updateExpense, addBill } from '@/services/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { format, parseISO } from 'date-fns'
import { FrequencyType } from '@/types/bills'

interface Props {
  expense: Expense
  category: Category
  onClose: () => void
  onUpdate: () => Promise<void>
}

export default function EditExpenseModal({ expense, category, onClose, onUpdate }: Props) {
  const { user } = useAuth()
  const [description, setDescription] = useState(expense.description)
  const [amount, setAmount] = useState(expense.amount.toString())
  const [date, setDate] = useState(format(parseISO(expense.date), 'yyyy-MM-dd'))
  const [convertToBill, setConvertToBill] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<FrequencyType>('monthly')
  const [customFrequencyDays, setCustomFrequencyDays] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      // Update the expense
      await updateExpense(user.uid, expense.id, {
        description,
        amount: parseFloat(amount),
        date,
        month: format(parseISO(date), 'yyyy-MM')
      })

      // If converting to bill, create a new bill
      if (convertToBill) {
        await addBill(user.uid, {
          title: description,
          amount: parseFloat(amount),
          dueDate: date,
          isPaid: false,
          lastPaid: null,
          isRecurring,
          categoryId: category.id,
          ...(isRecurring && {
            frequency,
            ...(frequency === 'custom' && {
              customFrequencyDays: parseInt(customFrequencyDays)
            })
          }),
        })
      }

      await onUpdate()
      onClose()
    } catch (error) {
      console.error('Error updating expense:', error)
      setError('Failed to update expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Expense</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="convertToBill"
              checked={convertToBill}
              onChange={(e) => setConvertToBill(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="convertToBill" className="text-sm font-medium text-gray-700">
              Convert to Bill
            </label>
          </div>

          {convertToBill && (
            <div className="space-y-4 pl-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
                  Recurring Bill
                </label>
              </div>

              {isRecurring && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Frequency</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as FrequencyType)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  {frequency === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Repeat every X days
                      </label>
                      <input
                        type="number"
                        value={customFrequencyDays}
                        onChange={(e) => setCustomFrequencyDays(e.target.value)}
                        min="1"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        required
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 rounded-md px-4 py-2 text-white ${
                loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 rounded-md px-4 py-2 hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 