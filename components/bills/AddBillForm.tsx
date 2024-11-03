'use client'

import { useState } from 'react'
import { FrequencyType } from '@/types/bills'
import { useAuth } from '@/contexts/AuthContext'
import { addBill } from '@/services/firebase'
import { formatDateForDB } from '@/utils/dates'

interface Props {
  onSuccess?: (newBill: Bill) => void
}

export default function AddBillForm({ onSuccess }: Props) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [frequency, setFrequency] = useState<FrequencyType>('monthly')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [customRepeatDays, setCustomRepeatDays] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !title || !amount || !dueDate || !frequency) return

    setIsSubmitting(true)
    setError(null)
    try {
      const billData = {
        title,
        amount: parseFloat(amount),
        dueDate: formatDateForDB(new Date(dueDate)),
        frequency,
        category,
        description,
        customRepeatDays: frequency === 'custom' && customRepeatDays 
          ? parseInt(customRepeatDays) 
          : null,
        isPaid: false,
      }

      // Remove undefined/null fields
      const cleanBillData = Object.fromEntries(
        Object.entries(billData).filter(([_, v]) => v != null)
      )

      const newBill = await addBill(user.uid, cleanBillData)
      
      // Reset form
      setTitle('')
      setAmount('')
      setDueDate('')
      setFrequency('monthly')
      setCategory('')
      setDescription('')
      setCustomRepeatDays('')
      
      // Update parent immediately
      onSuccess?.(newBill)
    } catch (error) {
      console.error('Error adding bill:', error)
      setError('Failed to add bill. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border rounded-lg"
          step="0.01"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Due Date
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full p-2 border rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Frequency
        </label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as FrequencyType)}
          className="w-full p-2 border rounded-lg"
          required
        >
          <option value="daily">Daily</option>
          <option value="bi-weekly">Bi-weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="semi-annually">Semi-annually</option>
          <option value="annually">Annually</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {frequency === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Repeat Every (days)
          </label>
          <input
            type="number"
            value={customRepeatDays}
            onChange={(e) => setCustomRepeatDays(e.target.value)}
            className="w-full p-2 border rounded-lg"
            min="1"
            required
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded-lg"
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-2 px-4 rounded-lg ${
          isSubmitting
            ? 'bg-gray-400'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white font-medium transition-colors duration-200`}
      >
        {isSubmitting ? 'Adding...' : 'Add Bill'}
      </button>
    </form>
  )
} 