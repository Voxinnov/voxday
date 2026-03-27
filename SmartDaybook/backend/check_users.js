const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsersTable() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smart_daybook'
        });

        const [rows] = await connection.query(`SHOW CREATE TABLE users`);
        console.log("Users definition:", rows[0]['Create Table']);
        await connection.end();
    } catch (err) {
        console.error("Error:", err);
    }
}
checkUsersTable();
