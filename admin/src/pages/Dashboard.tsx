import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PackageOpen, TrendingUp, AlertTriangle, Package, DollarSign, ChevronRight } from 'lucide-react';
import apiClient from '../api/apiClient';

/**
 * Resumen. En compu ocupa exactamente el alto de la pantalla (sin scroll de página): indicadores arriba y
 * el gráfico + las alertas de stock llenando el resto; solo la lista de alertas se desplaza por dentro.
 * Cada alerta abre la edición de ese producto en el inventario (/admin/inventory?edit=<id>).
 */

const formatMoney = (n: unknown) => `$${Number(n ?? 0).toLocaleString('es-AR')}`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await apiClient.get('/admin/dashboard');
        // Si la API no devuelve el JSON esperado (ej: una VITE_API_URL mal configurada), no rompemos la pantalla
        if (data && typeof data === 'object' && !Array.isArray(data)) setStats(data);
        else console.error('Respuesta inesperada de /admin/dashboard. Revisá VITE_API_URL:', data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const lowStockProducts: any[] = Array.isArray(stats?.lowStockProducts) ? stats.lowStockProducts : [];
  const chart = Array.isArray(stats?.financialChart) ? stats.financialChart : [];

  // El id de una alerta de sabor es "<productId>-<sabor>": el producto es la primera parte
  const openProduct = (alertId: string) => navigate(`/admin/inventory?edit=${String(alertId).split('-')[0]}`);

  const cards = [
    { label: 'Ganancias del mes', value: formatMoney(stats?.thisMonthRevenue), icon: DollarSign, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Ventas del mes', value: `${stats?.thisMonthSales ?? 0} pedidos`, icon: TrendingUp, tone: 'bg-[#CAA959]/10 text-[#CAA959]' },
    { label: 'Por despachar', value: `${stats?.pendingOrdersCount ?? 0} pedidos`, icon: PackageOpen, tone: 'bg-amber-50 text-amber-500' },
  ];

  return (
    // lg: alto de la pantalla menos el padding del layout (3rem arriba + 3rem abajo)
    <div className="flex flex-col gap-5 lg:h-[calc(100vh-6rem)] lg:min-h-[560px]">
      <div className="shrink-0">
        <h1 className="text-3xl md:text-4xl font-black text-[#202A36] uppercase italic tracking-tighter">Panel principal</h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Resumen general de tu tienda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        {cards.map((c) => (
          <div key={c.label} className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${c.tone}`}>
              <c.icon size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{c.label}</p>
              <p className="text-xl font-black text-[#202A36] truncate">{isLoading ? '…' : c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:flex-1 lg:min-h-0">
        {/* Finanzas (2 columnas) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col lg:min-h-0">
          <h2 className="text-lg font-black text-[#202A36] uppercase tracking-tighter mb-4 flex items-center gap-2 shrink-0">
            <TrendingUp size={18} className="text-[#CAA959]" />
            Finanzas (últimos 6 meses)
          </h2>
          <div className="h-[260px] lg:h-auto lg:flex-1 lg:min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#9ca3af' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(v: number) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : `${Math.round(v)}`)} dx={-10} />
                <Tooltip
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [formatMoney(value), 'Ganancia']}
                />
                <Bar dataKey="total" fill="#202A36" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alertas de stock: cada una abre la edición del producto */}
        <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col lg:min-h-0">
          <h2 className="text-lg font-black text-[#202A36] uppercase tracking-tighter mb-1 flex items-center gap-2 shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
            Alertas de stock
            {lowStockProducts.length > 0 && (
              <span className="ml-auto text-[10px] font-black bg-red-50 text-red-500 px-2 py-0.5 rounded-full">{lowStockProducts.length}</span>
            )}
          </h2>
          <p className="text-xs text-gray-400 font-medium mb-4 shrink-0">Tocá un producto para agregarle stock.</p>

          <div className="max-h-[320px] lg:max-h-none lg:flex-1 lg:min-h-0 overflow-y-auto custom-scrollbar -mr-2 pr-2 space-y-2">
            {lowStockProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-8">
                <Package size={36} className="mb-3 opacity-50" />
                <p className="text-sm font-medium">{isLoading ? 'Cargando…' : 'Todo tu inventario tiene buen stock.'}</p>
              </div>
            ) : (
              lowStockProducts.map((product: any) => (
                <button
                  key={product._id}
                  type="button"
                  onClick={() => openProduct(product._id)}
                  className="dash-alert w-full flex items-center gap-3 p-3 rounded-xl border border-red-50 bg-red-50/30 text-left"
                >
                  <img src={product.image} alt="" loading="lazy" className="w-11 h-11 rounded-lg object-contain bg-white p-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-800 leading-tight line-clamp-2">{product.name}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mt-1">
                      {Number(product.countInStock) === 1 ? 'Queda 1 unidad' : `Quedan ${product.countInStock} unidades`}
                    </p>
                  </div>
                  <ChevronRight size={18} className="dash-alert-arrow text-gray-300 shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
