const db = require('./config/db');

async function updateUpiPaymentMethods() {
    try {
        console.log('Updating UPI transactions with missing payment_method...');
        
        const [result] = await db.query(`
            UPDATE transactions t
            JOIN payment_accounts pa ON t.payment_account_id = pa.id
            SET t.payment_method = TRIM(SUBSTRING_INDEX(pa.bank_name, ',', 1))
            WHERE pa.account_type = 'upi'
              AND (t.payment_method IS NULL OR TRIM(t.payment_method) = '')
              AND pa.bank_name IS NOT NULL
              AND TRIM(pa.bank_name) != ''
        `);

        console.log(`Updated ${result.affectedRows} UPI transactions with default linked bank method.`);
        process.exit(0);
    } catch (err) {
        console.error('Error updating UPI payment methods:', err);
        process.exit(1);
    }
}

updateUpiPaymentMethods();
