const mysql = require('/var/www/voxday.bvox.in/SmartDaybook/backend/node_modules/mysql2/promise');
const bcrypt = require('/var/www/voxday.bvox.in/SmartDaybook/backend/node_modules/bcryptjs');
require('/var/www/voxday.bvox.in/SmartDaybook/backend/node_modules/dotenv').config({ path: '/var/www/voxday.bvox.in/SmartDaybook/backend/.env' });

async function resetInDb(dbName) {
    let pool;
    try {
        pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: dbName
        });

        const newPass = '123456';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPass, salt);

        const emails = ['jishavox@gmail.com', 'jisha@voxinnov.com', 'admin@voxday.com', 'vishnuvox@gmail.com', 'info@voxinnov.com'];

        for (const email of emails) {
            const [res] = await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
            if (res.affectedRows > 0) {
                console.log(`Password reset for ${email} in ${dbName} to: 123456`);
            }
        }
    } catch (err) {
        console.error(`Error updating passwords in ${dbName}:`, err.message);
    } finally {
        if (pool) await pool.end();
    }
}

async function run() {
    await resetInDb('smart_daybook');
    await resetInDb('voxday_db');
}

run();
