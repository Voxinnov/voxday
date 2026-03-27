const express = require('express');
const router = express.Router();
const { getAllCategoriesAdmin, updateCategoryAdmin, deleteCategoryAdmin } = require('../controllers/adminCategoryController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(protect, admin, getAllCategoriesAdmin);
router.route('/:id').put(protect, admin, updateCategoryAdmin).delete(protect, admin, deleteCategoryAdmin);

module.exports = router;
