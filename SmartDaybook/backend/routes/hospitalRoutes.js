const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, hospitalController.getHospitalRecords)
    .post(protect, hospitalController.createHospitalRecord);

router.route('/:id')
    .put(protect, hospitalController.updateHospitalRecord)
    .delete(protect, hospitalController.deleteHospitalRecord);

module.exports = router;
