import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PackageOpen, TrendingUp, AlertTriangle, Package, DollarSign } from 'lucide-react';
import apiClient from '../api/apiClient';

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await apiClient.get('/admin/dashboard');
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CAA959]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-[#202A36] uppercase italic tracking-tighter">Panel Principal</h1>
        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-2">Resumen general de tu tienda</p>
      </div>

      {/* Tarjetas de Resumen Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Ganancias del Mes</p>
            <p className="text-2xl font-black text-[#202A36]">${stats?.thisMonthRevenue.toLocaleString('es-AR')}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 rounded-full bg-[#CAA959]/10 text-[#CAA959] flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Ventas del Mes</p>
            <p className="text-2xl font-black text-[#202A36]">{stats?.thisMonthSales} pedidos</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
            <PackageOpen size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Por Despachar</p>
            <p className="text-2xl font-black text-[#202A36]">{stats?.pendingOrdersCount} pedidos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gráfico Financiero (Ocupa 2 columnas) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <h2 className="text-xl font-black text-[#202A36] uppercase tracking-tighter mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-[#CAA959]" />
            Finanzas (Últimos 6 meses)
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.financialChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 'bold', fill: '#9ca3af' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  tickFormatter={(value) => `$${value/1000}k`}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`$${value.toLocaleString('es-AR')}`, 'Ganancia']}
                />
                <Bar dataKey="total" fill="#202A36" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alertas de Stock (Ocupa 1 columna) */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col">
          <h2 className="text-xl font-black text-[#202A36] uppercase tracking-tighter mb-6 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            Alertas de Stock
          </h2>
          
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-4">
            {stats?.lowStockProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <Package size={40} className="mb-4 opacity-50" />
                <p className="text-sm font-medium">Todo tu inventario tiene buen stock.</p>
              </div>
            ) : (
              stats?.lowStockProducts.map((product: any) => (
                <div key={product._id} className="flex items-center gap-4 p-4 rounded-xl border border-red-50 bg-red-50/30">
                  <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover bg-white" />
                  <div className="flex-1">
                    <p className="text-sm font-black text-gray-800 leading-tight">{product.name}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mt-1">
                      {product.countInStock === 0 ? 'SIN STOCK' : `Solo ${product.countInStock} disponibles`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
