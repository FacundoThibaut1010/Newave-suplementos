/**
 * Desplazamiento suave hacia una sección (o arriba de todo).
 *
 * El scroll suave del navegador es muy rápido en distancias largas: parece que "salta" a la sección.
 * Acá se recorre la página con aceleración y frenado (ease-in-out) y una duración que crece con la
 * distancia (0,6 s – 1,6 s), así se ve el camino. Si la persona toca la pantalla, usa la rueda o el
 * teclado, se corta y le devuelve el control. Con "reducir movimiento" va directo.
 */

const HEADER_OFFSET = 100;
let cancelCurrent: (() => void) | null = null;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const jump = (y: number) => window.scrollTo({ top: y, left: 0, behavior: 'instant' as ScrollBehavior });

const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

/** Destino: un id de sección, un elemento o una posición en px. */
export function smoothScrollTo(target: string | HTMLElement | number, offset = HEADER_OFFSET) {
  const resolve = (): number | null => {
    if (typeof target === 'number') return target;
    const el = typeof target === 'string' ? document.getElementById(target) : target;
    if (!el) return null;
    return el.getBoundingClientRect().top + window.scrollY - offset;
  };

  const first = resolve();
  if (first === null) return false;

  cancelCurrent?.();

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const startY = window.scrollY;
  const distance = Math.abs(Math.min(Math.max(first, 0), maxScroll()) - startY);
  if (reduce || distance < 4) {
    jump(first);
    return true;
  }

  const duration = Math.min(1600, Math.max(600, 450 + distance * 0.35));
  const start = performance.now();
  let raf = 0;

  const stop = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('wheel', stop);
    window.removeEventListener('touchstart', stop);
    window.removeEventListener('keydown', stop);
    if (cancelCurrent === stop) cancelCurrent = null;
  };

  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    // El destino se recalcula en cada cuadro: si una imagen termina de cargar y mueve la sección, igual llega justo
    const to = Math.min(Math.max(resolve() ?? first, 0), maxScroll());
    jump(startY + (to - startY) * easeInOutCubic(t));
    if (t < 1) raf = requestAnimationFrame(step);
    else stop();
  };

  window.addEventListener('wheel', stop, { passive: true });
  window.addEventListener('touchstart', stop, { passive: true });
  window.addEventListener('keydown', stop);
  cancelCurrent = stop;
  raf = requestAnimationFrame(step);
  return true;
}
