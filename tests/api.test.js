const request = require('supertest');
const app = require('../server');
const db = require('../db/database');

describe('API Endpoints', () => {
    let token;
    let testUser = {
        full_name: 'API Test User',
        email: 'apitest@example.com',
        password: 'password123'
    };

    beforeAll(async () => {
        // Clean up
        db.prepare('DELETE FROM users WHERE email = ?').run(testUser.email);

        // Register and get token
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);
        token = res.body.token;
    });

    afterAll(() => {
        db.prepare('DELETE FROM users WHERE email = ?').run(testUser.email);
    });

    describe('Schedules', () => {
        it('should generate a schedule', async () => {
            const res = await request(app)
                .post('/api/schedules/generate')
                .set('Authorization', `Bearer ${token}`)
                .send({ date: '2025-01-01' });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('schedule');
            expect(Array.isArray(res.body.schedule)).toBe(true);
        });

        it('should get a schedule', async () => {
            const res = await request(app)
                .get('/api/schedules/2025-01-01')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('schedule_data');
        });
    });

    describe('Meals', () => {
        it('should suggest a meal', async () => {
            const res = await request(app)
                .post('/api/meals/suggest')
                .set('Authorization', `Bearer ${token}`)
                .send({ date: '2025-01-01', meal_type: 'lunch' });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('suggestion');
            expect(res.body.suggestion).toHaveProperty('name');
        });
    });

    describe('Tasks', () => {
        it('should create a task', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: 'Test Task',
                    urgency: 8,
                    importance: 8,
                    deadline: '2025-01-02'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('taskId');
            expect(res.body.eisenhower_quadrant).toBe('Q1'); // High urgency & importance
        });

        it('should get tasks', async () => {
            const res = await request(app)
                .get('/api/tasks')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
        });
    });
});
