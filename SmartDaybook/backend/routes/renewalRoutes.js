const express = require('express');
const router = express.Router();
const { getRenewals, createRenewal, updateRenewal, deleteRenewal } = require('../controllers/renewalController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getRenewals).post(protect, createRenewal);
router.route('/:id').put(protect, updateRenewal).delete(protect, deleteRenewal);

module.exports = router;
