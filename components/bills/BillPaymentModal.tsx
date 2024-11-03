'use client'

import { useState } from 'react'
import { Bill } from '@/types/bills'
import CategorySelector from '@/components/CategorySelector'
import { toggleBillPaid } from '@/services/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Category } from '@/components/BudgetDashboard'

interface Props {
  bill: Bill
  onClose: () => void
  onSuccess: () => void
}

export default function BillPaymentModal({ bill, onClose, onSuccess }: Props) {
  const { user } = useAuth()
  const [categoryId, setCategoryId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !categoryId) return

    setLoading(true)
    setError(null)
    try {
      await toggleBillPaid(user.uid, bill.id, bill, categoryId)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error marking bill as paid:', error)
      setError('Failed to mark bill as paid. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleNewCategory = (category: Category) => {
    setCategoryId(category.id)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Mark Bill as Paid</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <p className="text-sm text-gray-600 mb-2">
              Select a category to track this expense:
            </p>
            <CategorySelector
              value={categoryId}
              onChange={setCategoryId}
              onAddNewCategory={handleNewCategory}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !categoryId}
              className={`px-4 py-2 rounded-lg ${
                loading || !categoryId
                  ? 'bg-gray-400'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              {loading ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 