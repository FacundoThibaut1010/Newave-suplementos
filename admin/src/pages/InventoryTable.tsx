import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Trash2, Edit3, X, Package, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../api/apiClient';
import ProductForm from '../components/ProductForm';
import ConfirmModal from '../components/ConfirmModal';
import { useAdminStore } from '../store/useAdminStore';

/**
 * Inventario: indicadores que filtran, buscador (nombre / categoría / sabor), pestañas por categoría
 * y la lista agrupada por categoría. `?edit=<id>` abre directamente la edición de ese producto
 * (lo usan las alertas de stock del Resumen).
 */

const LOW_STOCK = 5;

type StockFilter = 'all' | 'active' | 'low' | 'out';

const totalStock = (p: any) =>
  p.variants?.length ? p.variants.reduce((acc: number, v: any) => acc + (Number(v.countInStock) || 0), 0) : Number(p.countInStock) || 0;

// Un producto tiene "stock bajo" si alguna de sus variantes (o él mismo) tiene entre 1 y 5 unidades
const hasLowStock = (p: any) => {
  const units = p.variants?.length ? p.variants.map((v: any) => Number(v.countInStock) || 0) : [Number(p.countInStock) || 0];
  return units.some((u: number) => u > 0 && u <= LOW_STOCK);
};

const categoryOf = (p: any) => (p.displaySection === 'Combo' ? 'Combos' : String(p.category || 'Sin categoría').trim() || 'Sin categoría');

const stockTone = (units: number) =>
  units <= 0 ? 'bg-red-50 text-red-600 border-red-100' : units <= LOW_STOCK ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100';

const formatPrice = (n: number) => `$${Number(n || 0).toLocaleString('es-AR')}`;

/** Fila horizontal deslizable: con el dedo (nativo), arrastrando con el mouse o con la rueda. */
const useDragScroll = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let startX = 0, startLeft = 0, down = false, moved = false;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = el.scrollLeft;
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) { moved = true; el.style.scrollSnapType = 'none'; el.style.cursor = 'grabbing'; }
      if (moved) el.scrollLeft = startLeft - dx;
    };
    const onUp = () => {
      if (!down) return;
      down = false; el.style.scrollSnapType = ''; el.style.cursor = '';
    };
    // Si fue un arrastre, que no cuente como clic en una categoría
    const onClick = (e: MouseEvent) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } };
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || el.scrollWidth <= el.clientWidth) return;
      const max = el.scrollWidth - el.clientWidth;
      if ((e.deltaY < 0 && el.scrollLeft <= 0) || (e.deltaY > 0 && el.scrollLeft >= max - 1)) return;
      e.preventDefault(); el.scrollLeft += e.deltaY;
    };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    el.addEventListener('click', onClick, true);
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      el.removeEventListener('click', onClick, true);
      el.removeEventListener('wheel', onWheel);
    };
  }, []);
  return ref;
};

const InventoryTable = () => {
  const chipsRef = useDragScroll();
  const { products, loadingProducts: loading, fetchProducts } = useAdminStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('Todas');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Abrir la edición de un producto desde un link (?edit=<id>), por ejemplo desde una alerta de stock
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || !Array.isArray(products) || products.length === 0) return;
    const product = products.find((p: any) => String(p._id) === editId);
    if (product) {
      setHighlightId(product._id);
      openEdit(product);
    } else {
      toast.error('Ese producto ya no existe en el inventario.');
    }
    searchParams.delete('edit');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, products]);

  const list = Array.isArray(products) ? products.filter((p) => p && typeof p.name === 'string') : [];

  const counts = useMemo(
    () => ({
      all: list.length,
      active: list.filter((p) => p.isActive !== false).length,
      low: list.filter(hasLowStock).length,
      out: list.filter((p) => totalStock(p) <= 0).length,
    }),
    [list]
  );

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    list.forEach((p) => map.set(categoryOf(p), (map.get(categoryOf(p)) || 0) + 1));
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'));
  }, [list]);

  // Filtros combinados: búsqueda + categoría + indicador
  const groups = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const filtered = list.filter((p) => {
      if (category !== 'Todas' && categoryOf(p) !== category) return false;
      if (stockFilter === 'active' && p.isActive === false) return false;
      if (stockFilter === 'low' && !hasLowStock(p)) return false;
      if (stockFilter === 'out' && totalStock(p) > 0) return false;
      if (!q) return true;
      const haystack = [p.name, p.category, ...(p.variants || []).map((v: any) => v.flavor)].join(' ').toLowerCase();
      return haystack.includes(q);
    });
    const map = new Map<string, any[]>();
    filtered.forEach((p) => {
      const c = categoryOf(p);
      if (!map.has(c)) map.set(c, []);
      map.get(c)!.push(p);
    });
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], 'es'))
      .map(([name, items]) => [name, items.sort((a: any, b: any) => a.name.localeCompare(b.name, 'es'))] as const);
  }, [list, searchTerm, category, stockFilter]);

  const visibleCount = groups.reduce((acc, [, items]) => acc + items.length, 0);
  const hasFilters = searchTerm || category !== 'Todas' || stockFilter !== 'all';

  const confirmDelete = (id: string) => {
    setProductToDelete(id);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!productToDelete) return;
    try {
      await apiClient.delete(`/admin/products/${productToDelete}`);
      toast.success('Producto eliminado.');
      fetchProducts(true);
    } catch {
      toast.error('Hubo un problema al eliminar.');
    } finally {
      setProductToDelete(null);
    }
  };

  const handleToggleActive = async (p: any) => {
    if (!p.isActive && totalStock(p) <= 0) {
      toast.error('No podés activar un producto sin stock disponible.');
      return;
    }
    setTogglingId(p._id);
    try {
      await apiClient.put(`/admin/products/${p._id}`, { isActive: !p.isActive });
      toast.success(p.isActive ? 'Producto desactivado' : 'Producto activado');
      fetchProducts(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al actualizar estado');
    } finally {
      setTogglingId(null);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => setEditingProduct(null), 350);
  };

  function openEdit(product: any) {
    setEditingProduct(product);
    setShowModal(true);
  }

  const clearFilters = () => {
    setSearchTerm('');
    setCategory('Todas');
    setStockFilter('all');
  };

  const stats: { key: StockFilter; label: string; value: number; icon: any; tone: string }[] = [
    { key: 'all', label: 'Productos', value: counts.all, icon: Package, tone: 'text-[#111214] bg-gray-100' },
    { key: 'active', label: 'Activos', value: counts.active, icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50' },
    { key: 'low', label: 'Stock bajo', value: counts.low, icon: AlertTriangle, tone: 'text-amber-600 bg-amber-50' },
    { key: 'out', label: 'Agotados', value: counts.out, icon: XCircle, tone: 'text-red-500 bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showModal && <ProductForm initialData={editingProduct} onClose={handleCloseModal} onSuccess={() => fetchProducts(true)} />}
      </AnimatePresence>

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-[#111214] tracking-tighter mb-1">Inventario</h1>
          <p className="text-gray-400 font-medium tracking-tight text-sm">Tus productos ordenados por categoría, con el stock de cada sabor.</p>
        </div>
        <button onClick={() => { setEditingProduct(null); setShowModal(true); }} className="btn-admin-primary justify-center">
          <Plus size={18} strokeWidth={3} />
          Nuevo producto
        </button>
      </div>

      {/* Indicadores (también filtran) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const active = stockFilter === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setStockFilter(active && s.key !== 'all' ? 'all' : s.key)}
              className={`inv-stat text-left bg-white rounded-2xl border p-4 flex items-center gap-3 ${
                active ? 'border-[#111214] ring-2 ring-[#111214]/10' : 'border-gray-100'
              }`}
            >
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.tone}`}>
                <s.icon size={20} />
              </span>
              <span className="min-w-0">
                <span className="block text-2xl font-black text-[#111214] leading-none tabular-nums">{s.value}</span>
                <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{s.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Buscador + categorías */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 md:p-5 space-y-4">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, categoría o sabor…"
            className="input-admin pl-12 pr-12"
          />
          {searchTerm && (
            <button type="button" onClick={() => setSearchTerm('')} aria-label="Borrar búsqueda" className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:text-black hover:bg-gray-100">
              <X size={16} />
            </button>
          )}
        </div>
        {/* Fila deslizable de borde a borde de la tarjeta, con desvanecido que indica que hay más */}
        <div ref={chipsRef} className="inv-chips flex gap-2 overflow-x-auto scrollbar-hide -mx-4 md:-mx-5 px-4 md:px-5 pb-1">
          {[['Todas', list.length] as const, ...categories].map(([name, n]) => {
            const active = category === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setCategory(name)}
                className={`inv-chip shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border ${
                  active ? 'bg-[#111214] text-white border-[#111214]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {name}
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista agrupada por categoría */}
      {loading && list.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : visibleCount === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
          <Package size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="font-bold text-[#111214]">No hay productos que coincidan.</p>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="mt-3 text-sm font-bold text-[#1C86C8] hover:underline">
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([groupName, items]) => (
            <section key={groupName}>
              <div className="flex items-center gap-3 mb-3 px-1">
                <h2 className="text-sm font-black uppercase tracking-widest text-[#111214]">{groupName}</h2>
                <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{items.length}</span>
                <span className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
                {items.map((p: any) => {
                  const units = totalStock(p);
                  return (
                    <motion.div
                      layout="position"
                      key={p._id}
                      className={`inv-row flex flex-col md:flex-row md:items-center gap-3 md:gap-5 p-4 md:px-6 ${highlightId === p._id ? 'is-highlight' : ''} ${p.isActive === false ? 'opacity-70' : ''}`}
                    >
                      {/* Producto */}
                      <button type="button" onClick={() => openEdit(p)} className="flex items-center gap-4 min-w-0 md:w-[34%] text-left">
                        <img
                          src={p.images?.[0] || p.image}
                          alt=""
                          loading="lazy"
                          className="w-14 h-14 rounded-2xl object-contain bg-[#F8F9FA] border border-gray-100 p-1 shrink-0"
                        />
                        <span className="min-w-0">
                          <span className="block font-bold text-sm text-[#111214] leading-snug line-clamp-2">{p.name}</span>
                          <span className="block text-xs font-black text-gray-500 mt-1">{formatPrice(p.price)}</span>
                        </span>
                      </button>

                      {/* Stock por sabor */}
                      <div className="flex-1 flex flex-wrap gap-1.5">
                        {p.variants?.length ? (
                          p.variants.map((v: any, i: number) => (
                            <span key={i} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${stockTone(Number(v.countInStock) || 0)}`}>
                              <span className="font-medium opacity-80">{v.flavor || `Opción ${i + 1}`}</span>
                              <span className="tabular-nums">{Number(v.countInStock) > 0 ? v.countInStock : 'Agotado'}</span>
                            </span>
                          ))
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${stockTone(units)}`}>
                            <span className="font-medium opacity-80">Stock</span>
                            <span className="tabular-nums">{units > 0 ? units : 'Agotado'}</span>
                          </span>
                        )}
                      </div>

                      {/* Estado + acciones */}
                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p)}
                          disabled={togglingId === p._id}
                          title={p.isActive ? 'Clic para desactivar' : 'Clic para activar'}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors ${
                            p.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${p.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          {p.isActive ? 'Activo' : 'Inactivo'}
                        </button>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(p)} aria-label={`Editar ${p.name}`} className="inv-icon-btn p-2.5 text-gray-400 hover:text-[#111214] rounded-xl">
                            <Edit3 size={18} />
                          </button>
                          <button onClick={() => confirmDelete(p._id)} aria-label={`Eliminar ${p.name}`} className="inv-icon-btn p-2.5 text-gray-400 hover:text-red-500 rounded-xl">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={executeDelete}
        title="¿Eliminar producto?"
        message="¿Querés eliminar este producto de tu catálogo? Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default InventoryTable;
