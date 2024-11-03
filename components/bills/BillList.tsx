'use client'

import { useState } from 'react'
import { Bill } from '@/types/bills'
import { format } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'
import { updateBill, deleteBill } from '@/services/firebase'
import BillPaymentModal from './BillPaymentModal'

interface Props {
  bills: Bill[]
  onUpdate?: () => void
}

export default function BillList({ bills, onUpdate }: Props) {
  const { user } = useAuth()
  const [sortBy, setSortBy] = useState<'dueDate' | 'amount'>('dueDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filterPaid, setFilterPaid] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)

  const handleTogglePaid = async (bill: Bill) => {
    if (!user) return
    if (bill.isPaid) {
      setLoading(bill.id)
      try {
        await updateBill(user.uid, bill.id, {
          isPaid: false,
          lastPaid: null
        })
        onUpdate?.()
      } catch (error) {
        console.error('Error updating bill:', error)
      } finally {
        setLoading(null)
      }
    } else {
      setSelectedBill(bill)
    }
  }

  const handleDelete = async (billId: string) => {
    if (!user || !window.confirm('Are you sure you want to delete this bill?')) return
    setLoading(billId)
    try {
      await deleteBill(user.uid, billId)
      onUpdate?.()
    } catch (error) {
      console.error('Error deleting bill:', error)
    } finally {
      setLoading(null)
    }
  }

  const sortedAndFilteredBills = bills
    .filter(bill => {
      if (filterPaid === 'paid') return bill.isPaid
      if (filterPaid === 'unpaid') return !bill.isPaid
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        return sortOrder === 'asc'
          ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
      } else {
        return sortOrder === 'asc'
          ? a.amount - b.amount
          : b.amount - a.amount
      }
    })

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={filterPaid}
          onChange={(e) => setFilterPaid(e.target.value as typeof filterPaid)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="all">All Bills</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>

        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSortBy('dueDate')
              setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
            }}
            className={`px-3 py-2 rounded-lg ${
              sortBy === 'dueDate' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
            }`}
          >
            Due Date {sortBy === 'dueDate' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => {
              setSortBy('amount')
              setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
            }}
            className={`px-3 py-2 rounded-lg ${
              sortBy === 'amount' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
            }`}
          >
            Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {sortedAndFilteredBills.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No bills found</p>
        ) : (
          sortedAndFilteredBills.map(bill => (
            <div
              key={bill.id}
              className={`p-4 rounded-lg ${
                bill.isPaid ? 'bg-gray-50' : 'bg-blue-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">{bill.title}</h3>
                  <p className="text-sm text-gray-500">
                    Due: {format(new Date(bill.dueDate), 'MMM d, yyyy')}
                  </p>
                  {bill.description && (
                    <p className="text-sm text-gray-600 mt-1">{bill.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Frequency: {bill.frequency}
                    {bill.lastPaid && ` • Last paid: ${format(new Date(bill.lastPaid), 'MMM d, yyyy')}`}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-semibold text-gray-800">
                    ${bill.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleTogglePaid(bill)}
                    disabled={loading === bill.id}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      bill.isPaid
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {loading === bill.id ? '...' : bill.isPaid ? 'Paid' : 'Mark as Paid'}
                  </button>
                  <button
                    onClick={() => handleDelete(bill.id)}
                    disabled={loading === bill.id}
                    className="p-1 text-gray-500 hover:text-red-500"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedBill && (
        <BillPaymentModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
          onSuccess={() => {
            onUpdate?.()
            setSelectedBill(null)
          }}
        />
      )}
    </div>
  )
} 