const express = require('express');
const router = express.Router();
const { getAllTodos, deleteTodo } = require('../controllers/adminTodoController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(protect, admin, getAllTodos);
router.route('/:id').delete(protect, admin, deleteTodo);

module.exports = router;
