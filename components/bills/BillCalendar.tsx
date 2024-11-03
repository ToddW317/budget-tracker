'use client'

import { useState, useMemo } from 'react'
import { Bill } from '@/types/bills'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'
import { generateFutureBillOccurrences, needsAttention } from '@/utils/recurring'

interface Props {
  bills: Bill[]
  onUpdate: () => Promise<void>
}

export default function BillCalendar({ bills, onUpdate }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  // Generate all bill occurrences including recurring ones
  const allBillOccurrences = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    
    return bills.flatMap(bill => {
      if (!bill.isRecurring) {
        const dueDate = parseISO(bill.dueDate)
        if (dueDate >= start && dueDate <= end) {
          return [bill]
        }
        return []
      }
      return generateFutureBillOccurrences(bill).filter(occurrence => {
        const dueDate = parseISO(occurrence.dueDate)
        return dueDate >= start && dueDate <= end
      })
    })
  }, [bills, currentMonth])

  // Group bills by date
  const billsByDate = useMemo(() => {
    const grouped: Record<string, Bill[]> = {}
    allBillOccurrences.forEach(bill => {
      const dateKey = format(parseISO(bill.dueDate), 'yyyy-MM-dd')
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(bill)
    })
    return grouped
  }, [allBillOccurrences])

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handlePreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          ←
        </button>
        <h2 className="text-xl font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Weekday Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-medium text-gray-500 text-sm py-2">
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayBills = billsByDate[dateKey] || []
          const hasUnpaidBills = dayBills.some(bill => !bill.isPaid)
          const hasAttentionBills = dayBills.some(bill => needsAttention(bill))

          return (
            <div
              key={dateKey}
              className={`min-h-[100px] p-2 border rounded-lg ${
                hasUnpaidBills ? 'bg-red-50' : 
                hasAttentionBills ? 'bg-yellow-50' : 
                'bg-white'
              }`}
            >
              <div className="text-right text-sm text-gray-500 mb-2">
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayBills.map(bill => (
                  <div
                    key={`${bill.id}_${bill.dueDate}`}
                    className={`text-sm p-1 rounded ${
                      bill.isPaid ? 'bg-green-100 text-green-800' : 
                      needsAttention(bill) ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    <div className="font-medium truncate">{bill.title}</div>
                    <div className="text-xs">${bill.amount.toFixed(2)}</div>
                    {bill.isRecurring && (
                      <div className="text-xs italic">
                        {bill.frequency}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-end space-x-4 text-sm mt-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-100 rounded-full mr-2"></div>
          <span>Paid</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-100 rounded-full mr-2"></div>
          <span>Due Soon</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-100 rounded-full mr-2"></div>
          <span>Unpaid</span>
        </div>
      </div>
    </div>
  )
} 