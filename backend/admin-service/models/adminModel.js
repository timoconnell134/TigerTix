const sqlite3 = require('sqlite3').verbose();
/**
 * Creates a new event in the database.
 * 
 * Purpose:
 *  - Inserts a new event with the given name, date, and ticket count into the events table.
 * 
 * Expected Inputs (parameters):
 *  - name (string): Name of the event
 *  - date (string, ISO format recommended): Date of the event
 *  - tickets (integer >= 0): Number of tickets available
 * 
 * Expected Outputs (return values):
 *  - Resolves to an object containing the created event:
 *      { id, name, date, tickets }
 *  - Rejects with an error if insertion fails
 * 
 * Side Effects:
 *  - Adds a new row to the events table in the SQLite database
 */
const DB = '../shared-db/database.sqlite';

exports.createEvent = ({ name, date, tickets }) => new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB);
    const stmt = db.prepare('INSERT INTO events(name, date, tickets) VALUES (?,?,?)');
    stmt.run([name, date, tickets], function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, name, date, tickets });
    });
    stmt.finalize(() => db.close());
});