
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | SelectOption)[];
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  icon,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  // Handle outside click & scroll
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        const portal = document.getElementById('select-portal');
        if (portal && !portal.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    const handleScroll = (event: Event) => {
      const portal = document.getElementById('select-portal');
      const target = event.target as Node;
      // If scrolling inside the dropdown, don't close.
      if (portal && portal.contains(target)) {
        return;
      }
      // Otherwise close
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', () => setIsOpen(false));
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', () => setIsOpen(false));
    };
  }, [isOpen]);

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownHeight = Math.min(options.length * 40 + 10, 300); // Estimate max height
      const spaceBelow = window.innerHeight - rect.bottom;
      
      let top = rect.bottom + 4;
      let left = rect.left;
      
      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
         top = rect.top - dropdownHeight - 4;
      }

      setPosition({
        top,
        left,
        width: rect.width
      });
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const normalizedOptions: SelectOption[] = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find(o => o.value === value);

  return (
    <>
      <div 
        ref={triggerRef}
        onClick={toggleOpen}
        className={`relative flex items-center w-full bg-white border rounded-lg transition-all cursor-pointer group ${className} ${isOpen ? 'ring-2 ring-green-500 border-transparent' : 'border-gray-200 hover:border-green-300'} ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
      >
        {icon && (
          <div className="pl-3 text-gray-400">
             {icon}
          </div>
        )}
        <div className={`flex-1 p-2.5 text-sm truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900 font-medium'}`}>
           {selectedOption ? (
             <div className="flex items-center gap-2">
               {selectedOption.color && (
                 <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: selectedOption.color }}></span>
               )}
               {selectedOption.label}
             </div>
           ) : placeholder}
        </div>
        <div className="pr-3 text-gray-400">
          <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && createPortal(
        <div 
          id="select-portal"
          className="fixed bg-white rounded-xl shadow-xl border border-gray-100 z-[9999] overflow-hidden animate-fade-in custom-scrollbar"
          style={{ 
            top: position.top, 
            left: position.left, 
            width: position.width,
            maxHeight: '300px',
            overflowY: 'auto'
          }}
        >
          {normalizedOptions.length === 0 ? (
             <div className="p-3 text-sm text-gray-400 text-center">No options available</div>
          ) : (
            normalizedOptions.map(opt => (
              <div
                key={opt.value}
                onClick={(e) => { 
                    e.stopPropagation(); 
                    if (!opt.disabled) handleSelect(opt.value); 
                }}
                className={`px-3 flex items-center justify-between transition-colors 
                  ${opt.disabled 
                    ? 'py-2 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-default border-y border-gray-100 first:border-t-0' 
                    : 'py-2.5 cursor-pointer ' + (opt.value === value ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-50')
                  }`}
              >
                <div className="flex items-center gap-2">
                   {opt.color && (
                     <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: opt.color }}></span>
                   )}
                   {opt.label}
                </div>
                {opt.value === value && !opt.disabled && <Check size={14} />}
              </div>
            ))
          )}
        </div>,
        document.body
      )}
    </>
  );
};
