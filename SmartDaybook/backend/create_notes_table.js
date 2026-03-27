const mysql = require('mysql2/promise');
require('dotenv').config();

async function createNotesTable() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smart_daybook'
        });

        await connection.query(`
            CREATE TABLE IF NOT EXISTS notes (
             id INT AUTO_INCREMENT PRIMARY KEY,
             user_id INT,
             title VARCHAR(255),
             content TEXT,
             color VARCHAR(20) DEFAULT '#ffffff',
             is_pinned BOOLEAN DEFAULT FALSE,
             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
             updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=MyISAM;
        `);
        console.log("Notes table created successfully.");
        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}
createNotesTable();
