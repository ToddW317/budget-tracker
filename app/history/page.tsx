'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import MonthSelector from '@/components/MonthSelector';
import { getMonthlyBudgets, getMonthlyExpenses, getUserCategories, getOrCreateMonthlyBudgets } from '@/services/firebase';
import { MonthlyBudget, Expense, Category } from '@/components/BudgetDashboard';
import MonthlyBreakdown from '@/components/MonthlyBreakdown';

export default function HistoryPage() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [monthlyBudgets, setMonthlyBudgets] = useState<MonthlyBudget[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadMonthData = async () => {
      setLoading(true);
      setError(null);
      try {
        const monthStr = format(selectedMonth, 'yyyy-MM');
        const [budgets, expenses, cats] = await Promise.all([
          getOrCreateMonthlyBudgets(user.uid, monthStr),
          getMonthlyExpenses(user.uid, monthStr),
          getUserCategories(user.uid)
        ]);
        setMonthlyBudgets(budgets);
        setMonthlyExpenses(expenses);
        setCategories(cats);
      } catch (error: any) {
        console.error('Error loading month data:', error);
        if (error.message?.includes('requires an index')) {
          setError('Database indexes are being built. This may take a few minutes.');
        } else {
          setError('Failed to load data');
        }
      }
      setLoading(false);
    };

    loadMonthData();
  }, [user, selectedMonth]);

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Budget History</h1>
        <MonthSelector 
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <MonthlyBreakdown
          budgets={monthlyBudgets}
          expenses={monthlyExpenses}
          month={selectedMonth}
          categories={categories}
        />
      )}
    </div>
  );
} 