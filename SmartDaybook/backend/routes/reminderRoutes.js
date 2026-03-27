const express = require('express');
const router = express.Router();
const { getReminders, createReminder, updateReminder, deleteReminder } = require('../controllers/reminderController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getReminders).post(protect, createReminder);
router.route('/:id').put(protect, updateReminder).delete(protect, deleteReminder);

module.exports = router;
