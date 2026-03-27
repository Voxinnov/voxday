const mysql = require('mysql2/promise');
require('dotenv').config();
async function test() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smart_daybook'
        });
        const [result] = await pool.query(
            'INSERT INTO notes (user_id, title, content, color, is_pinned) VALUES (?, ?, ?, ?, ?)',
            [1, 'test', 'test', '#ffffff', false]
        );
        console.log(result);
        process.exit();
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
test();
