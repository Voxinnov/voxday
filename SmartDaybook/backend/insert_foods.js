const db = require('./config/db');

const foods = [
    // Kerala Foods
    ['Idli', 'breakfast', 39, 1.2, 8, 0.1, 'maintenance', 'veg', 'Kerala'],
    ['Dosa', 'breakfast', 133, 2.6, 23.3, 3, 'maintenance', 'veg', 'Kerala'],
    ['Appam', 'breakfast', 120, 2, 19, 3, 'maintenance', 'veg', 'Kerala'],
    ['Puttu', 'breakfast', 250, 4, 52, 2, 'weight_gain', 'veg', 'Kerala'],
    ['Kadala curry', 'breakfast', 200, 8, 25, 6, 'weight_gain', 'veg', 'Kerala'],
    ['Fish curry', 'lunch', 180, 20, 5, 8, 'weight_loss', 'nonveg', 'Kerala'],
    ['Brown rice', 'lunch', 110, 2.6, 23, 0.9, 'weight_loss', 'veg', 'Kerala'],
    ['Avial', 'lunch', 150, 4, 15, 10, 'maintenance', 'veg', 'Kerala'],
    ['Thoran', 'lunch', 120, 3, 10, 7, 'maintenance', 'veg', 'Kerala'],
    ['Ragi', 'dinner', 160, 4, 35, 1, 'weight_loss', 'veg', 'Kerala'],
    // Generic Indian/Western
    ['Banana smoothie', 'early_morning', 150, 3, 30, 1, 'weight_gain', 'veg', 'Indian'],
    ['Oats', 'breakfast', 150, 5, 27, 3, 'weight_loss', 'vegan', 'Indian'],
    ['Millets', 'lunch', 130, 4, 25, 1, 'weight_loss', 'vegan', 'Indian'],
    ['Milk', 'early_morning', 120, 8, 12, 5, 'weight_gain', 'veg', 'Indian'],
    ['Eggs', 'mid_morning_snack', 140, 12, 1, 10, 'maintenance', 'nonveg', 'International'],
    ['Nuts', 'evening_snack', 180, 5, 6, 15, 'weight_gain', 'vegan', 'International'],
    ['Vegetables', 'lunch', 80, 3, 15, 0, 'weight_loss', 'vegan', 'Indian'],
    ['Fruits', 'evening_snack', 90, 1, 22, 0, 'weight_loss', 'vegan', 'International'],
    ['Lean protein', 'dinner', 160, 25, 0, 5, 'weight_loss', 'nonveg', 'International']
];

async function seedFoods() {
    try {
        for (const food of foods) {
            // check if food exists
            const [existing] = await db.query('SELECT id FROM foods WHERE food_name = ?', [food[0]]);
            if (existing.length === 0) {
                await db.query(
                    'INSERT INTO foods (food_name, category, calories, protein, carbs, fat, diet_type, preference, region) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    food
                );
            }
        }
        console.log('Foods seeded successfully');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedFoods();
