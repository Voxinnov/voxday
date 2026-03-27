const db = require('../config/db');

// default template
const defaultActivities = [
    { name: "Wake Up Time", start: "06:00:00", end: "06:15:00", icon: "Sun" },
    { name: "Fresh Up Time", start: "06:15:00", end: "06:45:00", icon: "Droplets" },
    { name: "Prayer Time", start: "06:45:00", end: "07:00:00", icon: "Book" },
    { name: "Exercise Time", start: "07:00:00", end: "07:45:00", icon: "Activity" },
    { name: "Food Preparing Time", start: "07:45:00", end: "08:30:00", icon: "ChefHat" },
    { name: "Breakfast Time", start: "08:30:00", end: "09:00:00", icon: "Coffee" },
    { name: "Medicine Time", start: "09:00:00", end: "09:05:00", icon: "Pill" },
    { name: "Travel Time to Office", start: "09:05:00", end: "09:45:00", icon: "Car" },
    { name: "Work Time", start: "09:45:00", end: "13:00:00", icon: "Briefcase" },
    { name: "Tea Break Time", start: "11:30:00", end: "11:45:00", icon: "Coffee" },
    { name: "Lunch Break Time", start: "13:00:00", end: "14:00:00", icon: "Utensils" },
    { name: "Work Time (Afternoon)", start: "14:00:00", end: "17:30:00", icon: "Briefcase" },
    { name: "Evening Tea Time", start: "17:30:00", end: "17:45:00", icon: "Coffee" },
    { name: "Office Leaving Time", start: "17:45:00", end: "18:00:00", icon: "LogOut" },
    { name: "Travel Time to Home", start: "18:00:00", end: "18:45:00", icon: "Home" },
    { name: "House Cleaning Time", start: "18:45:00", end: "19:15:00", icon: "Wind" },
    { name: "Dinner Preparing Time", start: "19:15:00", end: "20:00:00", icon: "ChefHat" },
    { name: "Prayer Time (Evening)", start: "20:00:00", end: "20:15:00", icon: "Book" },
    { name: "Dinner Time", start: "20:15:00", end: "21:00:00", icon: "Utensils" },
    { name: "Screen Time", start: "21:00:00", end: "21:45:00", icon: "Monitor" },
    { name: "Reading Time", start: "21:45:00", end: "22:15:00", icon: "BookOpen" },
    { name: "Private Time", start: "22:15:00", end: "22:45:00", icon: "Lock" },
    { name: "Sleeping Time", start: "22:45:00", end: "23:00:00", icon: "Moon" }
];

const defaultDisciplines = [
    { name: "Do 20 push-ups" },
    { name: "Read 5 pages" },
    { name: "10 minutes meditation" },
    { name: "Drink 2 glasses of water" },
    { name: "Clean your room" },
    { name: "Write tomorrow's plan" }
];

exports.getProfile = async (req, res) => {
    try {
        const [profile] = await db.query('SELECT * FROM day_planner_profiles WHERE user_id = ?', [req.user.id]);
        res.json(profile[0] || null);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.setupProfile = async (req, res) => {
    const { name, gender, age, working_type, working_day, off_day, wake_up_preference, sleep_preference } = req.body;
    try {
        const [existing] = await db.query('SELECT * FROM day_planner_profiles WHERE user_id = ?', [req.user.id]);

        if (existing.length === 0) {
            await db.query(`
                INSERT INTO day_planner_profiles (user_id, name, gender, age, working_type, working_day, off_day, wake_up_preference, sleep_preference)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [req.user.id, name, gender, age || null, working_type, working_day, off_day, wake_up_preference, sleep_preference]);

            // Seed default activities for Working Day
            const activities = defaultActivities.map((act, index) => [
                req.user.id, act.name, act.icon, 'General', act.start, act.end, true, 'Medium', 'Working Day', false, index
            ]);

            // Seed default activities for Off Day (Simplified)
            const offDayActivities = defaultActivities
                .filter(a => !['Travel Time to Office', 'Work Time', 'Work Time (Afternoon)', 'Office Leaving Time'].includes(a.name))
                .map((act, index) => [
                    req.user.id, act.name, act.icon, 'General', act.start, act.end, true, 'Medium', 'Off Day', false, index
                ]);

            await db.query(`
                INSERT INTO day_plan_activities 
                (user_id, activity_name, icon, category, start_time, end_time, reminder, priority, day_mode, is_custom, order_index)
                VALUES ?
            `, [[...activities, ...offDayActivities]]);

            // Seed Disciplines
            const disciplines = defaultDisciplines.map(d => [req.user.id, d.name, false]);
            await db.query(`INSERT INTO day_plan_disciplines (user_id, name, is_custom) VALUES ?`, [disciplines]);

            res.status(201).json({ message: 'Profile and templates created successfully' });
        } else {
            await db.query(`
                UPDATE day_planner_profiles SET name=?, gender=?, age=?, working_type=?, working_day=?, off_day=?, wake_up_preference=?, sleep_preference=? WHERE user_id=?
            `, [name, gender, age || null, working_type, working_day, off_day, wake_up_preference, sleep_preference, req.user.id]);
            res.json({ message: 'Profile updated' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getActivities = async (req, res) => {
    const { mode } = req.query; // 'Working Day' or 'Off Day'
    try {
        const [activities] = await db.query(`
            SELECT * FROM day_plan_activities WHERE user_id = ? AND day_mode = ? ORDER BY start_time ASC
        `, [req.user.id, mode || 'Working Day']);
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.createActivity = async (req, res) => {
    const { activity_name, start_time, end_time, reminder, priority, day_mode, icon, category } = req.body;
    try {
        const [result] = await db.query(`
            INSERT INTO day_plan_activities (user_id, activity_name, icon, category, start_time, end_time, reminder, priority, day_mode, is_custom)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [req.user.id, activity_name, icon || 'List', category || 'Custom', start_time, end_time, reminder !== false, priority || 'Medium', day_mode || 'Working Day', true]);
        res.status(201).json({ id: result.insertId, message: 'Activity added' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateActivity = async (req, res) => {
    const { activity_name, start_time, end_time, priority, reminder } = req.body;
    try {
        await db.query(`
            UPDATE day_plan_activities SET activity_name=?, start_time=?, end_time=?, priority=?, reminder=? WHERE id=? AND user_id=?
        `, [activity_name, start_time, end_time, priority, reminder, req.params.id, req.user.id]);
        res.json({ message: 'Activity updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteActivity = async (req, res) => {
    try {
        await db.query('DELETE FROM day_plan_activities WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
        res.json({ message: 'Activity deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Logs & Rating
exports.getDailyLog = async (req, res) => {
    const { date, mode } = req.query; // Send YYYY-MM-DD
    try {
        // Fetch all activities for mode
        const [activities] = await db.query('SELECT * FROM day_plan_activities WHERE user_id=? AND day_mode=? ORDER BY start_time ASC', [req.user.id, mode || 'Working Day']);
        // Fetch logs for date
        const [logs] = await db.query('SELECT * FROM day_plan_daily_logs WHERE user_id=? AND log_date=?', [req.user.id, date]);

        const logMap = {};
        logs.forEach(l => { logMap[l.activity_id] = l; });

        // merged
        const merged = activities.map(act => ({
            ...act,
            log: logMap[act.id] || { status: 'Pending', rating: 0, discipline_assigned: null }
        }));

        res.json(merged);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateDailyLog = async (req, res) => {
    const { activity_id, log_date, status, rating } = req.body;
    try {
        let discipline = null;
        if (status === 'Not Completed') {
            const [disciplines] = await db.query('SELECT * FROM day_plan_disciplines WHERE user_id=?', [req.user.id]);
            if (disciplines.length > 0) {
                discipline = disciplines[Math.floor(Math.random() * disciplines.length)].name;
            }
        }

        const [existing] = await db.query('SELECT id FROM day_plan_daily_logs WHERE user_id=? AND activity_id=? AND log_date=?', [req.user.id, activity_id, log_date]);

        if (existing.length > 0) {
            await db.query(`UPDATE day_plan_daily_logs SET status=?, rating=?, discipline_assigned=? WHERE id=?`, [status, rating || 0, discipline, existing[0].id]);
        } else {
            await db.query(`INSERT INTO day_plan_daily_logs (user_id, activity_id, log_date, status, rating, discipline_assigned) VALUES (?, ?, ?, ?, ?, ?)`,
                [req.user.id, activity_id, log_date, status, rating || 0, discipline]);
        }
        res.json({ message: 'Log updated', discipline_assigned: discipline });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Analytics
exports.getAnalytics = async (req, res) => {
    try {
        const [logs] = await db.query('SELECT * FROM day_plan_daily_logs WHERE user_id=? AND log_date = CURDATE()', [req.user.id]);
        let completed = 0; let partial = 0; let missed = 0; let totalRating = 0; let ratedCount = 0;

        logs.forEach(l => {
            if (l.status === 'Completed') completed++;
            else if (l.status === 'Partially Completed') partial++;
            else if (l.status === 'Not Completed') missed++;

            if (l.rating > 0) { totalRating += l.rating; ratedCount++; }
        });

        const totalTasks = completed + partial + missed;
        const completePct = totalTasks > 0 ? (completed / totalTasks) * 100 : 0;
        const avgRating = ratedCount > 0 ? (totalRating / ratedCount).toFixed(1) : 0;

        res.json({
            completed, partial, missed, totalTasks,
            completion_percentage: completePct.toFixed(1),
            average_rating: avgRating
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
