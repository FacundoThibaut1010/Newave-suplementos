import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Hero from '../components/home/Hero';
import ProductGrid from '../components/home/ProductGrid';
import CategoryScroll from '../components/home/CategoryScroll';
import BestSellers from '../components/home/BestSellers';

const HomePage = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const timer = setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          const y = element.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 300); // Wait a bit for layout to settle
      return () => clearTimeout(timer);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <>
      <Hero />
      <CategoryScroll />
      <ProductGrid />
      <BestSellers />


    </>
  );
};

export default HomePage;
