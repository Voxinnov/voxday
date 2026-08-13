const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, tripController.getTrips)
    .post(protect, tripController.createTrip);

router.route('/:id')
    .get(protect, tripController.getTripDetails)
    .put(protect, tripController.updateTrip)
    .delete(protect, tripController.deleteTrip);

router.route('/:id/plans')
    .post(protect, tripController.addPlan);

router.route('/plans/:planId')
    .delete(protect, tripController.deletePlan);

router.route('/:id/places')
    .post(protect, tripController.addPlace);

router.route('/places/:placeId')
    .delete(protect, tripController.deletePlace);

module.exports = router;
