import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';

interface AdminMultiSelectProps {
  value: string; // Comma separated string e.g. "Proteína, Creatina"
  onChange: (val: string) => void;
  options: { value: string, label: string }[];
  placeholder?: string;
}

const AdminMultiSelect = ({ value, onChange, options, placeholder = 'Selecciona...' }: AdminMultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedValues = value ? value.split(',').map(v => v.trim()).filter(Boolean) : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    let newSelected;
    if (selectedValues.includes(optionValue)) {
      newSelected = selectedValues.filter(v => v !== optionValue);
    } else {
      newSelected = [...selectedValues, optionValue];
    }
    onChange(newSelected.join(', '));
  };

  const removeOption = (e: React.MouseEvent, optionValue: string) => {
    e.stopPropagation();
    const newSelected = selectedValues.filter(v => v !== optionValue);
    onChange(newSelected.join(', '));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full min-h-[46px] gap-2 px-4 py-2 rounded-2xl border transition-all text-sm outline-none bg-gray-50 border-transparent hover:border-gray-200 focus-within:border-black focus-within:bg-white focus-within:ring-4 focus-within:ring-black/5 cursor-pointer`}
      >
        <div className="flex flex-wrap gap-1.5 flex-1">
          {selectedValues.length === 0 ? (
            <span className="font-bold text-gray-400 py-1">{placeholder}</span>
          ) : (
            selectedValues.map(val => {
              const opt = options.find(o => o.value === val);
              return (
                <span key={val} className="flex items-center gap-1 bg-black text-white px-2 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase">
                  {opt ? opt.label : val}
                  <button type="button" onClick={(e) => removeOption(e, val)} className="hover:text-red-400 ml-0.5">
                    <X size={12} />
                  </button>
                </span>
              );
            })
          )}
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="ml-2 shrink-0">
          <ChevronDown size={16} className="text-gray-400" />
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-gray-100 bg-white shadow-2xl z-[100] overflow-hidden"
          >
            <div className="py-1 max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleOption(option.value)}
                    className={`w-full text-left px-4 py-2.5 text-[13px] font-bold transition-colors hover:bg-gray-50 ${isSelected ? '!text-black bg-gray-50' : 'text-gray-500'}`}
                  >
                    <div className="flex items-center justify-between">
                      {option.label}
                      <div className={`w-3 h-3 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-black border-black' : 'border-gray-300'}`}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminMultiSelect;
