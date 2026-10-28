const db = require('./config/db');

async function migrateTransferPaymentMethod() {
    try {
        console.log('Checking transactions table for transfer_payment_method column...');
        
        const [columns] = await db.query(`SHOW COLUMNS FROM transactions LIKE 'transfer_payment_method'`);
        if (columns.length === 0) {
            await db.query(`ALTER TABLE transactions ADD COLUMN transfer_payment_method VARCHAR(50) AFTER transfer_account_id`);
            console.log('Added transfer_payment_method column to transactions.');
        } else {
            console.log('transfer_payment_method column already exists.');
        }

        console.log('Populating transfer_payment_method for existing UPI transfers...');
        const [result] = await db.query(`
            UPDATE transactions t
            JOIN payment_accounts pa ON t.transfer_account_id = pa.id
            SET t.transfer_payment_method = TRIM(SUBSTRING_INDEX(pa.bank_name, ',', 1))
            WHERE t.type = 'transfer'
              AND pa.account_type = 'upi'
              AND (t.transfer_payment_method IS NULL OR TRIM(t.transfer_payment_method) = '')
              AND pa.bank_name IS NOT NULL
              AND TRIM(pa.bank_name) != ''
        `);

        console.log(`Updated ${result.affectedRows} transfer transactions with default target UPI linked bank.`);
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
}

migrateTransferPaymentMethod();
