const express = require('express');
const router = express.Router();
const { getAllTransactions, deleteTransaction } = require('../controllers/adminTransactionController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(protect, admin, getAllTransactions);
router.route('/:id').delete(protect, admin, deleteTransaction);

module.exports = router;
