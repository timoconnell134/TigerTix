const sqlite3 = require('sqlite3').verbose();
const DB = '../shared-db/database.sqlite';

// List all events (id, name, date, tickets)
exports.getEvents = () => new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB);
    db.all('SELECT id, name, date, tickets FROM events ORDER BY date', (err, rows) => {
        if (err) reject(err); else resolve(rows);
        db.close();
    });
});

// Purchase one ticket atomically (no oversell)
exports.purchaseTicket = (id) => new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB);
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
});
