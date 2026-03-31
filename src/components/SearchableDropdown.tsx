import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '../lib/utils';

interface SearchableDropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
}

export default function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  label,
  error,
  required
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-1.5" ref={dropdownRef}>
      {label && (
        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-900 border rounded-xl transition-all duration-200 text-left",
            isOpen ? "border-neutral-900 dark:border-white ring-2 ring-neutral-900/5 dark:ring-white/5" : "border-neutral-200 dark:border-neutral-800",
            error ? "border-red-500" : ""
          )}
        >
          <span className={cn(!value && "text-neutral-400")}>
            {value || placeholder}
          </span>
          <ChevronDown size={18} className={cn("transition-transform duration-200", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Type to search..."
                  className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800 border-none rounded-lg text-sm focus:ring-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={cn(
                      "w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors",
                      value === option && "bg-neutral-50 dark:bg-neutral-800 font-semibold"
                    )}
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                  >
                    {option}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-neutral-500 text-center">
                  No results found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
