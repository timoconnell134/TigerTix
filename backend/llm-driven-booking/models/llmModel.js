const sqlite3 = require('sqlite3').verbose();
const DB = '../shared-db/database.sqlite';

exports.confirmBooking = ({ eventName, qty }) => new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB);
    db.serialize(() => {
        db.run('BEGIN IMMEDIATE TRANSACTION');
        db.get(
            'SELECT id, name, tickets FROM events WHERE LOWER(name) = LOWER(?)',
            [eventName],
            (err, row) => {
                if (err) { db.run('ROLLBACK'); db.close(); return reject(err); }
                if (!row) { db.run('ROLLBACK'); db.close(); return reject({ code: 404 }); }
                if (row.tickets < qty) { db.run('ROLLBACK'); db.close(); return reject({ code: 409 }); }

                db.run('UPDATE events SET tickets = tickets - ? WHERE id = ?', [qty, row.id], (e2) => {
                    if (e2) { db.run('ROLLBACK'); db.close(); return reject(e2); }

                    db.run('INSERT INTO bookings(event_id, qty) VALUES (?, ?)', [row.id, qty], function (e3) {
                        if (e3) { db.run('ROLLBACK'); db.close(); return reject(e3); }

                        db.run('COMMIT', (e4) => {
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
});
