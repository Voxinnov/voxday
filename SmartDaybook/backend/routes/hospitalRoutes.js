const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');
const hospitalFollowupController = require('../controllers/hospitalFollowupController');
const { protect } = require('../middleware/authMiddleware');

// Follow-ups sub-routes (declared BEFORE /:id to prevent route collision)
router.route('/follow-ups')
    .get(protect, hospitalFollowupController.getFollowUps)
    .post(protect, hospitalFollowupController.createFollowUp);

router.route('/follow-ups/:id')
    .put(protect, hospitalFollowupController.updateFollowUp)
    .delete(protect, hospitalFollowupController.deleteFollowUp);

// Hospital Records routes
router.route('/')
    .get(protect, hospitalController.getHospitalRecords)
    .post(protect, hospitalController.createHospitalRecord);

router.route('/:id')
    .put(protect, hospitalController.updateHospitalRecord)
    .delete(protect, hospitalController.deleteHospitalRecord);

module.exports = router;
