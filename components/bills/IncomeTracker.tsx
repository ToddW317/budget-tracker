'use client'

import { useState, useEffect } from 'react'
import { Income, FrequencyType } from '@/types/bills'
import { useAuth } from '@/contexts/AuthContext'
import { addIncome, deleteIncome } from '@/services/firebase'
import { format } from 'date-fns'

interface Props {
  incomes: Income[]
  onSuccess?: () => void
}

export default function IncomeTracker({ incomes: initialIncomes, onSuccess }: Props) {
  const { user } = useAuth()
  const [incomes, setIncomes] = useState<Income[]>(initialIncomes)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newIncome, setNewIncome] = useState({
    source: '',
    amount: '',
    frequency: 'monthly' as FrequencyType,
    receiveDate: '',
    description: ''
  })

  // Update local state when props change
  useEffect(() => {
    setIncomes(initialIncomes)
  }, [initialIncomes])

  const totalMonthlyIncome = incomes.reduce((total, income) => {
    return total + income.amount;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newIncome.source || !newIncome.amount || !newIncome.receiveDate) return

    setLoading(true)
    setError(null)
    try {
      const addedIncome = await addIncome(user.uid, {
        ...newIncome,
        amount: parseFloat(newIncome.amount),
      })

      // Update local state
      setIncomes(prev => [...prev, addedIncome])
      
      setShowAddForm(false)
      setNewIncome({
        source: '',
        amount: '',
        frequency: 'monthly',
        receiveDate: '',
        description: ''
      })
      onSuccess?.()
    } catch (error) {
      console.error('Error adding income:', error)
      setError('Failed to add income. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (incomeId: string) => {
    if (!user || !window.confirm('Are you sure you want to delete this income source?')) return
    setDeleteLoading(incomeId)
    try {
      await deleteIncome(user.uid, incomeId)
      // Update local state
      setIncomes(prev => prev.filter(income => income.id !== incomeId))
      onSuccess?.()
    } catch (error) {
      console.error('Error deleting income:', error)
    } finally {
      setDeleteLoading(null)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Monthly Income</h3>
          <p className="text-2xl font-bold text-green-600">
            ${totalMonthlyIncome.toFixed(2)}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          {showAddForm ? 'Cancel' : '+ Add Income'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-medium text-gray-800 mb-4">Add New Income Source</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source
                </label>
                <input
                  type="text"
                  value={newIncome.source}
                  onChange={(e) => setNewIncome(prev => ({ ...prev, source: e.target.value }))}
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
                  value={newIncome.amount}
                  onChange={(e) => setNewIncome(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  value={newIncome.frequency}
                  onChange={(e) => setNewIncome(prev => ({ ...prev, frequency: e.target.value as FrequencyType }))}
                  className="w-full p-2 border rounded-lg"
                  required
                >
                  <option value="daily">Daily</option>
                  <option value="bi-weekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="semi-annually">Semi-annually</option>
                  <option value="annually">Annually</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receive Date
                </label>
                <input
                  type="date"
                  value={newIncome.receiveDate}
                  onChange={(e) => setNewIncome(prev => ({ ...prev, receiveDate: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={newIncome.description}
                onChange={(e) => setNewIncome(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border rounded-lg"
                rows={2}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 bg-green-500 text-white rounded-lg ${
                  loading ? 'opacity-50' : 'hover:bg-green-600'
                } transition-colors`}
              >
                {loading ? 'Adding...' : 'Add Income Source'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile-friendly table */}
      <div className="overflow-x-auto">
        <div className="min-w-full divide-y divide-gray-200">
          {/* Mobile view (card layout) */}
          <div className="md:hidden space-y-4">
            {incomes.map(income => (
              <div key={income.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{income.source}</h4>
                    <p className="text-sm text-gray-500">{income.description}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(income.id)}
                    disabled={deleteLoading === income.id}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    {deleteLoading === income.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Amount:</span>
                    <span className="ml-2 font-medium">${income.amount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Frequency:</span>
                    <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {income.frequency}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Next Payment:</span>
                    <span className="ml-2">{format(new Date(income.receiveDate), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop view (table layout) */}
          <table className="hidden md:table min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frequency
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Payment
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {incomes.map(income => (
                <tr key={income.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">{income.source}</div>
                      {income.description && (
                        <div className="text-sm text-gray-500">{income.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${income.amount.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {income.frequency}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(income.receiveDate), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(income.id)}
                      disabled={deleteLoading === income.id}
                      className="text-red-600 hover:text-red-900"
                    >
                      {deleteLoading === income.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {incomes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No income sources added yet
        </div>
      )}
    </div>
  )
} 