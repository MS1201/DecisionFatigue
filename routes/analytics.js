const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);


router.get('/', (req, res) => {
    const { days = 30 } = req.query;
    const userId = req.user.userId;

    try {

        const decisionStats = db.prepare(`
            SELECT 
                SUM(decisions_automated) as total_decisions_automated,
                SUM(tasks_completed) as total_tasks_completed,
                AVG(schedule_adherence) as avg_schedule_adherence,
                AVG(mood_average) as avg_mood,
                AVG(energy_average) as avg_energy
            FROM decision_stats
            WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
        `).get(userId, days);


        const taskTrend = db.prepare(`
            SELECT date, tasks_completed
            FROM decision_stats
            WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
            ORDER BY date
        `).all(userId, days);


        const autopilotUsage = db.prepare(`
            SELECT 
                COUNT(CASE WHEN is_autopilot = 1 THEN 1 END) as autopilot_count,
                COUNT(*) as total_count
            FROM (
                SELECT is_autopilot FROM schedules WHERE user_id = ?
                UNION ALL
                SELECT is_autopilot FROM meals WHERE user_id = ?
                UNION ALL
                SELECT is_autopilot FROM outfits WHERE user_id = ?
            )
        `).get(userId, userId, userId);


        const habitConsistency = calculateHabitConsistency(userId, days);


        const productivityScore = calculateProductivityScore(userId, days);

        res.json({
            decisionStats: decisionStats || {},
            taskTrend,
            autopilotUsage: {
                percentage: Math.round((autopilotUsage.autopilot_count / autopilotUsage.total_count) * 100) || 0,
                count: autopilotUsage.autopilot_count || 0
            },
            habitConsistency,
            productivityScore
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});


router.post('/update-stats', (req, res) => {
    const { date } = req.body;
    const userId = req.user.userId;

    try {

        const automatedDecisions = db.prepare(`
            SELECT COUNT(*) as count FROM (
                SELECT 1 FROM schedules WHERE user_id = ? AND date = ? AND is_autopilot = 1
                UNION ALL
                SELECT 1 FROM meals WHERE user_id = ? AND date = ? AND is_autopilot = 1
                UNION ALL
                SELECT 1 FROM outfits WHERE user_id = ? AND date = ? AND is_autopilot = 1
            )
        `).get(userId, date, userId, date, userId, date);


        const completedTasks = db.prepare(`
            SELECT COUNT(*) as count FROM tasks
            WHERE user_id = ? AND DATE(completed_at) = ? AND status = 'completed'
        `).get(userId, date);


        const moodMapping = { terrible: 1, bad: 2, okay: 3, good: 4, great: 5 };
        const moodLogs = db.prepare(`
            SELECT mood, energy_level FROM mood_logs
            WHERE user_id = ? AND date = ?
        `).all(userId, date);

        const avgMood = moodLogs.length > 0
            ? moodLogs.reduce((sum, log) => sum + (moodMapping[log.mood] || 3), 0) / moodLogs.length
            : 0;

        const avgEnergy = moodLogs.length > 0
            ? moodLogs.reduce((sum, log) => sum + log.energy_level, 0) / moodLogs.length
            : 0;


        const scheduleAdherence = 85;


        db.prepare(`
            INSERT OR REPLACE INTO decision_stats 
            (user_id, date, decisions_automated, tasks_completed, schedule_adherence, mood_average, energy_average)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(userId, date, automatedDecisions.count, completedTasks.count, scheduleAdherence, avgMood, avgEnergy);

        res.json({ message: 'Stats updated successfully' });
    } catch (error) {
        console.error('Stats update error:', error);
        res.status(500).json({ error: 'Failed to update stats' });
    }
});

function calculateHabitConsistency(userId, days) {

    const scheduleCount = db.prepare(`
        SELECT COUNT(*) as count FROM schedules
        WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
    `).get(userId, days);

    const mealCount = db.prepare(`
        SELECT COUNT(DISTINCT date) as count FROM meals
        WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
    `).get(userId, days);

    const moodCount = db.prepare(`
        SELECT COUNT(DISTINCT date) as count FROM mood_logs
        WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
    `).get(userId, days);

    return {
        schedules: Math.round((scheduleCount.count / days) * 100),
        meals: Math.round((mealCount.count / days) * 100),
        moodTracking: Math.round((moodCount.count / days) * 100)
    };
}

function calculateProductivityScore(userId, days) {

    const stats = db.prepare(`
        SELECT 
            AVG(tasks_completed) as avg_tasks,
            AVG(schedule_adherence) as avg_adherence,
            AVG(energy_average) as avg_energy
        FROM decision_stats
        WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
    `).get(userId, days);

    if (!stats || !stats.avg_tasks) {
        return 0;
    }

    // Weighted score: 40% tasks, 30% adherence, 30% energy
    const score = (
        (stats.avg_tasks * 10 * 0.4) +
        (stats.avg_adherence * 0.3) +
        (stats.avg_energy * 10 * 0.3)
    );

    return Math.min(100, Math.round(score));
}

module.exports = router;
