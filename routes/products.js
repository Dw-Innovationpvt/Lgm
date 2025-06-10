const express = require('express');
const { 
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getProductsByCategory
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(protect, authorize('admin'), upload.array('images', 5), createProduct);

router.get('/featured', getFeaturedProducts);
router.get('/category/:categoryId', getProductsByCategory);

router.route('/:id')
  .get(getProduct)
  .put(protect, authorize('admin'), upload.array('images', 5), updateProduct)
  .delete(protect, authorize('admin'), deleteProduct);

module.exports = router;
