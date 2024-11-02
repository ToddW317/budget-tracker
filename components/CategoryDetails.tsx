import { useState } from 'react';
import { Category, Expense } from './BudgetDashboard';

interface Props {
  category: Category;
  expenses: Expense[];
  onClose: () => void;
  onUpdateCategory: (categoryId: string, updates: Partial<Category>) => Promise<void>;
  onDeleteExpense?: (expense: Expense) => Promise<void>;
}

export default function CategoryDetails({ 
  category, 
  expenses, 
  onClose, 
  onUpdateCategory,
  onDeleteExpense 
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editBudget, setEditBudget] = useState(category.budget.toString());
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSave = async () => {
    await onUpdateCategory(category.id, {
      budget: parseFloat(editBudget)
    });
    setIsEditing(false);
  };

  const sortedExpenses = [...expenses].sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'desc' 
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime();
    } else {
      return sortOrder === 'desc' 
        ? b.amount - a.amount 
        : a.amount - b.amount;
    }
  });

  const toggleSort = (field: 'date' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">{category.name}</h2>
            {isEditing ? (
              <div className="mt-2 flex items-center space-x-2">
                <input
                  type="number"
                  value={editBudget}
                  onChange={(e) => setEditBudget(e.target.value)}
                  className="w-32 px-2 py-1 border rounded"
                  placeholder="Budget amount"
                />
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="mt-1 space-y-1">
                <p className="text-gray-600">
                  Budget: ${category.budget.toFixed(2)}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="ml-2 text-blue-500 hover:text-blue-600"
                  >
                    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </p>
                <p className="text-gray-600">Spent: ${category.spent.toFixed(2)}</p>
                <p className={`font-medium ${category.budget - category.spent < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Remaining: ${(category.budget - category.spent).toFixed(2)}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">Expense History</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => toggleSort('date')}
                className={`px-3 py-1 rounded ${
                  sortBy === 'date' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Date {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
              <button
                onClick={() => toggleSort('amount')}
                className={`px-3 py-1 rounded ${
                  sortBy === 'amount' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Amount {sortBy === 'amount' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sortedExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div>
                  <p className="font-medium text-gray-800">{expense.description}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(expense.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-gray-800">
                    ${expense.amount.toFixed(2)}
                  </span>
                  {onDeleteExpense && (
                    <button
                      onClick={() => onDeleteExpense(expense)}
                      className="text-red-500 hover:text-red-600"
                      title="Delete expense"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 