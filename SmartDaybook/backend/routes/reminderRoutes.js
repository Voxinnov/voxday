const express = require('express');
const router = express.Router();
const { getReminders, createReminder, updateReminder, deleteReminder, patchReminderStatus } = require('../controllers/reminderController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getReminders).post(protect, createReminder);
router.route('/:id').put(protect, updateReminder).delete(protect, deleteReminder);
router.route('/:id/status').patch(protect, patchReminderStatus);

module.exports = router;
