'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Category, Expense } from '@/components/BudgetDashboard'
import { getUserCategories, getUserExpenses } from '@/services/firebase'
import Link from 'next/link'
import { PieChart } from '@/components/charts/ChartWrapper'

export default function TransactionsPage() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      const [categoriesData, expensesData] = await Promise.all([
        getUserCategories(user!.uid),
        getUserExpenses(user!.uid)
      ])
      setCategories(categoriesData)
      setExpenses(expensesData)
    } catch (error) {
      setError('Failed to load data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredAndSortedExpenses = () => {
    return expenses
      .filter(expense => {
        const matchesCategory = selectedCategory === 'all' || expense.categoryId === selectedCategory
        const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesCategory && matchesSearch
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          const comparison = new Date(b.date).getTime() - new Date(a.date).getTime()
          return sortOrder === 'desc' ? comparison : -comparison
        } else if (sortBy === 'amount') {
          const comparison = b.amount - a.amount
          return sortOrder === 'desc' ? comparison : -comparison
        } else {
          const catA = categories.find(c => c.id === a.categoryId)?.name || ''
          const catB = categories.find(c => c.id === b.categoryId)?.name || ''
          const comparison = catA.localeCompare(catB)
          return sortOrder === 'desc' ? -comparison : comparison
        }
      })
  }

  const getCategoryBreakdown = () => {
    const breakdown = categories.map(category => {
      const categoryExpenses = expenses.filter(e => e.categoryId === category.id)
      const total = categoryExpenses.reduce((sum, e) => sum + e.amount, 0)
      return {
        category: category.name,
        total
      }
    })

    return {
      labels: breakdown.map(b => b.category),
      datasets: [{
        data: breakdown.map(b => b.total),
        backgroundColor: [
          '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
          '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'
        ]
      }]
    }
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  if (error) return <div className="text-red-500">{error}</div>

  const filteredExpenses = getFilteredAndSortedExpenses()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-blue-500 hover:text-blue-600">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">All Transactions</h1>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Total Transactions</p>
              <p className="text-2xl font-bold text-blue-700">{expenses.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Total Spent</p>
              <p className="text-2xl font-bold text-green-700">
                ${expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600">Average Transaction</p>
              <p className="text-2xl font-bold text-yellow-700">
                ${(expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length).toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600">Categories</p>
              <p className="text-2xl font-bold text-purple-700">{categories.length}</p>
            </div>
          </div>
        </div>

        {/* Category Breakdown Chart */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Category Breakdown</h2>
          <div className="aspect-square">
            <PieChart data={getCategoryBreakdown()} />
          </div>
        </div>

        {/* Filters and Transaction List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transactions..."
                className="px-3 py-2 border rounded-lg flex-grow"
              />
            </div>

            {/* Sort Controls */}
            <div className="flex space-x-2">
              {(['date', 'amount', 'category'] as const).map((field) => (
                <button
                  key={field}
                  onClick={() => {
                    if (sortBy === field) {
                      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
                    } else {
                      setSortBy(field)
                      setSortOrder('desc')
                    }
                  }}
                  className={`px-3 py-1 rounded ${
                    sortBy === field ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                  {sortBy === field && (sortOrder === 'desc' ? ' ↓' : ' ↑')}
                </button>
              ))}
            </div>

            {/* Transaction List */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => {
                    const category = categories.find(c => c.id === expense.categoryId)
                    return (
                      <tr key={expense.id} className="border-b last:border-0">
                        <td className="py-3">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/categories/${expense.categoryId}`}
                            className="text-blue-500 hover:text-blue-600"
                          >
                            {category?.name}
                          </Link>
                        </td>
                        <td className="py-3">{expense.description}</td>
                        <td className="py-3 text-right">${expense.amount.toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 