const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getProfile, setupProfile,
    getActivities, createActivity, updateActivity, deleteActivity,
    getDailyLog, updateDailyLog,
    getAnalytics
} = require('../controllers/dayPlannerController');

router.get('/profile', protect, getProfile);
router.post('/profile', protect, setupProfile);

router.get('/activities', protect, getActivities);
router.post('/activities', protect, createActivity);
router.put('/activities/:id', protect, updateActivity);
router.delete('/activities/:id', protect, deleteActivity);

router.get('/logs', protect, getDailyLog);
router.post('/logs', protect, updateDailyLog);

router.get('/analytics', protect, getAnalytics);

module.exports = router;
