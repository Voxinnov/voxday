const db = require('../config/db');

// @desc    Get all todos
// @route   GET /api/todos
exports.getTodos = async (req, res) => {
    try {
        const [todos] = await db.query('SELECT * FROM todos WHERE user_id = ? ORDER BY due_date ASC', [req.user.id]);
        res.json(todos);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Create a todo
// @route   POST /api/todos
exports.createTodo = async (req, res) => {
    const { title, description, due_date, priority, status } = req.body;
    if (!title) {
        return res.status(400).json({ message: 'Please provide a title' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO todos (user_id, title, description, due_date, priority, status) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, title, description || null, due_date || null, priority || 'medium', status || 'pending']
        );
        res.status(201).json({ 
            id: result.insertId, 
            user_id: req.user.id,
            title, 
            description: description || null, 
            due_date: due_date || null, 
            priority: priority || 'medium', 
            status: status || 'pending' 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update a todo
// @route   PUT /api/todos/:id
exports.updateTodo = async (req, res) => {
    const { title, description, due_date, priority, status } = req.body;

    try {
        const [result] = await db.query(
            'UPDATE todos SET title = ?, description = ?, due_date = ?, priority = ?, status = ? WHERE id = ? AND user_id = ?',
            [title, description || null, due_date || null, priority, status, req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Todo not found or unauthorized' });
        res.json({ message: 'Todo updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a todo
// @route   DELETE /api/todos/:id
exports.deleteTodo = async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM todos WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Todo not found or unauthorized' });
        res.json({ message: 'Todo deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
