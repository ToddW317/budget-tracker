'use client'

import { useState } from 'react'
import { Bill, FrequencyType } from '@/types/bills'
import { addBill } from '@/services/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'

interface Props {
  onSuccess: (bill: Bill) => void
}

export default function AddBillForm({ onSuccess }: Props) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'))
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
      const newBill = await addBill(user.uid, {
        title,
        amount: parseFloat(amount),
        dueDate,
        isPaid: false,
        lastPaid: null,
        isRecurring,
        ...(isRecurring && {
          frequency,
          ...(frequency === 'custom' && {
            customFrequencyDays: parseInt(customFrequencyDays)
          })
        })
      })

      onSuccess(newBill)
      
      // Reset form
      setTitle('')
      setAmount('')
      setDueDate(format(new Date(), 'yyyy-MM-dd'))
      setIsRecurring(false)
      setFrequency('monthly')
      setCustomFrequencyDays('')
    } catch (err) {
      setError('Failed to add bill')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Bill Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          required
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Amount
        </label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.01"
          min="0"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          required
        />
      </div>

      <div>
        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
          Due Date
        </label>
        <input
          type="date"
          id="dueDate"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isRecurring"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="rounded border-gray-300 text-blue-600"
        />
        <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
          Recurring Bill
        </label>
      </div>

      {isRecurring && (
        <div className="space-y-4 pl-6">
          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">
              Frequency
            </label>
            <select
              id="frequency"
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
              <label htmlFor="customDays" className="block text-sm font-medium text-gray-700">
                Repeat every X days
              </label>
              <input
                type="number"
                id="customDays"
                value={customFrequencyDays}
                onChange={(e) => setCustomFrequencyDays(e.target.value)}
                min="1"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`w-full rounded-md px-4 py-2 text-white ${
          loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {loading ? 'Adding...' : 'Add Bill'}
      </button>
    </form>
  )
} 