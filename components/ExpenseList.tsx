import { Category, Expense } from './BudgetDashboard'

export default function ExpenseList({
  expenses,
  categories,
}: {
  expenses: Expense[]
  categories: Category[]
}) {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Recent Expenses</h3>
      <div className="space-y-2">
        {expenses.map((expense) => {
          const category = categories.find((c) => c.id === expense.categoryId)
          return (
            <div
              key={expense.id}
              className="p-3 bg-white rounded-lg shadow flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{expense.description}</p>
                <p className="text-sm text-gray-500">{category?.name}</p>
              </div>
              <p className="font-semibold">${expense.amount}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
} 