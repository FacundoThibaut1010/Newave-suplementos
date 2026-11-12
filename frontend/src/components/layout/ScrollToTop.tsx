import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Al cambiar de página, vuelve arriba AL INSTANTE (antes de pintar).
 * Antes algunas páginas (catálogo, favoritos) mantenían el scroll de la página anterior y otras subían
 * con scroll suave (por `scroll-behavior: smooth` del CSS), así que se veía el footer y después "subía".
 * Si la URL trae un #ancla (ej. /#categorias), no hace nada: la home se encarga de ir a esa sección.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
