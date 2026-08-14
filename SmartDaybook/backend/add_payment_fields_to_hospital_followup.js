const mysql = require('/var/www/voxday.bvox.in/SmartDaybook/backend/node_modules/mysql2/promise');
require('/var/www/voxday.bvox.in/SmartDaybook/backend/node_modules/dotenv').config({ path: '/var/www/voxday.bvox.in/SmartDaybook/backend/.env' });

async function addColumnsInDb(dbName) {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: dbName
        });

        console.log(`Updating hospital_followups schema in ${dbName}...`);

        const colsToAdd = [
            { name: 'total_bill_amount', type: 'DECIMAL(10,2) DEFAULT 0.00' },
            { name: 'payment_mode', type: "VARCHAR(50) DEFAULT 'self_pay'" },
            { name: 'payment_account_id', type: 'INT NULL' },
            { name: 'self_pay_amount', type: 'DECIMAL(10,2) DEFAULT 0.00' },
            { name: 'payment_method', type: 'VARCHAR(100) NULL' }
        ];

        for (const col of colsToAdd) {
            const [existing] = await connection.query(
                `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'hospital_followups' AND COLUMN_NAME = ?`,
                [dbName, col.name]
            );

            if (existing.length === 0) {
                console.log(`Adding column ${col.name} to ${dbName}.hospital_followups...`);
                await connection.query(`ALTER TABLE hospital_followups ADD COLUMN ${col.name} ${col.type}`);
            } else {
                console.log(`Column ${col.name} already exists in ${dbName}.hospital_followups.`);
            }
        }

        console.log(`Successfully updated hospital_followups in ${dbName}.`);

    } catch (err) {
        console.error(`Error updating hospital_followups schema in ${dbName}:`, err.message);
    } finally {
        if (connection) await connection.end();
    }
}

async function run() {
    await addColumnsInDb('smart_daybook');
    await addColumnsInDb('voxday_db');
}

run();
