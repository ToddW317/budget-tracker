'use client'

import { useState, useMemo } from 'react'
import { Bill } from '@/types/bills'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'
import { generateFutureBillOccurrences, needsAttention } from '@/utils/recurring'
import EditBillModal from './EditBillModal'

interface Props {
  bills: Bill[]
  onUpdate: () => Promise<void>
}

export default function BillCalendar({ bills, onUpdate }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)

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
    setSelectedDate(null)
  }

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))
    setSelectedDate(null)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  const handleBillClick = (bill: Bill) => {
    // If it's a recurring occurrence, use the original bill ID
    const originalBill = {
      ...bill,
      id: bill.id.split('_')[0] // Get the original bill ID
    };
    setSelectedBill(originalBill);
  };

  const selectedDateBills = selectedDate 
    ? billsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : []

  return (
    <div className="space-y-4 max-w-full overflow-x-hidden">
      {/* Calendar Header - made more compact */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePreviousMonth}
          className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg"
        >
          ←
        </button>
        <h2 className="text-lg sm:text-xl font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg"
        >
          →
        </button>
      </div>

      {/* Calendar Grid - adjusted for mobile */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {/* Weekday Headers - more compact on mobile */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
          <div key={day} className="text-center font-medium text-gray-500 text-xs sm:text-sm py-1">
            {day}
          </div>
        ))}

        {/* Calendar Days - simplified for mobile */}
        {calendarDays.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayBills = billsByDate[dateKey] || []
          const hasUnpaidBills = dayBills.some(bill => !bill.isPaid)
          const hasAttentionBills = dayBills.some(bill => needsAttention(bill))
          const isSelected = selectedDate && isSameDay(day, selectedDate)

          return (
            <div
              key={dateKey}
              onClick={() => handleDateClick(day)}
              className={`min-h-[60px] sm:min-h-[100px] p-1 sm:p-2 border rounded-lg cursor-pointer transition-all duration-200 ${
                isSelected ? 'ring-2 ring-blue-500 shadow-lg' :
                hasUnpaidBills ? 'bg-red-50 hover:bg-red-100' : 
                hasAttentionBills ? 'bg-yellow-50 hover:bg-yellow-100' : 
                'bg-white hover:bg-gray-50'
              }`}
            >
              <div className="text-right text-xs sm:text-sm text-gray-500">
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                {dayBills.slice(0, 1).map(bill => (
                  <div
                    key={`${bill.id}_${bill.dueDate}`}
                    className={`text-xs sm:text-sm p-0.5 sm:p-1 rounded cursor-pointer ${
                      bill.isPaid ? 'bg-green-100 text-green-800' : 
                      needsAttention(bill) ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    <div className="font-medium truncate">{bill.title}</div>
                  </div>
                ))}
                {dayBills.length > 1 && (
                  <div className="text-[10px] sm:text-xs text-gray-500 text-center">
                    +{dayBills.length - 1}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Date Bills - made more compact for mobile */}
      {selectedDate && (
        <div className="mt-4 sm:mt-8 bg-gray-50 rounded-lg p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-semibold mb-3">
            Bills for {format(selectedDate, 'MMM d, yyyy')}
          </h3>
          {selectedDateBills.length === 0 ? (
            <p className="text-gray-500 text-center py-2 sm:py-4">No bills due on this date</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {selectedDateBills.map(bill => (
                <div
                  key={bill.id}
                  onClick={() => handleBillClick(bill)}
                  className={`p-2 sm:p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                    bill.isPaid ? 'bg-green-50 hover:bg-green-100' :
                    needsAttention(bill) ? 'bg-yellow-50 hover:bg-yellow-100' :
                    'bg-red-50 hover:bg-red-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-sm sm:text-base">{bill.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        ${bill.amount.toFixed(2)}
                        {bill.isRecurring && (
                          <span className="ml-2 italic">
                            ({bill.frequency}
                            {bill.customFrequencyDays && ` every ${bill.customFrequencyDays} days`})
                          </span>
                        )}
                      </p>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-xs sm:text-sm ${
                      bill.isPaid ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {bill.isPaid ? 'Paid' : 'Unpaid'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend - simplified for mobile */}
      <div className="flex justify-end flex-wrap gap-2 text-xs sm:text-sm mt-2 sm:mt-4">
        <div className="flex items-center">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-100 rounded-full mr-1 sm:mr-2"></div>
          <span>Paid</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-100 rounded-full mr-1 sm:mr-2"></div>
          <span>Due Soon</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-100 rounded-full mr-1 sm:mr-2"></div>
          <span>Unpaid</span>
        </div>
      </div>

      {/* Edit Bill Modal */}
      {selectedBill && (
        <EditBillModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  )
} 