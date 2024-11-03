'use client'

import { useState, useEffect } from 'react'
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

  const loadData = async () => {
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
  }

  useEffect(() => {
    loadData()
  }, [user])

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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Bills & Income Calendar</h1>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {view === 'calendar' ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <BillCalendar 
                bills={bills} 
                onUpdate={handleBillsUpdate}
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <BillList 
                bills={bills} 
                onUpdate={handleBillsUpdate}
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Add New Bill</h2>
            <AddBillForm 
              onSuccess={(newBill) => {
                setBills(prev => [...prev, newBill])
              }} 
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Income Tracker</h2>
            <IncomeTracker 
              incomes={incomes} 
              onUpdate={handleIncomesUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 