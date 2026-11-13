import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ProductCard from './ProductCard';
import { useStoreConfigStore } from '../../store/useStoreConfigStore';
import { useProductStore } from '../../store/useProductStore';

gsap.registerPlugin(ScrollTrigger);

/**
 * Más vendidos.
 * - Celular: la sección se fija en pantalla y el scroll vertical desplaza los productos de costado
 *   (ScrollTrigger con pin + scrub). El producto del centro queda en foco (escala/opacidad) y se ajusta
 *   suavemente a cada tarjeta. Al terminar, la página sigue normal: no hay una caja con scroll propio.
 * - Compu: estante con tarjetas de ancho exacto (5 por página en compu, 4 en tablet) para que nunca quede
 *   un producto cortado; flechas arriba a la derecha que avanzan de a una página y barra de progreso.
 * - "Reducir movimiento": fila deslizable simple, sin pin ni efectos.
 */

const MOBILE_MOTION = '(max-width: 767px) and (prefers-reduced-motion: no-preference)';
const HEADER_OFFSET = 128;

const BestSellers = () => {
  const bestSellers = useStoreConfigStore((state) => state.bestSellers);
  const activeProducts = useProductStore((state) => state.products);

  // Solo los que siguen a la venta (un producto desactivado no debería aparecer en "más vendidos")
  const activeIds = new Set(activeProducts.map((p: any) => String(p._id)));
  const items = activeProducts.length
    ? bestSellers.filter((p: any) => p && activeIds.has(String(p._id)))
    : bestSellers;

  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  // Compu: estado de las flechas y de la barra (qué parte del estante se está viendo)
  const thumbRef = useRef<HTMLDivElement>(null);
  const [nav, setNav] = useState({ prev: false, next: false, paged: false });
  const syncShelf = useCallback(() => {
    const el = wrapRef.current;
    if (!el || window.innerWidth < 768) return;
    const max = el.scrollWidth - el.clientWidth;
    const paged = max > 4;
    const prev = el.scrollLeft > 4;
    const next = el.scrollLeft < max - 4;
    setNav((n) => (n.prev === prev && n.next === next && n.paged === paged ? n : { prev, next, paged }));
    if (thumbRef.current) {
      const ratio = el.clientWidth / el.scrollWidth;
      const pos = max > 0 ? el.scrollLeft / max : 0;
      thumbRef.current.style.width = `${ratio * 100}%`;
      thumbRef.current.style.transform = `translateX(${pos * (1 / ratio - 1) * 100}%)`;
    }
  }, []);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    syncShelf();
    el.addEventListener('scroll', syncShelf, { passive: true });
    const ro = new ResizeObserver(syncShelf);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener('scroll', syncShelf);
      ro.disconnect();
    };
  }, [syncShelf, items.length]);
  // La barra aparece recién cuando hay más productos de los que entran: medirla apenas se muestra
  useEffect(() => {
    if (nav.paged) syncShelf();
  }, [nav.paged, syncShelf]);
  const page = (dir: -1 | 1) => {
    const el = wrapRef.current;
    if (!el) return;
    const gap = parseFloat(getComputedStyle(el.firstElementChild as Element).columnGap) || 0;
    el.scrollBy({ left: dir * (el.clientWidth + gap), behavior: 'smooth' });
  };

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || items.length < 2) return;

    const mm = gsap.matchMedia();

    mm.add(MOBILE_MOTION, () => {
      const cards = gsap.utils.toArray<HTMLElement>('.bs-card', track);
      const title = gsap.utils.toArray<HTMLElement>('.bs-reveal', section);

      // Título y contador entran al llegar a la sección
      gsap.from(title, {
        yPercent: 110,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.06,
        scrollTrigger: { trigger: section, start: 'top 80%', once: true },
      });

      // El producto más cercano al centro queda en foco; el resto se achica y se atenúa
      const setters = cards.map((card) => ({
        scale: gsap.quickSetter(card, 'scale'),
        opacity: gsap.quickSetter(card, 'opacity'),
        rotate: gsap.quickSetter(card, 'rotate', 'deg'),
      }));
      const focus = () => {
        const center = window.innerWidth / 2;
        let nearest = 0;
        let best = Infinity;
        cards.forEach((card, i) => {
          const r = card.getBoundingClientRect();
          const offset = (r.left + r.width / 2 - center) / r.width; // 0 = centrado, ±1 = una tarjeta al costado
          const d = Math.min(Math.abs(offset), 1.4);
          setters[i].scale(1 - d * 0.12);
          setters[i].opacity(1 - d * 0.45);
          setters[i].rotate(Math.max(-1, Math.min(1, offset)) * 3);
          if (Math.abs(offset) < best) {
            best = Math.abs(offset);
            nearest = i;
          }
        });
        setCurrent((prev) => (prev === nearest ? prev : nearest));
      };

      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const steps = cards.length - 1;

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          // Se fija justo debajo del menú fijo (barra de anuncios 48px + menú 80px)
          start: () => `top ${HEADER_OFFSET}px`,
          end: () => `+=${distance() * 1.15}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          // Se acomoda suavemente en la tarjeta más cercana cuando el dedo para
          // directional: false → se acomoda en la tarjeta MÁS CERCANA (no salta a la siguiente apenas entrás)
          snap: { snapTo: 1 / steps, directional: false, duration: { min: 0.15, max: 0.4 }, ease: 'power2.out', delay: 0.05 },
          onUpdate: (self) => {
            if (progressRef.current) progressRef.current.style.transform = `scaleX(${self.progress})`;
            focus();
          },
          onRefresh: focus,
        },
      });

      focus();
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });

    // Las imágenes cambian el alto de la página: recalcular posiciones cuando terminan de cargar
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);
    const refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 600);

    return () => {
      window.removeEventListener('load', onLoad);
      window.clearTimeout(refreshTimer);
      mm.revert();
    };
  }, [items.length]);

  if (items.length === 0) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section
      ref={sectionRef}
      id="mas-vendidos"
      className="bs-section relative bg-[#F4F4F4] border-t border-gray-100 overflow-hidden"
    >
      <div className="bs-inner max-w-[1200px] mx-auto px-6 py-14 lg:py-16 flex flex-col">
        {/* Encabezado */}
        <div className="flex items-end justify-between gap-4 mb-8 md:mb-10">
          <div className="overflow-hidden">
            <h3 className="bs-reveal text-3xl md:text-4xl font-black text-[#202A36] uppercase italic tracking-tighter">Más Vendidos</h3>
            <p className="bs-reveal text-[10px] font-black text-[#CAA959] uppercase tracking-[0.2em] mt-2">Los favoritos de nuestros clientes</p>
          </div>
          {/* Contador y progreso (solo celular, donde la sección se recorre con el scroll) */}
          <div className="bs-counter md:hidden flex flex-col items-end gap-2 shrink-0 overflow-hidden pr-1.5 -mr-1.5">
            <span className="bs-reveal font-black italic text-[#202A36] tabular-nums text-lg leading-none">
              {pad(current + 1)}
              <span className="text-zinc-400"> / {pad(items.length)}</span>
            </span>
            <div className="bs-reveal w-20 h-[3px] bg-black/10 rounded-full overflow-hidden">
              <div ref={progressRef} className="h-full bg-[#CAA959] origin-left" style={{ transform: 'scaleX(0)' }} />
            </div>
          </div>
          {/* Compu: flechas del estante (solo si hay más productos de los que entran) */}
          {nav.paged && (
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <button type="button" onClick={() => page(-1)} disabled={!nav.prev} aria-label="Ver anteriores" className="bs-nav">
                <ChevronLeft size={20} strokeWidth={2.25} />
              </button>
              <button type="button" onClick={() => page(1)} disabled={!nav.next} aria-label="Ver siguientes" className="bs-nav">
                <ChevronRight size={20} strokeWidth={2.25} />
              </button>
            </div>
          )}
        </div>

        {/* Celular: pista horizontal movida por el scroll · Compu: grilla */}
        <div className="relative">
        <div ref={wrapRef} className="bs-track-wrap bs-shelf scrollbar-hide">
        <div
          ref={trackRef}
          // Celular: fila w-max movida por GSAP · Compu: columnas de ancho exacto (ver .bs-track en index.css)
          className="bs-track flex gap-4 w-max"
        >
          {items.map((product: any, idx: number) => (
            <div key={`${product._id}-${idx}`} className="bs-card w-[68vw] max-w-[300px] md:w-auto md:max-w-none shrink-0 will-change-transform md:will-change-auto">
              <ProductCard
                id={product._id}
                {...product}
                category={product.category || 'Destacado'}
                image={product.images?.[0] || product.image || ''}
                images={product.images}
                hidePrice={true}
              />
            </div>
          ))}
        </div>
        </div>
        {/* Compu: barra que muestra qué parte del estante se ve */}
        {nav.paged && (
          <div className="hidden md:block mt-8 mx-auto w-40 h-[3px] rounded-full bg-black/10 overflow-hidden" aria-hidden>
            <div ref={thumbRef} className="bs-thumb h-full rounded-full bg-[#202A36]" />
          </div>
        )}
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
