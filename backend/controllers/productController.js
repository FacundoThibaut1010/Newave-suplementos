import Product from '../models/Product.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = {};
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    let products = await Product.find(query);
    
    // Si hay una búsqueda, ordenamos manualmente para poner las coincidencias exactas del nombre primero
    if (search) {
      const searchLower = search.toLowerCase();
      products.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Prioridad 1: Coincidencia exacta
        if (aName === searchLower) return -1;
        if (bName === searchLower) return 1;
        
        // Prioridad 2: Empieza con el término
        if (aName.startsWith(searchLower) && !bName.startsWith(searchLower)) return -1;
        if (bName.startsWith(searchLower) && !aName.startsWith(searchLower)) return 1;
        
        // Prioridad 3: Contiene el término en el nombre (vs en descripción o categoría)
        if (aName.includes(searchLower) && !bName.includes(searchLower)) return -1;
        if (bName.includes(searchLower) && !aName.includes(searchLower)) return 1;
        
        return 0;
      });
    }
    
    res.json({
      message: '¡Aquí tienes los productos que encontramos para ti! 🎁',
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500);
    throw new Error('No pudimos cargar los productos en este momento. ¡Danos un segundo! ⏳');
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    
    if (product) {
      res.json({
        message: '¡Excelente elección! Aquí tienes los detalles del producto ✨',
        product
      });
    } else {
      res.status(404);
      throw new Error('¡Uy! No pudimos encontrar ese producto. Puede que ya no esté disponible 💔');
    }
  } catch (error) {
    if (error.kind === 'ObjectId') {
      res.status(404);
      throw new Error('El ID del producto no parece válido. ¿Lo escribiste bien? 🤔');
    }
    res.status(500);
    throw new Error('Tuvimos un problemita al buscar el producto. ¡Vuelve a intentarlo! 🛠️');
  }
};

// @desc    Get active categories with images
// @route   GET /api/products/active-categories
// @access  Public
export const getActiveCategories = async (req, res) => {
  try {
    const StoreConfig = (await import('../models/StoreConfig.js')).default;
    const config = await StoreConfig.findOne();
    const configCategories = config?.categories || [];

    // Buscar todas las categorías que tengan al menos un producto
    const activeCategoriesNames = await Product.distinct('category');
    const normalizedActiveNames = activeCategoriesNames.map(name => name?.toLowerCase().trim());
    
    // Filtrar las categorías de configuración para dejar solo las activas
    const activeCategories = configCategories.filter(cat => {
      const catName = cat.name?.toLowerCase().trim();
      const catSlug = cat.slug?.toLowerCase().trim();
      return normalizedActiveNames.includes(catName) || normalizedActiveNames.includes(catSlug);
    });

    res.json(activeCategories);
  } catch (error) {
    res.status(500);
    throw new Error('No pudimos cargar las categorías. ¡Danos un segundo! ⏳');
  }
};
