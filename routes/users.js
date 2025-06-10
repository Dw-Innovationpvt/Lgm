const express = require('express');
const { 
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  updateUserRole
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Admin routes
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

router.put('/:id/role', updateUserRole);

// Public routes (require only authentication)
router.use(protect);
router.put('/profile', updateProfile);
router.post('/address', addAddress);
router.put('/address/:addressId', updateAddress);
router.delete('/address/:addressId', deleteAddress);

module.exports = router;
