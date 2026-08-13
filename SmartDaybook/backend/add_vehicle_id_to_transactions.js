const mysql = require('/var/www/voxday.bvox.in/SmartDaybook/backend/node_modules/mysql2/promise');
require('/var/www/voxday.bvox.in/SmartDaybook/backend/node_modules/dotenv').config({ path: '/var/www/voxday.bvox.in/SmartDaybook/backend/.env' });

async function addVehicleIdColumnToDb(dbName) {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: dbName
        });

        console.log(`Checking vehicle_id column in ${dbName}...`);
        const [columns] = await connection.query(`SHOW COLUMNS FROM transactions LIKE 'vehicle_id'`);

        if (columns.length === 0) {
            await connection.query(`ALTER TABLE transactions ADD COLUMN vehicle_id INT NULL AFTER payment_account_id`);
            await connection.query(`ALTER TABLE transactions ADD INDEX idx_vehicle_id (vehicle_id)`);
            console.log(`Added vehicle_id column to ${dbName}.transactions successfully.`);
        } else {
            console.log(`vehicle_id column already exists in ${dbName}.transactions.`);
        }
    } catch (err) {
        console.error(`Error updating schema in ${dbName}:`, err.message);
    } finally {
        if (connection) await connection.end();
    }
}

async function run() {
    await addVehicleIdColumnToDb('smart_daybook');
    await addVehicleIdColumnToDb('voxday_db');
}

run();
