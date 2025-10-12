const sqlite3 = require('sqlite3').verbose();
const DB = '../shared-db/database.sqlite';

/**
 * Fetch all events from the database.
 * 
 * Purpose:
 *  - Retrieves all events with their ID, name, date, and ticket count.
 *  - Orders events by date.
 * 
 * Expected Inputs:
 *  - None
 * 
 * Expected Outputs:
 *  - Promise that resolves to an array of event objects:
 *      [{ id, name, date, tickets }, ...]
 *  - Rejects if a database error occurs.
 * 
 * Side Effects:
 *  - Reads from the shared SQLite database.
 */

exports.getEvents = () => new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB);
    db.all('SELECT id, name, date, tickets FROM events ORDER BY date', (err, rows) => {
        if (err) reject(err); else resolve(rows);
        db.close();
    });
});

/**
 * Purchase a ticket for a specific event safely.
 * 
 * Purpose:
 *  - Atomically decrements the ticket count for a given event.
 *  - Prevents overselling by using an immediate transaction.
 * 
 * Expected Inputs:
 *  - id (Number): Event ID to purchase a ticket for
 * 
 * Expected Outputs:
 *  - Resolves on successful purchase
 *  - Rejects with error object if:
 *      code 404 -> event not found
 *      code 409 -> sold out
 *      other -> database error
 * 
 * Side Effects:
 *  - Updates the ticket count in the shared SQLite database
 */

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
