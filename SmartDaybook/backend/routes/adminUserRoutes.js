const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserRole, updateUserStatus, deleteUser } = require('../controllers/adminUserController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(protect, admin, getAllUsers);
router.route('/:id/role').put(protect, admin, updateUserRole);
router.route('/:id/status').put(protect, admin, updateUserStatus);
router.route('/:id').delete(protect, admin, deleteUser);

module.exports = router;
