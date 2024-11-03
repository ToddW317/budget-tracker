'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getUserCategoryById, getUserExpensesByCategory, updateCategory, updateExpense } from '@/services/firebase'
import { Category, Expense } from '@/components/BudgetDashboard'
import MonthSelector from '@/components/MonthSelector'
import { format, parseISO, isSameMonth, subMonths, startOfMonth, endOfMonth, startOfDay, parse } from 'date-fns'
import Link from 'next/link'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function CategoryDetails({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const [category, setCategory] = useState<Category | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [newBudget, setNewBudget] = useState('')
  const [showSpendingInsights, setShowSpendingInsights] = useState(false)
  const [historicalExpenses, setHistoricalExpenses] = useState<Expense[]>([])
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isEditingExpense, setIsEditingExpense] = useState(false)
  const [editedExpense, setEditedExpense] = useState<{
    description: string
    amount: string
    date: string
  }>({
    description: '',
    amount: '',
    date: ''
  })

  // Fetch 6 months of historical data for trends
  useEffect(() => {
    if (!user || !params.id) return

    const loadHistoricalData = async () => {
      try {
        const promises = []
        for (let i = 0; i < 6; i++) {
          const monthDate = subMonths(selectedMonth, i)
          const monthStr = format(monthDate, 'yyyy-MM')
          promises.push(getUserExpensesByCategory(user.uid, params.id, monthStr))
        }
        const results = await Promise.all(promises)
        setHistoricalExpenses(results.flat())
      } catch (error) {
        console.error('Error loading historical data:', error)
      }
    }

    loadHistoricalData()
  }, [user, params.id, selectedMonth])

  // Load current month's data
  useEffect(() => {
    if (!user || !params.id) return

    const loadCategoryData = async () => {
      setLoading(true)
      setError(null)
      try {
        const monthStr = format(selectedMonth, 'yyyy-MM')
        const [categoryData, expensesData] = await Promise.all([
          getUserCategoryById(user.uid, params.id),
          getUserExpensesByCategory(user.uid, params.id, monthStr)
        ])
        setCategory(categoryData)
        setExpenses(expensesData)
        setNewBudget(categoryData.budget.toString())
      } catch (error) {
        console.error('Error loading category data:', error)
        setError('Failed to load category data')
      }
      setLoading(false)
    }

    loadCategoryData()
  }, [user, params.id, selectedMonth])

  const handleUpdateBudget = async () => {
    if (!user || !category) return
    try {
      await updateCategory(user.uid, category.id, {
        budget: parseFloat(newBudget)
      })
      setCategory(prev => prev ? { ...prev, budget: parseFloat(newBudget) } : null)
      setIsEditingBudget(false)
    } catch (error) {
      console.error('Error updating budget:', error)
    }
  }

  // Calculate insights and statistics
  const insights = useMemo(() => {
    if (!historicalExpenses.length) return null

    const averageSpending = historicalExpenses.reduce((sum, exp) => sum + exp.amount, 0) / 6
    const currentMonthSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const spendingTrend = currentMonthSpending - averageSpending
    
    const commonExpenses = historicalExpenses.reduce((acc, exp) => {
      acc[exp.description] = (acc[exp.description] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostFrequent = Object.entries(commonExpenses)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)

    return {
      averageSpending,
      spendingTrend,
      mostFrequent
    }
  }, [historicalExpenses, expenses])

  // Prepare chart data
  const chartData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(selectedMonth, 5 - i)
      return {
        month: format(date, 'MMM yyyy'),
        total: historicalExpenses
          .filter(exp => isSameMonth(parseISO(exp.date), date))
          .reduce((sum, exp) => sum + exp.amount, 0)
      }
    })

    return {
      labels: last6Months.map(m => m.month),
      datasets: [
        {
          label: 'Monthly Spending',
          data: last6Months.map(m => m.total),
          fill: true,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        }
      ]
    }
  }, [historicalExpenses, selectedMonth])

  const handleUpdateExpense = async () => {
    if (!user || !selectedExpense || !category) return

    try {
      const updatedAmount = parseFloat(editedExpense.amount)
      const originalAmount = selectedExpense.amount
      const amountDiff = updatedAmount - originalAmount

      const expenseDate = startOfDay(parse(editedExpense.date, 'yyyy-MM-dd', new Date()))
      
      await updateExpense(user.uid, selectedExpense.id, {
        ...selectedExpense,
        description: editedExpense.description,
        amount: updatedAmount,
        date: expenseDate.toISOString(),
        month: format(expenseDate, 'yyyy-MM')
      })

      // Update local state
      setExpenses(prev => prev.map(exp => 
        exp.id === selectedExpense.id
          ? {
              ...exp,
              description: editedExpense.description,
              amount: updatedAmount,
              date: expenseDate.toISOString(),
              month: format(expenseDate, 'yyyy-MM')
            }
          : exp
      ))

      // Update category spent amount
      setCategory(prev => prev ? {
        ...prev,
        spent: prev.spent + amountDiff
      } : null)

      setIsEditingExpense(false)
      setSelectedExpense(null)
    } catch (error) {
      console.error('Error updating expense:', error)
      // You might want to add error handling UI here
    }
  }

  const startEditingExpense = () => {
    if (!selectedExpense) return
    
    setEditedExpense({
      description: selectedExpense.description,
      amount: selectedExpense.amount.toString(),
      date: format(parseISO(selectedExpense.date), 'yyyy-MM-dd')
    })
    setIsEditingExpense(true)
  }

  if (!user || loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        {error || 'Category not found'}
      </div>
    )
  }

  const monthlySpent = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const monthStr = format(selectedMonth, 'MMMM yyyy')
  const spendingPercentage = (monthlySpent / category.budget) * 100

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <Link
          href="/"
          className="text-blue-500 hover:text-blue-600 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <button
          onClick={() => setShowSpendingInsights(!showSpendingInsights)}
          className="text-blue-500 hover:text-blue-600"
        >
          {showSpendingInsights ? 'Hide Insights' : 'Show Insights'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          {isEditingBudget ? (
            <div className="space-y-2 w-full max-w-md">
              <input
                type="text"
                value={editedExpense.description}
                onChange={(e) => setEditedExpense(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                className="w-full px-3 py-2 border rounded text-lg"
                placeholder="Category name"
              />
              <input
                type="number"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                step="0.01"
                min="0"
                placeholder="Budget amount"
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleUpdateBudget}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditingBudget(false);
                    setNewBudget(category.budget.toString());
                    setEditedExpense(prev => ({
                      ...prev,
                      description: category.name
                    }));
                  }}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-gray-800">
                {category.name}
              </h1>
              <button
                onClick={() => {
                  setIsEditingBudget(true);
                  setNewBudget(category.budget.toString());
                  setEditedExpense(prev => ({
                    ...prev,
                    description: category.name
                  }));
                }}
                className="text-blue-500 hover:text-blue-600"
              >
                Edit Category
              </button>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800">Monthly Budget</h3>
            <p className="text-2xl font-bold text-blue-900">${category.budget.toFixed(2)}</p>
          </div>
          <div className={`${
            spendingPercentage >= 90 ? 'bg-red-50' :
            spendingPercentage >= 75 ? 'bg-yellow-50' :
            'bg-green-50'
          } p-4 rounded-lg`}>
            <h3 className="text-sm font-medium text-green-800">Spent in {monthStr}</h3>
            <p className="text-2xl font-bold text-green-900">${monthlySpent.toFixed(2)}</p>
            <p className="text-sm mt-1">
              {spendingPercentage.toFixed(1)}% of budget
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-800">Remaining</h3>
            <p className="text-2xl font-bold text-purple-900">
              ${(category.budget - monthlySpent).toFixed(2)}
            </p>
            <p className="text-sm mt-1">
              {Math.max(0, ((category.budget - monthlySpent) / category.budget) * 100).toFixed(1)}% left
            </p>
          </div>
        </div>

        {showSpendingInsights && insights && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Spending Insights</h3>
            <div className="space-y-3">
              <p>
                6-month average spending: 
                <span className="font-semibold ml-2">
                  ${insights.averageSpending.toFixed(2)}
                </span>
              </p>
              <p>
                Current month vs average:
                <span className={`font-semibold ml-2 ${
                  insights.spendingTrend > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {insights.spendingTrend > 0 ? '+' : ''}
                  ${insights.spendingTrend.toFixed(2)}
                </span>
              </p>
              <div>
                <p className="mb-1">Most frequent expenses:</p>
                <ul className="list-disc list-inside">
                  {insights.mostFrequent.map(([desc, count]) => (
                    <li key={desc}>
                      {desc} ({count} times)
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Spending Trend</h3>
          <div className="h-64">
            <Line data={chartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => `$${value}`
                  }
                }
              }
            }} />
          </div>
        </div>

        <MonthSelector
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Expenses for {monthStr}</h2>
        {expenses.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No expenses recorded for this month
          </p>
        ) : (
          <div className="space-y-4">
            {expenses.map(expense => (
              <div
                key={expense.id}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => setSelectedExpense(expense)}
              >
                <div>
                  <p className="font-medium text-gray-800">{expense.description}</p>
                  <p className="text-sm text-gray-500">
                    {format(parseISO(expense.date), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">
                    ${expense.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {((expense.amount / category.budget) * 100).toFixed(1)}% of budget
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Updated Expense Details Modal */}
      {selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {isEditingExpense ? 'Edit Expense' : 'Expense Details'}
              </h3>
              <button
                onClick={() => {
                  setSelectedExpense(null)
                  setIsEditingExpense(false)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {isEditingExpense ? (
                // Edit Mode
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={editedExpense.description}
                      onChange={(e) => setEditedExpense(prev => ({
                        ...prev,
                        description: e.target.value
                      }))}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={editedExpense.amount}
                      onChange={(e) => setEditedExpense(prev => ({
                        ...prev,
                        amount: e.target.value
                      }))}
                      step="0.01"
                      min="0"
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={editedExpense.date}
                      max={format(new Date(), 'yyyy-MM-dd')}
                      onChange={(e) => setEditedExpense(prev => ({
                        ...prev,
                        date: e.target.value
                      }))}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="flex space-x-3 mt-6">
                    <button
                      onClick={handleUpdateExpense}
                      disabled={!editedExpense.description || !editedExpense.amount || !editedExpense.date}
                      className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditingExpense(false)}
                      className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                // View Mode
                <>
                  <div>
                    <label className="text-sm text-gray-600">Description</label>
                    <p className="font-medium">{selectedExpense.description}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Amount</label>
                    <p className="font-medium">${selectedExpense.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Date</label>
                    <p className="font-medium">
                      {format(parseISO(selectedExpense.date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Percentage of Budget</label>
                    <p className="font-medium">
                      {((selectedExpense.amount / category.budget) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="flex space-x-3 mt-6">
                    <button
                      onClick={startEditingExpense}
                      className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                    >
                      Edit Expense
                    </button>
                    <button
                      onClick={() => setSelectedExpense(null)}
                      className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 