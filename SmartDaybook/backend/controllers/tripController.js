const db = require('../config/db');

// @desc    Get all trips for user
// @route   GET /api/trips
exports.getTrips = async (req, res) => {
    try {
        const userId = req.user.id;
        const [trips] = await db.query(
            `SELECT t.*,
                    COALESCE((SELECT SUM(amount) FROM transactions WHERE trip_id = t.id AND type = 'expense'), 0) as spent,
                    (SELECT COUNT(*) FROM trip_plans WHERE trip_id = t.id) as plan_count,
                    (SELECT COUNT(*) FROM trip_places WHERE trip_id = t.id) as place_count
             FROM trips t
             WHERE t.user_id = ?
             ORDER BY t.start_date DESC`,
            [userId]
        );

        res.json({ success: true, data: trips });
    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Create a new trip
// @route   POST /api/trips
exports.createTrip = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, destination, start_date, end_date, budget } = req.body;

        if (!name || !destination || !start_date || !end_date) {
            return res.status(400).json({ success: false, message: 'Please provide trip name, destination, start_date, and end_date.' });
        }

        const [result] = await db.query(
            `INSERT INTO trips (user_id, name, destination, start_date, end_date, budget)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, name.trim(), destination.trim(), start_date, end_date, Number(budget) || 0]
        );

        res.status(201).json({ success: true, tripId: result.insertId, message: 'Trip created successfully' });
    } catch (error) {
        console.error('Error creating trip:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get single trip details (with plans, places, transactions)
// @route   GET /api/trips/:id
exports.getTripDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const tripId = req.params.id;

        const [trips] = await db.query('SELECT * FROM trips WHERE id = ? AND user_id = ?', [tripId, userId]);
        if (trips.length === 0) {
            return res.status(404).json({ success: false, message: 'Trip not found or unauthorized' });
        }

        const trip = trips[0];

        // Plans (Itinerary)
        const [plans] = await db.query('SELECT * FROM trip_plans WHERE trip_id = ? ORDER BY date ASC, time ASC', [tripId]);

        // Places to visit
        const [places] = await db.query('SELECT * FROM trip_places WHERE trip_id = ? ORDER BY id ASC', [tripId]);

        // Expenses (Transactions linked to trip)
        const [expenses] = await db.query(
            `SELECT t.*, c.name as category_name, pa.account_name
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             LEFT JOIN payment_accounts pa ON t.payment_account_id = pa.id
             WHERE t.trip_id = ?
             ORDER BY t.transaction_date DESC`,
            [tripId]
        );

        const spent = expenses.reduce((acc, curr) => {
            if (curr.type === 'expense') return acc + Number(curr.amount || 0);
            return acc;
        }, 0);

        res.json({
            success: true,
            data: {
                trip: {
                    ...trip,
                    spent,
                    remaining: Math.max(0, Number(trip.budget || 0) - spent)
                },
                plans,
                places,
                expenses
            }
        });
    } catch (error) {
        console.error('Error fetching trip details:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update trip
// @route   PUT /api/trips/:id
exports.updateTrip = async (req, res) => {
    try {
        const userId = req.user.id;
        const tripId = req.params.id;
        const { name, destination, start_date, end_date, budget } = req.body;

        const [result] = await db.query(
            `UPDATE trips
             SET name = ?, destination = ?, start_date = ?, end_date = ?, budget = ?
             WHERE id = ? AND user_id = ?`,
            [name.trim(), destination.trim(), start_date, end_date, Number(budget) || 0, tripId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Trip not found or unauthorized' });
        }

        res.json({ success: true, message: 'Trip updated successfully' });
    } catch (error) {
        console.error('Error updating trip:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Delete trip (Safe delete: clears trip_id on transactions, deletes plans & places)
// @route   DELETE /api/trips/:id
exports.deleteTrip = async (req, res) => {
    try {
        const userId = req.user.id;
        const tripId = req.params.id;

        const [trips] = await db.query('SELECT * FROM trips WHERE id = ? AND user_id = ?', [tripId, userId]);
        if (trips.length === 0) {
            return res.status(404).json({ success: false, message: 'Trip not found or unauthorized' });
        }

        // Clear trip_id on transactions to preserve financial data
        await db.query('UPDATE transactions SET trip_id = NULL WHERE trip_id = ?', [tripId]);
        // Delete plans and places
        await db.query('DELETE FROM trip_plans WHERE trip_id = ?', [tripId]);
        await db.query('DELETE FROM trip_places WHERE trip_id = ?', [tripId]);
        // Delete trip
        await db.query('DELETE FROM trips WHERE id = ? AND user_id = ?', [tripId, userId]);

        res.json({ success: true, message: 'Trip deleted successfully. Financial transactions were preserved.' });
    } catch (error) {
        console.error('Error deleting trip:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Add plan to trip
// @route   POST /api/trips/:id/plans
exports.addPlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const tripId = req.params.id;
        const { date, time, title, notes } = req.body;

        if (!date || !title) {
            return res.status(400).json({ success: false, message: 'Please provide date and title for plan.' });
        }

        const [trips] = await db.query('SELECT * FROM trips WHERE id = ? AND user_id = ?', [tripId, userId]);
        if (trips.length === 0) {
            return res.status(404).json({ success: false, message: 'Trip not found' });
        }

        const [result] = await db.query(
            'INSERT INTO trip_plans (trip_id, date, time, title, notes) VALUES (?, ?, ?, ?, ?)',
            [tripId, date, time || null, title.trim(), notes ? notes.trim() : null]
        );

        res.status(201).json({ success: true, planId: result.insertId, message: 'Plan added successfully' });
    } catch (error) {
        console.error('Error adding plan:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Delete plan
// @route   DELETE /api/trips/plans/:planId
exports.deletePlan = async (req, res) => {
    try {
        const planId = req.params.planId;
        await db.query('DELETE FROM trip_plans WHERE id = ?', [planId]);
        res.json({ success: true, message: 'Plan deleted' });
    } catch (error) {
        console.error('Error deleting plan:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Add place to trip
// @route   POST /api/trips/:id/places
exports.addPlace = async (req, res) => {
    try {
        const userId = req.user.id;
        const tripId = req.params.id;
        const { name, notes } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Please provide place name.' });
        }

        const [trips] = await db.query('SELECT * FROM trips WHERE id = ? AND user_id = ?', [tripId, userId]);
        if (trips.length === 0) {
            return res.status(404).json({ success: false, message: 'Trip not found' });
        }

        const [result] = await db.query(
            'INSERT INTO trip_places (trip_id, name, notes) VALUES (?, ?, ?)',
            [tripId, name.trim(), notes ? notes.trim() : null]
        );

        res.status(201).json({ success: true, placeId: result.insertId, message: 'Place added successfully' });
    } catch (error) {
        console.error('Error adding place:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Delete place
// @route   DELETE /api/trips/places/:placeId
exports.deletePlace = async (req, res) => {
    try {
        const placeId = req.params.placeId;
        await db.query('DELETE FROM trip_places WHERE id = ?', [placeId]);
        res.json({ success: true, message: 'Place deleted' });
    } catch (error) {
        console.error('Error deleting place:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
