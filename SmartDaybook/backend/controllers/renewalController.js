const db = require('../config/db');

// @desc    Get all renewals for the current user
// @route   GET /api/renewals
exports.getRenewals = async (req, res) => {
    try {
        const [renewals] = await db.query(
            `SELECT * FROM renewals WHERE user_id = ? ORDER BY next_renewal_date ASC`,
            [req.user.id]
        );
        res.json(renewals);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Create a renewal
// @route   POST /api/renewals
exports.createRenewal = async (req, res) => {
    const { category, provider, amount, agent_name, agent_number, renewal_frequency, next_renewal_date, last_renewal_date, remark, status } = req.body;

    if (!category || !provider || !amount || !next_renewal_date) {
        return res.status(400).json({ message: 'Please provide category, provider, amount, and next renewal date' });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO renewals (user_id, category, provider, amount, agent_name, agent_number, renewal_frequency, next_renewal_date, last_renewal_date, remark, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                category,
                provider,
                amount,
                agent_name || null,
                agent_number || null,
                renewal_frequency || 'yearly',
                next_renewal_date,
                last_renewal_date || null,
                remark || null,
                status || 'active'
            ]
        );
        res.status(201).json({
            id: result.insertId,
            user_id: req.user.id,
            category,
            provider,
            amount,
            agent_name: agent_name || null,
            agent_number: agent_number || null,
            renewal_frequency: renewal_frequency || 'yearly',
            next_renewal_date,
            last_renewal_date: last_renewal_date || null,
            remark: remark || null,
            status: status || 'active'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update a renewal
// @route   PUT /api/renewals/:id
exports.updateRenewal = async (req, res) => {
    const { category, provider, amount, agent_name, agent_number, renewal_frequency, next_renewal_date, last_renewal_date, remark, status } = req.body;

    try {
        const [result] = await db.query(
            `UPDATE renewals SET category = ?, provider = ?, amount = ?, agent_name = ?, agent_number = ?,
             renewal_frequency = ?, next_renewal_date = ?, last_renewal_date = ?, remark = ?, status = ?
             WHERE id = ? AND user_id = ?`,
            [
                category,
                provider,
                amount,
                agent_name || null,
                agent_number || null,
                renewal_frequency || 'yearly',
                next_renewal_date,
                last_renewal_date || null,
                remark || null,
                status || 'active',
                req.params.id,
                req.user.id
            ]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Renewal not found or unauthorized' });
        res.json({ message: 'Renewal updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a renewal
// @route   DELETE /api/renewals/:id
exports.deleteRenewal = async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM renewals WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Renewal not found or unauthorized' });
        res.json({ message: 'Renewal removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
