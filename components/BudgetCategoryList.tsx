'use client'

import { useState } from 'react';
import { Category } from './BudgetDashboard';
import Link from 'next/link';

interface Props {
  categories: Category[];
  onUpdateCategory: (categoryId: string, updates: Partial<Category>) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
}

export default function BudgetCategoryList({ categories, onUpdateCategory, onDeleteCategory }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBudget, setEditBudget] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleEditClick = (category: Category) => {
    setEditingId(category.id);
    setEditBudget(category.budget.toString());
    setEditName(category.name);
  };

  const handleSaveEdit = async (categoryId: string) => {
    if (!editBudget.trim() || !editName.trim()) return;
    
    setIsLoading(categoryId);
    try {
      await onUpdateCategory(categoryId, {
        budget: parseFloat(editBudget),
        name: editName.trim()
      });
      setEditingId(null);
    } catch (error) {
      console.error('Error updating category:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category? All associated expenses will also be deleted.')) {
      return;
    }
    
    setIsLoading(categoryId);
    try {
      await onDeleteCategory(categoryId);
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-4 mt-6">
      {categories.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No categories added yet</p>
      ) : (
        categories.map((category) => {
          const remaining = category.budget - category.spent;
          const percentSpent = (category.spent / category.budget) * 100;
          const progressBarColor = 
            percentSpent >= 90 ? 'bg-red-500' :
            percentSpent >= 75 ? 'bg-yellow-500' :
            'bg-emerald-500';

          return (
            <div
              key={category.id}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  {editingId === category.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2 py-1 border rounded text-sm"
                        placeholder="Category name"
                      />
                      <input
                        type="number"
                        value={editBudget}
                        onChange={(e) => setEditBudget(e.target.value)}
                        className="w-32 px-2 py-1 border rounded text-sm"
                        placeholder="Budget amount"
                      />
                      <div className="flex items-center space-x-2 mt-2">
                        <button
                          onClick={() => handleSaveEdit(category.id)}
                          disabled={isLoading === category.id}
                          className="text-sm px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-sm px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-medium text-gray-800">{category.name}</h3>
                      <p className="text-sm text-gray-500">
                        ${category.spent.toFixed(2)} of ${category.budget.toFixed(2)}
                      </p>
                    </>
                  )}
                </div>
                {!editingId && (
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        remaining < 0
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      ${Math.abs(remaining).toFixed(2)} {remaining < 0 ? 'over' : 'left'}
                    </span>
                    <button
                      onClick={() => handleEditClick(category)}
                      className="p-1 text-gray-500 hover:text-blue-500"
                      title="Edit category"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      disabled={isLoading === category.id}
                      className="p-1 text-gray-500 hover:text-red-500"
                      title="Delete category"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="relative pt-1">
                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${Math.min(100, percentSpent)}%` }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${progressBarColor} transition-all duration-500`}
                  ></div>
                </div>
              </div>
              
              {!editingId && (
                <div className="mt-2 flex justify-between items-center">
                  <Link
                    href={`/categories/${category.id}`}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    View Details →
                  </Link>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
} 