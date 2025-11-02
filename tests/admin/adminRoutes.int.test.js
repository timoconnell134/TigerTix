const express = require('express');
const supertest = require('supertest');
const cors = require('cors');
const { freshDbFile } = require('../helpers/db');

describe('Admin service - POST /api/admin/events', () => {
    let app, request;

    beforeEach(async () => {
        const dbPath = await freshDbFile();
        jest.resetModules();

        // mock model to point at our fresh DB
        jest.doMock('../../backend/admin-service/models/adminModel', () => {
            const sqlite3 = require('sqlite3').verbose();
            return {
                createEvent: ({ name, date, tickets }) => new Promise((resolve, reject) => {
                    const db = new sqlite3.Database(dbPath);
                    const stmt = db.prepare('INSERT INTO events(name, date, tickets) VALUES (?,?,?)');
                    stmt.run([name, date, tickets], function (err) {
                        if (err) reject(err); else resolve({ id: this.lastID, name, date, tickets });
                    });
                    stmt.finalize(() => db.close());
                })
            };
        });

        const routes = require('../../backend/admin-service/routes/adminRoutes');
        app = express();
        app.use(cors());
        app.use(express.json());
        app.use('/api/admin', routes);
        request = supertest(app);
    });

    test('creates an event with valid payload', async () => {
        const res = await request.post('/api/admin/events').send({
            name: 'Jazz Night', date: '2025-12-10', tickets: 25
        });
        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
        expect(res.body).toMatchObject({ name: 'Jazz Night', date: '2025-12-10', tickets: 25 });
    });

    test('rejects invalid date format', async () => {
        const res = await request.post('/api/admin/events').send({
            name: 'Bad Date', date: '12-10-2025', tickets: 10
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid input');
    });
});
