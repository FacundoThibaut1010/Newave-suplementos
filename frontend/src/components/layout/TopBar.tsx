import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import apiClient from '../../api/apiClient';

const defaultMessages = [
  "ENVÍO GRATIS EN COMPRAS SUPERIORES A $150.000",
  "NUEVA CREATINA MICRONIZADA - ¡YA DISPONIBLE!",
  "SUMATE A LA REVOLUCIÓN NEWAVE 🚀",
  "SEGUINOS EN INSTAGRAM COMO @NEWAVE.FITNESS",
];

const TopBar = () => {
  const [index, setIndex] = useState(0);
  const [messages, setMessages] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await apiClient.get('/admin/config');
        if (data.announcement) {
          if (!data.announcement.enabled) {
            setMessages(defaultMessages);
            setIsVisible(true);
            return;
          }
          
          let combined = [...defaultMessages];
          if (data.announcement.messages && data.announcement.messages.length > 0) {
            const validMsgs = data.announcement.messages.filter((m: string) => m.trim() !== '');
            if (validMsgs.length > 0) {
              combined = [...combined, ...validMsgs];
            }
          }
          
          setMessages(combined);
          setIsVisible(true);
          return;
        }
        
        // If enabled but no custom messages, show defaults
        setMessages(defaultMessages);
        setIsVisible(true);
      } catch (err) {
        setMessages(defaultMessages);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [messages.length]);

  if (!isVisible || messages.length === 0) return null;

  return (
    <div className="bg-black text-white min-h-[3rem] h-12 md:h-10 flex items-center justify-center overflow-hidden fixed top-0 w-full z-[60] px-4 text-center">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="text-[10px] font-black uppercase tracking-[0.2em] italic"
        >
          {messages[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};

export default TopBar;
