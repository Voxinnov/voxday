const db = require('../config/db');

// @desc    Get all payment accounts for user
// @route   GET /api/payment-accounts
exports.getPaymentAccounts = async (req, res) => {
    try {
        const [accounts] = await db.query(
            'SELECT * FROM payment_accounts WHERE user_id = ? ORDER BY is_default DESC, created_at ASC',
            [req.user.id]
        );
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Create a payment account
// @route   POST /api/payment-accounts
exports.createPaymentAccount = async (req, res) => {
    const { account_name, account_type, bank_name, account_number, upi_id, is_default } = req.body;

    if (!account_name || !account_type) {
        return res.status(400).json({ message: 'Account name and type are required' });
    }

    try {
        // If setting as default, clear existing defaults
        if (is_default) {
            await db.query(
                'UPDATE payment_accounts SET is_default = 0 WHERE user_id = ?',
                [req.user.id]
            );
        }

        const [result] = await db.query(
            'INSERT INTO payment_accounts (user_id, account_name, account_type, bank_name, account_number, upi_id, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, account_name, account_type, bank_name || null, account_number || null, upi_id || null, is_default ? 1 : 0]
        );

        const [newAccount] = await db.query('SELECT * FROM payment_accounts WHERE id = ?', [result.insertId]);
        res.status(201).json(newAccount[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update a payment account
// @route   PUT /api/payment-accounts/:id
exports.updatePaymentAccount = async (req, res) => {
    const { account_name, account_type, bank_name, account_number, upi_id, is_default } = req.body;

    try {
        // Verify ownership
        const [existing] = await db.query(
            'SELECT * FROM payment_accounts WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Account not found or unauthorized' });
        }

        // If setting as default, clear existing defaults
        if (is_default) {
            await db.query(
                'UPDATE payment_accounts SET is_default = 0 WHERE user_id = ?',
                [req.user.id]
            );
        }

        await db.query(
            'UPDATE payment_accounts SET account_name = ?, account_type = ?, bank_name = ?, account_number = ?, upi_id = ?, is_default = ? WHERE id = ? AND user_id = ?',
            [account_name, account_type, bank_name || null, account_number || null, upi_id || null, is_default ? 1 : 0, req.params.id, req.user.id]
        );

        const [updated] = await db.query('SELECT * FROM payment_accounts WHERE id = ?', [req.params.id]);
        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a payment account
// @route   DELETE /api/payment-accounts/:id
exports.deletePaymentAccount = async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM payment_accounts WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Account not found or unauthorized' });
        }
        res.json({ message: 'Payment account deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Set default payment account
// @route   PUT /api/payment-accounts/:id/set-default
exports.setDefaultAccount = async (req, res) => {
    try {
        // Verify ownership
        const [existing] = await db.query(
            'SELECT * FROM payment_accounts WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Account not found or unauthorized' });
        }

        // Clear all defaults then set new one
        await db.query('UPDATE payment_accounts SET is_default = 0 WHERE user_id = ?', [req.user.id]);
        await db.query('UPDATE payment_accounts SET is_default = 1 WHERE id = ?', [req.params.id]);

        res.json({ message: 'Default account updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
