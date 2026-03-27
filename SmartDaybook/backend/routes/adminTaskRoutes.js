const express = require('express');
const router = express.Router();
const { getAllTasks, deleteTask } = require('../controllers/adminTaskController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(protect, admin, getAllTasks);
router.route('/:id').delete(protect, admin, deleteTask);

module.exports = router;
