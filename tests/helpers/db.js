const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const SCHEMA = path.join(__dirname, '..', '..', 'backend', 'shared-db', 'init.sql');
const DB_DIR = path.join(__dirname, '..', '..', 'tmp-test-db');

function freshDbFile() {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    const dbPath = path.join(DB_DIR, `db-${Date.now()}-${Math.random()}.sqlite`);
    fs.writeFileSync(dbPath, '');
    const sql = fs.readFileSync(SCHEMA, 'utf-8');
    const db = new sqlite3.Database(dbPath);
    return new Promise((res, rej) => {
        db.exec(sql, (err) => {
            if (err) return rej(err);
            db.close(() => res(dbPath));
        });
    });
}

module.exports = { freshDbFile };
