const express = require('express');
const router = express.Router();
const smokeController = require('../controllers/smokeController');
const { protect } = require('../middleware/authMiddleware');

router.get('/summary', protect, smokeController.getSmokeSummary);
router.post('/log', protect, smokeController.logSmokeEvent);
router.put('/settings', protect, smokeController.updateSmokeSettings);
router.delete('/reset', protect, smokeController.resetSmokeData);

module.exports = router;
