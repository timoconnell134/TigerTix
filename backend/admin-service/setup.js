const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

module.exports = async () => {
    const db = new sqlite3.Database('../shared-db/database.sqlite');
    const sql = fs.readFileSync('../shared-db/init.sql', 'utf-8');
    await new Promise((res, rej) => db.exec(sql, err => err ? rej(err) : res()));
    db.close();
};