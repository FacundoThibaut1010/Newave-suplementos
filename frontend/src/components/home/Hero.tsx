import { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { useStoreConfigStore } from '../../store/useStoreConfigStore';
import goldWhey from '../../assets/hero-estudio/gold-whey.webp';
import goldCreatina from '../../assets/hero-estudio/gold-creatina.webp';
import starPlatinum from '../../assets/hero-estudio/star-platinum.webp';
import xtrenghtAdvanced from '../../assets/hero-estudio/xtrenght-advanced.webp';
import enaWhey from '../../assets/hero-estudio/ena-whey.webp';

/**
 * Escenario del Hero con look de foto de producto: envases APOYADOS sobre una superficie clara, una sola
 * luz suave desde arriba a la izquierda, sombra de contacto, sombra proyectada, sombreado coherente sobre
 * cada envase y un reflejo tenue. Al entrar "se prende la luz" y los productos se apoyan; después solo un
 * parallax de cámara muy leve con el mouse. Estilos en index.css (.studio-*).
 */

type Item = {
  src: string;
  alt: string;
  cx: number; // centro horizontal (% del ancho del escenario)
  base: number; // línea donde apoya (% del alto del escenario)
  h: number; // alto del envase (% del alto del escenario)
  ratio: number; // ancho / alto de la imagen recortada
  row: 'back' | 'front';
  order: number;
};

// Alturas relativas aproximadas a las reales (bolsa 2 lb > doypack 300 g > potes 2 lb)
const ITEMS: Item[] = [
  { src: goldWhey, alt: 'Gold Nutrition Whey Protein 2 Lbs', cx: 39, base: 70, h: 58, ratio: 727 / 1064, row: 'back', order: 1 },
  { src: goldCreatina, alt: 'Gold Nutrition Creatina Monohidrato', cx: 68, base: 70, h: 47, ratio: 724 / 999, row: 'back', order: 3 },
  { src: enaWhey, alt: 'ENA Whey Protein Truemade', cx: 17, base: 86, h: 40, ratio: 302 / 520, row: 'front', order: 2 },
  { src: starPlatinum, alt: 'Star Nutrition Platinum Whey Protein', cx: 50, base: 90, h: 50, ratio: 495 / 861, row: 'front', order: 0 },
  { src: xtrenghtAdvanced, alt: 'Xtrenght Advanced Whey Protein', cx: 82, base: 87, h: 44, ratio: 451 / 775, row: 'front', order: 4 },
];

const STAGE_RATIO = 5 / 4; // ancho / alto del escenario

const Product = ({ item, camX, camY, still }: { item: Item; camX: MotionValue<number>; camY: MotionValue<number>; still: boolean }) => {
  const widthPct = (item.h * item.ratio) / STAGE_RATIO; // ancho en % del ancho del escenario
  const depth = item.row === 'front' ? 1 : 0.45;
  const x = useTransform(camX, (v) => (still ? 0 : v * 14 * depth));
  const y = useTransform(camY, (v) => (still ? 0 : v * 6 * depth));
  const transform = useMotionTemplate`translate3d(${x}px, ${y}px, 0)`;

  return (
    <motion.div
      className={`studio-product studio-product--${item.row}`}
      style={{
        left: `${item.cx - widthPct / 2}%`,
        width: `${widthPct}%`,
        bottom: `${100 - item.base}%`,
        zIndex: item.row === 'front' ? 3 : 2,
        transform,
        ['--enter-delay' as any]: `${500 + item.order * 90}ms`,
      }}
    >
      {/* Lo que pertenece al piso no baja con el producto: solo aparece cuando "se apoya" */}
      <div className="studio-ground" aria-hidden>
        {/* Sombra proyectada (luz desde arriba a la izquierda → cae hacia atrás, a la derecha) */}
        <img src={item.src} alt="" className="studio-cast" draggable={false} />
        {/* Reflejo tenue sobre la superficie */}
        <img src={item.src} alt="" className="studio-reflection" draggable={false} />
        {/* Sombra de contacto: donde el envase toca la superficie */}
        <span className="studio-contact" />
      </div>

      <div className="studio-product-enter">
        <div className="studio-body">
          <img src={item.src} alt={item.alt} className="studio-img" draggable={false} decoding="async" fetchPriority={item.order < 2 ? 'high' : 'auto'} />
          {/* Sombreado y luz de borde recortados con la silueta del envase, para que todos tengan la misma luz */}
          <span className="studio-shade" aria-hidden style={{ WebkitMaskImage: `url(${item.src})`, maskImage: `url(${item.src})` }} />
          <span className="studio-rim" aria-hidden style={{ WebkitMaskImage: `url(${item.src})`, maskImage: `url(${item.src})` }} />
        </div>
      </div>
    </motion.div>
  );
};

const StudioStage = () => {
  const still = useReducedMotion() ?? false;
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  // Cámara pesada y sin rebote: se siente como mover la cabeza frente a una vidriera
  const camX = useSpring(rawX, { stiffness: 50, damping: 20 });
  const camY = useSpring(rawY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    if (still || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const onMove = (e: PointerEvent) => {
      rawX.set(e.clientX / window.innerWidth - 0.5);
      rawY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [still, rawX, rawY]);

  return (
    <div className="studio-stage studio-stage--light" style={{ aspectRatio: String(STAGE_RATIO) }} aria-label="Productos destacados">
      <div className="studio-backdrop" aria-hidden />
      <div className="studio-key-light" aria-hidden />
      <div className="studio-floor" aria-hidden />
      {ITEMS.map((item) => (
        <Product key={item.alt} item={item} camX={camX} camY={camY} still={still} />
      ))}
    </div>
  );
};

/** Hero de la home: estudio claro, productos apoyados con luz y sombras coherentes, tipografía Outfit (la del resto del sitio). */
const Hero = () => {
  const hero = useStoreConfigStore((state) => state.hero);
  const title = hero.title || "Energía. Fuerza. Resultados.";

  return (
    <section id="hero" className="studio-light-section relative overflow-hidden pt-6 md:pt-[120px] pb-10 lg:pb-0 min-h-[100svh] md:min-h-0 lg:min-h-[82vh] flex items-center">
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 md:px-16 lg:px-24 grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)] gap-4 lg:gap-6 items-center">
        <motion.div
          initial={{ opacity: 0, transform: "translateY(16px)" }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="studio-light-text text-center lg:text-left order-2 lg:order-1"
        >
          <span className="block text-[11px] lg:text-xs font-medium uppercase tracking-[0.28em] text-neutral-500 mb-5">
            Strength &amp; Performance
          </span>
          <h1 className="studio-light-title text-5xl leading-[0.98] sm:text-6xl lg:text-6xl xl:text-[5rem] 2xl:text-[5.5rem] text-neutral-900 mb-6">
            {title.split(" ").map((word: string, i: number) => (
              <span key={i}>
                {word}{" "}
                <br className="hidden lg:block" />
              </span>
            ))}
          </h1>
          <p className="text-base md:text-lg text-neutral-600 leading-relaxed max-w-md mx-auto lg:mx-0 mb-9">
            {hero.subtitle || "Descubrí la suplementación premium diseñada para quienes buscan superar cada límite."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
            <Link to="/productos" className="studio-light-cta w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-neutral-900 text-white px-9 py-4 rounded-full text-sm font-medium tracking-wide">
              Ver catálogo
              <ArrowRight size={16} className="studio-cta-arrow" />
            </Link>
          </div>
        </motion.div>

        <div className="w-full max-w-[490px] sm:max-w-[580px] mx-auto lg:max-w-none order-1 lg:order-2">
          <StudioStage />
        </div>
      </div>
    </section>
  );
};

export default Hero;
