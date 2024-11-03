'use client'

import { useState } from 'react'
import { Income, FrequencyType } from '@/types/bills'
import { addIncome, updateIncome, deleteIncome } from '@/services/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { format, parseISO } from 'date-fns'
import { formatDisplayDate } from '@/utils/dates'

interface Props {
  incomes: Income[]
  onUpdate: () => Promise<void>
}

export default function IncomeTracker({ incomes, onUpdate }: Props) {
  const { user } = useAuth()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [source, setSource] = useState('')
  const [amount, setAmount] = useState('')
  const [receiveDate, setReceiveDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<FrequencyType>('monthly')
  const [customFrequencyDays, setCustomFrequencyDays] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || loading) return
    
    setLoading(true)
    setError(null)

    try {
      const incomeData = {
        source,
        amount: parseFloat(amount),
        receiveDate,
        isRecurring,
        ...(isRecurring && {
          frequency,
          ...(frequency === 'custom' && {
            customFrequencyDays: parseInt(customFrequencyDays)
          })
        })
      }

      if (editingId) {
        await updateIncome(user.uid, editingId, incomeData)
      } else {
        await addIncome(user.uid, incomeData)
      }

      await onUpdate()
      resetForm()
    } catch (err) {
      setError('Failed to save income')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (incomeId: string) => {
    if (!user || !window.confirm('Are you sure you want to delete this income?')) return

    try {
      await deleteIncome(user.uid, incomeId)
      await onUpdate()
    } catch (err) {
      console.error('Error deleting income:', err)
    }
  }

  const resetForm = () => {
    setSource('')
    setAmount('')
    setReceiveDate(format(new Date(), 'yyyy-MM-dd'))
    setIsRecurring(false)
    setFrequency('monthly')
    setCustomFrequencyDays('')
    setEditingId(null)
    setShowAddForm(false)
  }

  const handleEdit = (income: Income) => {
    setEditingId(income.id)
    setSource(income.source)
    setAmount(income.amount.toString())
    setReceiveDate(format(parseISO(income.receiveDate), 'yyyy-MM-dd'))
    setIsRecurring(income.isRecurring)
    if (income.frequency) {
      setFrequency(income.frequency)
      if (income.frequency === 'custom' && income.customFrequencyDays) {
        setCustomFrequencyDays(income.customFrequencyDays.toString())
      }
    }
    setShowAddForm(true)
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          {showAddForm ? 'Cancel' : 'Add Income Source'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <label htmlFor="source" className="block text-sm font-medium text-gray-700">
              Income Source
            </label>
            <input
              type="text"
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
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
            <label htmlFor="receiveDate" className="block text-sm font-medium text-gray-700">
              Receive Date
            </label>
            <input
              type="date"
              id="receiveDate"
              value={receiveDate}
              onChange={(e) => setReceiveDate(e.target.value)}
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
              Recurring Income
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
            {loading ? 'Saving...' : editingId ? 'Update Income' : 'Add Income'}
          </button>
        </form>
      )}

      {/* Income List */}
      <div className="space-y-4">
        {incomes.map(income => (
          <div
            key={income.id}
            className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
          >
            <div>
              <h3 className="font-medium">{income.source}</h3>
              <p className="text-sm text-gray-500">
                ${income.amount.toFixed(2)}
                {income.isRecurring && (
                  <span className="ml-2 italic">
                    ({income.frequency}
                    {income.customFrequencyDays && ` every ${income.customFrequencyDays} days`})
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500">
                Receives on {formatDisplayDate(income.receiveDate)}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(income)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(income.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 