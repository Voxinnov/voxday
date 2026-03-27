const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTables() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Creating Goal Tracker tables...');

        // 1. Goals Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS goals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(100),
                type ENUM('Short-term', 'Long-term') DEFAULT 'Short-term',
                priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
                status ENUM('Active', 'Completed', 'On-Hold', 'Abandoned') DEFAULT 'Active',
                start_date DATE,
                target_date DATE,
                progress_percentage INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 2. Goal Milestones (Sub-goals)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS goal_milestones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                goal_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                is_completed BOOLEAN DEFAULT FALSE,
                due_date DATE,
                completed_at TIMESTAMP NULL,
                FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
            )
        `);

        // 3. Goal Habit Integration (Links goals to habits if they existed, but we'll store them as goals-specific daily tasks for now)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS goal_habits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                goal_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                frequency VARCHAR(50) DEFAULT 'Daily',
                FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
            )
        `);

        // 4. Goal Progress Logs
        await connection.query(`
            CREATE TABLE IF NOT EXISTS goal_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                goal_id INT NOT NULL,
                content TEXT NOT NULL,
                log_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
            )
        `);

        console.log('Goal Tracker tables created successfully.');
    } catch (err) {
        console.error('Error creating tables:', err);
    } finally {
        await connection.end();
    }
}

createTables();
