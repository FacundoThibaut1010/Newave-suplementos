import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PackageOpen, Calendar, CreditCard, ShoppingBag, Truck, MapPin, ChevronDown, CheckCircle2, RotateCcw, User, Send, Trash2 } from 'lucide-react';
import apiClient from '../api/apiClient';
import { toast } from 'sonner';
import ConfirmModal from '../components/ConfirmModal';

const OrdersTable = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'activas' | 'despachadas' | 'entregadas'>('activas');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

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

  const handleMarkAsDispatched = async (orderId: string) => {
    try {
      await apiClient.put(`/admin/orders/${orderId}/dispatch`);
      toast.success('¡Paquete marcado como despachado! Se ha enviado un correo al cliente.');
      fetchOrders();
      setExpandedRow(null);
    } catch (error) {
      toast.error('Error al despachar la orden');
    }
  };

  const handleMarkAsDelivered = async (orderId: string) => {
    try {
      await apiClient.put(`/admin/orders/${orderId}/deliver`);
      toast.success('¡Orden marcada como entregada exitosamente!');
      fetchOrders();
      setExpandedRow(null);
    } catch (error) {
      toast.error('Error al actualizar la orden');
    }
  };

  const handleUndeliver = async (orderId: string) => {
    try {
      await apiClient.put(`/admin/orders/${orderId}/undeliver`);
      toast.success('¡Entrega deshecha! Orden devuelta a despachadas.');
      fetchOrders();
      setExpandedRow(null);
    } catch (error) {
      toast.error('Error al actualizar la orden');
    }
  };

  const confirmDeleteOrder = (orderId: string) => {
    setOrderToDelete(orderId);
    setDeleteModalOpen(true);
  };

  const executeDeleteOrder = async () => {
    if (!orderToDelete) return;
    try {
      await apiClient.delete(`/admin/orders/${orderToDelete}`);
      toast.success('¡Venta eliminada con éxito!');
      fetchOrders();
      setExpandedRow(null);
    } catch (error) {
      toast.error('Error al eliminar la venta');
    } finally {
      setOrderToDelete(null);
    }
  };

  const toggleRow = (id: string) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
    }
  };

  // Filtrar órdenes según la pestaña activa
  const filteredOrders = orders.filter((order: any) => {
    if (activeTab === 'activas') return !order.isDispatched && !order.isDelivered;
    if (activeTab === 'despachadas') return order.isDispatched && !order.isDelivered;
    if (activeTab === 'entregadas') return order.isDelivered;
    return false;
  });

  const formatPaymentMethod = (methodId: string, typeId: string) => {
    if (!methodId) return 'Mercado Pago';
    if (methodId === 'account_money') return 'Dinero en Cuenta';
    if (typeId === 'credit_card') return `Tarjeta Crédito (${methodId.toUpperCase()})`;
    if (typeId === 'debit_card') return `Tarjeta Débito (${methodId.toUpperCase()})`;
    if (typeId === 'ticket') return `Efectivo / Transferencia`;
    return methodId.toUpperCase();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-[#202A36] uppercase italic tracking-tighter">Ventas y Envíos</h1>
        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-2">Gestión de logística de 3 estados</p>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap items-center gap-4 border-b border-gray-200 pb-px">
        <button
          onClick={() => { setActiveTab('activas'); setExpandedRow(null); }}
          className={`pb-4 px-2 font-black uppercase tracking-widest text-xs transition-colors relative ${activeTab === 'activas' ? 'text-[#202A36]' : 'text-gray-400 hover:text-gray-600'}`}
        >
          1. Activas (Armar)
          {activeTab === 'activas' && (
            <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CAA959]" />
          )}
        </button>
        <button
          onClick={() => { setActiveTab('despachadas'); setExpandedRow(null); }}
          className={`pb-4 px-2 font-black uppercase tracking-widest text-xs transition-colors relative ${activeTab === 'despachadas' ? 'text-[#202A36]' : 'text-gray-400 hover:text-gray-600'}`}
        >
          2. Despachadas (En camino)
          {activeTab === 'despachadas' && (
            <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CAA959]" />
          )}
        </button>
        <button
          onClick={() => { setActiveTab('entregadas'); setExpandedRow(null); }}
          className={`pb-4 px-2 font-black uppercase tracking-widest text-xs transition-colors relative ${activeTab === 'entregadas' ? 'text-[#202A36]' : 'text-gray-400 hover:text-gray-600'}`}
        >
          3. Entregadas (Historial)
          {activeTab === 'entregadas' && (
            <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CAA959]" />
          )}
        </button>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-20 text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-8 h-8 border-2 border-gray-200 border-t-[#CAA959] rounded-full mx-auto mb-4" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cargando datos...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <PackageOpen size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-[#202A36] uppercase tracking-tight mb-2">
              {activeTab === 'activas' ? 'No hay órdenes por armar' : activeTab === 'despachadas' ? 'No hay paquetes en camino' : 'No hay historial aún'}
            </h3>
            <p className="text-sm text-gray-400">
              {activeTab === 'activas' ? '¡Todo está despachado o no hay ventas nuevas!' : activeTab === 'despachadas' ? 'Aquí verás los paquetes que le entregaste al correo.' : 'Cuando marques una orden como entregada aparecerá aquí.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="p-3 md:p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">ID / Fecha</th>
                  <th className="hidden md:table-cell p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Cliente</th>
                  <th className="hidden md:table-cell p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Productos</th>
                  <th className="p-3 md:p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total / Pago</th>
                  <th className="p-3 md:p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado</th>
                  <th className="p-3 md:p-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map((order: any) => (
                  <React.Fragment key={order._id}>
                    <tr 
                      className={`hover:bg-gray-50/30 transition-colors group cursor-pointer ${expandedRow === order._id ? 'bg-gray-50/50' : ''}`}
                      onClick={() => toggleRow(order._id)}
                    >
                      <td className="p-3 md:p-6">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs md:text-xs text-gray-900 font-bold">#{order._id.slice(-6).toUpperCase()}</span>
                          <div className="flex items-center gap-1 text-[9px] md:text-[10px] text-gray-400 font-bold uppercase">
                            <Calendar size={12} />
                            {new Date(order.createdAt).toLocaleDateString('es-AR')}
                          </div>
                          {/* Cliente en mobile */}
                          <div className="md:hidden mt-1 flex flex-col">
                            <span className="text-[10px] font-black text-[#202A36] capitalize leading-tight">{order.guestInfo?.fullName || 'Invitado'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell p-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#CAA959]/10 flex items-center justify-center text-[#CAA959]">
                              <User size={16} />
                            </div>
                            <div>
                              <span className="text-lg font-black text-[#202A36] capitalize block leading-tight">{order.guestInfo?.fullName || 'Invitado'}</span>
                              <a href={`mailto:${order.guestInfo?.email}`} className="text-xs text-blue-500 hover:underline font-medium">{order.guestInfo?.email}</a>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell p-6">
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
                      <td className="p-3 md:p-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs md:text-sm font-black text-[#202A36]">${order.totalPrice.toLocaleString('es-AR')}</span>
                          <div className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md w-fit">
                            <CreditCard size={12} />
                            {formatPaymentMethod(order.paymentResult?.payment_method_id, order.paymentResult?.payment_type_id)}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 md:p-6">
                        {order.isDelivered ? (
                          <div className="inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600">
                            <CheckCircle2 size={12} className="md:w-[14px] md:h-[14px]" />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Entregado</span>
                          </div>
                        ) : order.isDispatched ? (
                          <div className="inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600">
                            <Truck size={12} className="md:w-[14px] md:h-[14px]" />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">En Camino</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-600 animate-pulse">
                            <PackageOpen size={12} className="md:w-[14px] md:h-[14px]" />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Armar</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 md:p-6 text-right">
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
                              <div className="p-4 md:p-8 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                
                                {/* Detalles de Envío */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-center gap-2 mb-4 text-[#CAA959]">
                                      <MapPin size={20} />
                                      <h3 className="font-black uppercase tracking-widest text-sm text-[#202A36]">Datos para el Envío</h3>
                                    </div>
                                    <div className="space-y-3">
                                      <p className="text-sm"><span className="font-bold text-gray-400 uppercase tracking-wider text-[10px] block mb-0.5">Teléfono</span> <span className="font-medium text-gray-800 text-lg">{order.guestInfo?.phone}</span></p>
                                      <p className="text-sm"><span className="font-bold text-gray-400 uppercase tracking-wider text-[10px] block mb-0.5">Dirección Exacta</span> <span className="font-medium text-gray-800 text-lg">{order.shippingAddress?.address} {order.shippingAddress?.addressLine2 && `(${order.shippingAddress.addressLine2})`}</span></p>
                                      <p className="text-sm"><span className="font-bold text-gray-400 uppercase tracking-wider text-[10px] block mb-0.5">Ubicación</span> <span className="font-medium text-gray-800">{order.shippingAddress?.city}, {order.shippingAddress?.state} - CP: {order.shippingAddress?.postalCode}</span></p>
                                    </div>
                                  </div>

                                  {!order.isDispatched && !order.isDelivered ? (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); handleMarkAsDispatched(order._id); }}
                                      className="mt-6 w-full py-4 bg-[#202A36] text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#CAA959] transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                    >
                                      <Send size={18} />
                                      Marcar paquete como despachado (Avisar cliente)
                                    </button>
                                  ) : order.isDispatched && !order.isDelivered ? (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); handleMarkAsDelivered(order._id); }}
                                      className="mt-6 w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                    >
                                      <CheckCircle2 size={18} />
                                      Marcar como Entregado al Cliente
                                    </button>
                                  ) : (
                                    <div className="flex gap-2 w-full mt-6">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleUndeliver(order._id); }}
                                        className="flex-1 py-3 border-2 border-red-100 text-red-500 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                      >
                                        <RotateCcw size={16} />
                                        Deshacer Entrega
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); confirmDeleteOrder(order._id); }}
                                        className="py-3 px-4 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-colors flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                        title="Eliminar venta permanentemente"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Resumen de Productos */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                  <div className="flex items-center gap-2 mb-4 text-[#CAA959]">
                                    <ShoppingBag size={20} />
                                    <h3 className="font-black uppercase tracking-widest text-sm text-[#202A36]">Productos a Empacar</h3>
                                  </div>
                                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {order.orderItems.map((item: any, i: number) => (
                                      <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-white shadow-sm" />
                                        <div className="flex-1">
                                          <p className="text-base font-black text-gray-800 leading-tight">{item.name}</p>
                                          <p className="text-xs font-black uppercase tracking-widest text-[#CAA959] mt-1">Cantidad: {item.qty}</p>
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

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={executeDeleteOrder}
        title="¿Eliminar Venta?"
        message="Esta acción no se puede deshacer y el resumen volverá a descontar este monto de las estadísticas."
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default OrdersTable;
