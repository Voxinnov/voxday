const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env' });

async function resetPassword() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smart_daybook'
    });

    try {
        const password = 'admin123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await pool.query(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, 'admin@voxday.com']
        );

        if (result.affectedRows > 0) {
            console.log('Password reset successfully for admin@voxday.com to: admin123');
        } else {
            console.log('User admin@voxday.com not found.');
        }
    } catch (error) {
        console.error('Error resetting password:', error);
    } finally {
        await pool.end();
    }
}

resetPassword();
