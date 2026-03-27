CREATE TABLE IF NOT EXISTS users (
 id INT AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(120),
 email VARCHAR(150) UNIQUE,
 phone VARCHAR(20),
 password VARCHAR(255),
 role ENUM('user', 'admin') DEFAULT 'user',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT,
 name VARCHAR(100),
 type ENUM('income','expense'),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT,
 category_id INT,
 classification ENUM('personal', 'official') DEFAULT 'official',
 amount DECIMAL(10,2),
 type ENUM('income','expense','credit','debit'),
 payment_method VARCHAR(50),
 description TEXT,
 attachment VARCHAR(255),
 transaction_date DATE,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS todos (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT,
 title VARCHAR(200),
 description TEXT,
 due_date DATE,
 priority ENUM('low','medium','high'),
 status ENUM('pending','completed'),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT,
 title VARCHAR(200),
 description TEXT,
 start_date DATE,
 due_date DATE,
 priority ENUM('low','medium','high'),
 status ENUM('pending','in_progress','completed','overdue'),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_subtasks (
 id INT AUTO_INCREMENT PRIMARY KEY,
 task_id INT,
 title VARCHAR(200),
 status ENUM('pending','completed'),
 FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_profiles (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT,
 age INT,
 gender ENUM('Male', 'Female', 'Other'),
 height_cm DECIMAL(5,2),
 weight_kg DECIMAL(5,2),
 activity_level ENUM('Sedentary', 'Light Activity', 'Moderate Activity', 'Heavy Activity'),
 food_preference ENUM('Vegetarian', 'Non-Vegetarian', 'Vegan'),
 region ENUM('Kerala', 'Indian', 'International'),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=MyISAM;

CREATE TABLE IF NOT EXISTS foods (
 id INT AUTO_INCREMENT PRIMARY KEY,
 food_name VARCHAR(255),
 category ENUM('breakfast', 'lunch', 'snack', 'dinner', 'early_morning', 'mid_morning_snack', 'evening_snack'),
 calories DECIMAL(8,2),
 protein DECIMAL(8,2),
 carbs DECIMAL(8,2),
 fat DECIMAL(8,2),
 diet_type ENUM('weight_loss', 'weight_gain', 'maintenance'),
 preference ENUM('veg', 'nonveg', 'vegan'),
 region ENUM('Kerala', 'Indian', 'International') DEFAULT 'Indian'
) ENGINE=MyISAM;

CREATE TABLE IF NOT EXISTS meal_plans (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT,
 bmi DECIMAL(5,2),
 goal VARCHAR(50),
 plan_type ENUM('BMI', 'NON_BMI'),
 start_date DATE,
 duration INT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=MyISAM;

CREATE TABLE IF NOT EXISTS meal_plan_items (
 id INT AUTO_INCREMENT PRIMARY KEY,
 meal_plan_id INT,
 day_number INT,
 meal_type ENUM('Early Morning', 'Breakfast', 'Mid Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'),
 food_id INT,
 calories DECIMAL(8,2)
) ENGINE=MyISAM;

CREATE TABLE IF NOT EXISTS day_planner_profiles (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT,
 name VARCHAR(120),
 gender ENUM('Male', 'Female', 'Other'),
 age INT,
 working_type VARCHAR(100),
 working_day VARCHAR(100),
 off_day VARCHAR(100),
 wake_up_preference TIME,
 sleep_preference TIME,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=MyISAM;

CREATE TABLE IF NOT EXISTS day_plan_activities (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT,
 activity_name VARCHAR(200),
 icon VARCHAR(50),
 category VARCHAR(100),
 start_time TIME,
 end_time TIME,
 reminder BOOLEAN DEFAULT TRUE,
 priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
 day_mode ENUM('Working Day', 'Off Day') DEFAULT 'Working Day',
 is_custom BOOLEAN DEFAULT FALSE,
 order_index INT DEFAULT 0
) ENGINE=MyISAM;

CREATE TABLE IF NOT EXISTS day_plan_daily_logs (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT,
 activity_id INT,
 log_date DATE,
 status ENUM('Pending', 'Completed', 'Partially Completed', 'Not Completed') DEFAULT 'Pending',
 rating INT DEFAULT 0,
 discipline_assigned VARCHAR(255)
) ENGINE=MyISAM;

CREATE TABLE IF NOT EXISTS day_plan_disciplines (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT,
 name VARCHAR(200),
 is_custom BOOLEAN DEFAULT FALSE
) ENGINE=MyISAM;
