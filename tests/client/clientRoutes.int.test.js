const express = require('express');
const supertest = require('supertest');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { freshDbFile } = require('../helpers/db');

describe('Client service - list & purchase', () => {
    let app, request, dbPath;

    beforeEach(async () => {
        dbPath = await freshDbFile();
        jest.resetModules();

        // seed an event with 2 tickets
        await new Promise((res, rej) => {
            const db = new sqlite3.Database(dbPath);
            db.run('INSERT INTO events(name, date, tickets) VALUES (?,?,?)',
                ['Jazz Night', '2025-12-10', 2],
                (e) => e ? rej(e) : db.close(res));
        });

        // mock model to use test DB
        jest.doMock('../../backend/client-service/models/clientModel', () => {
            const sqlite3 = require('sqlite3').verbose();
            return {
                getEvents: () => new Promise((resolve, reject) => {
                    const db = new sqlite3.Database(dbPath);
                    db.all('SELECT id, name, date, tickets FROM events ORDER BY date', (err, rows) => {
                        if (err) reject(err); else resolve(rows);
                        db.close();
                    });
                }),
                purchaseTicket: (id) => new Promise((resolve, reject) => {
                    const db = new sqlite3.Database(dbPath);
                    db.serialize(() => {
                        db.run('BEGIN IMMEDIATE TRANSACTION');
                        db.get('SELECT tickets FROM events WHERE id = ?', [id], (err, row) => {
                            if (err) { db.run('ROLLBACK'); db.close(); return reject(err); }
                            if (!row) { db.run('ROLLBACK'); db.close(); return reject({ code: 404 }); }
                            if (row.tickets <= 0) { db.run('ROLLBACK'); db.close(); return reject({ code: 409 }); }
                            db.run('UPDATE events SET tickets = tickets - 1 WHERE id = ?', [id], (e2) => {
                                if (e2) { db.run('ROLLBACK'); db.close(); return reject(e2); }
                                db.run('COMMIT', (e3) => {
                                    if (e3) { db.run('ROLLBACK'); db.close(); return reject(e3); }
                                    db.close(); resolve();
                                });
                            });
                        });
                    });
                })
            };
        });

        const routes = require('../../backend/client-service/routes/clientRoutes');
        app = express(); app.use(cors()); app.use(express.json()); app.use('/api', routes);
        request = supertest(app);
    });

    test('GET /api/events lists events', async () => {
        const res = await request.get('/api/events');
        expect(res.status).toBe(200);
        expect(res.body[0].name).toBe('Jazz Night');
    });

    test('purchase decrements stock; third attempt sold out', async () => {
        const list = await request.get('/api/events');
        const id = list.body[0].id;
        expect((await request.post(`/api/events/${id}/purchase`)).status).toBe(200);
        expect((await request.post(`/api/events/${id}/purchase`)).status).toBe(200);
        expect((await request.post(`/api/events/${id}/purchase`)).status).toBe(409);
    });
});
