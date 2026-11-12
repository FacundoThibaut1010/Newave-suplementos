import { useCallback, useEffect, useState, type RefObject } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Flechas para filas con scroll horizontal (solo compu: en celular se desliza con el dedo).
 * Aparecen únicamente cuando hay contenido escondido hacia ese lado, así que si todo entra no se ven.
 * El contenedor (targetRef) tiene que ser el elemento con overflow-x: auto.
 */
type Props = {
  targetRef: RefObject<HTMLElement | null>;
  /** Fondo oscuro → flechas claras */
  dark?: boolean;
  className?: string;
};

const ScrollArrows = ({ targetRef, dark = false, className = '' }: Props) => {
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = targetRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, [targetRef]);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [targetRef, update]);

  const scrollBy = (dir: -1 | 1) => {
    const el = targetRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const base = `scroll-arrow hidden md:flex absolute top-1/2 z-20 w-11 h-11 rounded-full items-center justify-center shadow-lg ${
    dark ? 'bg-white text-black' : 'bg-white text-[#202A36] border border-black/5'
  }`;

  return (
    <div className={className}>
      <button
        type="button"
        aria-label="Ver anteriores"
        onClick={() => scrollBy(-1)}
        className={`${base} left-2 lg:left-4 ${canLeft ? 'is-visible' : ''}`}
        tabIndex={canLeft ? 0 : -1}
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        aria-label="Ver siguientes"
        onClick={() => scrollBy(1)}
        className={`${base} right-2 lg:right-4 ${canRight ? 'is-visible' : ''}`}
        tabIndex={canRight ? 0 : -1}
      >
        <ChevronRight size={22} />
      </button>
    </div>
  );
};

export default ScrollArrows;
