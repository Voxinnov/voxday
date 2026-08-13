const db = require('../config/db');

// @desc    Get all payment accounts for user
exports.getPaymentAccounts = async (req, res) => {
    try {
        const [accounts] = await db.query(
            `SELECT pa.*,
                (
                    COALESCE(pa.initial_balance, 0)
                    + COALESCE((SELECT SUM(amount) FROM transactions WHERE payment_account_id = pa.id AND type = 'income'), 0)
                    + COALESCE((SELECT SUM(amount) FROM transactions WHERE transfer_account_id = pa.id AND type = 'transfer'), 0)
                    - COALESCE((SELECT SUM(amount) FROM transactions WHERE payment_account_id = pa.id AND type = 'expense'), 0)
                    - COALESCE((SELECT SUM(amount) FROM transactions WHERE payment_account_id = pa.id AND type = 'transfer'), 0)
                ) AS current_balance
             FROM payment_accounts pa
             WHERE pa.user_id = ?
             ORDER BY pa.is_default DESC, pa.created_at ASC`,
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
    const { account_name, account_type, bank_name, account_number, upi_id, initial_balance, is_default } = req.body;

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
            'INSERT INTO payment_accounts (user_id, account_name, account_type, bank_name, account_number, upi_id, initial_balance, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, account_name, account_type, bank_name || null, account_number || null, upi_id || null, initial_balance || 0.00, is_default ? 1 : 0]
        );

        const [newAccount] = await db.query(
            `SELECT pa.*,
                (
                    COALESCE(pa.initial_balance, 0)
                    + COALESCE((SELECT SUM(amount) FROM transactions WHERE payment_account_id = pa.id AND type = 'income'), 0)
                    + COALESCE((SELECT SUM(amount) FROM transactions WHERE transfer_account_id = pa.id AND type = 'transfer'), 0)
                    - COALESCE((SELECT SUM(amount) FROM transactions WHERE payment_account_id = pa.id AND type = 'expense'), 0)
                    - COALESCE((SELECT SUM(amount) FROM transactions WHERE payment_account_id = pa.id AND type = 'transfer'), 0)
                ) AS current_balance
             FROM payment_accounts pa WHERE pa.id = ?`,
            [result.insertId]
        );
        res.status(201).json(newAccount[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update a payment account
// @route   PUT /api/payment-accounts/:id
exports.updatePaymentAccount = async (req, res) => {
    const { account_name, account_type, bank_name, account_number, upi_id, initial_balance, is_default } = req.body;

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
            'UPDATE payment_accounts SET account_name = ?, account_type = ?, bank_name = ?, account_number = ?, upi_id = ?, initial_balance = ?, is_default = ? WHERE id = ? AND user_id = ?',
            [account_name, account_type, bank_name || null, account_number || null, upi_id || null, initial_balance || 0.00, is_default ? 1 : 0, req.params.id, req.user.id]
        );

        const [updated] = await db.query(
            `SELECT pa.*,
                (
                    COALESCE(pa.initial_balance, 0)
                    + COALESCE((SELECT SUM(amount) FROM transactions WHERE payment_account_id = pa.id AND type = 'income'), 0)
                    + COALESCE((SELECT SUM(amount) FROM transactions WHERE transfer_account_id = pa.id AND type = 'transfer'), 0)
                    - COALESCE((SELECT SUM(amount) FROM transactions WHERE payment_account_id = pa.id AND type = 'expense'), 0)
                    - COALESCE((SELECT SUM(amount) FROM transactions WHERE payment_account_id = pa.id AND type = 'transfer'), 0)
                ) AS current_balance
             FROM payment_accounts pa WHERE pa.id = ?`,
            [req.params.id]
        );
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
