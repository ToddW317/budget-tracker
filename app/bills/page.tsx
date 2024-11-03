'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import BillCalendar from '@/components/bills/BillCalendar'
import BillList from '@/components/bills/BillList'
import AddBillForm from '@/components/bills/AddBillForm'
import IncomeTracker from '@/components/bills/IncomeTracker'
import { getUserBills, getUserIncomes } from '@/services/firebase'
import { Bill, Income } from '@/types/bills'

export default function BillsPage() {
  const { user } = useAuth()
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [bills, setBills] = useState<Bill[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddBill, setShowAddBill] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [billsData, incomesData] = await Promise.all([
        getUserBills(user.uid),
        getUserIncomes(user.uid)
      ])
      setBills(billsData)
      setIncomes(incomesData)
    } catch (err) {
      setError('Failed to load data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleBillsUpdate = async () => {
    await loadData()
  }

  const handleIncomesUpdate = async () => {
    await loadData()
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p>Please sign in to view your bills and income</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Bills & Income Tracker</h1>
        <div className="flex space-x-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-lg ${
                view === 'calendar' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Calendar View
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-lg ${
                view === 'list' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              List View
            </button>
          </div>
          <button
            onClick={() => setShowAddBill(!showAddBill)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            {showAddBill ? 'Hide Form' : 'Add New Bill'}
          </button>
        </div>
      </div>

      {/* Add Bill Form (Collapsible) */}
      {showAddBill && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Add New Bill</h2>
          <AddBillForm 
            onSuccess={(newBill) => {
              setBills(prev => [...prev, newBill])
              setShowAddBill(false)
            }} 
          />
        </div>
      )}

      {/* Main Calendar/List View */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {view === 'calendar' ? (
          <BillCalendar 
            bills={bills} 
            onUpdate={handleBillsUpdate}
          />
        ) : (
          <BillList 
            bills={bills} 
            onUpdate={handleBillsUpdate}
          />
        )}
      </div>

      {/* Income Tracker Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Income Tracker</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Total Monthly Income: 
              <span className="ml-2 font-semibold text-green-600">
                ${incomes.reduce((sum, income) => sum + income.amount, 0).toFixed(2)}
              </span>
            </span>
          </div>
        </div>
        <IncomeTracker 
          incomes={incomes} 
          onUpdate={handleIncomesUpdate}
        />
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="text-sm font-medium text-blue-800">Total Bills</h3>
          <p className="text-2xl font-bold text-blue-900">
            ${bills.reduce((sum, bill) => sum + bill.amount, 0).toFixed(2)}/month
          </p>
        </div>
        <div className="bg-green-50 rounded-xl p-6">
          <h3 className="text-sm font-medium text-green-800">Total Income</h3>
          <p className="text-2xl font-bold text-green-900">
            ${incomes.reduce((sum, income) => sum + income.amount, 0).toFixed(2)}/month
          </p>
        </div>
        <div className="bg-purple-50 rounded-xl p-6">
          <h3 className="text-sm font-medium text-purple-800">Net Income</h3>
          <p className="text-2xl font-bold text-purple-900">
            ${(
              incomes.reduce((sum, income) => sum + income.amount, 0) -
              bills.reduce((sum, bill) => sum + bill.amount, 0)
            ).toFixed(2)}/month
          </p>
        </div>
      </div>
    </div>
  )
} 