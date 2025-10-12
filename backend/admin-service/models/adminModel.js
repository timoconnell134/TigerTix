const sqlite3 = require('sqlite3').verbose();
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