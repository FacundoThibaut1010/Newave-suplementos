import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  Settings, 
  BarChart3, 
  LogOut, 
  ExternalLink 
} from 'lucide-react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';

const AdminLayout = () => {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Resumen', path: '/admin' },
    { icon: Package, label: 'Inventario', path: '/admin/inventory' },
    { icon: BarChart3, label: 'Ventas', path: '/admin/analytics' },
    { icon: Settings, label: 'Identidad', path: '/admin/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Toaster position="top-right" richColors closeButton />
      
      {/* Sidebar */}
      <aside className="w-72 bg-[#202A36] text-white flex flex-col p-8 fixed h-full z-10 shadow-2xl">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-[#CAA959] rounded-full flex items-center justify-center text-white shadow-xl">
            <span className="text-xl font-black italic">NW</span>
          </div>
          <div>
            <h2 className="text-lg font-black leading-none italic">NEWAVE</h2>
            <p className="text-[9px] text-[#CAA959] font-black uppercase tracking-[0.2em] mt-1">Admin Performance</p>
          </div>
        </div>

        <nav className="flex-grow space-y-3">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-5 py-4 rounded-full transition-all group ${
                  isActive 
                    ? 'bg-[#CAA959] text-white shadow-lg shadow-[#CAA959]/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-8 border-t border-white/5 space-y-2">
          <a href="http://localhost:5173" target="_blank" rel="noreferrer" className="flex items-center gap-4 px-5 py-4 text-gray-400 hover:text-[#CAA959] transition-colors">
            <ExternalLink size={20} />
            <span className="text-xs font-black uppercase tracking-widest">Ver Tienda</span>
          </a>
          <button className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:text-red-400 transition-colors">
            <LogOut size={20} />
            <span className="text-xs font-black uppercase tracking-widest">Salir</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow ml-72 p-12">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};

export default AdminLayout;
