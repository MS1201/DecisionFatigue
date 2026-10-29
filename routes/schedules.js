const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();


router.use(authenticateToken);


router.post('/generate', (req, res) => {
    const { date, customPreferences } = req.body;
    const userId = req.user.userId;

    try {

        const prefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(userId);


        const schedule = generateSmartSchedule(prefs, customPreferences);


        const scheduleData = JSON.stringify(schedule);
        db.prepare(`
            INSERT OR REPLACE INTO schedules (user_id, date, schedule_data, is_autopilot)
            VALUES (?, ?, ?, ?)
        `).run(userId, date, scheduleData, customPreferences?.autopilot || 0);

        res.json({ schedule, date });
    } catch (error) {
        console.error('Schedule generation error:', error);
        res.status(500).json({ error: 'Failed to generate schedule' });
    }
});


router.get('/:date', (req, res) => {
    try {
        const schedule = db.prepare(`
            SELECT * FROM schedules WHERE user_id = ? AND date = ?
        `).get(req.user.userId, req.params.date);

        if (schedule) {
            schedule.schedule_data = JSON.parse(schedule.schedule_data);
        }

        res.json(schedule || null);
    } catch (error) {
        console.error('Schedule fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch schedule' });
    }
});


router.put('/:date', (req, res) => {
    const { schedule_data } = req.body;

    try {
        db.prepare(`
            UPDATE schedules 
            SET schedule_data = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND date = ?
        `).run(JSON.stringify(schedule_data), req.user.userId, req.params.date);

        res.json({ message: 'Schedule updated successfully' });
    } catch (error) {
        console.error('Schedule update error:', error);
        res.status(500).json({ error: 'Failed to update schedule' });
    }
});


function generateSmartSchedule(preferences, custom = {}) {
    const schedule = [];
    const workStart = preferences.work_start_time || '09:00';
    const workEnd = preferences.work_end_time || '17:00';
    const sleepGoal = preferences.sleep_goal_hours || 8;
    const energyPeak = preferences.energy_peak_time || 'morning';


    const wakeTime = subtractHours(workStart, 2);

    schedule.push({
        time: wakeTime,
        activity: 'Wake Up & Morning Routine',
        duration: 60,
        energy_level: 'medium',
        type: 'personal'
    });

    schedule.push({
        time: addMinutes(wakeTime, 60),
        activity: 'Breakfast',
        duration: 30,
        energy_level: 'medium',
        type: 'meal'
    });

    schedule.push({
        time: addMinutes(wakeTime, 90),
        activity: 'Exercise/Workout',
        duration: 30,
        energy_level: 'high',
        type: 'health'
    });

    schedule.push({
        time: workStart,
        activity: 'Work - Deep Focus Time',
        duration: 120,
        energy_level: energyPeak === 'morning' ? 'high' : 'medium',
        type: 'work'
    });

    schedule.push({
        time: addMinutes(workStart, 120),
        activity: 'Short Break',
        duration: 15,
        energy_level: 'low',
        type: 'break'
    });

    schedule.push({
        time: addMinutes(workStart, 135),
        activity: 'Work - Meetings/Collaboration',
        duration: 90,
        energy_level: 'medium',
        type: 'work'
    });

    schedule.push({
        time: '13:00',
        activity: 'Lunch Break',
        duration: 60,
        energy_level: 'low',
        type: 'meal'
    });

    schedule.push({
        time: '14:00',
        activity: 'Work - Tasks & Projects',
        duration: 180,
        energy_level: energyPeak === 'afternoon' ? 'high' : 'medium',
        type: 'work'
    });

    schedule.push({
        time: workEnd,
        activity: 'End of Workday - Wrap Up',
        duration: 15,
        energy_level: 'low',
        type: 'work'
    });

    schedule.push({
        time: addMinutes(workEnd, 15),
        activity: 'Personal Time / Hobbies',
        duration: 120,
        energy_level: 'medium',
        type: 'personal'
    });

    schedule.push({
        time: '19:00',
        activity: 'Dinner',
        duration: 45,
        energy_level: 'medium',
        type: 'meal'
    });

    schedule.push({
        time: '20:00',
        activity: 'Evening Relaxation',
        duration: 120,
        energy_level: energyPeak === 'evening' ? 'high' : 'low',
        type: 'personal'
    });

    schedule.push({
        time: '22:00',
        activity: 'Sleep Preparation',
        duration: 30,
        energy_level: 'low',
        type: 'personal'
    });

    schedule.push({
        time: '22:30',
        activity: 'Sleep',
        duration: sleepGoal * 60,
        energy_level: 'rest',
        type: 'sleep'
    });

    return schedule;
}


function addMinutes(time, minutes) {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + minutes;
    const newH = Math.floor(totalMinutes / 60) % 24;
    const newM = totalMinutes % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function subtractHours(time, hours) {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m - (hours * 60);
    const newH = Math.floor(totalMinutes / 60) % 24;
    const newM = totalMinutes % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

module.exports = router;
