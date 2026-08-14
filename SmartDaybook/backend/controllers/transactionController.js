const db = require('../config/db');

// @desc    Get all transactions
// @route   GET /api/transactions
exports.getTransactions = async (req, res) => {
    try {
        const [transactions] = await db.query(`
            SELECT t.*, c.name as category_name,
                   v.name as vehicle_name, v.number as vehicle_number,
                   tr.name as trip_name,
                   pa.account_name, pa.account_type, pa.bank_name, pa.upi_id,
                   pa_to.account_name as transfer_account_name, pa_to.account_type as transfer_account_type,
                   pa_to.bank_name as transfer_bank_name, pa_to.upi_id as transfer_upi_id
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
// Helper to sync hospital records if category is hospital related
async function syncHospitalRecord(userId, transactionId, categoryId, transactionDate, description) {
    try {
        if (!categoryId) {
            await db.query('DELETE FROM hospital_records WHERE transaction_id = ? AND user_id = ?', [transactionId, userId]);
            return;
        }
        const [cats] = await db.query('SELECT name FROM categories WHERE id = ?', [categoryId]);
        if (cats.length === 0) return;
        const catName = cats[0].name.toLowerCase();
        const isHospital = /hospital|medical|doctor|clinic|health|pharmacy|medicine/.test(catName);

        if (!isHospital) {
            await db.query('DELETE FROM hospital_records WHERE transaction_id = ? AND user_id = ?', [transactionId, userId]);
            return;
        }

        let patient_name = 'General';
        let hospital_name = 'Hospital';
        let expense_type = cats[0].name || 'Hospital';
        let notes = description || null;

        if (description) {
            const match = description.match(/^(.*?)\s*-\s*(.*?)\s*\((.*?)\)$/);
            if (match) {
                expense_type = match[1].trim() || expense_type;
                patient_name = match[2].trim() || patient_name;
                hospital_name = match[3].trim() || hospital_name;
            } else if (description.trim()) {
                notes = description.trim();
            }
        }

        const [existing] = await db.query('SELECT id FROM hospital_records WHERE transaction_id = ? AND user_id = ?', [transactionId, userId]);
        if (existing.length > 0) {
            await db.query(
                'UPDATE hospital_records SET visit_date = ?, expense_type = ?, notes = ? WHERE id = ?',
                [transactionDate, expense_type, notes, existing[0].id]
            );
        } else {
            await db.query(
                'INSERT INTO hospital_records (user_id, transaction_id, patient_name, hospital_name, visit_date, expense_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [userId, transactionId, patient_name, hospital_name, transactionDate, expense_type, notes]
            );
        }
    } catch (err) {
        console.error('Error syncing hospital record:', err);
    }
}

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

        if (category_id) {
            await syncHospitalRecord(req.user.id, result.insertId, category_id, transaction_date, description);
        }

        // Return with joined account, vehicle & trip info
        const [rows] = await db.query(`
            SELECT t.*, c.name as category_name,
                   v.name as vehicle_name, v.number as vehicle_number,
                   tr.name as trip_name,
                   pa.account_name, pa.account_type, pa.bank_name, pa.upi_id,
                   pa_to.account_name as transfer_account_name, pa_to.account_type as transfer_account_type,
                   pa_to.bank_name as transfer_bank_name, pa_to.upi_id as transfer_upi_id
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

        await syncHospitalRecord(req.user.id, req.params.id, category_id, transaction_date, description);

        res.json({ message: 'Transaction updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
exports.deleteTransaction = async (req, res) => {
    try {
        await db.query('DELETE FROM hospital_records WHERE transaction_id = ? AND user_id = ?', [req.params.id, req.user.id]);

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
