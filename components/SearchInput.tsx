
import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = ""
}) => {
  return (
    <div className={`relative group ${className}`}>
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors pointer-events-none">
        <Search size={16} />
      </div>
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-3.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-green-300 transition-all placeholder-gray-400 text-gray-900 shadow-sm"
      />
      {value && (
        <button 
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-red-500 p-0.5 rounded-full transition-colors"
          title="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
