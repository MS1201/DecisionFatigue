const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);


router.post('/', (req, res) => {
    const { title, description, deadline, urgency, importance } = req.body;

    try {

        const { priority_score, eisenhower_quadrant } = calculatePriority(urgency, importance, deadline);

        const result = db.prepare(`
            INSERT INTO tasks (user_id, title, description, deadline, urgency, importance, priority_score, eisenhower_quadrant)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(req.user.userId, title, description, deadline, urgency, importance, priority_score, eisenhower_quadrant);

        res.json({ message: 'Task created', taskId: result.lastInsertRowid, priority_score, eisenhower_quadrant });
    } catch (error) {
        console.error('Task creation error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});


router.get('/', (req, res) => {
    const { status } = req.query;

    try {
        let query = 'SELECT * FROM tasks WHERE user_id = ?';
        const params = [req.user.userId];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY priority_score DESC, deadline ASC';

        const tasks = db.prepare(query).all(...params);
        res.json(tasks);
    } catch (error) {
        console.error('Task fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});


router.get('/top-priorities', (req, res) => {
    try {
        const tasks = db.prepare(`
            SELECT * FROM tasks 
            WHERE user_id = ? AND status = 'pending'
            ORDER BY priority_score DESC
            LIMIT 3
        `).all(req.user.userId);

        res.json(tasks);
    } catch (error) {
        console.error('Priority tasks fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch priority tasks' });
    }
});


router.put('/:id', (req, res) => {
    const { title, description, deadline, urgency, importance, status } = req.body;

    try {
        let priority_score, eisenhower_quadrant;

        if (urgency !== undefined || importance !== undefined || deadline !== undefined) {

            const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.userId);
            const result = calculatePriority(
                urgency ?? task.urgency,
                importance ?? task.importance,
                deadline ?? task.deadline
            );
            priority_score = result.priority_score;
            eisenhower_quadrant = result.eisenhower_quadrant;
        }

        db.prepare(`
            UPDATE tasks 
            SET title = COALESCE(?, title),
                description = COALESCE(?, description),
                deadline = COALESCE(?, deadline),
                urgency = COALESCE(?, urgency),
                importance = COALESCE(?, importance),
                status = COALESCE(?, status),
                priority_score = COALESCE(?, priority_score),
                eisenhower_quadrant = COALESCE(?, eisenhower_quadrant),
                completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
        `).run(title, description, deadline, urgency, importance, status,
            priority_score, eisenhower_quadrant, status, req.params.id, req.user.userId);

        res.json({ message: 'Task updated' });
    } catch (error) {
        console.error('Task update error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});


router.delete('/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.user.userId);
        res.json({ message: 'Task deleted' });
    } catch (error) {
        console.error('Task delete error:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});


function calculatePriority(urgency, importance, deadline) {

    const normalizedUrgency = Math.max(1, Math.min(10, urgency || 5));
    const normalizedImportance = Math.max(1, Math.min(10, importance || 5));


    let priority_score = normalizedUrgency * normalizedImportance;


    if (deadline) {
        const daysUntilDeadline = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));

        if (daysUntilDeadline < 0) {
            priority_score *= 1.5;
        } else if (daysUntilDeadline <= 1) {
            priority_score *= 1.4;
        } else if (daysUntilDeadline <= 3) {
            priority_score *= 1.3;
        } else if (daysUntilDeadline <= 7) {
            priority_score *= 1.1;
        }
    }


    let eisenhower_quadrant;
    if (normalizedUrgency >= 6 && normalizedImportance >= 6) {
        eisenhower_quadrant = 'Q1';
    } else if (normalizedUrgency < 6 && normalizedImportance >= 6) {
        eisenhower_quadrant = 'Q2';
    } else if (normalizedUrgency >= 6 && normalizedImportance < 6) {
        eisenhower_quadrant = 'Q3';
    } else {
        eisenhower_quadrant = 'Q4';
    }

    return { priority_score: Math.round(priority_score * 10) / 10, eisenhower_quadrant };
}

module.exports = router;
