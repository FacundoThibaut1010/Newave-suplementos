import Hero from '../components/home/Hero';
import ProductGrid from '../components/home/ProductGrid';
import CategoryScroll from '../components/home/CategoryScroll';
import { Truck, ShieldCheck, CreditCard, RefreshCcw } from 'lucide-react';

const HomePage = () => {
  return (
    <>
      <Hero />
      <CategoryScroll />
      <ProductGrid />
      
      {/* Trust Badges Section - ENA Style */}
      <section className="bg-[#202A36] py-20 mt-12">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-12">
          {[
            { icon: Truck, title: 'Envíos a todo el país', desc: 'Recibí tu pedido en casa' },
            { icon: ShieldCheck, title: 'Compra Segura', desc: 'Protegemos tus datos' },
            { icon: CreditCard, title: 'Cuotas sin interés', desc: 'Con tarjetas seleccionadas' },
            { icon: RefreshCcw, title: 'Cambios gratis', desc: '30 días para devolver' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-[#CAA959] mb-6 group-hover:bg-[#CAA959] group-hover:text-white transition-all duration-500">
                <item.icon size={32} strokeWidth={1.5} />
              </div>
              <h4 className="text-white text-xs font-black uppercase tracking-widest mb-2">{item.title}</h4>
              <p className="text-gray-400 text-[10px] font-medium uppercase tracking-widest">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default HomePage;
