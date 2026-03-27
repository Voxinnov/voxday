const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createProfile, getProfile,
    calculateBMI,
    getFoods, createFood,
    generateMealPlan, getMealPlan
} = require('../controllers/dietController');

// Profile
router.post('/profile/create', protect, createProfile);
router.get('/profile/:id', protect, getProfile);

// BMI
router.post('/bmi/calculate', protect, calculateBMI); // Usually calculate is stateless but protect anyway

// Foods
router.get('/foods', protect, getFoods);
router.post('/foods', protect, createFood);

// Meal Plan
router.post('/mealplan/generate', protect, generateMealPlan);
router.get('/mealplan/:user_id', protect, getMealPlan);

module.exports = router;
