'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Category, Expense } from '@/components/BudgetDashboard'
import { getUserCategoryById, getUserExpensesByCategory, updateCategory, deleteExpense, updateExpense } from '@/services/firebase'
import Link from 'next/link'
import { LineChart } from '@/components/charts/ChartWrapper'
import { useParams } from 'next/navigation'
import { TooltipItem, ScriptableContext } from 'chart.js'

interface ChartPoint {
  x: number;  // timestamp instead of Date
  y: number;
}

export default function CategoryDetailsPage() {
  const params = useParams()
  const categoryId = params.id as string
  const { user } = useAuth()
  const [category, setCategory] = useState<Category | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [newBudget, setNewBudget] = useState('')
  const [editingExpense, setEditingExpense] = useState<string | null>(null)
  const [editExpenseData, setEditExpenseData] = useState({ amount: '', description: '' })

  const loadCategoryData = useCallback(async () => {
    try {
      const [categoryData, expensesData] = await Promise.all([
        getUserCategoryById(user!.uid, categoryId),
        getUserExpensesByCategory(user!.uid, categoryId)
      ])
      setCategory(categoryData)
      setExpenses(expensesData)
    } catch (error) {
      setError('Failed to load category data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [user, categoryId])

  useEffect(() => {
    if (user && categoryId) {
      loadCategoryData()
    }
  }, [user, categoryId, loadCategoryData])

  const handleUpdateBudget = async () => {
    if (!category || !newBudget) return
    try {
      await updateCategory(user!.uid, categoryId, {
        budget: parseFloat(newBudget)
      })
      setCategory(prev => prev ? { ...prev, budget: parseFloat(newBudget) } : null)
      setIsEditingBudget(false)
    } catch (error) {
      console.error('Error updating budget:', error)
    }
  }

  const handleUpdateExpense = async (expenseId: string) => {
    if (!editExpenseData.amount || !editExpenseData.description) return
    try {
      // First, adjust the category spent amount
      const expense = expenses.find(e => e.id === expenseId)
      if (!expense) return

      const amountDiff = parseFloat(editExpenseData.amount) - expense.amount
      
      await Promise.all([
        updateCategory(user!.uid, categoryId, {
          spent: (category?.spent || 0) + amountDiff
        }),
        // Update the expense
        updateExpense(user!.uid, expenseId, {
          amount: parseFloat(editExpenseData.amount),
          description: editExpenseData.description
        })
      ])

      // Update local state
      setExpenses(prev => prev.map(e => 
        e.id === expenseId 
          ? { ...e, amount: parseFloat(editExpenseData.amount), description: editExpenseData.description }
          : e
      ))
      setCategory(prev => prev ? { ...prev, spent: (prev.spent || 0) + amountDiff } : null)
      setEditingExpense(null)
    } catch (error) {
      console.error('Error updating expense:', error)
    }
  }

  const handleDeleteExpense = async (expense: Expense) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return
    try {
      await deleteExpense(user!.uid, expense.id, categoryId, expense.amount)
      setExpenses(prev => prev.filter(e => e.id !== expense.id))
      setCategory(prev => prev ? { ...prev, spent: prev.spent - expense.amount } : null)
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  const getChartData = () => {
    const sortedExpenses = [...expenses].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    const cutoffDate = new Date()
    if (timeframe === 'week') cutoffDate.setDate(cutoffDate.getDate() - 7)
    if (timeframe === 'month') cutoffDate.setMonth(cutoffDate.getMonth() - 1)
    if (timeframe === 'year') cutoffDate.setFullYear(cutoffDate.getFullYear() - 1)

    const filteredExpenses = sortedExpenses.filter(expense => 
      new Date(expense.date) > cutoffDate
    )

    // Calculate cumulative spending
    let cumulative = 0
    const cumulativeData: ChartPoint[] = filteredExpenses.map(expense => {
      cumulative += expense.amount
      return {
        x: new Date(expense.date).getTime(),  // Convert Date to timestamp
        y: cumulative
      }
    })

    const individualData: ChartPoint[] = filteredExpenses.map(expense => ({
      x: new Date(expense.date).getTime(),  // Convert Date to timestamp
      y: expense.amount
    }))

    return {
      datasets: [
        {
          label: 'Individual Expenses',
          data: individualData,
          type: 'bar' as const,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
          yAxisID: 'y'
        },
        {
          label: 'Cumulative Spending',
          data: cumulativeData,
          type: 'line' as const,
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 2,
          fill: true,
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    }
  }

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: timeframe === 'week' ? 'day' as const : 
                timeframe === 'month' ? 'week' as const : 
                'month' as const
        },
        ticks: {
          source: 'auto',
          autoSkip: true
        },
        grid: {
          display: false
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Individual Expenses ($)'
        },
        grid: {
          drawBorder: false,
          borderDash: [2, 4]
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Cumulative Spending ($)'
        },
        grid: {
          display: false,
          drawBorder: false
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context: TooltipItem<'line' | 'bar'>) {
            const value = context.parsed.y;
            return `$${typeof value === 'number' ? value.toFixed(2) : '0.00'}`;
          }
        }
      }
    }
  }

  const getSortedExpenses = () => {
    return [...expenses].sort((a, b) => {
      if (sortBy === 'date') {
        const comparison = new Date(b.date).getTime() - new Date(a.date).getTime()
        return sortOrder === 'desc' ? comparison : -comparison
      } else {
        const comparison = b.amount - a.amount
        return sortOrder === 'desc' ? comparison : -comparison
      }
    })
  }

  const getStatistics = () => {
    if (!expenses.length) return null
    
    const amounts = expenses.map(e => e.amount)
    return {
      total: amounts.reduce((a, b) => a + b, 0),
      average: amounts.reduce((a, b) => a + b, 0) / amounts.length,
      max: Math.max(...amounts),
      min: Math.min(...amounts),
      count: expenses.length
    }
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  if (error) return <div className="text-red-500">{error}</div>
  if (!category) return <div>Category not found</div>

  const stats = getStatistics()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-blue-500 hover:text-blue-600">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Overview */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <h1 className="text-3xl font-bold text-gray-800">{category.name}</h1>
            {isEditingBudget ? (
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="px-3 py-2 border rounded-lg w-32"
                  placeholder="New budget"
                />
                <button
                  onClick={handleUpdateBudget}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingBudget(false)}
                  className="px-3 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setNewBudget(category.budget.toString())
                  setIsEditingBudget(true)
                }}
                className="text-blue-500 hover:text-blue-600"
              >
                Edit Budget
              </button>
            )}
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Budget</p>
              <p className="text-2xl font-bold text-blue-700">${category.budget.toFixed(2)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Spent</p>
              <p className="text-2xl font-bold text-green-700">${category.spent.toFixed(2)}</p>
            </div>
            <div className={`${
              category.budget - category.spent < 0 ? 'bg-red-50' : 'bg-emerald-50'
            } p-4 rounded-lg`}>
              <p className="text-sm text-emerald-600">Remaining</p>
              <p className="text-2xl font-bold text-emerald-700">
                ${(category.budget - category.spent).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-xl font-bold text-gray-800">${stats.total.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Average Expense</p>
                <p className="text-xl font-bold text-gray-800">${stats.average.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Largest Expense</p>
                <p className="text-xl font-bold text-gray-800">${stats.max.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Smallest Expense</p>
                <p className="text-xl font-bold text-gray-800">${stats.min.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-xl font-bold text-gray-800">{stats.count}</p>
              </div>
            </div>
          </div>
        )}

        {/* Expense Chart */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Expense Trend</h2>
            <div className="flex space-x-2">
              {(['week', 'month', 'year'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1 rounded ${
                    timeframe === t ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px]">
            <LineChart data={getChartData()} options={chartOptions} />
          </div>
        </div>

        {/* Expense List */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Expense History</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  if (sortBy === 'date') {
                    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
                  } else {
                    setSortBy('date')
                    setSortOrder('desc')
                  }
                }}
                className={`px-3 py-1 rounded ${
                  sortBy === 'date' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Date {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
              <button
                onClick={() => {
                  if (sortBy === 'amount') {
                    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
                  } else {
                    setSortBy('amount')
                    setSortOrder('desc')
                  }
                }}
                className={`px-3 py-1 rounded ${
                  sortBy === 'amount' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Amount {sortBy === 'amount' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getSortedExpenses().map((expense) => (
                  <tr key={expense.id} className="border-b last:border-0">
                    <td className="py-3">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      {editingExpense === expense.id ? (
                        <input
                          type="text"
                          value={editExpenseData.description}
                          onChange={(e) => setEditExpenseData(prev => ({
                            ...prev,
                            description: e.target.value
                          }))}
                          className="px-2 py-1 border rounded w-full"
                        />
                      ) : (
                        expense.description
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {editingExpense === expense.id ? (
                        <input
                          type="number"
                          value={editExpenseData.amount}
                          onChange={(e) => setEditExpenseData(prev => ({
                            ...prev,
                            amount: e.target.value
                          }))}
                          className="px-2 py-1 border rounded w-24"
                        />
                      ) : (
                        `$${expense.amount.toFixed(2)}`
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end space-x-2">
                        {editingExpense === expense.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateExpense(expense.id)}
                              className="text-blue-500 hover:text-blue-600"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingExpense(null)}
                              className="text-gray-500 hover:text-gray-600"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingExpense(expense.id)
                                setEditExpenseData({
                                  amount: expense.amount.toString(),
                                  description: expense.description
                                })
                              }}
                              className="text-blue-500 hover:text-blue-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense)}
                              className="text-red-500 hover:text-red-600"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
} 