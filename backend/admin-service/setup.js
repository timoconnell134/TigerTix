const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

/**
 * Initializes the database for the application.
 * 
 * Purpose:
 *  - Reads the SQL schema from `init.sql`.
 *  - Executes the SQL commands to create tables and seed initial data.
 * 
 * Expected Inputs:
 *  - None
 * 
 * Expected Outputs:
 *  - Returns a promise that resolves when the database setup is complete.
 *  - Rejects if there is an error executing the SQL.
 * 
 * Side Effects:
 *  - Creates or resets the SQLite database at '../shared-db/database.sqlite'.
 *  - Runs all SQL commands defined in `init.sql`.
 */
module.exports = async () => {
    const db = new sqlite3.Database('../shared-db/database.sqlite');
    const sql = fs.readFileSync('../shared-db/init.sql', 'utf-8');
    await new Promise((res, rej) => db.exec(sql, err => err ? rej(err) : res()));
    db.close();
};