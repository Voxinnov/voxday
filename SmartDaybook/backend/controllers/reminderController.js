const db = require('../config/db');

// @desc    Get all reminders
// @route   GET /api/reminders
exports.getReminders = async (req, res) => {
    try {
        const [reminders] = await db.query(
            `SELECT * FROM event_reminders WHERE user_id = ? ORDER BY event_date ASC, event_time ASC`,
            [req.user.id]
        );
        res.json(reminders);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Create an event reminder
// @route   POST /api/reminders
exports.createReminder = async (req, res) => {
    const { title, description, event_date, event_time, status } = req.body;

    if (!title || !event_date) {
        return res.status(400).json({ message: 'Please provide title and event date' });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO event_reminders (user_id, title, description, event_date, event_time, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                title,
                description || null,
                event_date,
                event_time || null,
                status || 'pending'
            ]
        );
        res.status(201).json({
            id: result.insertId,
            user_id: req.user.id,
            title,
            description: description || null,
            event_date,
            event_time: event_time || null,
            status: status || 'pending'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update a reminder
// @route   PUT /api/reminders/:id
exports.updateReminder = async (req, res) => {
    const { title, description, event_date, event_time, status } = req.body;

    try {
        const [result] = await db.query(
            `UPDATE event_reminders SET title = ?, description = ?, event_date = ?, event_time = ?, status = ?
             WHERE id = ? AND user_id = ?`,
            [
                title,
                description || null,
                event_date,
                event_time || null,
                status || 'pending',
                req.params.id,
                req.user.id
            ]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Reminder not found' });
        res.json({ message: 'Reminder updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a reminder
// @route   DELETE /api/reminders/:id
exports.deleteReminder = async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM event_reminders WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Reminder not found' });
        res.json({ message: 'Reminder removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
