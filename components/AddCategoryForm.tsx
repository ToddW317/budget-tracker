'use client'

import { useState } from 'react'
import { Category } from './BudgetDashboard'

export default function AddCategoryForm({
  onAddCategory,
}: {
  onAddCategory: (category: Omit<Category, 'id' | 'spent'>) => void
}) {
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name && budget) {
      onAddCategory({
        name,
        budget: parseFloat(budget),
      })
      setName('')
      setBudget('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category Name"
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <input
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="Budget Amount"
          className="w-full p-2 border rounded"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
      >
        Add Category
      </button>
    </form>
  )
} 