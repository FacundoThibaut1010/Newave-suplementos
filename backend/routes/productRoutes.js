import express from 'express';
const router = express.Router();
import { getProducts, getProductById, getActiveCategories } from '../controllers/productController.js';

router.get('/active-categories', getActiveCategories);
router.get('/', getProducts);
router.get('/:id', getProductById);

export default router;
