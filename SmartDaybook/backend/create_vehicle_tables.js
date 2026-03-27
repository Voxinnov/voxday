const mysql = require('mysql2/promise');
require('dotenv').config();

async function createVehicleTables() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smart_daybook'
        });

        const tables = [
            `CREATE TABLE IF NOT EXISTS vehicles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                name VARCHAR(100),
                number VARCHAR(50),
                type VARCHAR(50),
                brand VARCHAR(50),
                model VARCHAR(50),
                year INT,
                fuel_type VARCHAR(50),
                insurance_expiry DATE,
                rc_expiry DATE,
                pollution_expiry DATE,
                purchase_date DATE,
                current_odometer INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=MyISAM;`,

            `CREATE TABLE IF NOT EXISTS vehicle_services (
                id INT AUTO_INCREMENT PRIMARY KEY,
                vehicle_id INT,
                service_date DATE,
                odometer INT,
                service_type VARCHAR(100),
                garage_name VARCHAR(100),
                cost DECIMAL(10,2),
                description TEXT,
                next_service_odometer INT,
                invoice_url VARCHAR(255),
                checklist JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=MyISAM;`,

            `CREATE TABLE IF NOT EXISTS vehicle_expenses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                vehicle_id INT,
                date DATE,
                expense_type VARCHAR(100),
                amount DECIMAL(10,2),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=MyISAM;`,

            `CREATE TABLE IF NOT EXISTS vehicle_fuels (
                id INT AUTO_INCREMENT PRIMARY KEY,
                vehicle_id INT,
                date DATE,
                odometer INT,
                quantity DECIMAL(10,2),
                cost DECIMAL(10,2),
                calculated_mileage DECIMAL(10,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=MyISAM;`,

            `CREATE TABLE IF NOT EXISTS vehicle_documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                vehicle_id INT,
                title VARCHAR(150),
                type VARCHAR(50),
                file_url VARCHAR(255),
                expiry_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=MyISAM;`
        ];

        for (const sql of tables) {
            await connection.query(sql);
        }

        console.log("Vehicle tables created successfully.");
        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error("Error creating vehicle tables:", err);
        process.exit(1);
    }
}
createVehicleTables();
