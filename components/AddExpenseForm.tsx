'use client'

import { useState } from 'react'
import { Category, Expense } from './BudgetDashboard'

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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (categoryId && amount && description) {
      setIsSubmitting(true)
      try {
        await onAddExpense({
          categoryId,
          amount: parseFloat(amount),
          description,
          date: new Date().toISOString(),
        })
        setCategoryId('')
        setAmount('')
        setDescription('')
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
        <select
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
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full p-2 border rounded"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full ${
          isSubmitting ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'
        } text-white p-2 rounded`}
      >
        {isSubmitting ? 'Adding...' : 'Add Expense'}
      </button>
    </form>
  )
} 