import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface AdminSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string, label: string }[];
  placeholder?: string;
  disabled?: boolean;
}

const AdminSelect = ({ value, onChange, options, placeholder = 'Selecciona...', disabled = false }: AdminSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full gap-3 px-4 py-3 rounded-2xl border transition-all text-sm outline-none 
          ${disabled
            ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-50 border-transparent hover:border-gray-200 text-black focus:border-black focus:bg-white focus:ring-4 focus:ring-black/5 cursor-pointer'
          }
        `}
      >
        <span className="font-bold text-left break-words pr-2">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className={disabled ? 'text-gray-300' : 'text-gray-400'} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }} // Reducido el salto de Y
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            // CLAVE: max-h-48 y overflow-y-auto para evitar que se escape del modal
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-gray-100 bg-white shadow-2xl z-[100] overflow-hidden"
          >
            <div className="py-1 max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-[13px] font-bold transition-colors hover:bg-gray-50 ${value === option.value ? 'text-black bg-gray-50' : 'text-gray-500'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    {option.label}
                    {value === option.value && (
                      <div className="w-1.5 h-1.5 rounded-full bg-black" /> // Indicador discreto de selección
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSelect;