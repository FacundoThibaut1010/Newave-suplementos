import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PackageOpen, ArrowLeft, Package, Truck, CheckCircle2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuthStore } from '../store/useAuthStore';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      const fetchMyOrders = async () => {
        try {
          const { data } = await apiClient.get('/users/orders');
          setOrders(data);
        } catch (error) {
          console.error("Error fetching orders:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchMyOrders();
    }
  }, [user]);

  if (!user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] text-black pt-40 md:pt-48 pb-20">
      <div className="max-w-5xl mx-auto px-6">

        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-black mb-10 transition-colors uppercase text-[10px] font-black tracking-widest">
          <ArrowLeft size={14} /> Volver a la tienda
        </Link>

        <h1 className="text-5xl font-black uppercase italic tracking-tighter mb-4 text-[#202A36] text-center md:text-left">Mis Compras</h1>
        <p className="text-gray-500 font-medium mb-12 text-center md:text-left">Aquí puedes hacerle seguimiento a todos tus pedidos en Newave.</p>

        {isLoading ? (
          <div className="flex justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CAA959]"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-16 shadow-sm border border-gray-100 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <PackageOpen size={40} className="text-gray-300" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-[#202A36] mb-2">Aún no tienes compras</h3>
            <p className="text-gray-500 font-medium mb-8">Realiza tu primera compra en nuestra tienda.</p>
            <Link to="/productos" className="py-4 px-8 bg-[#202A36] text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#CAA959] transition-colors">
              Explorar Productos
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-start md:items-center"
              >
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="font-mono text-sm text-gray-400 font-bold uppercase">#{order._id.slice(-6)}</span>
                    <span className="text-sm font-bold text-gray-500">{new Date(order.createdAt).toLocaleDateString('es-AR')}</span>

                    {order.isDelivered ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                        <CheckCircle2 size={12} /> Entregado
                      </span>
                    ) : order.isDispatched ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                        <Truck size={12} /> En Camino
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                        <Package size={12} /> Armando Paquete
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 py-2">
                    {order.orderItems.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-4">
                        <img src={item.image} alt={item.name} className="inline-block h-24 w-24 md:h-28 md:w-28 rounded-[1.5rem] border-2 border-white object-cover bg-gray-50 shadow-sm flex-shrink-0" />
                        <div>
                          <p className="text-sm font-black text-[#202A36]">{item.name}</p>
                          {item.variant && <p className="text-xs font-bold text-gray-500">Sabor: {item.variant}</p>}
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#CAA959] mt-0.5">Cantidad: {item.qty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:items-end w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-8">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total</span>
                  <span className="text-3xl font-black italic tracking-tighter text-[#202A36]">${order.totalPrice.toLocaleString('es-AR')}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;
