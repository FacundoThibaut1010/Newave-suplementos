import { create } from 'zustand';
import apiClient from '../api/apiClient';

// Igual que el filtro del catálogo (ProductsPage): coincide si un nombre contiene al otro ("Proteínas" ~ "Proteína")
export const categoryMatches = (productCategory?: string, target?: string) => {
  if (!productCategory || !target) return false;
  const a = productCategory.toLowerCase().trim();
  const b = target.toLowerCase().trim();
  return a === b || a.includes(b) || b.includes(a);
};

interface ProductStore {
  products: any[];
  categories: { value: string; label: string }[];
  activeCategories: any[];
  loading: boolean;
  error: string | null;
  hasFetched: boolean;
  fetchProducts: () => Promise<void>;
  getProductById: (id: string) => any | undefined;
  hasCombos: () => boolean;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  categories: [{ value: 'Todas', label: 'Todos' }],
  activeCategories: [],
  loading: false,
  error: null,
  hasFetched: false,

  fetchProducts: async () => {
    const { hasFetched, loading } = get();
    // Prevent fetching if already fetched or currently loading
    if (hasFetched || loading) return;

    set({ loading: true, error: null });
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        apiClient.get('/products'),
        apiClient.get('/products/active-categories')
      ]);

      const products = productsRes.data.products || [];
      // Solo categorías que tengan al menos un producto a la venta: si no hay, desaparecen
      // de la home, el menú, el footer y el catálogo. Misma regla de coincidencia que el catálogo.
      const activeCategories = (categoriesRes.data || []).filter((cat: any) =>
        products.some((p: any) => categoryMatches(p.category, cat.slug) || categoryMatches(p.category, cat.name))
      );
      const dynamicOptions = activeCategories.map((c: any) => ({ value: c.slug, label: c.name }));
      const categories = [{ value: 'Todas', label: 'Todos' }, ...dynamicOptions];

      set({ products, categories, activeCategories, loading: false, hasFetched: true });
    } catch (error: any) {
      set({ error: error.response?.data?.friendlyMessage || 'Error al cargar los productos.', loading: false });
    }
  },

  getProductById: (id: string) => {
    return get().products.find((p) => p._id === id);
  },

  hasCombos: () => {
    return get().products.some((p) => p.displaySection === 'Combo');
  },
}));
