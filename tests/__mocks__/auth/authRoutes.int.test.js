// tests/auth/authRoutes.int.test.js
const supertest = require('supertest');

describe.skip('User auth service - register, login, protected', () => {
    let request;

    beforeAll(() => {
        // Start the auth service once for all tests
        require('././backend/user-auth-service/server.js');
        request = supertest('http://localhost:4000');
    });

    test('registers a new user', async () => {
        const res = await request.post('/api/auth/register').send({
            email: 'test@example.com',
            password: 'secret123'
        });

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/registered/i);
    });

    test('rejects duplicate registration for the same email', async () => {
        await request.post('/api/auth/register').send({
            email: 'dupe@example.com',
            password: 'secret123'
        });

        const res = await request.post('/api/auth/register').send({
            email: 'dupe@example.com',
            password: 'secret123'
        });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/already exists/i);
    });

    test('logs in and allows access to protected route with JWT', async () => {
        const email = 'jwt-user@example.com';
        const password = 'secret123';

        // Register user
        await request.post('/api/auth/register').send({ email, password });

        // Login
        const login = await request.post('/api/auth/login').send({ email, password });
        expect(login.status).toBe(200);
        expect(login.body.token).toBeDefined();

        const token = login.body.token;

        // Use token on protected route
        const protectedRes = await request
            .get('/api/auth/protected')
            .set('Authorization', `Bearer ${token}`);

        expect(protectedRes.status).toBe(200);
        expect(protectedRes.body.user.email).toBe(email);
    });

    test('rejects invalid login', async () => {
        const res = await request.post('/api/auth/login').send({
            email: 'no-such-user@example.com',
            password: 'wrong'
        });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/invalid login/i);
    });
});
