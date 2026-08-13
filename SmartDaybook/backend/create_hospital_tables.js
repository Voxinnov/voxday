const mysql = require('/var/www/voxday.bvox.in/SmartDaybook/backend/node_modules/mysql2/promise');
require('/var/www/voxday.bvox.in/SmartDaybook/backend/node_modules/dotenv').config({ path: '/var/www/voxday.bvox.in/SmartDaybook/backend/.env' });

async function createTablesInDb(dbName) {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: dbName
        });

        console.log(`Setting up hospital tables in ${dbName}...`);

        // 1. Create hospital_records table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS hospital_records (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                transaction_id INT NULL,
                patient_name VARCHAR(255) NOT NULL,
                hospital_name VARCHAR(255) NOT NULL,
                visit_date DATE NOT NULL,
                expense_type VARCHAR(100) NOT NULL,
                notes TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_transaction_id (transaction_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        console.log(`Successfully configured hospital_records in ${dbName}.`);

    } catch (err) {
        console.error(`Error setting up hospital schema in ${dbName}:`, err.message);
    } finally {
        if (connection) await connection.end();
    }
}

async function run() {
    await createTablesInDb('smart_daybook');
    await createTablesInDb('voxday_db');
}

run();
