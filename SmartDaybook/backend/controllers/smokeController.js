const db = require('../config/db');

// Ensure default settings exist for user
const getOrCreateSettings = async (userId) => {
    const [rows] = await db.query(
        'SELECT * FROM smoke_settings WHERE user_id = ?',
        [userId]
    );

    if (rows.length > 0) {
        return rows[0];
    }

    const defaultSettings = {
        user_id: userId,
        avg_per_day: 10,
        daily_target: 5,
        price_per_cigarette: 20.00,
        quit_goal: null
    };

    await db.query(
        'INSERT INTO smoke_settings (user_id, avg_per_day, daily_target, price_per_cigarette, quit_goal) VALUES (?, ?, ?, ?, ?)',
        [userId, defaultSettings.avg_per_day, defaultSettings.daily_target, defaultSettings.price_per_cigarette, defaultSettings.quit_goal]
    );

    const [newRows] = await db.query(
        'SELECT * FROM smoke_settings WHERE user_id = ?',
        [userId]
    );

    return newRows[0] || defaultSettings;
};

// @desc    Get Smoke Tracker summary for logged in user
// @route   GET /api/smoke/summary
exports.getSmokeSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        const settings = await getOrCreateSettings(userId);

        // Today's smoked count
        const [todaySmokedRows] = await db.query(
            "SELECT COUNT(*) AS count FROM smoke_events WHERE user_id = ? AND event_type = 'smoked' AND DATE(event_time) = CURRENT_DATE()",
            [userId]
        );
        const todaySmoked = todaySmokedRows[0]?.count || 0;

        // Yesterday's smoked count
        const [yesterdaySmokedRows] = await db.query(
            "SELECT COUNT(*) AS count FROM smoke_events WHERE user_id = ? AND event_type = 'smoked' AND DATE(event_time) = CURRENT_DATE() - INTERVAL 1 DAY",
            [userId]
        );
        const yesterdaySmoked = yesterdaySmokedRows[0]?.count || 0;

        // Today's cravings resisted
        const [todayResistedRows] = await db.query(
            "SELECT COUNT(*) AS count FROM smoke_events WHERE user_id = ? AND event_type = 'resisted' AND DATE(event_time) = CURRENT_DATE()",
            [userId]
        );
        const todayResisted = todayResistedRows[0]?.count || 0;

        // Total cravings resisted
        const [totalResistedRows] = await db.query(
            "SELECT COUNT(*) AS count FROM smoke_events WHERE user_id = ? AND event_type = 'resisted'",
            [userId]
        );
        const totalResisted = totalResistedRows[0]?.count || 0;

        // Last cigarette timestamp
        const [lastSmokedRows] = await db.query(
            "SELECT event_time FROM smoke_events WHERE user_id = ? AND event_type = 'smoked' ORDER BY event_time DESC LIMIT 1",
            [userId]
        );
        const lastSmokedTime = lastSmokedRows.length > 0 ? lastSmokedRows[0].event_time : null;

        // Calculate streaks (longest smoke-free streak and current smoke-free streak)
        const [allSmokedEvents] = await db.query(
            "SELECT event_time FROM smoke_events WHERE user_id = ? AND event_type = 'smoked' ORDER BY event_time ASC",
            [userId]
        );

        let longestStreakMs = 0;
        let currentStreakMs = 0;
        const now = new Date();

        if (allSmokedEvents.length === 0) {
            const [firstEvent] = await db.query(
                "SELECT created_at FROM smoke_settings WHERE user_id = ?",
                [userId]
            );
            const startTime = firstEvent.length > 0 ? new Date(firstEvent[0].created_at) : now;
            const diff = Math.max(0, now.getTime() - startTime.getTime());
            longestStreakMs = diff;
            currentStreakMs = diff;
        } else {
            for (let i = 1; i < allSmokedEvents.length; i++) {
                const prev = new Date(allSmokedEvents[i - 1].event_time).getTime();
                const curr = new Date(allSmokedEvents[i].event_time).getTime();
                const gap = curr - prev;
                if (gap > longestStreakMs) {
                    longestStreakMs = gap;
                }
            }

            const lastTime = new Date(allSmokedEvents[allSmokedEvents.length - 1].event_time).getTime();
            currentStreakMs = Math.max(0, now.getTime() - lastTime);
            if (currentStreakMs > longestStreakMs) {
                longestStreakMs = currentStreakMs;
            }
        }

        // Price per cigarette (default to ₹20 if unconfigured or 0)
        const rawPrice = parseFloat(settings.price_per_cigarette);
        const pricePerCig = !isNaN(rawPrice) && rawPrice > 0 ? rawPrice : 20.00;

        // Today's smoking cost: todaySmoked * pricePerCig
        const todaySmokingCost = todaySmoked * pricePerCig;

        // Money saved from resisted cravings (or daily reduction)
        const moneySaved = totalResisted * pricePerCig;

        res.json({
            todaySmoked,
            yesterdaySmoked,
            todayResisted,
            totalResisted,
            lastSmokedTime,
            currentStreakMs,
            longestStreakMs,
            todaySmokingCost,
            moneySaved,
            settings: {
                avg_per_day: settings.avg_per_day,
                daily_target: settings.daily_target,
                price_per_cigarette: pricePerCig,
                quit_goal: settings.quit_goal
            }
        });
    } catch (error) {
        console.error('Error fetching smoke summary:', error);
        res.status(500).json({ message: 'Failed to fetch smoke summary', error: error.message });
    }
};

// @desc    Log a smoking or resisted event
// @route   POST /api/smoke/log
exports.logSmokeEvent = async (req, res) => {
    try {
        const userId = req.user.id;
        const { event_type } = req.body;

        if (!event_type || (event_type !== 'smoked' && event_type !== 'resisted')) {
            return res.status(400).json({ message: "Invalid event_type. Must be 'smoked' or 'resisted'." });
        }

        await db.query(
            "INSERT INTO smoke_events (user_id, event_type, event_time) VALUES (?, ?, NOW())",
            [userId, event_type]
        );

        res.status(201).json({ message: 'Event recorded successfully', event_type });
    } catch (error) {
        console.error('Error logging smoke event:', error);
        res.status(500).json({ message: 'Failed to record event', error: error.message });
    }
};

// @desc    Update user smoke settings
// @route   PUT /api/smoke/settings
exports.updateSmokeSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { avg_per_day, daily_target, price_per_cigarette, quit_goal } = req.body;

        const priceVal = parseFloat(price_per_cigarette);
        if (price_per_cigarette !== undefined && (isNaN(priceVal) || priceVal < 0)) {
            return res.status(400).json({ message: 'Cigarette price must be a valid positive number.' });
        }

        const avgVal = parseInt(avg_per_day, 10) || 10;
        const targetVal = parseInt(daily_target, 10) || 5;
        const finalPrice = !isNaN(priceVal) && priceVal >= 0 ? priceVal : 20.00;
        const quitGoalVal = quit_goal !== undefined ? quit_goal : null;

        await db.query(
            `INSERT INTO smoke_settings (user_id, avg_per_day, daily_target, price_per_cigarette, quit_goal)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             avg_per_day = VALUES(avg_per_day),
             daily_target = VALUES(daily_target),
             price_per_cigarette = VALUES(price_per_cigarette),
             quit_goal = VALUES(quit_goal)`,
            [userId, avgVal, targetVal, finalPrice, quitGoalVal]
        );

        res.json({
            message: 'Settings updated successfully',
            settings: {
                avg_per_day: avgVal,
                daily_target: targetVal,
                price_per_cigarette: finalPrice,
                quit_goal: quitGoalVal
            }
        });
    } catch (error) {
        console.error('Error updating smoke settings:', error);
        res.status(500).json({ message: 'Failed to update settings', error: error.message });
    }
};

// @desc    Reset all smoke tracker data for logged in user
// @route   DELETE /api/smoke/reset
exports.resetSmokeData = async (req, res) => {
    try {
        const userId = req.user.id;

        // Delete all smoking & resisted events for user
        await db.query("DELETE FROM smoke_events WHERE user_id = ?", [userId]);

        // Reset settings to default values for user
        await db.query("DELETE FROM smoke_settings WHERE user_id = ?", [userId]);

        res.json({ message: 'All smoke tracking data has been reset successfully' });
    } catch (error) {
        console.error('Error resetting smoke data:', error);
        res.status(500).json({ message: 'Failed to reset smoke tracking data', error: error.message });
    }
};
