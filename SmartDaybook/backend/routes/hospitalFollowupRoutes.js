const express = require('express');
const router = express.Router();
const hospitalFollowupController = require('../controllers/hospitalFollowupController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, hospitalFollowupController.getFollowUps)
    .post(protect, hospitalFollowupController.createFollowUp);

router.route('/:id')
    .put(protect, hospitalFollowupController.updateFollowUp)
    .delete(protect, hospitalFollowupController.deleteFollowUp);

module.exports = router;
