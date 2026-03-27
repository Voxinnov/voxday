const db = require('../config/db');

exports.getAllTasks = async (req, res) => {
    try {
        const [tasks] = await db.query(`
            SELECT t.*, u.name as user_name, u.email as user_email
            FROM tasks t
            LEFT JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
        `);
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Task not found' });
        res.json({ message: 'Task removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
