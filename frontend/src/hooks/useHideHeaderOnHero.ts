import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * En celular, en la home, la barra de anuncios y el menú quedan ocultos mientras se ve el Hero
 * (así se ve completo, sin cortes) y aparecen cuando empieza a verse la segunda sección.
 * En compu y en el resto de las páginas, el menú se ve siempre.
 */
const MOBILE_QUERY = '(max-width: 767px)';

export const useHideHeaderOnHero = () => {
  const { pathname } = useLocation();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const isHome = pathname === '/';
    const mq = window.matchMedia(MOBILE_QUERY);
    let frame = 0;

    const update = () => {
      frame = 0;
      const hero = document.getElementById('hero');
      if (!isHome || !mq.matches || !hero) {
        setHidden(false);
        return;
      }
      // Oculto mientras el Hero ocupe más de la mitad de la pantalla; aparece cuando la segunda sección toma el lugar
      setHidden(hero.getBoundingClientRect().bottom > window.innerHeight * 0.5);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    // El Hero puede montarse un instante después (carga diferida): revisamos de nuevo
    const retry = window.setTimeout(update, 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    mq.addEventListener('change', onScroll);

    return () => {
      window.clearTimeout(retry);
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      mq.removeEventListener('change', onScroll);
    };
  }, [pathname]);

  return hidden;
};
