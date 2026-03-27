const db = require('../config/db');

// @desc    Get all categories from all users
// @route   GET /api/admin/categories
exports.getAllCategoriesAdmin = async (req, res) => {
    try {
        const [categories] = await db.query(
            'SELECT categories.*, users.name as user_name, users.email as user_email FROM categories JOIN users ON categories.user_id = users.id ORDER BY categories.created_at DESC'
        );
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update a category (Any)
// @route   PUT /api/admin/categories/:id
exports.updateCategoryAdmin = async (req, res) => {
    const { name, type } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE categories SET name = ?, type = ? WHERE id = ?',
            [name, type, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Category not found' });
        res.json({ message: 'Category updated successfully (Admin)' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a category (Any)
// @route   DELETE /api/admin/categories/:id
exports.deleteCategoryAdmin = async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM categories WHERE id = ?',
            [req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Category not found' });
        res.json({ message: 'Category removed successfully (Admin)' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
