const mysql = require('mysql2/promise');
require('dotenv').config();

async function initPaymentAccounts() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'voxday_db'
        });

        console.log('Connected to MySQL database...');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS payment_accounts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                account_name VARCHAR(100) NOT NULL,
                account_type ENUM('cash', 'bank', 'upi', 'credit_card', 'bank_transfer') NOT NULL,
                bank_name VARCHAR(100),
                account_number VARCHAR(50),
                upi_id VARCHAR(100),
                initial_balance DECIMAL(10,2) DEFAULT 0.00,
                is_default TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                KEY user_id (user_id)
            ) ENGINE=MyISAM;
        `);
        console.log('payment_accounts table created or verified.');

        // Check if initial_balance column exists
        const [columns] = await connection.query(`SHOW COLUMNS FROM payment_accounts LIKE 'initial_balance'`);
        if (columns.length === 0) {
            await connection.query(`ALTER TABLE payment_accounts ADD COLUMN initial_balance DECIMAL(10,2) DEFAULT 0.00 AFTER upi_id`);
            console.log('Added initial_balance column to payment_accounts.');
        }

        await connection.end();
        console.log('Migration complete successfully.');
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
}

initPaymentAccounts();
