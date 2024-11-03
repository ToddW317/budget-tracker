'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import BudgetCategoryList from './BudgetCategoryList'
import ExpenseList from './ExpenseList'
import AddExpenseForm from './AddExpenseForm'
import AddCategoryForm from './AddCategoryForm'
import { addCategory, addExpense, getUserCategories, getUserExpenses, updateCategory, deleteCategory, deleteExpense } from '@/services/firebase'
import UserProfileSettings from './UserProfileSettings'
import Link from 'next/link'

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
  month: string // Format: "YYYY-MM"
}

export type MonthlyBudget = {
  id: string
  month: string // Format: "YYYY-MM"
  categoryId: string
  budget: number
  spent: number
}

export type Bill = {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  lastPaid: string | null;
};

export type Income = {
  id: string;
  source: string;
  amount: number;
  receiveDate: string;
  isRecurring: boolean;
  frequency?: 'weekly' | 'biweekly' | 'monthly';
};

export default function BudgetDashboard() {
  const { user, signInWithGoogle } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isIndexBuilding, setIsIndexBuilding] = useState(false)

  const loadUserData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    setIsIndexBuilding(false)
    try {
      const [userCategories, userExpenses] = await Promise.all([
        getUserCategories(user.uid),
        getUserExpenses(user.uid)
      ])
      setCategories(userCategories)
      setExpenses(userExpenses)
    } catch (error: any) {
      if (error.message?.includes('requires an index')) {
        setIsIndexBuilding(true)
        setError('Database indexes are being built. This may take a few minutes.')
      } else {
        setError('Failed to load data. Please try again later.')
      }
      console.error('Error loading user data:', error)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (user) {
      loadUserData()
    } else {
      setCategories([])
      setExpenses([])
      setLoading(false)
    }
  }, [user, loadUserData])

  const handleAddCategory = async (category: Omit<Category, 'id' | 'spent'>) => {
    if (!user) return
    setError(null)
    try {
      const newCategory = await addCategory(user.uid, category)
      setCategories(prev => [...prev, newCategory])
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
      
      const completeExpense: Expense = {
        id: newExpense.id || Date.now().toString(),
        categoryId: expense.categoryId,
        amount: expense.amount,
        description: expense.description,
        date: expense.date,
        month: expense.month
      };
      
      setExpenses(prev => [...prev, completeExpense]);
      
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

  const handleUpdateCategory = async (categoryId: string, updates: Partial<Category>) => {
    if (!user) return;
    setError(null);
    try {
      const updatedCategory = await updateCategory(user.uid, categoryId, updates);
      setCategories(prev => prev.map(cat => 
        cat.id === categoryId ? { ...cat, ...updatedCategory } : cat
      ));
    } catch (error) {
      setError('Failed to update category. Please try again.');
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!user) return;
    setError(null);
    try {
      await deleteCategory(user.uid, categoryId);
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      setExpenses(prev => prev.filter(exp => exp.categoryId !== categoryId));
    } catch (error) {
      setError('Failed to delete category. Please try again.');
      console.error('Error deleting category:', error);
    }
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    setError(null);
    try {
      await deleteExpense(user.uid, expense.id, expense.categoryId, expense.amount);
      setExpenses(prev => prev.filter(exp => exp.id !== expense.id));
      setCategories(prev => prev.map(cat => {
        if (cat.id === expense.categoryId) {
          return {
            ...cat,
            spent: cat.spent - expense.amount
          };
        }
        return cat;
      }));
    } catch (error) {
      setError('Failed to delete expense. Please try again.');
      console.error('Error deleting expense:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Welcome to Budget Tracker</h2>
        <p className="text-gray-600 mb-8 text-center max-w-md">
          Sign in to start managing your expenses and take control of your finances
        </p>
        <button
          onClick={signInWithGoogle}
          className="flex items-center space-x-3 bg-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            {/* Google icon SVG */}
          </svg>
          <span className="text-gray-700 font-medium">Sign in with Google</span>
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 py-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-600">{error}</p>
              {isIndexBuilding && (
                <p className="text-sm text-red-500 mt-1">
                  Please wait while we set up the database. This is a one-time process.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Welcome back, {user.displayName}
            </h2>
            <p className="text-gray-500 mt-1">Manage your budget and expenses</p>
          </div>
          <Link
            href="/history"
            className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span>View History</span>
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Budget Categories</h2>
            <AddCategoryForm onAddCategory={handleAddCategory} />
            <BudgetCategoryList 
              categories={categories} 
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Add New Expense</h2>
            <AddExpenseForm categories={categories} onAddExpense={handleAddExpense} />
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <ExpenseList 
              expenses={expenses} 
              categories={categories}
              onDeleteExpense={handleDeleteExpense}
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <UserProfileSettings />
        </div>
      </div>
    </div>
  )
} 