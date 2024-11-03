'use client'

import { useState, useEffect } from 'react'
import { Category } from '@/components/BudgetDashboard'
import { getUserCategories, addCategory } from '@/services/firebase'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  value: string
  onChange: (categoryId: string) => void
  onAddNewCategory?: (category: Category) => void
}

export default function CategorySelector({ value, onChange, onAddNewCategory }: Props) {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [addingCategory, setAddingCategory] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryBudget, setNewCategoryBudget] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCategories() {
      if (!user) return
      try {
        const data = await getUserCategories(user.uid)
        setCategories(data)
      } catch (error) {
        console.error('Error loading categories:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [user])

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value
    if (selectedValue === 'new') {
      setShowNewForm(true)
    } else {
      onChange(selectedValue)
    }
  }

  const handleAddCategory = async () => {
    if (!user || !newCategoryName || !newCategoryBudget) return

    setError(null)
    setAddingCategory(true)
    try {
      const newCategory = await addCategory(user.uid, {
        name: newCategoryName,
        budget: parseFloat(newCategoryBudget)
      })

      // Update local state
      setCategories(prev => [...prev, newCategory])
      
      // Select the new category
      onChange(newCategory.id)
      
      // Reset form
      setNewCategoryName('')
      setNewCategoryBudget('')
      setShowNewForm(false)
      
      // Notify parent if needed
      onAddNewCategory?.(newCategory)
    } catch (error) {
      console.error('Error adding category:', error)
      setError('Failed to add category. Please try again.')
    } finally {
      setAddingCategory(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse h-10 bg-gray-100 rounded"></div>
  }

  return (
    <div className="space-y-4">
      <select
        value={value}
        onChange={handleSelectChange}
        className="w-full p-2 border rounded-lg"
      >
        <option value="">Select Category</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name} (${category.budget.toFixed(2)})
          </option>
        ))}
        <option value="new">+ Add New Category</option>
      </select>

      {showNewForm && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name
            </label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget Amount
            </label>
            <input
              type="number"
              value={newCategoryBudget}
              onChange={(e) => setNewCategoryBudget(e.target.value)}
              className="w-full p-2 border rounded-lg"
              step="0.01"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleAddCategory}
              disabled={addingCategory || !newCategoryName || !newCategoryBudget}
              className={`px-4 py-2 rounded-lg ${
                addingCategory || !newCategoryName || !newCategoryBudget
                  ? 'bg-gray-400'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              {addingCategory ? 'Adding...' : 'Add Category'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewForm(false)
                setNewCategoryName('')
                setNewCategoryBudget('')
                setError(null)
                onChange('')
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 