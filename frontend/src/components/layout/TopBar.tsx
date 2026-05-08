import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const messages = [
  "ENVÍO GRATIS EN COMPRAS SUPERIORES A $90.000",
  "3 CUOTAS SIN INTERÉS EN TODO EL SITIO",
  "NUEVA CREATINA MICRONIZADA - ¡YA DISPONIBLE!",
  "SUMATE A LA REVOLUCIÓN NEWAVE 🚀"
];

const TopBar = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-black text-white h-10 flex items-center justify-center overflow-hidden fixed top-0 w-full z-[60]">
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
