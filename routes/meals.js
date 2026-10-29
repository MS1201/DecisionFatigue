const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);


const mealDatabase = {
    breakfast: {
        balanced: [
            { name: 'Poha with Peanuts', calories: 300, prep_time: 15, ingredients: ['flattened rice', 'peanuts', 'onion', 'mustard seeds', 'turmeric'], instructions: 'Wash poha, sauté veggies and spices, component mix.' },
            { name: 'Vegetable Upma', calories: 280, prep_time: 20, ingredients: ['semolina', 'carrots', 'peas', 'mustard seeds', 'curry leaves'], instructions: 'Roast rava, cook veggies, component mix with water.' },
            { name: 'Multigrain Paratha & Curd', calories: 350, prep_time: 20, ingredients: ['wheat flour', 'chickpea flour', 'spices', 'curd'], instructions: 'Knead dough, roll paratha, cook with ghee.' },
        ],
        vegan: [
            { name: 'Besan Chilla (Gram Flour Pancake)', calories: 250, prep_time: 15, ingredients: ['gram flour', 'onion', 'tomato', 'spices'], instructions: 'Make batter, pour on pan, cook both sides.' },
            { name: 'Idli with Sambar', calories: 200, prep_time: 20, ingredients: ['idli batter', 'lentils', 'vegetables', 'tamarind'], instructions: 'Steam idlis, make sambar with veggies.' },
        ],
        keto: [
            { name: 'Paneer Bhurji', calories: 400, prep_time: 15, ingredients: ['paneer', 'onion', 'tomato', 'spices', 'butter'], instructions: 'Sauté veggies, add crumbled paneer and spices.' },
            { name: 'Boiled Egg Chaat', calories: 300, prep_time: 10, ingredients: ['eggs', 'onion', 'tomato', 'chaat masala'], instructions: 'Boil eggs, chop, component mix with veggies and spices.' },
        ]
    },
    lunch: {
        balanced: [
            { name: 'Roti, Dal Tadka & Sabzi', calories: 450, prep_time: 30, ingredients: ['wheat flour', 'toor dal', 'seasonal vegetables', 'spices'], instructions: 'Make roti, cook dal and sabzi.' },
            { name: 'Rajma Chawal', calories: 500, prep_time: 40, ingredients: ['kidney beans', 'rice', 'onion', 'tomato', 'spices'], instructions: 'Pressure cook rajma, make gravy, serve with rice.' },
            { name: 'Chicken Curry & Rice', calories: 550, prep_time: 40, ingredients: ['chicken', 'onion', 'tomato', 'ginger garlic paste', 'rice'], instructions: 'Cook chicken curry, serve with steamed rice.' },
        ],
        vegan: [
            { name: 'Chana Masala & Brown Rice', calories: 480, prep_time: 35, ingredients: ['chickpeas', 'onion', 'tomato', 'brown rice', 'spices'], instructions: 'Cook chickpeas in gravy, serve with brown rice.' },
            { name: 'Aloo Gobi & Roti', calories: 400, prep_time: 30, ingredients: ['potato', 'cauliflower', 'wheat flour', 'spices'], instructions: 'Sauté aloo gobi, serve with roti.' },
        ],
        keto: [
            { name: 'Palak Paneer (No Rice)', calories: 500, prep_time: 30, ingredients: ['spinach', 'paneer', 'cream', 'spices'], instructions: 'Blanch spinach, puree, cook with paneer.' },
            { name: 'Cauliflower Rice Biryani', calories: 350, prep_time: 25, ingredients: ['cauliflower', 'vegetables', 'whole spices', 'ghee'], instructions: 'Sauté spices and veggies, add grated cauliflower.' },
        ]
    },
    dinner: {
        balanced: [
            { name: 'Moong Dal Khichdi', calories: 350, prep_time: 25, ingredients: ['rice', 'moong dal', 'ghee', 'cumin'], instructions: 'Pressure cook rice and dal with turmeric and salt.' },
            { name: 'Roti & Bhindi Masala', calories: 380, prep_time: 25, ingredients: ['wheat flour', 'okra', 'onion', 'spices'], instructions: 'Stir fry okra, serve with roti.' },
            { name: 'Egg Curry & Rice', calories: 450, prep_time: 30, ingredients: ['eggs', 'onion', 'tomato', 'coconut milk', 'rice'], instructions: 'Make egg curry, serve with rice.' },
        ],
        vegan: [
            { name: 'Mixed Vegetable Curry & Roti', calories: 400, prep_time: 30, ingredients: ['seasonal vegetables', 'coconut milk', 'wheat flour'], instructions: 'Cook veggies in coconut curry, serve with roti.' },
            { name: 'Dal Fry & Jeera Rice', calories: 420, prep_time: 30, ingredients: ['toor dal', 'rice', 'cumin', 'ghee replacement'], instructions: 'Cook dal, temper with spices, serve with jeera rice.' },
        ],
        keto: [
            { name: 'Grilled Fish with Veggies', calories: 500, prep_time: 25, ingredients: ['fish fillet', 'lemon', 'pepper', 'seasonal veggies'], instructions: 'Marinate fish, grill, serve with sautéed veggies.' },
            { name: 'Egg Bhurji & Salad', calories: 400, prep_time: 15, ingredients: ['eggs', 'onion', 'tomato', 'cucumber', 'lettuce'], instructions: 'Scramble eggs with spices, serve with fresh salad.' },
        ]
    },
    snack: [
        { name: 'Roasted Makhana', calories: 150, prep_time: 5, ingredients: ['lotus seeds', 'ghee', 'rock salt', 'pepper'] },
        { name: 'Masala Chai & Biscuits', calories: 180, prep_time: 10, ingredients: ['milk', 'tea leaves', 'sugar', 'digestive biscuits'] },
        { name: 'Fruit Chaat', calories: 120, prep_time: 10, ingredients: ['seasonal fruits', 'chaat masala', 'lemon juice'] },
        { name: 'Sprouts Salad', calories: 160, prep_time: 10, ingredients: ['sprouted moong', 'onion', 'tomato', 'lemon'] },
        { name: 'Bhel Puri (Dry)', calories: 200, prep_time: 10, ingredients: ['puffed rice', 'sev', 'onion', 'chutney'] },
    ]
};


router.post('/suggest', (req, res) => {
    const { date, meal_type } = req.body;
    const userId = req.user.userId;

    try {

        const prefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(userId);
        const dietType = prefs.diet_type || 'balanced';

        let suggestions = [];
        if (meal_type === 'snack') {
            suggestions = mealDatabase.snack;
        } else {
            suggestions = mealDatabase[meal_type]?.[dietType] || mealDatabase[meal_type]?.balanced || [];
        }


        if (prefs.cooking_time_preference === 'short') {
            suggestions = suggestions.filter(m => m.prep_time <= 15);
        } else if (prefs.cooking_time_preference === 'medium') {
            suggestions = suggestions.filter(m => m.prep_time <= 30);
        }


        const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

        res.json({ suggestion, meal_type, date });
    } catch (error) {
        console.error('Meal suggestion error:', error);
        res.status(500).json({ error: 'Failed to generate meal suggestion' });
    }
});


router.post('/save', (req, res) => {
    const { date, meal_type, meal_name, recipe, calories, is_autopilot } = req.body;

    try {
        db.prepare(`
            INSERT INTO meals (user_id, date, meal_type, meal_name, recipe, calories, is_autopilot)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(req.user.userId, date, meal_type, meal_name, JSON.stringify(recipe), calories, is_autopilot || 0);

        res.json({ message: 'Meal saved successfully' });
    } catch (error) {
        console.error('Meal save error:', error);
        res.status(500).json({ error: 'Failed to save meal' });
    }
});


router.get('/:date', (req, res) => {
    try {
        const meals = db.prepare(`
            SELECT * FROM meals WHERE user_id = ? AND date = ?
        `).all(req.user.userId, req.params.date);

        meals.forEach(meal => {
            if (meal.recipe) meal.recipe = JSON.parse(meal.recipe);
        });

        res.json(meals);
    } catch (error) {
        console.error('Meal fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch meals' });
    }
});


router.post('/grocery-list', (req, res) => {
    const { week_start_date } = req.body;

    try {

        const meals = db.prepare(`
            SELECT * FROM meals 
            WHERE user_id = ? AND date >= date(?) AND date < date(?, '+7 days')
        `).all(req.user.userId, week_start_date, week_start_date);


        const ingredients = {};
        meals.forEach(meal => {
            if (meal.recipe) {
                const recipe = JSON.parse(meal.recipe);
                recipe.ingredients?.forEach(ing => {
                    ingredients[ing] = (ingredients[ing] || 0) + 1;
                });
            }
        });

        const groceryList = Object.keys(ingredients).map(item => ({
            item,
            quantity: ingredients[item],
            category: categorizeIngredient(item)
        }));


        db.prepare(`
            INSERT OR REPLACE INTO grocery_lists (user_id, week_start_date, items)
            VALUES (?, ?, ?)
        `).run(req.user.userId, week_start_date, JSON.stringify(groceryList));

        res.json({ groceryList, week_start_date });
    } catch (error) {
        console.error('Grocery list error:', error);
        res.status(500).json({ error: 'Failed to generate grocery list' });
    }
});

function categorizeIngredient(item) {
    const categories = {
        produce: ['lettuce', 'tomato', 'cucumber', 'spinach', 'broccoli', 'carrots', 'veggies', 'vegetables', 'fruits', 'berries', 'banana', 'apple', 'avocado', 'lemon', 'asparagus', 'cauliflower', 'zucchini', 'green beans'],
        protein: ['chicken', 'turkey', 'salmon', 'steak', 'eggs', 'tofu', 'bacon', 'pork chops', 'ground beef'],
        dairy: ['milk', 'cheese', 'greek yogurt', 'butter', 'parmesan'],
        grains: ['oats', 'bread', 'quinoa', 'rice', 'pasta', 'tortilla', 'pita'],
        pantry: ['olive oil', 'soy sauce', 'honey', 'maple syrup', 'tahini', 'marinara', 'curry paste'],
        other: []
    };

    for (const [category, items] of Object.entries(categories)) {
        if (items.some(i => item.toLowerCase().includes(i))) {
            return category;
        }
    }
    return 'other';
}

module.exports = router;
