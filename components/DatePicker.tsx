
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  minDate?: string;
  maxDate?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ 
  value, 
  onChange, 
  placeholder = "Select date", 
  className = "",
  minDate,
  maxDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const triggerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  // Initialize view date from value
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        setViewDate(new Date(y, m - 1, 1));
      }
    }
  }, [value, isOpen]);

  // Handle outside click & scroll
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        // Check if click is inside the portal content (which is not in triggerRef)
        const portal = document.getElementById('datepicker-portal');
        if (portal && !portal.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    const handleScroll = (event: Event) => {
      const portal = document.getElementById('datepicker-portal');
      const target = event.target as Node;
      // If scrolling inside the dropdown (unlikely for datepicker but safe to have), don't close
      if (portal && portal.contains(target)) {
        return;
      }
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Close on scroll to prevent detachment, but allow internal scrolling
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', () => setIsOpen(false));
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', () => setIsOpen(false));
    };
  }, [isOpen]);

  const toggleCalendar = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      
      // Calculate position (prefer bottom, flip to top if no space)
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 320; // Approx height
      
      // For fixed positioning, use viewport coordinates directly.
      let top = rect.bottom + 4;
      let left = rect.left;

      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
         top = rect.top - dropdownHeight - 4;
      }

      setPosition({
        top,
        left,
        width: rect.width
      });
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + 1;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // Calendar Logic
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay(); // 0 = Sun
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Generate grid
  const blanks = Array(firstDayOfMonth).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const totalSlots = [...blanks, ...days];

  return (
    <>
      <div 
        ref={triggerRef}
        className={`relative flex items-center w-full bg-white border rounded-lg transition-all cursor-pointer group ${className} ${isOpen ? 'ring-2 ring-green-500 border-transparent' : 'border-gray-200 hover:border-green-300'}`}
        onClick={toggleCalendar}
      >
        <div className="pl-3 text-gray-400">
           <Calendar size={18} />
        </div>
        <div className={`flex-1 p-2.5 text-sm ${!value ? 'text-gray-400' : 'text-gray-900 font-medium'}`}>
           {value || placeholder}
        </div>
        {value && (
          <div 
             className="pr-2 text-gray-400 hover:text-red-500 transition-colors z-10 p-1"
             onClick={handleClear}
          >
             <X size={16} />
          </div>
        )}
      </div>

      {isOpen && createPortal(
        <div 
          id="datepicker-portal"
          className="fixed bg-white rounded-xl shadow-xl border border-gray-100 z-[9999] overflow-hidden animate-fade-in"
          style={{ 
            top: position.top, 
            left: position.left, 
            minWidth: '280px',
            maxWidth: '320px' 
          }}
        >
          {/* Header */}
          <div className="bg-gray-50 p-3 flex justify-between items-center border-b border-gray-100">
             <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
               <ChevronLeft size={20} />
             </button>
             <span className="font-semibold text-gray-800">
               {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
             </span>
             <button onClick={handleNextMonth} className="p-1 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
               <ChevronRight size={20} />
             </button>
          </div>

          {/* Grid */}
          <div className="p-3">
            <div className="grid grid-cols-7 mb-2">
              {weekDays.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {totalSlots.map((day, index) => {
                if (!day) return <div key={`blank-${index}`} />;
                
                const currentStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = value === currentStr;
                const isToday = new Date().toISOString().split('T')[0] === currentStr;
                
                let isDisabled = false;
                if (minDate && currentStr < minDate) isDisabled = true;
                if (maxDate && currentStr > maxDate) isDisabled = true;

                return (
                  <button
                    key={day}
                    onClick={(e) => { e.stopPropagation(); !isDisabled && handleDateSelect(day); }}
                    disabled={isDisabled}
                    className={`
                      h-8 w-8 rounded-full text-sm flex items-center justify-center transition-all
                      ${isSelected 
                        ? 'bg-green-600 text-white shadow-sm font-bold' 
                        : isToday 
                          ? 'bg-green-50 text-green-700 font-semibold border border-green-200' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }
                      ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="p-2 border-t border-gray-100 bg-gray-50 flex justify-center">
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 const today = new Date();
                 const str = today.toISOString().split('T')[0];
                 onChange(str);
                 setIsOpen(false);
               }}
               className="text-xs font-medium text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-100 transition-colors"
             >
               Jump to Today
             </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
