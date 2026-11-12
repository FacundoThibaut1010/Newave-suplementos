import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X, Plus, Mail, Phone } from 'lucide-react';

/**
 * Menú de pantalla completa para celular.
 * - Se abre con un círculo que se expande desde el botón de las tres líneas (clip-path), cubriendo la web.
 * - Opciones grandes y numeradas que suben en cascada desde una máscara; las líneas divisorias se dibujan.
 * - "Productos" despliega las categorías activas.
 * - Se renderiza en un portal: el <nav> tiene backdrop-filter, que encerraría a un elemento fixed adentro.
 * Animaciones en CSS (solo transform/opacity/clip-path). Estilos en index.css (.mmenu-*).
 */

export type MobileMenuItem = {
  label: string;
  to?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  href?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  items: MobileMenuItem[];
  categories: { name: string; slug: string }[];
  /** Posición del botón que abrió el menú, para que el círculo nazca ahí */
  origin: { x: number; y: number };
};

const EXIT_MS = 420;

const MobileMenu = ({ open, onClose, items, categories, origin }: Props) => {
  // Mantener montado mientras corre la animación de cierre
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // dos frames: primero se monta cerrado, después se abre (así la transición arranca)
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    setProductsOpen(false);
    const t = window.setTimeout(() => setMounted(false), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const pad = (n: number) => String(n).padStart(2, '0');
  // "Productos" va como tercera opción, desplegable
  const productsIndex = Math.min(2, items.length);
  const rows: (MobileMenuItem | 'products')[] = [...items.slice(0, productsIndex), 'products', ...items.slice(productsIndex)];

  return createPortal(
    <div
      className={`mmenu ${visible ? 'is-open' : ''}`}
      style={{ ['--mx' as any]: `${origin.x}px`, ['--my' as any]: `${origin.y}px` }}
      role="dialog"
      aria-modal="true"
      aria-label="Menú"
    >
      <div className="mmenu-glow" aria-hidden />

      <div className="mmenu-top">
        <span className="mmenu-brand">NEWAVE.</span>
        <button type="button" onClick={onClose} aria-label="Cerrar menú" className="mmenu-close">
          <X size={26} strokeWidth={2.2} />
        </button>
      </div>

      <nav className="mmenu-list">
        {rows.map((row, i) => {
          const style = { ['--i' as any]: i };
          const num = <span className="mmenu-num">{pad(i + 1)}</span>;

          if (row === 'products') {
            return (
              <div key="products" className="mmenu-row" style={style}>
                <button type="button" className="mmenu-link" onClick={() => setProductsOpen((v) => !v)} aria-expanded={productsOpen}>
                  <span className="mmenu-mask">
                    <span className="mmenu-text">
                      {num}
                      Productos
                    </span>
                  </span>
                  <Plus size={22} className={`mmenu-plus ${productsOpen ? 'is-open' : ''}`} />
                </button>
                <div className={`mmenu-sub ${productsOpen ? 'is-open' : ''}`}>
                  <div className="mmenu-sub-inner">
                    {categories.map((cat) => (
                      <Link key={cat.slug} to={`/productos/${cat.slug}`} onClick={onClose} className="mmenu-sublink">
                        {cat.name}
                      </Link>
                    ))}
                    <Link to="/productos" onClick={onClose} className="mmenu-sublink is-all">
                      Ver todos →
                    </Link>
                  </div>
                </div>
                <span className="mmenu-line" aria-hidden />
              </div>
            );
          }

          const content = (
            <span className="mmenu-mask">
              <span className="mmenu-text">
                {num}
                {row.label}
              </span>
            </span>
          );

          return (
            <div key={row.label} className="mmenu-row" style={style}>
              {row.to ? (
                <Link to={row.to} onClick={(e) => { row.onClick?.(e as any); onClose(); }} className="mmenu-link">
                  {content}
                </Link>
              ) : (
                <a href={row.href} onClick={(e) => { row.onClick?.(e); onClose(); }} className="mmenu-link">
                  {content}
                </a>
              )}
              <span className="mmenu-line" aria-hidden />
            </div>
          );
        })}
      </nav>

      <div className="mmenu-footer" style={{ ['--i' as any]: rows.length + 1 }}>
        <a href="https://www.instagram.com/newave.fitness/" target="_blank" rel="noreferrer" className="mmenu-social">
          <img src="/mdi--instagram.svg" alt="" className="w-[18px] h-[18px] invert" /> @newave.fitness
        </a>
        <div className="mmenu-social-group">
          <a href="https://wa.me/5491165392403" target="_blank" rel="noreferrer" className="mmenu-social is-icon" aria-label="Escribinos por WhatsApp">
            <Phone size={18} />
          </a>
          <a href="mailto:newavesuple2026@gmail.com" className="mmenu-social is-icon" aria-label="Enviar mail">
            <Mail size={18} />
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MobileMenu;
