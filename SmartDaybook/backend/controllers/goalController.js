const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// @desc    Get all goals for user
// @route   GET /api/goals
exports.getGoals = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get single goal with milestones, logs, habits
// @route   GET /api/goals/:id
exports.getGoalDetail = async (req, res) => {
    try {
        const goalId = req.params.id;
        const [goalRows] = await pool.query(
            'SELECT * FROM goals WHERE id = ? AND user_id = ?',
            [goalId, req.user.id]
        );

        if (goalRows.length === 0) {
            return res.status(404).json({ success: false, error: 'Goal not found' });
        }

        const [milestones] = await pool.query('SELECT * FROM goal_milestones WHERE goal_id = ?', [goalId]);
        const [habits] = await pool.query('SELECT * FROM goal_habits WHERE goal_id = ?', [goalId]);
        const [logs] = await pool.query('SELECT * FROM goal_logs WHERE goal_id = ? ORDER BY log_date DESC', [goalId]);

        res.json({
            success: true,
            data: {
                goal: goalRows[0],
                milestones,
                habits,
                logs
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Create new goal
// @route   POST /api/goals
exports.createGoal = async (req, res) => {
    try {
        const { title, description, category, type, priority, start_date, target_date } = req.body;
        const [result] = await pool.query(
            'INSERT INTO goals (user_id, title, description, category, type, priority, start_date, target_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, title, description, category, type, priority, start_date, target_date]
        );
        res.status(201).json({ success: true, data: { id: result.insertId, ...req.body } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Update goal progress manually or status
exports.updateGoal = async (req, res) => {
    try {
        const { title, description, category, status, progress_percentage, target_date } = req.body;
        await pool.query(
            'UPDATE goals SET title = ?, description = ?, category = ?, status = ?, progress_percentage = ?, target_date = ? WHERE id = ? AND user_id = ?',
            [title, description, category, status, progress_percentage, target_date, req.params.id, req.user.id]
        );
        res.json({ success: true, message: 'Goal updated' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Delete goal
// @route   DELETE /api/goals/:id
exports.deleteGoal = async (req, res) => {
    try {
        await pool.query('DELETE FROM goals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ success: true, message: 'Goal deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Add Milestone
// @route   POST /api/goals/:id/milestones
exports.addMilestone = async (req, res) => {
    try {
        const { title, due_date } = req.body;
        const [result] = await pool.query(
            'INSERT INTO goal_milestones (goal_id, title, due_date) VALUES (?, ?, ?)',
            [req.params.id, title, due_date]
        );

        // Recalculate percentage
        await updateGoalProgress(req.params.id);

        res.status(201).json({ success: true, data: { id: result.insertId, ...req.body } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Toggle Milestone status
// @route   PUT /api/goals/milestones/:id
exports.toggleMilestone = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT goal_id, is_completed FROM goal_milestones WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });

        const goalId = rows[0].goal_id;
        const newStatus = !rows[0].is_completed;
        const completedAt = newStatus ? new Date() : null;

        await pool.query(
            'UPDATE goal_milestones SET is_completed = ?, completed_at = ? WHERE id = ?',
            [newStatus, completedAt, req.params.id]
        );

        // Recalculate percentage
        await updateGoalProgress(goalId);

        res.json({ success: true, newStatus });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Delete Milestone
// @route   DELETE /api/goals/milestones/:id
exports.deleteMilestone = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT goal_id FROM goal_milestones WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });

        const goalId = rows[0].goal_id;
        await pool.query('DELETE FROM goal_milestones WHERE id = ?', [req.params.id]);

        // Recalculate percentage
        await updateGoalProgress(goalId);

        res.json({ success: true, message: 'Milestone deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Add Log
// @route   POST /api/goals/:id/logs
exports.addLog = async (req, res) => {
    try {
        const { content, log_date } = req.body;
        await pool.query(
            'INSERT INTO goal_logs (goal_id, content, log_date) VALUES (?, ?, ?)',
            [req.params.id, content, log_date || new Date().toISOString().split('T')[0]]
        );
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Add Habit
// @route   POST /api/goals/:id/habits
exports.addHabit = async (req, res) => {
    try {
        const { title, frequency } = req.body;
        const [result] = await pool.query(
            'INSERT INTO goal_habits (goal_id, title, frequency) VALUES (?, ?, ?)',
            [req.params.id, title, frequency || 'Daily']
        );
        res.status(201).json({ success: true, data: { id: result.insertId, ...req.body } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Delete Habit
// @route   DELETE /api/goals/habits/:id
exports.deleteHabit = async (req, res) => {
    try {
        await pool.query('DELETE FROM goal_habits WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Habit deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Helper function to update goal progress
async function updateGoalProgress(goalId) {
    const [counts] = await pool.query(
        'SELECT COUNT(*) as total, SUM(CASE WHEN is_completed THEN 1 ELSE 0 END) as done FROM goal_milestones WHERE goal_id = ?',
        [goalId]
    );

    let percentage = 0;
    if (counts[0].total > 0) {
        percentage = Math.round((counts[0].done / counts[0].total) * 100);
    }

    await pool.query('UPDATE goals SET progress_percentage = ? WHERE id = ?', [percentage, goalId]);
}
