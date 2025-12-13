
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';

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
  searchable?: boolean; // New prop to enable/disable search
  searchPlaceholder?: string;
}

// Utility function to remove Vietnamese accents for better search
const removeVietnameseAccents = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritical marks
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  icon,
  disabled = false,
  searchable = true, // Default to true
  searchPlaceholder = "Search..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const triggerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsContainerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  // Normalize options
  const normalizedOptions: SelectOption[] = options.map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  // Filter options based on search query (accent-insensitive)
  const filteredOptions = searchable && searchQuery
    ? normalizedOptions.filter(opt => {
      const normalizedLabel = removeVietnameseAccents(opt.label);
      const normalizedQuery = removeVietnameseAccents(searchQuery);
      return normalizedLabel.includes(normalizedQuery);
    })
    : normalizedOptions;

  // Separate selectable options (non-disabled)
  const selectableOptions = filteredOptions.filter(opt => !opt.disabled);

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

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      // Small delay to ensure portal is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    // Reset search when closing
    if (!isOpen) {
      setSearchQuery('');
      setHighlightedIndex(-1);
    }
  }, [isOpen, searchable]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < selectableOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < selectableOptions.length) {
          handleSelect(selectableOptions[highlightedIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsContainerRef.current) {
      const highlightedElement = optionsContainerRef.current.querySelector(
        `[data-option-index="${highlightedIndex}"]`
      ) as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex]);

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 640; // sm breakpoint
      const dropdownHeight = Math.min(options.length * 48 + 60, isMobile ? 300 : 350); // Larger items on mobile
      const spaceBelow = window.innerHeight - rect.bottom;

      let top = rect.bottom + 4;
      let left = rect.left;
      let width = rect.width;

      // On mobile, make dropdown wider and centered if needed
      if (isMobile) {
        const padding = 16;
        const maxWidth = window.innerWidth - (padding * 2);

        if (width < maxWidth) {
          // Center the dropdown if trigger is narrow
          const centerOffset = (maxWidth - width) / 2;
          left = Math.max(padding, left - centerOffset);
          width = Math.min(maxWidth, width + (centerOffset * 2));
        }

        // Ensure dropdown doesn't go off-screen
        if (left + width > window.innerWidth - padding) {
          left = window.innerWidth - width - padding;
        }
        if (left < padding) {
          left = padding;
          width = window.innerWidth - (padding * 2);
        }
      }

      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        top = rect.top - dropdownHeight - 4;
      }

      setPosition({
        top,
        left,
        width
      });
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  const selectedOption = normalizedOptions.find(o => o.value === value);

  // Highlight matching text in label
  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 text-gray-900 font-semibold">{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <>
      <div
        ref={triggerRef}
        onClick={toggleOpen}
        className={`relative flex items-center w-full bg-white border rounded-lg transition-all cursor-pointer group min-h-[44px] sm:min-h-0 ${className} ${isOpen ? 'ring-2 ring-green-500 border-transparent' : 'border-gray-200 hover:border-green-300'} ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
      >
        {icon && (
          <div className="pl-3 text-gray-400">
            {icon}
          </div>
        )}
        <div className={`flex-1 p-3 sm:p-2.5 text-sm truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900 font-medium'}`}>
          {selectedOption ? (
            <div className="flex items-center gap-2">
              {selectedOption.color && (
                <span className="w-3 h-3 sm:w-2.5 sm:h-2.5 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: selectedOption.color }}></span>
              )}
              {selectedOption.label}
            </div>
          ) : placeholder}
        </div>
        <div className="pr-3 text-gray-400">
          <ChevronDown size={18} className={`sm:w-4 sm:h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && createPortal(
        <div
          id="select-portal"
          className="fixed bg-white rounded-xl shadow-xl border border-gray-100 z-[9999] overflow-hidden animate-fade-in"
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
          }}
          onKeyDown={handleKeyDown}
        >
          {/* Search Input */}
          {searchable && (
            <div className="p-2 sm:p-2 border-b border-gray-100 bg-gray-50">
              <div className="relative">
                <Search size={18} className="sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0); // Reset to first option when searching
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-3 py-3 sm:py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all min-h-[44px] sm:min-h-0"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div
            ref={optionsContainerRef}
            className="max-h-[250px] overflow-y-auto custom-scrollbar"
          >
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-sm text-gray-400 text-center">
                {searchQuery ? `No results for "${searchQuery}"` : 'No options available'}
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const selectableIndex = selectableOptions.findIndex(o => o.value === opt.value);
                const isHighlighted = selectableIndex === highlightedIndex;

                return (
                  <div
                    key={opt.value}
                    data-option-index={selectableIndex}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!opt.disabled) handleSelect(opt.value);
                    }}
                    onMouseEnter={() => {
                      if (!opt.disabled) setHighlightedIndex(selectableIndex);
                    }}
                    className={`px-3 sm:px-3 flex items-center justify-between transition-colors 
                      ${opt.disabled
                        ? 'py-2 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-default border-y border-gray-100 first:border-t-0'
                        : 'py-3 sm:py-2.5 cursor-pointer min-h-[44px] sm:min-h-0 ' + (
                          isHighlighted
                            ? 'bg-green-100 text-green-800 font-medium'
                            : opt.value === value
                              ? 'bg-green-50 text-green-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                        )
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      {opt.color && (
                        <span className="w-3 h-3 sm:w-2.5 sm:h-2.5 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: opt.color }}></span>
                      )}
                      <span className="text-sm sm:text-sm">
                        {searchable && searchQuery ? highlightText(opt.label, searchQuery) : opt.label}
                      </span>
                    </div>
                    {opt.value === value && !opt.disabled && <Check size={16} className="flex-shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
