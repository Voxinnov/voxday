const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, goalController.getGoals);
router.post('/', protect, goalController.createGoal);
router.get('/:id', protect, goalController.getGoalDetail);
router.put('/:id', protect, goalController.updateGoal);
router.delete('/:id', protect, goalController.deleteGoal);

router.post('/:id/milestones', protect, goalController.addMilestone);
router.put('/milestones/:id', protect, goalController.toggleMilestone);
router.delete('/milestones/:id', protect, goalController.deleteMilestone);

router.post('/:id/logs', protect, goalController.addLog);

router.post('/:id/habits', protect, goalController.addHabit);
router.delete('/habits/:id', protect, goalController.deleteHabit);

module.exports = router;
