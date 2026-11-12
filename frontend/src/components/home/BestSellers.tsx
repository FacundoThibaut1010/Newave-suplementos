import { useLayoutEffect, useRef, useState } from 'react';
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
 * - Compu: grilla con todos los productos visibles, sin scroll lateral.
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
  const progressRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

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
        <div className="flex items-end md:items-center md:justify-center justify-between gap-4 mb-8 md:mb-10">
          <div className="overflow-hidden md:text-center">
            <h3 className="bs-reveal text-3xl md:text-3xl font-black text-[#202A36] uppercase italic tracking-tighter">Más Vendidos</h3>
            <p className="bs-reveal text-[10px] font-black text-[#CAA959] uppercase tracking-[0.2em] mt-2">Los favoritos de nuestros clientes</p>
          </div>
          {/* Contador y progreso (solo celular, donde la sección se recorre con el scroll) */}
          <div className="bs-counter md:hidden flex flex-col items-end gap-2 shrink-0 overflow-hidden">
            <span className="bs-reveal font-black italic text-[#202A36] tabular-nums text-lg leading-none">
              {pad(current + 1)}
              <span className="text-zinc-400"> / {pad(items.length)}</span>
            </span>
            <div className="bs-reveal w-20 h-[3px] bg-black/10 rounded-full overflow-hidden">
              <div ref={progressRef} className="h-full bg-[#CAA959] origin-left" style={{ transform: 'scaleX(0)' }} />
            </div>
          </div>
        </div>

        {/* Celular: pista horizontal movida por el scroll · Compu: grilla */}
        <div className="bs-track-wrap">
        <div
          ref={trackRef}
          className="bs-track flex md:grid md:justify-center gap-4 md:gap-6 w-max md:w-auto"
          // Compu: tantas columnas como productos (hasta 5), centradas y sin huecos
          style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 5)}, minmax(0, 230px))` }}
        >
          {items.map((product: any, idx: number) => (
            <div key={`${product._id}-${idx}`} className="bs-card w-[68vw] max-w-[300px] md:w-auto md:max-w-none shrink-0 will-change-transform">
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
      </div>
    </section>
  );
};

export default BestSellers;
