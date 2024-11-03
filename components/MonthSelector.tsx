import { useState } from 'react';
import { format, subMonths, addMonths } from 'date-fns';

interface Props {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

export default function MonthSelector({ selectedMonth, onMonthChange }: Props) {
  const handlePreviousMonth = () => {
    onMonthChange(subMonths(selectedMonth, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(selectedMonth, 1);
    if (nextMonth <= new Date()) {
      onMonthChange(nextMonth);
    }
  };

  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
      <button
        onClick={handlePreviousMonth}
        className="p-2 hover:bg-gray-100 rounded-lg"
      >
        ←
      </button>
      
      <h2 className="text-xl font-semibold">
        {format(selectedMonth, 'MMMM yyyy')}
      </h2>
      
      <button
        onClick={handleNextMonth}
        disabled={addMonths(selectedMonth, 1) > new Date()}
        className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
      >
        →
      </button>
    </div>
  );
} 