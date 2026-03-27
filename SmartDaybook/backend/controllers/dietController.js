const db = require('../config/db');

// --- PROFILE ---
exports.createProfile = async (req, res) => {
    const { age, gender, height_cm, weight_kg, activity_level, food_preference, region } = req.body;
    try {
        const [existing] = await db.query('SELECT * FROM user_profiles WHERE user_id = ?', [req.user.id]);
        if (existing.length > 0) {
            await db.query(
                'UPDATE user_profiles SET age=?, gender=?, height_cm=?, weight_kg=?, activity_level=?, food_preference=?, region=? WHERE user_id=?',
                [age, gender, height_cm, weight_kg, activity_level, food_preference, region, req.user.id]
            );
            return res.status(200).json({ message: 'Profile updated' });
        }
        await db.query(
            'INSERT INTO user_profiles (user_id, age, gender, height_cm, weight_kg, activity_level, food_preference, region) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, age, gender, height_cm, weight_kg, activity_level, food_preference, region]
        );
        res.status(201).json({ message: 'Profile created' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const [profile] = await db.query('SELECT * FROM user_profiles WHERE user_id = ?', [req.params.id]);
        res.json(profile[0] || null);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- BMI Calculation ---
exports.calculateBMI = async (req, res) => {
    const { weight_kg, height_cm } = req.body;
    if (!weight_kg || !height_cm) return res.status(400).json({ message: 'Provide weight and height' });
    const height_m = height_cm / 100;
    const bmi = weight_kg / (height_m * height_m);
    let category = '';
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi < 24.9) category = 'Normal';
    else if (bmi < 29.9) category = 'Overweight';
    else category = 'Obese';

    // Diet logic defaults
    let recommended_goal = 'Maintenance';
    if (bmi < 18.5) recommended_goal = 'Weight Gain';
    if (bmi >= 25) recommended_goal = 'Weight Loss';

    res.json({ bmi: bmi.toFixed(2), category, recommended_goal });
};

// --- FOODS ---
exports.getFoods = async (req, res) => {
    try {
        const { preference, diet_type, region } = req.query;
        let query = 'SELECT * FROM foods WHERE 1=1';
        let params = [];
        if (preference) { query += ' AND preference = ?'; params.push(preference); }
        if (diet_type) { query += ' AND diet_type = ?'; params.push(diet_type); }
        if (region) { query += ' AND region = ?'; params.push(region); }
        const [foods] = await db.query(query, params);
        res.json(foods);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.createFood = async (req, res) => {
    const { food_name, category, calories, protein, carbs, fat, diet_type, preference, region } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO foods (food_name, category, calories, protein, carbs, fat, diet_type, preference, region) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [food_name, category, calories, protein, carbs, fat, diet_type, preference, region || 'Indian']
        );
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- MEAL PLAN ---
exports.generateMealPlan = async (req, res) => {
    const { goal, plan_type, duration } = req.body;

    try {
        const [profileRows] = await db.query('SELECT * FROM user_profiles WHERE user_id = ?', [req.user.id]);
        const profile = profileRows[0];

        let bmi = 0;
        let diet_type = 'maintenance';
        let preference = 'veg';
        let region = 'Indian';

        if (profile) {
            const hm = profile.height_cm / 100;
            bmi = profile.weight_kg / (hm * hm);
            if (goal === 'Weight Loss') diet_type = 'weight_loss';
            else if (goal === 'Weight Gain') diet_type = 'weight_gain';
            else diet_type = 'maintenance';

            preference = profile.food_preference?.toLowerCase() === 'non-vegetarian' ? 'nonveg' : profile.food_preference?.toLowerCase();
            if (!preference) preference = 'veg';
            region = profile.region || 'Indian';
        } else if (plan_type === 'BMI') {
            return res.status(400).json({ message: 'Profile required for BMI based plan' });
        } else {
            if (goal === 'Weight Loss') diet_type = 'weight_loss';
            else if (goal === 'Weight Gain') diet_type = 'weight_gain';
            else diet_type = 'maintenance';
        }

        const [planRes] = await db.query(
            'INSERT INTO meal_plans (user_id, bmi, goal, plan_type, start_date, duration) VALUES (?, ?, ?, ?, CURDATE(), ?)',
            [req.user.id, bmi, goal, plan_type, duration || 7]
        );
        const planId = planRes.insertId;

        // Fetch foods based on preferences
        const [foods] = await db.query(
            'SELECT * FROM foods WHERE diet_type = ? AND preference = ? AND region IN (?, "Indian", "International")',
            [diet_type, preference, region]
        );

        // Fallback if no specific foods found
        const availableFoods = foods.length > 0 ? foods : await db.query('SELECT * FROM foods')[0];

        // Group foods by category
        const categorizedFoods = {
            'early_morning': [], 'breakfast': [], 'mid_morning_snack': [], 'lunch': [], 'evening_snack': [], 'dinner': []
        };

        availableFoods.forEach(f => {
            if (categorizedFoods[f.category]) {
                categorizedFoods[f.category].push(f);
            }
        });

        // Generate days
        const limitDays = duration || 7;
        const meals = ['Early Morning', 'Breakfast', 'Mid Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'];
        const mealKeys = ['early_morning', 'breakfast', 'mid_morning_snack', 'lunch', 'evening_snack', 'dinner'];

        const planItems = [];
        for (let day = 1; day <= limitDays; day++) {
            for (let i = 0; i < meals.length; i++) {
                const cats = categorizedFoods[mealKeys[i]];
                let chosenFood = null;
                if (cats && cats.length > 0) {
                    chosenFood = cats[Math.floor(Math.random() * cats.length)];
                } else if (availableFoods.length > 0) {
                    chosenFood = availableFoods[Math.floor(Math.random() * availableFoods.length)];
                }

                if (chosenFood) {
                    planItems.push([
                        planId, day, meals[i], chosenFood.id, chosenFood.calories
                    ]);
                }
            }
        }

        if (planItems.length > 0) {
            await db.query('INSERT INTO meal_plan_items (meal_plan_id, day_number, meal_type, food_id, calories) VALUES ?', [planItems]);
        }

        res.status(201).json({ message: 'Meal plan generated', plan_id: planId });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getMealPlan = async (req, res) => {
    try {
        const userId = req.params.user_id === 'me' ? req.user.id : req.params.user_id;
        const [plans] = await db.query('SELECT * FROM meal_plans WHERE user_id = ? ORDER BY id DESC', [userId]);
        if (plans.length > 0) {
            const [items] = await db.query(`
                SELECT mpi.*, f.food_name, f.protein, f.carbs, f.fat, f.category 
                FROM meal_plan_items mpi 
                LEFT JOIN foods f ON mpi.food_id = f.id 
                WHERE mpi.meal_plan_id = ? 
                ORDER BY mpi.day_number ASC, FIELD(mpi.meal_type, 'Early Morning', 'Breakfast', 'Mid Morning Snack', 'Lunch', 'Evening Snack', 'Dinner') ASC
            `, [plans[0].id]);
            res.json({ plan: plans[0], items });
        } else {
            res.json(null); // No plans generated
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
