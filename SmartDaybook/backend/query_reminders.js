require('dotenv').config({path: '/var/www/vsuite.bvox.in/voxdbook/SmartDaybook/backend/.env'});
const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  const [rows] = await connection.execute('SELECT * FROM event_reminders ORDER BY id DESC LIMIT 2');
  console.log(JSON.stringify(rows, null, 2));
  connection.end();
}
run();
