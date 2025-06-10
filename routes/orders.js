const express = require('express');
const { 
  createOrder,
  getOrders,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createOrder)
  .get(authorize('admin'), getOrders);

router.get('/myorders', getMyOrders);

router.route('/:id')
  .get(getOrderById);

router.put('/:id/pay', updateOrderToPaid);
router.put('/:id/deliver', authorize('admin'), updateOrderToDelivered);
router.put('/:id/status', authorize('admin'), updateOrderStatus);

module.exports = router;
