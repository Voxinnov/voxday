const db = require('../config/db');

// Helper to ensure "Hospital Expense" category exists for user
async function getOrCreateHospitalCategory(userId) {
    const [rows] = await db.query(
        'SELECT id FROM categories WHERE user_id = ? AND (LOWER(name) = ? OR LOWER(name) LIKE ?)',
        [userId, 'hospital expense', '%hospital%']
    );
    if (rows.length > 0) return rows[0].id;

    const [result] = await db.query(
        'INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)',
        [userId, 'Hospital Expense', 'expense']
    );
    return result.insertId;
}

// @desc    Get all hospital records & summary for logged-in user
// @route   GET /api/hospital
exports.getHospitalRecords = async (req, res) => {
    try {
        const userId = req.user.id;

        // Auto-sync any transactions with Hospital/Medical/Doctor categories missing from hospital_records
        const [missingTxs] = await db.query(`
            SELECT t.*, c.name as category_name
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            LEFT JOIN hospital_records h ON h.transaction_id = t.id
            WHERE t.user_id = ?
              AND h.id IS NULL
              AND (
                LOWER(c.name) LIKE '%hospital%' 
                OR LOWER(c.name) LIKE '%medical%' 
                OR LOWER(c.name) LIKE '%doctor%'
                OR LOWER(c.name) LIKE '%clinic%'
                OR LOWER(c.name) LIKE '%health%'
                OR LOWER(c.name) LIKE '%pharmacy%'
                OR LOWER(c.name) LIKE '%medicine%'
              )
        `, [userId]);

        for (const tx of missingTxs) {
            let patient_name = 'General';
            let hospital_name = 'Hospital';
            let expense_type = tx.category_name || 'Hospital';
            let notes = tx.description || null;

            if (tx.description) {
                const match = tx.description.match(/^(.*?)\s*-\s*(.*?)\s*\((.*?)\)$/);
                if (match) {
                    expense_type = match[1].trim() || expense_type;
                    patient_name = match[2].trim() || patient_name;
                    hospital_name = match[3].trim() || hospital_name;
                } else if (tx.description.trim()) {
                    notes = tx.description.trim();
                }
            }

            await db.query(`
                INSERT INTO hospital_records (user_id, transaction_id, patient_name, hospital_name, visit_date, expense_type, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [userId, tx.id, patient_name, hospital_name, tx.transaction_date, expense_type, notes]);
        }

        const [records] = await db.query(
            `SELECT h.*,
                    COALESCE(t.amount, 0) as amount,
                    t.payment_account_id,
                    pa.account_name,
                    c.name as category_name
             FROM hospital_records h
             LEFT JOIN transactions t ON h.transaction_id = t.id
             LEFT JOIN payment_accounts pa ON t.payment_account_id = pa.id
             LEFT JOIN categories c ON t.category_id = c.id
             WHERE h.user_id = ?
             ORDER BY h.visit_date DESC, h.id DESC`,
            [userId]
        );

        // Summary calculations
        const total_expense = records.reduce((sum, r) => sum + Number(r.amount || 0), 0);

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const this_month_expense = records.reduce((sum, r) => {
            const d = new Date(r.visit_date);
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                return sum + Number(r.amount || 0);
            }
            return sum;
        }, 0);

        const patientsSet = new Set();
        const hospitalsSet = new Set();
        records.forEach(r => {
            if (r.patient_name) patientsSet.add(r.patient_name.trim());
            if (r.hospital_name) hospitalsSet.add(r.hospital_name.trim());
        });

        res.json({
            success: true,
            summary: {
                total_expense,
                this_month_expense,
                visit_count: records.length,
                patient_count: patientsSet.size
            },
            patients: Array.from(patientsSet).sort(),
            hospitals: Array.from(hospitalsSet).sort(),
            data: records
        });
    } catch (error) {
        console.error('Error fetching hospital records:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Create a new hospital expense record (creates linked transaction)
// @route   POST /api/hospital
exports.createHospitalRecord = async (req, res) => {
    try {
        const userId = req.user.id;
        const { patient_name, hospital_name, visit_date, expense_type, amount, payment_account_id, notes } = req.body;

        if (!patient_name || !hospital_name || !visit_date || !expense_type || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Please provide patient_name, hospital_name, visit_date, expense_type, and amount.'
            });
        }

        const categoryId = await getOrCreateHospitalCategory(userId);
        const description = `${expense_type} - ${patient_name.trim()} (${hospital_name.trim()})`;

        // 1. Insert into transactions table (Single Source of Truth)
        const [txResult] = await db.query(
            `INSERT INTO transactions (user_id, category_id, classification, amount, type, payment_account_id, description, transaction_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                categoryId,
                'personal',
                Number(amount),
                'expense',
                payment_account_id || null,
                description,
                visit_date
            ]
        );

        const transactionId = txResult.insertId;

        // 2. Insert into hospital_records table
        const [hospResult] = await db.query(
            `INSERT INTO hospital_records (user_id, transaction_id, patient_name, hospital_name, visit_date, expense_type, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                transactionId,
                patient_name.trim(),
                hospital_name.trim(),
                visit_date,
                expense_type.trim(),
                notes ? notes.trim() : null
            ]
        );

        res.status(201).json({
            success: true,
            id: hospResult.insertId,
            transaction_id: transactionId,
            message: 'Hospital expense recorded successfully'
        });
    } catch (error) {
        console.error('Error creating hospital record:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update a hospital expense record (updates linked transaction)
// @route   PUT /api/hospital/:id
exports.updateHospitalRecord = async (req, res) => {
    try {
        const userId = req.user.id;
        const recordId = req.params.id;
        const { patient_name, hospital_name, visit_date, expense_type, amount, payment_account_id, notes } = req.body;

        const [existing] = await db.query(
            'SELECT * FROM hospital_records WHERE id = ? AND user_id = ?',
            [recordId, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Hospital record not found or unauthorized' });
        }

        const record = existing[0];

        // 1. Update hospital_records table
        await db.query(
            `UPDATE hospital_records
             SET patient_name = ?, hospital_name = ?, visit_date = ?, expense_type = ?, notes = ?
             WHERE id = ? AND user_id = ?`,
            [patient_name.trim(), hospital_name.trim(), visit_date, expense_type.trim(), notes ? notes.trim() : null, recordId, userId]
        );

        // 2. Update linked transaction if present
        if (record.transaction_id) {
            const description = `${expense_type.trim()} - ${patient_name.trim()} (${hospital_name.trim()})`;
            await db.query(
                `UPDATE transactions
                 SET amount = ?, payment_account_id = ?, transaction_date = ?, description = ?
                 WHERE id = ? AND user_id = ?`,
                [Number(amount), payment_account_id || null, visit_date, description, record.transaction_id, userId]
            );
        }

        res.json({ success: true, message: 'Hospital record updated successfully' });
    } catch (error) {
        console.error('Error updating hospital record:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a hospital expense record (deletes linked transaction)
// @route   DELETE /api/hospital/:id
exports.deleteHospitalRecord = async (req, res) => {
    try {
        const userId = req.user.id;
        const recordId = req.params.id;

        const [existing] = await db.query(
            'SELECT * FROM hospital_records WHERE id = ? AND user_id = ?',
            [recordId, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Hospital record not found or unauthorized' });
        }

        const record = existing[0];

        // Delete hospital record
        await db.query('DELETE FROM hospital_records WHERE id = ? AND user_id = ?', [recordId, userId]);

        // Delete linked transaction
        if (record.transaction_id) {
            await db.query('DELETE FROM transactions WHERE id = ? AND user_id = ?', [record.transaction_id, userId]);
        }

        res.json({ success: true, message: 'Hospital record and linked transaction deleted successfully' });
    } catch (error) {
        console.error('Error deleting hospital record:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
