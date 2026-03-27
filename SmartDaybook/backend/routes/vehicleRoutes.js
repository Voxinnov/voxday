const express = require('express');
const router = express.Router();
const {
    getVehicles,
    createVehicle,
    getVehicleDetails,
    addService,
    addExpense,
    addFuel
} = require('../controllers/vehicleController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getVehicles)
    .post(protect, createVehicle);

router.route('/:id')
    .get(protect, getVehicleDetails);

router.route('/:id/services')
    .post(protect, addService);

router.route('/:id/expenses')
    .post(protect, addExpense);

router.route('/:id/fuels')
    .post(protect, addFuel);

module.exports = router;
