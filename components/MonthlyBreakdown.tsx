import { format, parseISO } from 'date-fns';
import { MonthlyBudget, Expense, Category } from './BudgetDashboard';
import Link from 'next/link';

interface Props {
  budgets: MonthlyBudget[];
  expenses: Expense[];
  month: Date;
  categories: Category[];
}

export default function MonthlyBreakdown({ budgets, expenses, month, categories }: Props) {
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.budget, 0);
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthStr = format(month, 'MMMM yyyy');

  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    if (!acc[expense.categoryId]) {
      acc[expense.categoryId] = {
        expenses: [],
        total: 0
      };
    }
    acc[expense.categoryId].expenses.push(expense);
    acc[expense.categoryId].total += expense.amount;
    return acc;
  }, {} as Record<string, { expenses: Expense[], total: number }>);

  return (
    <div className="space-y-6">
      {/* Monthly Overview Card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Monthly Overview - {monthStr}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800">Total Budget</h3>
            <p className="text-2xl font-bold text-blue-900">${totalBudget.toFixed(2)}</p>
          </div>
          <div className={`${
            totalSpent >= totalBudget ? 'bg-red-50' :
            totalSpent >= totalBudget * 0.9 ? 'bg-yellow-50' :
            'bg-green-50'
          } p-4 rounded-lg`}>
            <h3 className="text-sm font-medium text-gray-800">Total Spent</h3>
            <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
            <p className="text-sm mt-1">
              {((totalSpent / totalBudget) * 100).toFixed(1)}% of total budget
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-800">Remaining</h3>
            <p className="text-2xl font-bold text-purple-900">
              ${(totalBudget - totalSpent).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Progress bar for overall budget */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div
            className={`h-2.5 rounded-full transition-all duration-300 ${
              totalSpent >= totalBudget ? 'bg-red-500' :
              totalSpent >= totalBudget * 0.9 ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            style={{ width: `${Math.min(100, (totalSpent / totalBudget) * 100)}%` }}
          />
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Category Breakdown</h2>
        <div className="space-y-6">
          {budgets
            // Filter out duplicate categories
            .filter((budget, index, self) => 
              index === self.findIndex(b => b.categoryId === budget.categoryId)
            )
            .map(budget => {
              const category = categories.find(c => c.id === budget.categoryId);
              const categoryData = expensesByCategory[budget.categoryId] || { total: 0, expenses: [] };
              const spendingPercentage = (categoryData.total / budget.budget) * 100;

              if (!category) return null;

              return (
                <div key={budget.id} className="border-b last:border-b-0 pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        spendingPercentage >= 100 ? 'bg-red-500' :
                        spendingPercentage >= 90 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} />
                      <Link 
                        href={`/categories/${category.id}`}
                        className="text-lg font-medium hover:text-blue-600"
                      >
                        {category.name}
                      </Link>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${categoryData.total.toFixed(2)} / ${budget.budget.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {spendingPercentage.toFixed(1)}% used
                      </p>
                    </div>
                  </div>

                  {/* Category progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        spendingPercentage >= 100 ? 'bg-red-500' :
                        spendingPercentage >= 90 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, spendingPercentage)}%` }}
                    />
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mt-2">
                    <div>
                      <span className="block text-gray-500">Transactions</span>
                      <span className="font-medium">{categoryData.expenses.length}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500">Avg. Transaction</span>
                      <span className="font-medium">
                        ${categoryData.expenses.length > 0 
                          ? (categoryData.total / categoryData.expenses.length).toFixed(2)
                          : '0.00'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-gray-500">Largest</span>
                      <span className="font-medium">
                        ${Math.max(...categoryData.expenses.map(e => e.amount), 0).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-gray-500">Remaining</span>
                      <span className={`font-medium ${budget.budget - categoryData.total < 0 ? 'text-red-600' : ''}`}>
                        ${(budget.budget - categoryData.total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Monthly Summary Stats */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Monthly Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <h3 className="text-sm text-gray-500 mb-1">Total Transactions</h3>
            <p className="text-xl font-semibold">{expenses.length}</p>
          </div>
          <div>
            <h3 className="text-sm text-gray-500 mb-1">Average Transaction</h3>
            <p className="text-xl font-semibold">
              ${expenses.length > 0 ? (totalSpent / expenses.length).toFixed(2) : '0.00'}
            </p>
          </div>
          <div>
            <h3 className="text-sm text-gray-500 mb-1">Largest Transaction</h3>
            <p className="text-xl font-semibold">
              ${Math.max(...expenses.map(e => e.amount), 0).toFixed(2)}
            </p>
          </div>
          <div>
            <h3 className="text-sm text-gray-500 mb-1">Categories Used</h3>
            <p className="text-xl font-semibold">
              {Object.keys(expensesByCategory).length} of {budgets.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 