const db = require('../config/db');

// @desc    Get all users
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC');
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
