const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db/database');

const router = express.Router();


const registerValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('full_name').trim().notEmpty()
];

const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
];


router.post('/register', registerValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, full_name } = req.body;

    try {

        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' });
        }


        const password_hash = await bcrypt.hash(password, 10);


        const result = db.prepare(
            'INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)'
        ).run(email, password_hash, full_name);

        const userId = result.lastInsertRowid;


        db.prepare(
            'INSERT INTO user_preferences (user_id) VALUES (?)'
        ).run(userId);

        // Generate JWT token
        const token = jwt.sign(
            { userId, email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: userId, email, full_name }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});


router.post('/login', loginValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {

        const user = db.prepare(
            'SELECT id, email, password_hash, full_name FROM users WHERE email = ?'
        ).get(email);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }


        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, email: user.email, full_name: user.full_name }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});


router.get('/profile', require('../middleware/auth').authenticateToken, (req, res) => {
    try {
        const user = db.prepare(
            'SELECT id, email, full_name, created_at FROM users WHERE id = ?'
        ).get(req.user.userId);

        const preferences = db.prepare(
            'SELECT * FROM user_preferences WHERE user_id = ?'
        ).get(req.user.userId);

        res.json({ user, preferences });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});


router.put('/preferences', require('../middleware/auth').authenticateToken, (req, res) => {
    const { diet_type, daily_calories, budget_level, cooking_time_preference,
        work_start_time, work_end_time, sleep_goal_hours, energy_peak_time } = req.body;

    try {
        db.prepare(`
            UPDATE user_preferences 
            SET diet_type = COALESCE(?, diet_type),
                daily_calories = COALESCE(?, daily_calories),
                budget_level = COALESCE(?, budget_level),
                cooking_time_preference = COALESCE(?, cooking_time_preference),
                work_start_time = COALESCE(?, work_start_time),
                work_end_time = COALESCE(?, work_end_time),
                sleep_goal_hours = COALESCE(?, sleep_goal_hours),
                energy_peak_time = COALESCE(?, energy_peak_time),
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `).run(diet_type, daily_calories, budget_level, cooking_time_preference,
            work_start_time, work_end_time, sleep_goal_hours, energy_peak_time,
            req.user.userId);

        res.json({ message: 'Preferences updated successfully' });
    } catch (error) {
        console.error('Preferences update error:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

module.exports = router;
