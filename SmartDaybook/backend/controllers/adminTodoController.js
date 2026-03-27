const db = require('../config/db');

exports.getAllTodos = async (req, res) => {
    try {
        const [todos] = await db.query(`
            SELECT t.*, u.name as user_name, u.email as user_email
            FROM todos t
            LEFT JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
        `);
        res.json(todos);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.deleteTodo = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM todos WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Todo not found' });
        res.json({ message: 'Todo removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
