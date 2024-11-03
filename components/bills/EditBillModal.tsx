'use client'

import { useState } from 'react'
import { Bill, FrequencyType } from '@/types/bills'
import { updateBill, deleteBill } from '@/services/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { format, parseISO } from 'date-fns'

interface Props {
  bill: Bill
  onClose: () => void
  onUpdate: () => Promise<void>
}

export default function EditBillModal({ bill, onClose, onUpdate }: Props) {
  const { user } = useAuth()
  const [title, setTitle] = useState(bill.title)
  const [amount, setAmount] = useState(bill.amount.toString())
  const [dueDate, setDueDate] = useState(format(parseISO(bill.dueDate), 'yyyy-MM-dd'))
  const [isRecurring, setIsRecurring] = useState(bill.isRecurring)
  const [frequency, setFrequency] = useState<FrequencyType>(bill.frequency || 'monthly')
  const [customFrequencyDays, setCustomFrequencyDays] = useState(bill.customFrequencyDays?.toString() || '')
  const [notes, setNotes] = useState(bill.notes || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || loading) return

    setLoading(true)
    setError(null)

    try {
      const baseBillId = bill.id.split('_')[0];

      await updateBill(user.uid, baseBillId, {
        title,
        amount: parseFloat(amount),
        dueDate,
        isRecurring,
        ...(isRecurring && {
          frequency,
          ...(frequency === 'custom' && {
            customFrequencyDays: parseInt(customFrequencyDays)
          })
        }),
        notes
      });

      await onUpdate()
      onClose()
    } catch (err) {
      console.error('Error updating bill:', err)
      setError('Failed to update bill')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!user || loading || !window.confirm('Are you sure you want to delete this bill?')) return

    setLoading(true)
    setError(null)

    try {
      await deleteBill(user.uid, bill.id)
      await onUpdate()
      onClose()
    } catch (err) {
      console.error('Error deleting bill:', err)
      setError('Failed to delete bill')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Bill</h2>
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
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
            <label className="block text-sm font-medium text-gray-700">Due Date</label>
            <input
              type="date"
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
              className="rounded border-gray-300"
            />
            <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
              Recurring Bill
            </label>
          </div>

          {isRecurring && (
            <div className="space-y-4 pl-6">
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
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Add any notes about this bill..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
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
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
            >
              Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 