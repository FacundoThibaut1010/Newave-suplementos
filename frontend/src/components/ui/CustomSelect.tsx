import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string, label: string }[];
  placeholder?: string;
  darkTheme?: boolean;
  icon?: React.ReactNode;
}

const CustomSelect = ({ value, onChange, options, placeholder, darkTheme = false, icon }: CustomSelectProps) => {
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

  const baseText = darkTheme ? 'text-white' : 'text-[#202A36]';
  const baseBorder = darkTheme ? 'border-white/20' : 'border-gray-200';
  const hoverBorder = darkTheme ? 'hover:border-white/40' : 'hover:border-gray-300';
  const menuBg = darkTheme ? 'bg-[#1A1A1A]' : 'bg-white';
  const menuBorder = darkTheme ? 'border-white/10' : 'border-gray-100';
  const itemHover = darkTheme ? 'hover:bg-white/5' : 'hover:bg-gray-50';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-3 px-6 py-3 rounded-full border ${baseBorder} ${hoverBorder} transition-all min-w-[180px] bg-transparent outline-none focus:border-[#CAA959]`}
      >
        <div className="flex items-center gap-2">
          {icon && <span className={`${baseText}`}>{icon}</span>}
          <span className={`text-[10px] font-bold uppercase tracking-widest ${baseText}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className={baseText} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute top-full right-0 mt-2 w-full min-w-[220px] rounded-2xl border ${menuBorder} ${menuBg} shadow-2xl overflow-hidden z-50`}
          >
            <div className="py-2">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${itemHover} ${
                    value === option.value ? 'text-[#CAA959]' : (darkTheme ? 'text-gray-300' : 'text-gray-600')
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
