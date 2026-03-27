const db = require('../config/db');

exports.getAllTransactions = async (req, res) => {
    try {
        const [transactions] = await db.query(`
            SELECT t.*, u.name as user_name, u.email as user_email, c.name as category_name
            FROM transactions t
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN categories c ON t.category_id = c.id
            ORDER BY t.created_at DESC
        `);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.deleteTransaction = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM transactions WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Transaction not found' });
        res.json({ message: 'Transaction removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
