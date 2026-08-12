// @ts-ignore
import { Mail, Phone, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useProductStore } from '../../store/useProductStore';

const Footer = () => {
  const activeCategories = useProductStore((state) => state.activeCategories);
  const [isContactOpen, setIsContactOpen] = useState(false);
  return (
    <footer id="contacto" className="bg-white border-t border-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div className="md:col-span-1">
            <h2 className="text-2xl font-black text-[#202A36] italic tracking-widest mb-6">
              NEWAVE.
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Suplementación de alto rendimiento para deportistas de élite. Potencia tu entrenamiento con Newave.
            </p>
            <div className="flex gap-4">
              {/* INSTAGRAM USANDO IMAGEN LOCAL */}
              <a
                href="https://www.instagram.com/newave.fitness/"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-[#CAA959] transition-all group"
              >
                <img
                  src="/mdi--instagram.svg"
                  alt="Instagram"
                  className="w-[18px] h-[18px] object-contain opacity-40 group-hover:opacity-100 group-hover:brightness-0 group-hover:invert"
                />
              </a>

              {/* MAIL USANDO LUCIDE-REACT */}
              <a
                href="mailto:newavesuple2026@gmail.com"
                className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-[#CAA959] hover:text-white hover:border-[#CAA959] transition-all"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>

          <div className="md:col-span-1">
            <h3 className="text-xs font-black text-[#202A36] uppercase tracking-[0.2em] mb-6">Productos</h3>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              <li><Link to="/productos" className="hover:text-[#CAA959] transition-colors">Ver Todo</Link></li>
              {activeCategories.map((cat, idx) => (
                <li key={idx}>
                  <Link to={`/productos/${cat.slug}`} className="hover:text-[#CAA959] transition-colors">{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-1">
            <h3 className="text-xs font-black text-[#202A36] uppercase tracking-[0.2em] mb-6">Soporte</h3>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              <li>
                <button 
                  onClick={() => setIsContactOpen(!isContactOpen)}
                  className="hover:text-[#CAA959] transition-colors flex items-center gap-2 outline-none font-black uppercase tracking-widest text-xs"
                >
                  Contacto
                  <ChevronDown size={14} className={`transition-transform ${isContactOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isContactOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <ul className="pt-4 space-y-4 pl-4 border-l-2 border-gray-100 mt-2 font-bold text-xs uppercase tracking-widest text-gray-400">
                        <li>
                          <a href="https://wa.me/5491165392403" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-[#CAA959] transition-colors">
                            <Phone size={14} /> WhatsApp
                          </a>
                        </li>
                        <li>
                          <a href="mailto:newavesuple2026@gmail.com" className="flex items-center gap-2 hover:text-[#CAA959] transition-colors">
                            <Mail size={14} /> Correo
                          </a>
                        </li>
                        <li>
                          <a href="https://www.instagram.com/newave.fitness/" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-[#CAA959] transition-colors group/insta">
                            <img src="/mdi--instagram.svg" alt="Instagram" className="w-3.5 h-3.5 object-contain opacity-40 group-hover/insta:opacity-100 group-hover/insta:brightness-0 group-hover/insta:invert-0" style={{ filter: 'brightness(0.6)' }} /> Instagram
                          </a>
                        </li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">
            © 2026 NEWAVE SUPLEMENTOS. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-gray-400 text-xs font-medium uppercase tracking-widest">
            <a href="#" className="hover:text-[#202A36]">Privacidad</a>
            <a href="#" className="hover:text-[#202A36]">Términos</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;