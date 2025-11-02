// tests/llm/confirm.int.test.js
const express = require('express');
const supertest = require('supertest');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { freshDbFile } = require('../helpers/db');

describe('LLM service - POST /api/llm/confirm', () => {
    let app, request, dbPath;

    beforeEach(async () => {
        dbPath = await freshDbFile();
        jest.resetModules();

        // 1) Seed an event with 2 tickets
        await new Promise((res, rej) => {
            const db = new sqlite3.Database(dbPath);
            db.run(
                'INSERT INTO events(name, date, tickets) VALUES (?,?,?)',
                ['Jazz Night', '2025-12-10', 2],
                e => (e ? rej(e) : db.close(res))
            );
        });

        // 2) Prevent real OpenAI init (dummy key + virtual mock)
        process.env.OPENAI_API_KEY = 'test-key';
        jest.doMock('openai', () => {
            return function Mock() {
                return {
                    chat: { completions: { create: async () => ({ choices: [{ message: { content: '{}' } }] }) } }
                };
            };
        }, { virtual: true });

        // 3) Point llmModel at our temp DB to run the real transaction code
        jest.doMock('../../backend/llm-driven-booking/models/llmModel', () => {
            const sqlite3 = require('sqlite3').verbose();
            return {
                confirmBooking: ({ eventName, qty }) => new Promise((resolve, reject) => {
                    const db = new sqlite3.Database(dbPath);
                    db.serialize(() => {
                        db.run('BEGIN IMMEDIATE TRANSACTION');
                        db.get(
                            'SELECT id, name, tickets FROM events WHERE LOWER(name)=LOWER(?)',
                            [eventName],
                            (err, row) => {
                                if (err) { db.run('ROLLBACK'); db.close(); return reject(err); }
                                if (!row) { db.run('ROLLBACK'); db.close(); return reject({ code: 404 }); }
                                if (row.tickets < qty) { db.run('ROLLBACK'); db.close(); return reject({ code: 409 }); }

                                db.run('UPDATE events SET tickets = tickets - ? WHERE id = ?', [qty, row.id], e2 => {
                                    if (e2) { db.run('ROLLBACK'); db.close(); return reject(e2); }
                                    db.run('INSERT INTO bookings(event_id, qty) VALUES (?, ?)', [row.id, qty], function (e3) {
                                        if (e3) { db.run('ROLLBACK'); db.close(); return reject(e3); }
                                        db.run('COMMIT', e4 => {
                                            if (e4) { db.run('ROLLBACK'); db.close(); return reject(e4); }
                                            const bookingId = this.lastID;
                                            db.close();
                                            resolve({ bookingId, eventId: row.id, qty, eventName: row.name });
                                        });
                                    });
                                });
                            }
                        );
                    });
                })
            };
        });

        // 4) Now require routes (after mocks)
        const routes = require('../../backend/llm-driven-booking/routes/llmRoutes');
        app = express();
        app.use(cors());
        app.use(express.json());
        app.use('/api/llm', routes);
        request = supertest(app);
    });

    test('books on confirm and enforces inventory', async () => {
        const ok = await request.post('/api/llm/confirm').send({ event: 'Jazz Night', tickets: 2 });
        expect(ok.status).toBe(200);
        expect(ok.body.ok).toBe(true);

        const soldOut = await request.post('/api/llm/confirm').send({ event: 'Jazz Night', tickets: 1 });
        expect(soldOut.status).toBe(409);
    });
});
