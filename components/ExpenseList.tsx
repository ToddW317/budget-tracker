'use client'

import { Category, Expense } from './BudgetDashboard'
import Link from 'next/link'
import { formatDisplayDate } from '@/utils/dates'

interface Props {
  expenses: Expense[]
  categories: Category[]
  onDeleteExpense?: (expense: Expense) => Promise<void>
}

export default function ExpenseList({
  expenses,
  categories,
  onDeleteExpense
}: Props) {
  const RECENT_EXPENSES_LIMIT = 5

  const sortedExpenses = [...expenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const recentExpenses = sortedExpenses.slice(0, RECENT_EXPENSES_LIMIT)

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Expenses</h3>
      <div className="space-y-3">
        {expenses.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No expenses recorded yet</p>
        ) : (
          <>
            {recentExpenses.map((expense) => {
              const category = categories.find((c) => c.id === expense.categoryId)
              if (!category) return null
              
              return (
                <Link
                  key={expense.id}
                  href={`/categories/${category.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-start space-x-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 text-sm">
                          {category.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{expense.description}</p>
                        <p className="text-sm text-gray-500">{category.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">
                        ${expense.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDisplayDate(expense.date)}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
            
            {expenses.length > RECENT_EXPENSES_LIMIT && (
              <div className="text-center py-4 px-2 w-full sticky bottom-0 bg-white/80 backdrop-blur-sm">
                <Link
                  href="/transactions"
                  className="inline-block w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
                >
                  View All Transactions →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
} 