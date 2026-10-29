require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');


require('./db/database');


const authRoutes = require('./routes/auth');
const scheduleRoutes = require('./routes/schedules');
const mealRoutes = require('./routes/meals');
const outfitRoutes = require('./routes/outfits');
const taskRoutes = require('./routes/tasks');
const moodRoutes = require('./routes/mood');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, 'public')));


app.use('/api/auth', authRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/outfits', outfitRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/analytics', analyticsRoutes);


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Decision Fatigue API is running' });
});


app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});


if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`
╔═══════════════════════════════════════════════════════╗
║   Decision Fatigue Management App                    ║
║   Server running on http://localhost:${PORT}          ║
║   API available at http://localhost:${PORT}/api       ║
╚═══════════════════════════════════════════════════════╝
        `);
    });
}

module.exports = app;
