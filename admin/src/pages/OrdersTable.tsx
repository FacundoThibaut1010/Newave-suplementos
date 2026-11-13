import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PackageOpen, Truck, CheckCircle2, Search, X, ChevronDown, MapPin, Phone, Mail, Copy, Send, RotateCcw, Trash2, CreditCard, Store, ArrowRight,
} from 'lucide-react';
import apiClient from '../api/apiClient';
import { toast } from 'sonner';
import ConfirmModal from '../components/ConfirmModal';

/**
 * Ventas: el recorrido de cada pedido en 3 pasos (por armar → en camino → entregado).
 * Cada pedido es una tarjeta con el siguiente paso a la vista; "Ver detalle" muestra los datos de envío,
 * contacto (WhatsApp, mail), la lista para empacar y el desglose del cobro.
 */

type Stage = 'armar' | 'camino' | 'entregados';

const stageOf = (o: any): Stage => (o.isDelivered ? 'entregados' : o.isDispatched ? 'camino' : 'armar');

const STAGES: { key: Stage; n: number; title: string; desc: string; icon: any; tone: string; ring: string }[] = [
  { key: 'armar', n: 1, title: 'Por armar', desc: 'Pagados: preparalos y despachalos', icon: PackageOpen, tone: 'text-amber-600 bg-amber-50', ring: 'border-amber-300 ring-amber-100' },
  { key: 'camino', n: 2, title: 'En camino', desc: 'Ya los entregaste al correo', icon: Truck, tone: 'text-blue-600 bg-blue-50', ring: 'border-blue-300 ring-blue-100' },
  { key: 'entregados', n: 3, title: 'Entregados', desc: 'El cliente ya los recibió', icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50', ring: 'border-emerald-300 ring-emerald-100' },
];

const money = (n: unknown) => `$${Number(n ?? 0).toLocaleString('es-AR')}`;

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.round(diff / 60000);
  if (min < 60) return `hace ${Math.max(1, min)} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `hace ${d} ${d === 1 ? 'día' : 'días'}`;
  return new Date(date).toLocaleDateString('es-AR');
};

const paymentLabel = (methodId?: string, typeId?: string) => {
  if (!methodId) return 'Mercado Pago';
  if (methodId === 'account_money') return 'Dinero en cuenta de Mercado Pago';
  if (typeId === 'credit_card') return `Crédito ${methodId.toUpperCase()}`;
  if (typeId === 'debit_card') return `Débito ${methodId.toUpperCase()}`;
  if (typeId === 'ticket') return 'Efectivo / transferencia';
  return methodId.toUpperCase();
};

// Tipo de envío a partir de lo que el checkout guarda en addressLine2 ("… Envío: <opción>")
const shippingLabel = (o: any) => {
  const line = String(o.shippingAddress?.addressLine2 || '');
  const m = line.match(/Env[ií]o:\s*(.+)$/i);
  const name = m ? m[1].trim() : '';
  const pickup = /retiro|sucursal/i.test(name);
  return { name: name || (Number(o.shippingPrice) > 0 ? 'Envío a domicilio' : 'Envío'), pickup };
};

const whatsappLink = (phone?: string) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  const full = digits.startsWith('54') ? digits : `549${digits.replace(/^0/, '')}`;
  return `https://wa.me/${full}`;
};

const OrdersTable = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('armar');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const { data } = await apiClient.get('/admin/orders');
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const run = async (id: string, fn: () => Promise<any>, ok: string, fail: string) => {
    setBusyId(id);
    try {
      await fn();
      toast.success(ok);
      await fetchOrders();
    } catch {
      toast.error(fail);
    } finally {
      setBusyId(null);
    }
  };

  const dispatch = (id: string) =>
    run(id, () => apiClient.put(`/admin/orders/${id}/dispatch`), 'Pedido despachado. Le avisamos al cliente por mail.', 'No se pudo marcar como despachado');
  const deliver = (id: string) =>
    run(id, () => apiClient.put(`/admin/orders/${id}/deliver`), 'Pedido marcado como entregado.', 'No se pudo marcar como entregado');
  const undeliver = (id: string) =>
    run(id, () => apiClient.put(`/admin/orders/${id}/undeliver`), 'Listo: el pedido volvió a "En camino".', 'No se pudo deshacer la entrega');

  const executeDelete = async () => {
    if (!orderToDelete) return;
    await run(orderToDelete, () => apiClient.delete(`/admin/orders/${orderToDelete}`), 'Venta eliminada.', 'No se pudo eliminar la venta');
    setOrderToDelete(null);
  };

  const counts = useMemo(
    () => ({
      armar: orders.filter((o) => stageOf(o) === 'armar').length,
      camino: orders.filter((o) => stageOf(o) === 'camino').length,
      entregados: orders.filter((o) => stageOf(o) === 'entregados').length,
    }),
    [orders]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders
      .filter((o) => stageOf(o) === stage)
      .filter((o) => {
        if (!q) return true;
        const hay = [
          o._id?.slice(-6),
          o.guestInfo?.fullName,
          o.guestInfo?.email,
          o.guestInfo?.phone,
          ...(o.orderItems || []).map((i: any) => `${i.name} ${i.variant || ''}`),
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, stage, search]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Dirección copiada');
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const current = STAGES.find((s) => s.key === stage)!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-[#111214] tracking-tighter mb-1">Ventas</h1>
        <p className="text-gray-400 font-medium text-sm">Seguí cada pedido en 3 pasos: armalo, despachalo y marcalo como entregado.</p>
      </div>

      {/* Recorrido del pedido */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {STAGES.map((s, i) => {
          const active = stage === s.key;
          return (
            <div key={s.key} className="relative">
              <button
                type="button"
                onClick={() => { setStage(s.key); setExpanded(null); }}
                className={`ord-stage w-full text-left bg-white rounded-2xl border p-4 flex items-center gap-3 ${active ? `${s.ring} ring-4` : 'border-gray-100'}`}
              >
                <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.tone}`}>
                  <s.icon size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="text-[10px] font-black text-gray-400">PASO {s.n}</span>
                  </span>
                  <span className="block text-base font-black text-[#111214] leading-tight">{s.title}</span>
                  <span className="block text-[11px] text-gray-400 font-medium leading-snug">{s.desc}</span>
                </span>
                <span className={`text-2xl font-black tabular-nums ${counts[s.key] > 0 && s.key === 'armar' ? 'text-amber-500' : 'text-[#111214]'}`}>{counts[s.key]}</span>
              </button>
              {i < STAGES.length - 1 && (
                <ArrowRight size={16} className="hidden sm:block absolute -right-[13px] top-1/2 -translate-y-1/2 text-gray-300 z-10" />
              )}
            </div>
          );
        })}
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente, mail, número de pedido o producto…"
          className="input-admin pl-12 pr-12"
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} aria-label="Borrar búsqueda" className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:text-black hover:bg-gray-100">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Pedidos */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
          <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${current.tone}`}>
            <current.icon size={28} />
          </div>
          <p className="font-black text-[#111214] text-lg">
            {search ? 'No hay pedidos que coincidan' : stage === 'armar' ? 'No hay pedidos para armar' : stage === 'camino' ? 'No hay pedidos en camino' : 'Todavía no hay pedidos entregados'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {search
              ? 'Probá con otro nombre o número.'
              : stage === 'armar'
              ? 'Cuando entre una compra pagada aparece acá.'
              : stage === 'camino'
              ? 'Acá ves los pedidos que marcaste como despachados.'
              : 'Cuando marques un pedido como entregado queda guardado acá.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((o) => {
            const open = expanded === o._id;
            const ship = shippingLabel(o);
            const items = o.orderItems || [];
            const units = items.reduce((acc: number, i: any) => acc + (Number(i.qty) || 0), 0);
            const subtotal = items.reduce((acc: number, i: any) => acc + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);
            const wa = whatsappLink(o.guestInfo?.phone);
            const fullAddress = `${o.shippingAddress?.address || ''}, ${o.shippingAddress?.city || ''}, ${o.shippingAddress?.state || ''} (CP ${o.shippingAddress?.postalCode || ''})`;
            const busy = busyId === o._id;

            return (
              <motion.div layout="position" key={o._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Resumen del pedido */}
                <div className="p-4 md:p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-4 min-w-0 lg:w-[38%]">
                    <div className="flex -space-x-3 shrink-0">
                      {items.slice(0, 3).map((it: any, i: number) => (
                        <img key={i} src={it.image} alt="" className="w-12 h-12 rounded-xl border-2 border-white object-contain bg-[#F8F9FA]" />
                      ))}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-[#111214] truncate capitalize">{o.guestInfo?.fullName || 'Cliente'}</p>
                      <p className="text-xs text-gray-400 font-medium">
                        <span className="font-mono font-bold text-gray-500">#{o._id.slice(-6).toUpperCase()}</span> · {timeAgo(o.paidAt || o.createdAt)} · {units}{' '}
                        {units === 1 ? 'producto' : 'productos'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:flex-1">
                    <span className="text-lg font-black text-[#111214] mr-1">{money(o.totalPrice)}</span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                      {ship.pickup ? <Store size={13} /> : <Truck size={13} />}
                      {ship.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 lg:justify-end shrink-0">
                    {stage === 'armar' && (
                      <button type="button" disabled={busy} onClick={() => dispatch(o._id)} className="ord-primary flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#111214] text-white text-xs font-black uppercase tracking-widest disabled:opacity-50">
                        <Send size={15} /> <span className="sm:hidden">Despachar</span><span className="hidden sm:inline">Marcar como despachado</span>
                      </button>
                    )}
                    {stage === 'camino' && (
                      <button type="button" disabled={busy} onClick={() => deliver(o._id)} className="ord-primary flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50">
                        <CheckCircle2 size={15} /> <span className="sm:hidden">Entregado</span><span className="hidden sm:inline">Marcar como entregado</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : o._id)}
                      aria-expanded={open}
                      className="ord-ghost inline-flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600"
                    >
                      {open ? 'Ocultar' : 'Ver detalle'}
                      <ChevronDown size={15} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Detalle */}
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1, transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } }}
                      exit={{ height: 0, opacity: 0, transition: { duration: 0.15 } }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-gray-100 bg-[#FAFAFA] p-4 md:p-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Envío y contacto */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Enviar a</p>
                          <div className="flex items-start gap-2">
                            <MapPin size={16} className="text-[#1C86C8] mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-[#111214] leading-snug">{o.shippingAddress?.address}</p>
                              <p className="text-xs text-gray-500">
                                {o.shippingAddress?.city}, {o.shippingAddress?.state} · CP {o.shippingAddress?.postalCode}
                              </p>
                              {o.shippingAddress?.addressLine2 && <p className="text-xs text-gray-400 mt-0.5">{o.shippingAddress.addressLine2}</p>}
                            </div>
                            <button type="button" onClick={() => copy(fullAddress)} aria-label="Copiar dirección" className="ord-ghost p-2 rounded-lg text-gray-400 hover:text-[#111214] shrink-0">
                              <Copy size={15} />
                            </button>
                          </div>
                          <div className="pt-3 border-t border-gray-100 space-y-2">
                            {o.guestInfo?.phone && (
                              <div className="flex items-center justify-between gap-2">
                                <span className="flex items-center gap-2 text-sm font-medium text-gray-700"><Phone size={15} className="text-gray-400" />{o.guestInfo.phone}</span>
                                {wa && (
                                  <a href={wa} target="_blank" rel="noreferrer" className="text-[11px] font-black uppercase tracking-wider text-emerald-600 hover:underline">
                                    WhatsApp
                                  </a>
                                )}
                              </div>
                            )}
                            {o.guestInfo?.email && (
                              <a href={`mailto:${o.guestInfo.email}`} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline break-all">
                                <Mail size={15} className="text-gray-400 shrink-0" />
                                {o.guestInfo.email}
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Para empacar */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Para empacar</p>
                          <div className="space-y-2">
                            {items.map((it: any, i: number) => (
                              <div key={i} className="flex items-center gap-3">
                                <img src={it.image} alt="" className="w-11 h-11 rounded-lg object-contain bg-[#F8F9FA] border border-gray-100 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-bold text-[#111214] leading-tight line-clamp-2">{it.name}</p>
                                  {it.variant && <p className="text-[11px] text-gray-500 font-medium">Sabor: {it.variant}</p>}
                                </div>
                                <span className="text-sm font-black text-[#111214] bg-gray-100 rounded-lg px-2.5 py-1 shrink-0">x{it.qty}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Cobro */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Cobro</p>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between text-gray-500"><span>Productos</span><span className="font-bold text-gray-700">{money(subtotal)}</span></div>
                            <div className="flex justify-between text-gray-500"><span>Envío</span><span className="font-bold text-gray-700">{Number(o.shippingPrice) > 0 ? money(o.shippingPrice) : 'Gratis'}</span></div>
                            <div className="flex justify-between pt-2 mt-1 border-t border-gray-100"><span className="font-black text-[#111214]">Total cobrado</span><span className="font-black text-[#111214]">{money(o.totalPrice)}</span></div>
                          </div>
                          <p className="flex items-center gap-2 text-xs text-gray-500 font-medium mt-3">
                            <CreditCard size={14} className="text-gray-400" />
                            {paymentLabel(o.paymentResult?.payment_method_id, o.paymentResult?.payment_type_id)}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-1">Pagado el {new Date(o.paidAt || o.createdAt).toLocaleDateString('es-AR')}</p>

                          {stage === 'entregados' && (
                            <div className="flex gap-2 mt-auto pt-4">
                              <button type="button" disabled={busy} onClick={() => undeliver(o._id)} className="ord-ghost flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600">
                                <RotateCcw size={14} /> Deshacer entrega
                              </button>
                              <button
                                type="button"
                                onClick={() => { setOrderToDelete(o._id); setDeleteModalOpen(true); }}
                                aria-label="Eliminar venta"
                                className="ord-ghost px-3 py-2.5 rounded-xl border border-red-100 text-red-500"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={executeDelete}
        title="¿Eliminar venta?"
        message="No se puede deshacer, y el monto se descuenta de las estadísticas del Resumen."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default OrdersTable;
