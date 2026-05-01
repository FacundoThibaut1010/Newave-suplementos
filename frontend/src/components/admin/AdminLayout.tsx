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
    <div className="flex min-h-screen bg-[#F4F4F5] font-sans">
      <Toaster position="top-right" richColors closeButton />
      
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col p-8 fixed h-full z-10">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl">
            <span className="text-xl font-black">A</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-black leading-none">Admin Panel</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Ecosistema Moderne</p>
          </div>
        </div>

        <nav className="flex-grow space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
                  isActive 
                    ? 'bg-black text-white shadow-lg shadow-black/10' 
                    : 'text-gray-400 hover:text-black hover:bg-gray-50'
                }`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-sm font-bold tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-8 border-t border-gray-50 space-y-2">
          <Link to="/" className="flex items-center gap-4 px-4 py-3.5 text-gray-400 hover:text-blue-600 transition-colors">
            <ExternalLink size={20} />
            <span className="text-sm font-bold tracking-tight">Ver Tienda</span>
          </Link>
          <button className="w-full flex items-center gap-4 px-4 py-3.5 text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={20} />
            <span className="text-sm font-bold tracking-tight">Salir</span>
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
