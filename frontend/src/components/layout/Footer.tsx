// @ts-ignore
import { Mail } from 'lucide-react';


const Footer = () => {
  return (
    <footer id="contacto" className="bg-white border-t border-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
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
                href="mailto:hola@newave.com"
                className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-[#CAA959] hover:text-white hover:border-[#CAA959] transition-all"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black text-[#202A36] uppercase tracking-[0.2em] mb-6">Productos</h3>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              <li><a href="#" className="hover:text-[#CAA959] transition-colors">Todos los productos</a></li>
              <li><a href="#" className="hover:text-[#CAA959] transition-colors">Proteínas</a></li>
              <li><a href="#" className="hover:text-[#CAA959] transition-colors">Creatinas</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-black text-[#202A36] uppercase tracking-[0.2em] mb-6">Soporte</h3>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              <li><a href="#" className="hover:text-[#CAA959] transition-colors">Contacto</a></li>
              <li><a href="#" className="hover:text-[#CAA959] transition-colors">Envíos</a></li>
              <li><a href="#" className="hover:text-[#CAA959] transition-colors">Devoluciones</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-black text-[#202A36] uppercase tracking-[0.2em] mb-6">Newsletter</h3>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="tu@email.com"
                className="bg-gray-50 border border-gray-100 rounded-full px-6 py-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#202A36]/5"
              />
              <button className="bg-[#202A36] text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#202A36]/90 transition-colors">
                Unirse
              </button>
            </div>
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