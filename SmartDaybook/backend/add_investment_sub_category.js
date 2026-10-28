const db = require('./config/db');

async function migrate() {
    try {
        console.log('Starting DB migration for sub_category...');

        // Add sub_category to categories table if not exists
        try {
            await db.query(`ALTER TABLE categories ADD COLUMN sub_category VARCHAR(50) DEFAULT 'general'`);
            console.log('Added sub_category column to categories table.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('sub_category column already exists in categories table.');
            } else {
                console.error('Error altering categories table:', err.message);
            }
        }

        // Add sub_category to transactions table if not exists
        try {
            await db.query(`ALTER TABLE transactions ADD COLUMN sub_category VARCHAR(50) DEFAULT 'general'`);
            console.log('Added sub_category column to transactions table.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('sub_category column already exists in transactions table.');
            } else {
                console.error('Error altering transactions table:', err.message);
            }
        }

        console.log('Migration finished successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
