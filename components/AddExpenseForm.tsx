'use client'

import { useState } from 'react'
import { Category, Expense } from './BudgetDashboard'
import { format } from 'date-fns'
import { localToUTC, getMonthFromUTC } from '@/utils/dates'

export default function AddExpenseForm({
  categories,
  onAddExpense,
}: {
  categories: Category[]
  onAddExpense: (expense: Omit<Expense, 'id'>) => void
}) {
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (categoryId && amount && description && date) {
      setIsSubmitting(true)
      try {
        const utcDate = localToUTC(date)
        
        await onAddExpense({
          categoryId,
          amount: parseFloat(amount),
          description,
          date: utcDate,
          month: getMonthFromUTC(utcDate)
        })
        setCategoryId('')
        setAmount('')
        setDescription('')
        setDate(format(new Date(), 'yyyy-MM-dd'))
      } catch (error) {
        console.error('Error submitting expense:', error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
          Date
        </label>
        <input
          type="date"
          id="date"
          value={date}
          max={format(new Date(), 'yyyy-MM-dd')}
          onChange={(e) => setDate(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Select Category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Amount
        </label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description"
          className="w-full p-2 border rounded"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting || !categoryId || !amount || !description || !date}
        className={`w-full ${
          isSubmitting || !categoryId || !amount || !description || !date
            ? 'bg-gray-400'
            : 'bg-green-500 hover:bg-green-600'
        } text-white p-2 rounded transition-colors`}
      >
        {isSubmitting ? 'Adding...' : 'Add Expense'}
      </button>
    </form>
  )
} 