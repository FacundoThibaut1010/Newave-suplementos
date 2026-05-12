import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PackageOpen, ExternalLink, Calendar, CreditCard, ShoppingBag, Truck, MapPin, ChevronDown, CheckCircle2 } from 'lucide-react';
import apiClient from '../api/apiClient';
import { toast } from 'sonner';

const OrdersTable = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await apiClient.get('/admin/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsDelivered = async (orderId: string) => {
    try {
      await apiClient.put(`/admin/orders/${orderId}/deliver`);
      toast.success('¡Orden marcada como enviada exitosamente!');
      fetchOrders(); // Recargar para mostrar el cambio
    } catch (error) {
      toast.error('Error al actualizar la orden');
    }
  };

  const toggleRow = (id: string) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-[#202A36] uppercase italic tracking-tighter">Ventas y Órdenes</h1>
        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-2">Monitoreo de transacciones y envíos</p>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-20 text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-8 h-8 border-2 border-gray-200 border-t-[#CAA959] rounded-full mx-auto mb-4" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cargando datos...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <PackageOpen size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-[#202A36] uppercase tracking-tight mb-2">Aún no hay ventas</h3>
            <p className="text-sm text-gray-400">Cuando recibas un pago aparecerá aquí.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">ID Orden / Fecha</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Cliente</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Productos</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total / Pago</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado de Envío</th>
                  <th className="p-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order: any) => (
                  <React.Fragment key={order._id}>
                    <tr 
                      className={`hover:bg-gray-50/30 transition-colors group cursor-pointer ${expandedRow === order._id ? 'bg-gray-50/50' : ''}`}
                      onClick={() => toggleRow(order._id)}
                    >
                      <td className="p-6">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs text-gray-900 font-bold">#{order._id.slice(-6).toUpperCase()}</span>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase">
                            <Calendar size={12} />
                            {new Date(order.createdAt).toLocaleDateString('es-AR')}
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-[#202A36] capitalize">{order.guestInfo?.fullName || 'Invitado'}</span>
                          <a href={`mailto:${order.guestInfo?.email}`} className="text-[10px] text-blue-500 hover:underline">{order.guestInfo?.email}</a>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {order.orderItems.slice(0, 3).map((item: any, i: number) => (
                              <img key={i} src={item.image} alt={item.name} className="w-8 h-8 rounded-full border-2 border-white object-cover bg-gray-100" />
                            ))}
                          </div>
                          {order.orderItems.length > 3 && (
                            <span className="text-[10px] font-bold text-gray-400">+{order.orderItems.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black text-[#202A36]">${order.totalPrice.toLocaleString('es-AR')}</span>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <CreditCard size={12} />
                            Pagado
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        {order.isDelivered ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600">
                            <Truck size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Enviado</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-600">
                            <PackageOpen size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Preparando</span>
                          </div>
                        )}
                      </td>
                      <td className="p-6 text-right">
                        <ChevronDown size={20} className={`text-gray-400 transition-transform ${expandedRow === order._id ? 'rotate-180' : ''}`} />
                      </td>
                    </tr>

                    {/* Fila Expandible con Detalles */}
                    <AnimatePresence>
                      {expandedRow === order._id && (
                        <tr className="bg-gray-50/50">
                          <td colSpan={6} className="p-0">
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-8 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                                
                                {/* Detalles de Envío */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                  <div className="flex items-center gap-2 mb-4 text-[#CAA959]">
                                    <MapPin size={20} />
                                    <h3 className="font-black uppercase tracking-widest text-sm text-[#202A36]">Detalles de Envío</h3>
                                  </div>
                                  <div className="space-y-3">
                                    <p className="text-sm"><span className="font-bold text-gray-400 uppercase tracking-wider text-[10px] block mb-0.5">Destinatario</span> <span className="font-medium text-gray-800">{order.guestInfo?.fullName}</span></p>
                                    <p className="text-sm"><span className="font-bold text-gray-400 uppercase tracking-wider text-[10px] block mb-0.5">Teléfono</span> <span className="font-medium text-gray-800">{order.guestInfo?.phone}</span></p>
                                    <p className="text-sm"><span className="font-bold text-gray-400 uppercase tracking-wider text-[10px] block mb-0.5">Dirección</span> <span className="font-medium text-gray-800">{order.shippingAddress?.address} {order.shippingAddress?.addressLine2 && `(${order.shippingAddress.addressLine2})`}</span></p>
                                    <p className="text-sm"><span className="font-bold text-gray-400 uppercase tracking-wider text-[10px] block mb-0.5">Ubicación</span> <span className="font-medium text-gray-800">{order.shippingAddress?.city}, {order.shippingAddress?.state} - CP: {order.shippingAddress?.postalCode}</span></p>
                                  </div>

                                  {!order.isDelivered && (
                                    <button 
                                      onClick={() => handleMarkAsDelivered(order._id)}
                                      className="mt-6 w-full py-3 bg-[#202A36] text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#CAA959] transition-colors flex items-center justify-center gap-2"
                                    >
                                      <CheckCircle2 size={16} />
                                      Marcar paquete como enviado
                                    </button>
                                  )}
                                </div>

                                {/* Resumen de Productos */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                  <div className="flex items-center gap-2 mb-4 text-[#CAA959]">
                                    <ShoppingBag size={20} />
                                    <h3 className="font-black uppercase tracking-widest text-sm text-[#202A36]">Productos a despachar</h3>
                                  </div>
                                  <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                    {order.orderItems.map((item: any, i: number) => (
                                      <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-white" />
                                        <div className="flex-1">
                                          <p className="text-sm font-bold text-gray-800">{item.name}</p>
                                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cantidad: {item.qty}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersTable;
