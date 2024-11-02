'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import BudgetCategoryList from './BudgetCategoryList'
import ExpenseList from './ExpenseList'
import AddExpenseForm from './AddExpenseForm'
import AddCategoryForm from './AddCategoryForm'
import { addCategory, addExpense, getUserCategories, getUserExpenses } from '@/services/firebase'

export type Category = {
  id: string
  name: string
  budget: number
  spent: number
}

export type Expense = {
  id: string
  categoryId: string
  amount: number
  description: string
  date: string
}

export default function BudgetDashboard() {
  const { user, signInWithGoogle } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadUserData()
    } else {
      setCategories([])
      setExpenses([])
      setLoading(false)
    }
  }, [user])

  const loadUserData = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const [userCategories, userExpenses] = await Promise.all([
        getUserCategories(user.uid),
        getUserExpenses(user.uid)
      ])
      setCategories(userCategories)
      setExpenses(userExpenses)
    } catch (error) {
      setError('Failed to load data. Please try again later.')
      console.error('Error loading user data:', error)
    }
    setLoading(false)
  }

  const handleAddCategory = async (category: Omit<Category, 'id' | 'spent'>) => {
    if (!user) return
    setError(null)
    try {
      const newCategory = await addCategory(user.uid, category)
      setCategories(prev => [...prev, newCategory as Category])
    } catch (error) {
      setError('Failed to add category. Please try again.')
      console.error('Error adding category:', error)
    }
  }

  const handleAddExpense = async (expense: Omit<Expense, 'id'>) => {
    if (!user) return;
    setError(null);
    try {
      const newExpense = await addExpense(user.uid, expense);
      if (!newExpense) throw new Error('Failed to add expense');
      
      setExpenses(prev => [...prev, newExpense]);
      
      // Update local category state
      setCategories(prev => prev.map(category => {
        if (category.id === expense.categoryId) {
          return {
            ...category,
            spent: category.spent + expense.amount
          };
        }
        return category;
      }));
    } catch (error) {
      setError('Failed to add expense. Please try again.');
      console.error('Error adding expense:', error);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl mb-4">Please sign in to manage your budget</h2>
        <button
          onClick={signInWithGoogle}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Sign in with Google
        </button>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-xl">Welcome, {user.displayName}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Categories</h2>
          <AddCategoryForm onAddCategory={handleAddCategory} />
          <BudgetCategoryList categories={categories} />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Add Expense</h2>
          <AddExpenseForm categories={categories} onAddExpense={handleAddExpense} />
          <ExpenseList expenses={expenses} categories={categories} />
        </div>
      </div>
    </div>
  )
} 