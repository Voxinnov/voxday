const express = require('express');
const router = express.Router();
const { getGlobalStats } = require('../controllers/adminStatsController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(protect, admin, getGlobalStats);

module.exports = router;
