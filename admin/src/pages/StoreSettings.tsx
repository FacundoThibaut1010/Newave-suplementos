import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Megaphone, RotateCcw, LayoutGrid, Star, Search, X, UploadCloud, Loader2, Plus, Trash2, Eye, EyeOff, Home } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../api/apiClient';
import { useAdminStore } from '../store/useAdminStore';

/**
 * Identidad: lo que se ve en la tienda, en 4 pestañas (portada, cinta de anuncios, categorías, más vendidos).
 * Los cambios se acumulan y se publican juntos desde la barra inferior, que solo aparece si hay cambios.
 */

type Tab = 'portada' | 'cinta' | 'categorias' | 'vendidos';

// Mensajes que la tienda muestra por defecto en la cinta (mismos que frontend/src/components/layout/TopBar.tsx)
const DEFAULT_MESSAGES = [
  'ENVÍO GRATIS EN COMPRAS SUPERIORES A $150.000',
  'NUEVA CREATINA MICRONIZADA - ¡YA DISPONIBLE!',
  'SUMATE A LA REVOLUCIÓN NEWAVE 🚀',
  'SEGUINOS EN INSTAGRAM COMO @NEWAVE.FITNESS',
];

// Las fotos de categorías con ruta relativa (/creatina (1).jpg) viven en la tienda: se cargan desde ahí,
// así el admin muestra exactamente lo mismo que ve el cliente.
const STORE_URL = (import.meta.env.VITE_STORE_URL || 'https://newave-suplementos.vercel.app').replace(/\/+$/, '');
const storeAsset = (src?: string) => (src && src.startsWith('/') ? STORE_URL + encodeURI(src) : src || '');

// Comprime una foto a WebP de hasta 800 px (igual que en el formulario de producto)
const compressImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (event) => {
      const img = new window.Image();
      img.onerror = reject;
      img.onload = () => {
        const MAX = 800;
        const scale = img.width > MAX ? MAX / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/webp', 0.82));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });

// Misma regla que usa la tienda para saber si un producto pertenece a una categoría
const matches = (productCategory?: string, target?: string) => {
  if (!productCategory || !target) return false;
  const a = productCategory.toLowerCase().trim();
  const b = target.toLowerCase().trim();
  return a === b || a.includes(b) || b.includes(a);
};

const idOf = (b: any) => String(b?._id ?? b);

const StoreSettings = () => {
  const { products, config: storeConfig, loadingConfig, fetchProducts, fetchConfig } = useAdminStore();
  const [config, setConfig] = useState<any>(null);
  const [originalConfig, setOriginalConfig] = useState<any>(null);
  const [tab, setTab] = useState<Tab>('portada');
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchConfig();
  }, []);

  useEffect(() => {
    if (storeConfig) {
      setConfig(storeConfig);
      setOriginalConfig(storeConfig);
    }
  }, [storeConfig]);

  const dirty = useMemo(() => config && originalConfig && JSON.stringify(config) !== JSON.stringify(originalConfig), [config, originalConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/admin/config', config);
      setOriginalConfig(config);
      fetchConfig(true);
      toast.success('Listo: la tienda ya muestra los cambios.');
    } catch {
      toast.error('Hubo un problema al publicar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {loadingConfig || !storeConfig ? <Loader2 size={32} className="animate-spin text-gray-300" /> : null}
      </div>
    );
  }

  // ---------- Cinta de anuncios ----------
  const announcement = config.announcement || { enabled: false, messages: [] };
  // customized = la lista ya fue editada acá y reemplaza a los mensajes por defecto.
  // Si no, mostramos lo que la tienda muestra hoy: los mensajes por defecto + los agregados (si la cinta estaba encendida).
  const messages: string[] = announcement.customized
    ? announcement.messages || []
    : [...DEFAULT_MESSAGES, ...(announcement.enabled ? (announcement.messages || []).filter((m: string) => m && m.trim()) : [])];
  const setMessages = (msgs: string[]) =>
    setConfig({ ...config, announcement: { ...announcement, customized: true, enabled: true, messages: msgs } });
  const restoreDefaultMessages = () =>
    setConfig({ ...config, announcement: { ...announcement, customized: false, enabled: false, messages: [] } });

  // ---------- Portada ----------
  const hero = config.hero || {};
  const setHero = (patch: any) => setConfig({ ...config, hero: { ...hero, ...patch } });

  // ---------- Categorías ----------
  const categories: any[] = config.categories || [];
  const setCategory = (idx: number, patch: any) => {
    const next = categories.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    setConfig({ ...config, categories: next });
  };
  const productList = Array.isArray(products) ? products : [];
  const categoryStats = (cat: any) => {
    const inCat = productList.filter((p: any) => matches(p.category, cat.slug) || matches(p.category, cat.name));
    return { total: inCat.length, active: inCat.filter((p: any) => p.isActive !== false).length };
  };
  const uploadCategoryImage = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingIdx(idx);
    try {
      setCategory(idx, { image: await compressImage(file) });
      toast.success('Foto cargada. Acordate de publicar los cambios.');
    } catch {
      toast.error('No se pudo procesar la foto.');
    } finally {
      setUploadingIdx(null);
    }
  };

  // ---------- Más vendidos ----------
  const bestIds: string[] = (config.bestSellers || []).map(idOf);
  const byId = new Map(productList.map((p: any) => [String(p._id), p]));
  const selected = bestIds.map((id) => byId.get(id)).filter(Boolean) as any[];
  const toggleBest = (id: string) => {
    const next = bestIds.includes(id) ? bestIds.filter((x) => x !== id) : [...bestIds, id];
    setConfig({ ...config, bestSellers: next });
  };
  const candidates = productList
    .filter((p: any) => !bestIds.includes(String(p._id)))
    .filter((p: any) => !productSearch.trim() || `${p.name} ${p.category}`.toLowerCase().includes(productSearch.trim().toLowerCase()))
    .sort((a: any, b: any) => Number(b.isActive !== false) - Number(a.isActive !== false) || a.name.localeCompare(b.name, 'es'));

  const tabs: { key: Tab; label: string; short: string; icon: any; badge?: number }[] = [
    { key: 'portada', label: 'Portada', short: 'Portada', icon: Home },
    { key: 'cinta', label: 'Cinta de anuncios', short: 'Cinta', icon: Megaphone, badge: messages.filter((m) => m.trim()).length },
    { key: 'categorias', label: 'Categorías', short: 'Categorías', icon: LayoutGrid, badge: categories.length },
    { key: 'vendidos', label: 'Más vendidos', short: 'Destacados', icon: Star, badge: selected.length },
  ];

  const labelCls = 'block text-[13px] font-bold text-[#202A36] mb-1.5';

  return (
    <div className="space-y-6 max-w-5xl pb-28">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-[#202A36] tracking-tighter mb-1">Identidad de la tienda</h1>
        <p className="text-gray-400 font-medium text-sm">Lo que ven tus clientes en la página: la portada, la cinta de arriba, las categorías y los más vendidos.</p>
      </div>

      {/* Pestañas */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 rounded-2xl">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`id-tab relative min-w-0 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-sm font-bold ${active ? 'text-[#202A36]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {active && <motion.span layoutId="id-tab-bg" className="absolute inset-0 bg-white rounded-xl shadow-sm" transition={{ type: 'spring', bounce: 0, duration: 0.3 }} />}
              <t.icon size={17} className="relative" />
              <span className="relative whitespace-nowrap sm:hidden">{t.short}</span>
              <span className="relative whitespace-nowrap hidden sm:inline">{t.label}</span>
              {t.badge !== undefined && (
                <span className={`relative hidden sm:inline text-[10px] font-black px-1.5 py-0.5 rounded-full ${active ? 'bg-[#202A36] text-white' : 'bg-white text-gray-500'}`}>{t.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, transform: 'translateY(6px)' }}
          animate={{ opacity: 1, transform: 'translateY(0px)', transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
        >
          {/* ---------- Portada ---------- */}
          {tab === 'portada' && (
            <section className="bg-white rounded-3xl border border-gray-100 p-5 md:p-7 space-y-6">
              <div>
                <h2 className="text-lg font-black text-[#202A36]">Lo primero que ve el cliente</h2>
                <p className="text-[13px] text-gray-500 mt-0.5">El título, el texto y el botón de la portada de la página de inicio. Si dejás un campo vacío se usa el texto de ejemplo.</p>
              </div>

              {/* Vista previa */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Así se ve en la tienda</p>
                <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-[#f5f3ef] to-[#ece9e3] p-6 md:p-8">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-neutral-500 mb-3">Strength &amp; Performance</p>
                  <p className="text-3xl md:text-4xl font-bold text-neutral-900 leading-[1.02] tracking-tight break-words">
                    {(hero.title || 'Energía. Fuerza. Resultados.').split(' ').map((w: string, i: number) => (
                      <span key={i}>
                        {w} <br className="hidden md:block" />
                      </span>
                    ))}
                  </p>
                  <p className="text-sm text-neutral-600 mt-3 max-w-md">
                    {hero.subtitle || 'Descubrí la suplementación premium diseñada para quienes buscan superar cada límite.'}
                  </p>
                  <span className="inline-flex mt-5 bg-neutral-900 text-white text-xs font-medium px-6 py-2.5 rounded-full">
                    {hero.buttonText || 'Ver catálogo'} →
                  </span>
                </div>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className={labelCls}>Título</label>
                  <input
                    type="text"
                    value={hero.title || ''}
                    onChange={(e) => setHero({ title: e.target.value })}
                    maxLength={60}
                    placeholder="Energía. Fuerza. Resultados."
                    className="input-admin text-sm font-bold"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Corto y con fuerza. En la compu cada palabra va en un renglón, por eso funcionan bien 2 o 3 palabras.</p>
                </div>
                <div>
                  <label className={labelCls}>Texto debajo del título</label>
                  <textarea
                    value={hero.subtitle || ''}
                    onChange={(e) => setHero({ subtitle: e.target.value })}
                    maxLength={160}
                    rows={3}
                    placeholder="Descubrí la suplementación premium diseñada para quienes buscan superar cada límite."
                    className="input-admin text-sm !rounded-2xl resize-none leading-relaxed"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Una o dos oraciones que digan qué ofrece la tienda.</p>
                </div>
                <div className="sm:max-w-xs">
                  <label className={labelCls}>Texto del botón</label>
                  <input
                    type="text"
                    value={hero.buttonText || ''}
                    onChange={(e) => setHero({ buttonText: e.target.value })}
                    maxLength={24}
                    placeholder="Ver catálogo"
                    className="input-admin text-sm font-bold"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Lleva al catálogo. Ej: "Ver catálogo", "Comprar ahora".</p>
                </div>
              </div>
            </section>
          )}

          {/* ---------- Cinta de anuncios ---------- */}
          {tab === 'cinta' && (
            <section className="bg-white rounded-3xl border border-gray-100 p-5 md:p-7 space-y-6">
              <div>
                <h2 className="text-lg font-black text-[#202A36]">La franja negra de arriba de todo</h2>
                <p className="text-[13px] text-gray-500 mt-0.5">Mensajes cortos que van rotando cada 4 segundos. Lo que está en esta lista es exactamente lo que se muestra.</p>
              </div>

              {/* Vista previa */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Así se ve en la tienda</p>
                <div className="rounded-2xl overflow-hidden border border-gray-100">
                  <div className="bg-black text-white h-11 flex items-center justify-center px-4 text-center">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] italic truncate">
                      {messages.find((m) => m.trim()) || DEFAULT_MESSAGES[0]}
                    </span>
                  </div>
                  <div className="h-10 bg-gradient-to-b from-gray-50 to-white" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className={labelCls}>Mensajes ({messages.filter((m) => m.trim()).length})</span>
                  {announcement.customized && (
                    <button type="button" onClick={restoreDefaultMessages} className="id-ghost-neutral inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 px-3 py-1.5 rounded-lg">
                      <RotateCcw size={13} /> Volver a los de por defecto
                    </button>
                  )}
                </div>
                {messages.map((msg, idx) => (
                  <div key={idx} className="flex gap-2 items-center min-w-0">
                    <span className="w-6 shrink-0 text-center text-xs font-black text-gray-300">{idx + 1}</span>
                    <input
                      type="text"
                      value={msg}
                      onChange={(e) => setMessages(messages.map((m, i) => (i === idx ? e.target.value : m)))}
                      placeholder="Ej: Envío gratis este fin de semana"
                      maxLength={70}
                      className="input-admin min-w-0 flex-1 uppercase tracking-wider font-bold text-sm"
                    />
                    <button type="button" onClick={() => setMessages(messages.filter((_, i) => i !== idx))} aria-label="Quitar mensaje" className="id-icon-btn shrink-0 p-2.5 rounded-xl text-gray-400 hover:text-red-500">
                      <X size={18} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setMessages([...messages, ''])} className="id-add w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm font-bold text-gray-500">
                  + Agregar mensaje
                </button>
                <p className="text-xs text-gray-400">Consejo: menos de 50 letras, para que se lea entero en el celular. Si borrás todos, se muestran los de por defecto.</p>
              </div>
            </section>
          )}

          {/* ---------- Categorías ---------- */}
          {tab === 'categorias' && (
            <section className="bg-white rounded-3xl border border-gray-100 p-5 md:p-7 space-y-6">
              <div>
                <h2 className="text-lg font-black text-[#202A36]">Las tarjetas de "Descubrí tu potencial"</h2>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  Una categoría solo se ve en la tienda (inicio, menú, footer y catálogo) si tiene al menos un producto activo.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat, idx) => {
                  const st = categoryStats(cat);
                  const visible = st.active > 0;
                  return (
                    <div key={idx} className="rounded-2xl border border-gray-100 bg-[#FAFAFA] overflow-hidden flex flex-col">
                      <label className="id-photo relative block aspect-[4/3] overflow-hidden bg-gray-100 cursor-pointer group">
                        {cat.image ? (
                          <img src={storeAsset(cat.image)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-1">
                            <UploadCloud size={22} />
                            <span className="text-xs font-bold">Subir foto</span>
                          </span>
                        )}
                        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 bg-white/95 text-[11px] font-bold text-[#202A36] px-2.5 py-1.5 rounded-lg shadow">
                          {uploadingIdx === idx ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
                          {cat.image ? 'Cambiar foto' : 'Subir'}
                        </span>
                        <span
                          className={`absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                            visible ? 'bg-emerald-500 text-white' : 'bg-white/95 text-gray-500'
                          }`}
                        >
                          {visible ? <Eye size={11} /> : <EyeOff size={11} />}
                          {visible ? 'Se ve' : 'Oculta'}
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadCategoryImage(idx, e)} />
                      </label>
                      <div className="p-4 space-y-3 flex-1 flex flex-col">
                        <div>
                          <label className={labelCls}>Nombre</label>
                          <input type="text" value={cat.name} onChange={(e) => setCategory(idx, { name: e.target.value })} className="input-admin text-sm font-bold" />
                        </div>
                        <p className="text-xs text-gray-500">
                          {st.total === 0
                            ? 'Sin productos: no aparece en la tienda.'
                            : `${st.total} ${st.total === 1 ? 'producto' : 'productos'}, ${st.active} ${st.active === 1 ? 'activo' : 'activos'}.`}
                        </p>
                        <details className="text-xs">
                          <summary className="font-bold text-gray-400 cursor-pointer select-none hover:text-[#202A36]">Opciones avanzadas</summary>
                          <div className="mt-2 space-y-2">
                            <label className="block text-[11px] font-bold text-gray-500">Identificador (va en la dirección de la página)</label>
                            <input type="text" value={cat.slug} onChange={(e) => setCategory(idx, { slug: e.target.value })} className="input-admin text-xs font-mono" />
                            <label className="block text-[11px] font-bold text-gray-500">Link de la foto</label>
                            <input type="text" value={cat.image} onChange={(e) => setCategory(idx, { image: e.target.value })} className="input-admin text-[11px] font-mono" placeholder="https://…" />
                          </div>
                        </details>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar la categoría "${cat.name}"? Los productos no se borran.`)) {
                              setConfig({ ...config, categories: categories.filter((_, i) => i !== idx) });
                            }
                          }}
                          className="id-ghost mt-auto inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold text-red-500"
                        >
                          <Trash2 size={13} /> Eliminar categoría
                        </button>
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setConfig({ ...config, categories: [...categories, { name: 'Nueva categoría', slug: 'nueva-categoria', image: '' }] })}
                  className="id-add rounded-2xl border-2 border-dashed border-gray-200 min-h-[260px] flex flex-col items-center justify-center gap-2 text-gray-400"
                >
                  <span className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center"><Plus size={22} /></span>
                  <span className="text-sm font-bold">Agregar categoría</span>
                </button>
              </div>
            </section>
          )}

          {/* ---------- Más vendidos ---------- */}
          {tab === 'vendidos' && (
            <section className="bg-white rounded-3xl border border-gray-100 p-5 md:p-7 space-y-6">
              <div>
                <h2 className="text-lg font-black text-[#202A36]">Los destacados de la página de inicio</h2>
                <p className="text-[13px] text-gray-500 mt-0.5">Elegí qué productos mostrar en "Más vendidos". Si no elegís ninguno, la sección no aparece.</p>
              </div>

              <div>
                <p className={labelCls}>Elegidos ({selected.length})</p>
                {selected.length === 0 ? (
                  <p className="text-sm text-gray-400 p-4 rounded-2xl bg-gray-50 text-center">Todavía no elegiste ninguno. Agregalos desde la lista de abajo.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selected.map((p: any, i: number) => (
                      <div key={p._id} className="min-w-0 flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 bg-[#FAFAFA]">
                        <span className="w-6 text-center text-xs font-black text-gray-300">{i + 1}</span>
                        <img src={p.images?.[0] || p.image} alt="" className="w-11 h-11 rounded-lg object-contain bg-white border border-gray-100 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-[#202A36] truncate">{p.name}</p>
                          <p className={`text-[11px] font-bold ${p.isActive === false ? 'text-amber-600' : 'text-gray-400'}`}>
                            {p.isActive === false ? 'Inactivo: no se muestra' : p.category || 'Producto'}
                          </p>
                        </div>
                        <button type="button" onClick={() => toggleBest(String(p._id))} aria-label={`Quitar ${p.name}`} className="id-icon-btn p-2 rounded-lg text-gray-400 hover:text-red-500">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className={labelCls}>Agregar productos</p>
                <div className="relative mb-3">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Buscar producto…" className="input-admin pl-12" />
                </div>
                <div className="max-h-[360px] overflow-y-auto custom-scrollbar -mr-2 pr-2 space-y-1.5">
                  {candidates.map((p: any) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => toggleBest(String(p._id))}
                      className="id-row w-full flex items-center gap-3 p-2.5 rounded-xl text-left"
                    >
                      <img src={p.images?.[0] || p.image} alt="" className="w-10 h-10 rounded-lg object-contain bg-white border border-gray-100 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-bold truncate ${p.isActive === false ? 'text-gray-400' : 'text-[#202A36]'}`}>{p.name}</p>
                        <p className="text-[11px] font-bold text-gray-400">{p.isActive === false ? 'Inactivo' : p.category || 'Producto'}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-black text-[#CAA959] shrink-0">
                        <Plus size={14} /> Agregar
                      </span>
                    </button>
                  ))}
                  {candidates.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No hay más productos para agregar.</p>}
                </div>
              </div>
            </section>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Barra de cambios sin publicar */}
      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={{ opacity: 0, transform: 'translateY(20px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)', transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } }}
            exit={{ opacity: 0, transform: 'translateY(20px)', transition: { duration: 0.15 } }}
            className="fixed bottom-4 left-4 right-4 md:left-[calc(18rem+2rem)] md:right-8 z-30"
          >
            <div className="max-w-5xl bg-[#202A36] text-white rounded-2xl shadow-2xl p-3 pl-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm font-bold">Tenés cambios sin publicar</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfig(originalConfig);
                    toast.success('Cambios descartados.');
                  }}
                  className="id-bar-ghost flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white/80"
                >
                  <RotateCcw size={14} /> Descartar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="id-bar-primary flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#CAA959] text-white text-xs font-black uppercase tracking-widest disabled:opacity-60"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Publicar cambios
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoreSettings;
