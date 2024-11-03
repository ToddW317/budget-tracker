'use client'

import { useState } from 'react'
import { Bill } from '@/types/bills'
import { addDays, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'
import { updateBill } from '@/services/firebase'
import { formatDateForDB, formatDateForDisplay, isSameDate } from '@/utils/dates'
import BillPaymentModal from './BillPaymentModal'

interface Props {
  bills: Bill[]
  onUpdate?: () => void
}

interface CalendarDayProps {
  date: Date
  bills: Bill[]
  onDayClick: (date: Date) => void
  isCurrentMonth: boolean
}

function CalendarDay({ date, bills, onDayClick, isCurrentMonth }: CalendarDayProps) {
  const dayBills = bills.filter(bill => isSameDate(bill.dueDate, date))
  const totalAmount = dayBills.reduce((sum, bill) => sum + bill.amount, 0)

  return (
    <button
      onClick={() => onDayClick(date)}
      className={`min-h-32 p-2 border hover:bg-gray-50 transition-colors relative flex flex-col ${
        !isCurrentMonth ? 'bg-gray-50 text-gray-400' :
        dayBills.length > 0 ? 'bg-blue-50' : ''
      }`}
    >
      <span className="text-sm">
        {format(date, 'd')}
      </span>
      {dayBills.length > 0 && (
        <div className="mt-1">
          <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
            ${totalAmount.toFixed(2)}
          </span>
          <div className="mt-2 space-y-1">
            {dayBills.map((bill, index) => (
              <div
                key={bill.id}
                className={`text-xs truncate ${
                  index >= 2 ? 'hidden' : ''
                }`}
              >
                {bill.title}
              </div>
            ))}
            {dayBills.length > 2 && (
              <div className="text-xs text-gray-500">
                +{dayBills.length - 2} more
              </div>
            )}
          </div>
        </div>
      )}
    </button>
  )
}

export default function BillCalendar({ bills, onUpdate }: Props) {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarDays = eachDayOfInterval({ 
    start: calendarStart, 
    end: addDays(monthEnd, 42 - eachDayOfInterval({ start: calendarStart, end: monthEnd }).length)
  })

  const handlePrevMonth = () => {
    setCurrentDate(prev => addDays(prev, -30))
    setSelectedDate(null)
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => addDays(prev, 30))
    setSelectedDate(null)
  }

  const handleTogglePaid = async (bill: Bill) => {
    if (!user) return
    if (bill.isPaid) {
      // If already paid, just unpay it
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
      // If unpaid, show payment modal
      setSelectedBill(bill)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ←
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="bg-gray-50 p-2 text-center text-sm font-medium"
          >
            {day}
          </div>
        ))}
        {calendarDays.map(day => (
          <CalendarDay
            key={day.toISOString()}
            date={day}
            bills={bills}
            onDayClick={setSelectedDate}
            isCurrentMonth={day.getMonth() === currentDate.getMonth()}
          />
        ))}
      </div>

      {selectedDate && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">
            Bills for {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          <div className="space-y-3">
            {bills
              .filter(bill => isSameDay(new Date(bill.dueDate), selectedDate))
              .map(bill => (
                <div
                  key={bill.id}
                  className={`p-4 rounded-lg ${
                    bill.isPaid ? 'bg-gray-50' : 'bg-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{bill.title}</h4>
                      <p className="text-sm text-gray-600">{bill.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Frequency: {bill.frequency}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold">
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
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

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