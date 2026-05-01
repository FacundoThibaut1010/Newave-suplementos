import Product from '../models/Product.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    
    const products = await Product.find(query).populate('category', 'name');
    
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
