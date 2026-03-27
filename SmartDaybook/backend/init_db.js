const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDB() {
    try {
        console.log('Connecting to MySQL to create database...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        const dbName = process.env.DB_NAME || 'smart_daybook';
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        console.log(`Database '${dbName}' created or already exists.`);

        await connection.query(`USE \`${dbName}\`;`);

        console.log('Reading schema.sql...');
        const schemaPath = path.join(__dirname, 'config', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Split by semicolon to execute multiple statements if needed
        const statements = schema.split(';').filter(stmt => stmt.trim() !== '');

        for (let stmt of statements) {
            await connection.query(stmt);
        }

        console.log('Schema imported successfully.');
        await connection.end();
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

initDB();
