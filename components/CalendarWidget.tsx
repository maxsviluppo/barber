
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Booking } from '../types';

interface CalendarWidgetProps {
  bookings: Booking[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onClose: () => void;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ bookings, selectedDate, onSelectDate, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    // 0 = Sunday, 1 = Monday, etc.
    // Adjust to make Monday = 0, Sunday = 6
    let day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthData = useMemo(() => {
    const days = [];
    const totalDays = daysInMonth(currentMonth);
    const startDay = firstDayOfMonth(currentMonth);
    
    // Empty slots for previous month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Days of current month
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      
      const hasBooking = bookings.some(b => b.date === dateStr && b.status !== 'cancelled');
      days.push({ day: i, dateStr, hasBooking });
    }
    
    return days;
  }, [currentMonth, bookings]);

  const monthName = currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-xl border border-zinc-100 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black capitalize text-zinc-900">{monthName}</h3>
        <div className="flex gap-2">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={handleNextMonth} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
          <div key={day} className="text-center text-[10px] font-black text-zinc-400 uppercase tracking-wider py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthData.map((item, index) => {
          if (!item) return <div key={`empty-${index}`} className="aspect-square" />;
          
          const isSelected = item.dateStr === selectedDate;
          
          // Fix today check using local time
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          const isToday = item.dateStr === todayStr;

          return (
            <button
              key={item.dateStr}
              onClick={() => {
                onSelectDate(item.dateStr);
                onClose();
              }}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all ${
                isSelected 
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-200 scale-105 font-black' 
                  : isToday
                    ? 'bg-amber-50 text-amber-700 font-bold border border-amber-200'
                    : 'hover:bg-zinc-50 text-zinc-700 font-medium'
              }`}
            >
              <span className="text-sm">{item.day}</span>
              {item.hasBooking && !isSelected && (
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1" />
              )}
              {isSelected && (
                <div className="w-1.5 h-1.5 rounded-full bg-white mt-1" />
              )}
            </button>
          );
        })}
      </div>
      
      <button 
        onClick={onClose}
        className="w-full mt-6 py-3 bg-zinc-100 text-zinc-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors"
      >
        Chiudi Calendario
      </button>
    </div>
  );
};

export default CalendarWidget;
