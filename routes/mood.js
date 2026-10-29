const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Mood label mapping from numeric score
const moodLabels = {
    1: 'terrible', 2: 'bad', 3: 'bad', 4: 'okay', 5: 'okay',
    6: 'good', 7: 'good', 8: 'great', 9: 'great', 10: 'great'
};

router.post('/', (req, res) => {
    // Accept both mood (text) and mood_score (numeric) from frontend
    const { date, time, mood, mood_score, energy_level, notes } = req.body;

    // If mood_score is provided (numeric from slider/emoji), map it to text
    let moodText = mood;
    if (mood_score !== undefined && mood_score !== null) {
        const score = parseInt(mood_score);
        moodText = moodLabels[score] || 'okay';
    }

    // Fall back to 'okay' if nothing provided
    if (!moodText) moodText = 'okay';

    try {
        db.prepare(`
            INSERT INTO mood_logs (user_id, date, time, mood, energy_level, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(req.user.userId, date, time, moodText, energy_level, notes);

        res.json({ message: 'Mood logged successfully' });
    } catch (error) {
        console.error('Mood log error:', error);
        res.status(500).json({ error: 'Failed to log mood' });
    }
});


router.get('/', (req, res) => {
    const { start_date, end_date } = req.query;

    try {
        let query = 'SELECT * FROM mood_logs WHERE user_id = ?';
        const params = [req.user.userId];

        if (start_date && end_date) {
            query += ' AND date >= ? AND date <= ?';
            params.push(start_date, end_date);
        }

        query += ' ORDER BY date DESC, time DESC';

        const logs = db.prepare(query).all(...params);
        res.json(logs);
    } catch (error) {
        console.error('Mood fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch mood logs' });
    }
});


router.get('/analytics', (req, res) => {
    const { days = 7 } = req.query;

    try {
        const logs = db.prepare(`
            SELECT mood, energy_level, date
            FROM mood_logs
            WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
            ORDER BY date DESC
        `).all(req.user.userId, days);


        const moodMapping = { terrible: 1, bad: 2, okay: 3, good: 4, great: 5 };
        const moodScores = logs.map(l => moodMapping[l.mood] || 3);
        const energyScores = logs.map(l => l.energy_level);

        const avgMood = moodScores.length ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length : 0;
        const avgEnergy = energyScores.length ? energyScores.reduce((a, b) => a + b, 0) / energyScores.length : 0;


        const byDate = {};
        logs.forEach(log => {
            if (!byDate[log.date]) {
                byDate[log.date] = { mood: [], energy: [] };
            }
            byDate[log.date].mood.push(moodMapping[log.mood] || 3);
            byDate[log.date].energy.push(log.energy_level);
        });

        const chartData = Object.keys(byDate).sort().map(date => ({
            date,
            avgMood: byDate[date].mood.reduce((a, b) => a + b, 0) / byDate[date].mood.length,
            avgEnergy: byDate[date].energy.reduce((a, b) => a + b, 0) / byDate[date].energy.length
        }));

        res.json({
            averageMood: Math.round(avgMood * 10) / 10,
            averageEnergy: Math.round(avgEnergy * 10) / 10,
            avg_mood: Math.round(avgMood * 10) / 10,
            avg_energy: Math.round(avgEnergy * 10) / 10,
            totalLogs: logs.length,
            chartData
        });
    } catch (error) {
        console.error('Mood analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

module.exports = router;
