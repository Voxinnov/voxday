const db = require('../config/db');

// @desc    Get all tasks with subtasks
// @route   GET /api/tasks
exports.getTasks = async (req, res) => {
    try {
        const [tasks] = await db.query('SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date ASC', [req.user.id]);

        // Fetch subtasks for each task
        for (let task of tasks) {
            const [subtasks] = await db.query('SELECT * FROM task_subtasks WHERE task_id = ?', [task.id]);
            task.subtasks = subtasks;
        }

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Create a task
// @route   POST /api/tasks
exports.createTask = async (req, res) => {
    const { title, description, start_date, due_date, priority, status } = req.body;
    if (!title) {
        return res.status(400).json({ message: 'Please provide a title' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO tasks (user_id, title, description, start_date, due_date, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, title, description || null, start_date || null, due_date || null, priority || 'medium', status || 'pending']
        );
        res.status(201).json({
            id: result.insertId,
            user_id: req.user.id,
            title,
            description: description || null,
            start_date: start_date || null,
            due_date: due_date || null,
            priority: priority || 'medium',
            status: status || 'pending',
            subtasks: []
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
    const { title, description, start_date, due_date, priority, status } = req.body;

    try {
        const [result] = await db.query(
            'UPDATE tasks SET title = ?, description = ?, start_date = ?, due_date = ?, priority = ?, status = ? WHERE id = ? AND user_id = ?',
            [title, description || null, start_date || null, due_date || null, priority, status, req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Task not found or unauthorized' });
        res.json({ message: 'Task updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM tasks WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        // Also delete subtasks
        await db.query('DELETE FROM task_subtasks WHERE task_id = ?', [req.params.id]);

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Task not found or unauthorized' });
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
