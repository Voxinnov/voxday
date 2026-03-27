const db = require('../config/db');

// @desc    Get all transactions
// @route   GET /api/transactions
exports.getTransactions = async (req, res) => {
    try {
        const [transactions] = await db.query(`
            SELECT t.*, c.name as category_name 
            FROM transactions t 
            LEFT JOIN categories c ON t.category_id = c.id 
            WHERE t.user_id = ? 
            ORDER BY t.transaction_date DESC
        `, [req.user.id]);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Create a transaction
// @route   POST /api/transactions
exports.createTransaction = async (req, res) => {
    const { category_id, classification, amount, type, payment_method, description, transaction_date } = req.body;
    if (!amount || !type || !transaction_date) {
        return res.status(400).json({ message: 'Please provide amount, type, and transaction_date' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO transactions (user_id, category_id, classification, amount, type, payment_method, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, category_id || null, classification || 'official', amount, type, payment_method || null, description || null, transaction_date]
        );
        res.status(201).json({
            id: result.insertId,
            user_id: req.user.id,
            category_id: category_id || null,
            classification: classification || 'official',
            amount,
            type,
            payment_method: payment_method || null,
            description: description || null,
            transaction_date
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
exports.updateTransaction = async (req, res) => {
    const { category_id, classification, amount, type, payment_method, description, transaction_date } = req.body;

    try {
        const [result] = await db.query(
            'UPDATE transactions SET category_id = ?, classification = ?, amount = ?, type = ?, payment_method = ?, description = ?, transaction_date = ? WHERE id = ? AND user_id = ?',
            [category_id || null, classification || 'official', amount, type, payment_method || null, description || null, transaction_date, req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Transaction not found or unauthorized' });
        res.json({ message: 'Transaction updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
exports.deleteTransaction = async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM transactions WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Transaction not found or unauthorized' });
        res.json({ message: 'Transaction removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
