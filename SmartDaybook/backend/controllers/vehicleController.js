const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smart_daybook',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const getVehicles = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.query('SELECT * FROM vehicles WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const createVehicle = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, number, type, brand, model, year, fuel_type, insurance_expiry, rc_expiry, pollution_expiry, purchase_date, current_odometer } = req.body;

        const [result] = await pool.query(
            'INSERT INTO vehicles (user_id, name, number, type, brand, model, year, fuel_type, insurance_expiry, rc_expiry, pollution_expiry, purchase_date, current_odometer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, name, number, type, brand, model, year, fuel_type, insurance_expiry || null, rc_expiry || null, pollution_expiry || null, purchase_date || null, current_odometer || 0]
        );
        res.status(201).json({ success: true, vehicleId: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getVehicleDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const [vehicles] = await pool.query('SELECT * FROM vehicles WHERE id = ? AND user_id = ?', [id, userId]);
        if (vehicles.length === 0) return res.status(404).json({ success: false, message: 'Vehicle not found' });

        const [services] = await pool.query('SELECT * FROM vehicle_services WHERE vehicle_id = ? ORDER BY service_date DESC', [id]);
        const [expenses] = await pool.query('SELECT * FROM vehicle_expenses WHERE vehicle_id = ? ORDER BY date DESC', [id]);
        const [fuels] = await pool.query('SELECT * FROM vehicle_fuels WHERE vehicle_id = ? ORDER BY date DESC', [id]);

        res.json({
            success: true,
            data: {
                vehicle: vehicles[0],
                services,
                expenses,
                fuels
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const addService = async (req, res) => {
    try {
        const { id } = req.params;
        const { service_date, odometer, service_type, garage_name, cost, description, next_service_odometer } = req.body;
        await pool.query(
            'INSERT INTO vehicle_services (vehicle_id, service_date, odometer, service_type, garage_name, cost, description, next_service_odometer) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, service_date, odometer, service_type, garage_name, cost, description, next_service_odometer]
        );
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const addExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, expense_type, amount, description } = req.body;
        await pool.query(
            'INSERT INTO vehicle_expenses (vehicle_id, date, expense_type, amount, description) VALUES (?, ?, ?, ?, ?)',
            [id, date, expense_type, amount, description]
        );
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const addFuel = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, odometer, quantity, cost } = req.body;

        // basic mileage approx, distance from last fuel / amount
        const [lastFuel] = await pool.query('SELECT odometer FROM vehicle_fuels WHERE vehicle_id = ? ORDER BY odometer DESC LIMIT 1', [id]);
        let calcMileage = null;
        if (lastFuel.length > 0 && odometer > lastFuel[0].odometer) {
            calcMileage = (odometer - lastFuel[0].odometer) / quantity;
        }

        await pool.query(
            'INSERT INTO vehicle_fuels (vehicle_id, date, odometer, quantity, cost, calculated_mileage) VALUES (?, ?, ?, ?, ?, ?)',
            [id, date, odometer, quantity, cost, calcMileage]
        );

        // update main vehicle odometer
        await pool.query('UPDATE vehicles SET current_odometer = ? WHERE id = ?', [odometer, id]);

        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getVehicles,
    createVehicle,
    getVehicleDetails,
    addService,
    addExpense,
    addFuel
};
