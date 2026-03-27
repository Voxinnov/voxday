const db = require('../config/db');

// @desc    Get all categories for logged in user
// @route   GET /api/categories
exports.getCategories = async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories WHERE user_id = ?', [req.user.id]);
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Create a category
// @route   POST /api/categories
exports.createCategory = async (req, res) => {
    const { name, type } = req.body;
    if (!name || !type) {
        return res.status(400).json({ message: 'Please provide name and type' });
    }
    try {
        const [result] = await db.query(
            'INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)',
            [req.user.id, name, type]
        );
        res.status(201).json({ id: result.insertId, user_id: req.user.id, name, type });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
exports.updateCategory = async (req, res) => {
    const { name, type } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE categories SET name = ?, type = ? WHERE id = ? AND user_id = ?',
            [name, type, req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Category not found or unauthorized' });
        res.json({ message: 'Category updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
exports.deleteCategory = async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM categories WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Category not found or unauthorized' });
        res.json({ message: 'Category removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
