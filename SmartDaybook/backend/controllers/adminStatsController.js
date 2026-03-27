const db = require('../config/db');

// @desc    Get global stats
// @route   GET /api/admin/stats
exports.getGlobalStats = async (req, res) => {
    try {
        const [users] = await db.query('SELECT COUNT(*) as count FROM users');
        const [categories] = await db.query('SELECT COUNT(*) as count FROM categories');
        const [transactions] = await db.query('SELECT COUNT(*) as count, SUM(amount) as totalVolume FROM transactions');
        const [tasks] = await db.query('SELECT COUNT(*) as count FROM tasks');
        const [todos] = await db.query('SELECT COUNT(*) as count FROM todos');
        
        res.json({
            users: users[0].count,
            categories: categories[0].count,
            transactions: transactions[0].count,
            transactionVolume: transactions[0].totalVolume || 0,
            tasks: tasks[0].count,
            todos: todos[0].count
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
