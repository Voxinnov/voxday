const db = require('../config/db');

// @desc    Get all users with stats
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT 
                u.id, u.name, u.email, u.phone, u.role, u.status, u.created_at,
                COUNT(DISTINCT t.id) as transaction_count,
                COALESCE(SUM(CASE WHEN t.type='income' THEN t.amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END), 0) as total_expense,
                COUNT(DISTINCT pa.id) as payment_accounts_count
            FROM users u
            LEFT JOIN transactions t ON t.user_id = u.id
            LEFT JOIN payment_accounts pa ON pa.user_id = u.id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
exports.updateUserRole = async (req, res) => {
    const { role } = req.body;
    try {
        const [result] = await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User role updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
exports.updateUserStatus = async (req, res) => {
    const { status } = req.body;
    if (!['active', 'inactive', 'suspended'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }
    try {
        const [result] = await db.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User status updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
