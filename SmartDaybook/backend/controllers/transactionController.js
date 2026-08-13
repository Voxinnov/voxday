const db = require('../config/db');

// @desc    Get all transactions
// @route   GET /api/transactions
exports.getTransactions = async (req, res) => {
    try {
        const [transactions] = await db.query(`
            SELECT t.*, c.name as category_name,
                   v.name as vehicle_name, v.number as vehicle_number,
                   tr.name as trip_name,
                   pa.account_name, pa.account_type,
                   pa_to.account_name as transfer_account_name, pa_to.account_type as transfer_account_type
            FROM transactions t 
            LEFT JOIN categories c ON t.category_id = c.id 
            LEFT JOIN vehicles v ON t.vehicle_id = v.id
            LEFT JOIN trips tr ON t.trip_id = tr.id
            LEFT JOIN payment_accounts pa ON t.payment_account_id = pa.id
            LEFT JOIN payment_accounts pa_to ON t.transfer_account_id = pa_to.id
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
    const { category_id, vehicle_id, trip_id, classification, amount, type, payment_method, payment_account_id, transfer_account_id, description, transaction_date } = req.body;
    if (!amount || !type || !transaction_date) {
        return res.status(400).json({ message: 'Please provide amount, type, and transaction_date' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO transactions (user_id, category_id, vehicle_id, trip_id, classification, amount, type, payment_method, payment_account_id, transfer_account_id, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, category_id || null, vehicle_id || null, trip_id || null, classification || 'official', amount, type, payment_method || null, payment_account_id || null, transfer_account_id || null, description || null, transaction_date]
        );

        // Return with joined account, vehicle & trip info
        const [rows] = await db.query(`
            SELECT t.*, c.name as category_name,
                   v.name as vehicle_name, v.number as vehicle_number,
                   tr.name as trip_name,
                   pa.account_name, pa.account_type,
                   pa_to.account_name as transfer_account_name, pa_to.account_type as transfer_account_type
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN vehicles v ON t.vehicle_id = v.id
            LEFT JOIN trips tr ON t.trip_id = tr.id
            LEFT JOIN payment_accounts pa ON t.payment_account_id = pa.id
            LEFT JOIN payment_accounts pa_to ON t.transfer_account_id = pa_to.id
            WHERE t.id = ?
        `, [result.insertId]);

        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
exports.updateTransaction = async (req, res) => {
    const { category_id, vehicle_id, trip_id, classification, amount, type, payment_method, payment_account_id, transfer_account_id, description, transaction_date } = req.body;

    try {
        const [result] = await db.query(
            'UPDATE transactions SET category_id = ?, vehicle_id = ?, trip_id = ?, classification = ?, amount = ?, type = ?, payment_method = ?, payment_account_id = ?, transfer_account_id = ?, description = ?, transaction_date = ? WHERE id = ? AND user_id = ?',
            [category_id || null, vehicle_id || null, trip_id || null, classification || 'official', amount, type, payment_method || null, payment_account_id || null, transfer_account_id || null, description || null, transaction_date, req.params.id, req.user.id]
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
