'use client'

import { useState } from 'react'
import { Bill } from '@/types/bills'
import { format, parseISO, isBefore, addDays } from 'date-fns'
import { needsAttention } from '@/utils/recurring'
import { toggleBillPaid } from '@/services/firebase'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  bills: Bill[]
  onUpdate: () => Promise<void>
}

export default function BillList({ bills, onUpdate }: Props) {
  const { user } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)

  const sortedBills = [...bills].sort((a, b) => {
    const dateA = parseISO(a.dueDate)
    const dateB = parseISO(b.dueDate)
    return dateA.getTime() - dateB.getTime()
  })

  const handleTogglePaid = async (bill: Bill) => {
    if (!user || loading) return
    setLoading(bill.id)
    try {
      await toggleBillPaid(user.uid, bill.id, bill)
      await onUpdate()
    } catch (error) {
      console.error('Error toggling bill paid status:', error)
    } finally {
      setLoading(null)
    }
  }

  const getBillStatus = (bill: Bill) => {
    if (bill.isPaid) return 'paid'
    if (needsAttention(bill)) return 'due-soon'
    if (isBefore(parseISO(bill.dueDate), new Date())) return 'overdue'
    return 'upcoming'
  }

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'due-soon':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Bills</h3>
        <div className="flex space-x-2 text-sm">
          <span className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
            Paid
          </span>
          <span className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
            Due Soon
          </span>
          <span className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
            Overdue
          </span>
        </div>
      </div>

      {sortedBills.length === 0 ? (
        <p className="text-center text-gray-500 py-4">No bills found</p>
      ) : (
        <div className="divide-y">
          {sortedBills.map(bill => {
            const status = getBillStatus(bill)
            const statusStyles = getStatusStyles(status)

            return (
              <div
                key={bill.id}
                className="py-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg px-4"
              >
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={bill.isPaid}
                    onChange={() => handleTogglePaid(bill)}
                    disabled={loading === bill.id}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{bill.title}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>${bill.amount.toFixed(2)}</span>
                      <span>•</span>
                      <span>Due {format(parseISO(bill.dueDate), 'MMM d, yyyy')}</span>
                      {bill.isRecurring && (
                        <>
                          <span>•</span>
                          <span className="italic">
                            {bill.frequency}
                            {bill.customFrequencyDays && ` (${bill.customFrequencyDays} days)`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles}`}>
                    {status.replace('-', ' ').toUpperCase()}
                  </span>
                  {bill.lastPaid && (
                    <span className="text-sm text-gray-500">
                      Last paid: {format(parseISO(bill.lastPaid), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Total Bills</h4>
            <p className="text-2xl font-semibold">
              ${bills.reduce((sum, bill) => sum + bill.amount, 0).toFixed(2)}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Paid</h4>
            <p className="text-2xl font-semibold text-green-600">
              ${bills.filter(b => b.isPaid).reduce((sum, bill) => sum + bill.amount, 0).toFixed(2)}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Remaining</h4>
            <p className="text-2xl font-semibold text-red-600">
              ${bills.filter(b => !b.isPaid).reduce((sum, bill) => sum + bill.amount, 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 