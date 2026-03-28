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

// @desc    Update a task (full edit — blocked for completed tasks)
// @route   PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
    const { title, description, start_date, due_date, priority, status } = req.body;

    try {
        // Fetch current task to guard completed tasks
        const [rows] = await db.query('SELECT status FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Task not found or unauthorized' });

        if (rows[0].status === 'completed') {
            return res.status(403).json({ message: 'Completed tasks cannot be edited.' });
        }

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

// @desc    Toggle task status only (complete / reopen)
// @route   PATCH /api/tasks/:id/status
exports.patchTaskStatus = async (req, res) => {
    const { status } = req.body;
    if (!status || !['pending', 'completed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value. Use pending or completed.' });
    }
    try {
        const [result] = await db.query(
            'UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?',
            [status, req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Task not found or unauthorized' });
        res.json({ message: 'Task status updated', status });
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
