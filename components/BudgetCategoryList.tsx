import { Category } from './BudgetDashboard'

export default function BudgetCategoryList({ categories }: { categories: Category[] }) {
  return (
    <div className="space-y-4 mt-4">
      {categories.map((category) => {
        const remaining = category.budget - category.spent;
        const percentSpent = (category.spent / category.budget) * 100;
        const progressBarColor = 
          percentSpent >= 90 ? 'bg-red-600' :
          percentSpent >= 75 ? 'bg-yellow-500' :
          'bg-blue-600';

        return (
          <div
            key={category.id}
            className="p-4 bg-white rounded-lg shadow"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">{category.name}</h3>
              <div className="text-right">
                <span className="text-sm text-gray-500">
                  ${category.spent} / ${category.budget}
                </span>
                <p className={`text-sm font-medium ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${remaining.toFixed(2)} remaining
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`${progressBarColor} h-2.5 rounded-full transition-all duration-300`}
                style={{
                  width: `${Math.min(100, percentSpent)}%`,
                }}
              ></div>
            </div>
          </div>
        )
      })}
    </div>
  )
} 