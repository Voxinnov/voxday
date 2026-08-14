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

        console.log(`Setting up hospital_followups table in ${dbName}...`);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS hospital_followups (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                patient_name VARCHAR(255) NOT NULL,
                visit_date DATE NOT NULL,
                hospital_name VARCHAR(255) NOT NULL,
                doctor_name VARCHAR(255) NULL,
                next_visit_date DATE NULL,
                remarks TEXT NULL,
                insurance_company VARCHAR(255) NULL,
                insurance_approved_amount DECIMAL(10,2) DEFAULT 0.00,
                lab_result_file LONGTEXT NULL,
                prescription_file LONGTEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_next_visit_date (next_visit_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        console.log(`Successfully configured hospital_followups in ${dbName}.`);

    } catch (err) {
        console.error(`Error setting up hospital_followups schema in ${dbName}:`, err.message);
    } finally {
        if (connection) await connection.end();
    }
}

async function run() {
    await createTablesInDb('smart_daybook');
    await createTablesInDb('voxday_db');
}

run();
