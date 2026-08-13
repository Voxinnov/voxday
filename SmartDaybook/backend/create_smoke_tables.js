const mysql = require('/var/www/voxday.bvox.in/SmartDaybook/backend/node_modules/mysql2/promise');
require('/var/www/voxday.bvox.in/SmartDaybook/backend/node_modules/dotenv').config({ path: '/var/www/voxday.bvox.in/SmartDaybook/backend/.env' });

async function createSmokeTablesForDb(dbName) {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: dbName
        });

        console.log(`Creating Smoke Tracker tables in ${dbName}...`);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS smoke_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                avg_per_day INT DEFAULT 10,
                daily_target INT DEFAULT 5,
                price_per_cigarette DECIMAL(10,2) DEFAULT 20.00,
                quit_goal VARCHAR(255) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id)
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS smoke_events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                event_type ENUM('smoked', 'resisted') NOT NULL,
                event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_time (user_id, event_time)
            );
        `);

        console.log(`Smoke Tracker tables created in ${dbName} successfully.`);
    } catch (err) {
        console.error(`Error creating tables in ${dbName}:`, err.message);
    } finally {
        if (connection) await connection.end();
    }
}

async function run() {
    await createSmokeTablesForDb('smart_daybook');
    await createSmokeTablesForDb('voxday_db');
}

run();
