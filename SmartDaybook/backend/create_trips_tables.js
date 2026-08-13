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

        console.log(`Setting up trips tables in ${dbName}...`);

        // 1. Create trips table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS trips (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                destination VARCHAR(255) NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                budget DECIMAL(10, 2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 2. Create trip_plans table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS trip_plans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                trip_id INT NOT NULL,
                date DATE NOT NULL,
                time VARCHAR(50) NULL,
                title VARCHAR(255) NOT NULL,
                notes TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_trip_id (trip_id),
                FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 3. Create trip_places table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS trip_places (
                id INT AUTO_INCREMENT PRIMARY KEY,
                trip_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                notes TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_trip_id (trip_id),
                FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 4. Add trip_id to transactions table
        const [columns] = await connection.query(`SHOW COLUMNS FROM transactions LIKE 'trip_id'`);
        if (columns.length === 0) {
            await connection.query(`ALTER TABLE transactions ADD COLUMN trip_id INT NULL AFTER vehicle_id`);
            await connection.query(`ALTER TABLE transactions ADD INDEX idx_trip_id (trip_id)`);
            console.log(`Added trip_id column to ${dbName}.transactions.`);
        } else {
            console.log(`trip_id column already exists in ${dbName}.transactions.`);
        }

        console.log(`Successfully configured trips tables in ${dbName}.`);

    } catch (err) {
        console.error(`Error setting up schema in ${dbName}:`, err.message);
    } finally {
        if (connection) await connection.end();
    }
}

async function run() {
    await createTablesInDb('smart_daybook');
    await createTablesInDb('voxday_db');
}

run();
