const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'd:/VOXINNOV/VOXDAY/SmartDaybook/backend/.env' });

async function listUsers() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smart_daybook'
    });

    try {
        const [rows] = await pool.query('SELECT name, email FROM users');
        console.log('Registered Users:');
        rows.forEach(user => {
            console.log(`- ${user.name} (${user.email})`);
        });
    } catch (error) {
        console.error('Error listing users:', error);
    } finally {
        await pool.end();
    }
}

listUsers();
