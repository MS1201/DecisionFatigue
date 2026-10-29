const request = require('supertest');
const app = require('../server'); // Assuming server.js exports app
const db = require('../db/database');

describe('Authentication Endpoints', () => {
    let testUser = {
        full_name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
    };

    // Clean up before running tests
    beforeAll(() => {
        db.prepare('DELETE FROM users WHERE email = ?').run(testUser.email);
    });

    afterAll(() => {
        db.prepare('DELETE FROM users WHERE email = ?').run(testUser.email);
    });

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toHaveProperty('email', testUser.email);
    });

    it('should not register a user with existing email', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(res.statusCode).toEqual(409);
        expect(res.body).toHaveProperty('error');
    });

    it('should login with valid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should not login with invalid password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: 'wrongpassword'
            });

        expect(res.statusCode).toEqual(401);
    });
});
