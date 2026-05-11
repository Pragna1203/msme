const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'users.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT
        )`, (err) => {
            if (err) {
                console.error('Error creating table', err.message);
            } else {
                db.run(`ALTER TABLE users ADD COLUMN resetToken TEXT`, (err) => {});
                db.run(`ALTER TABLE users ADD COLUMN resetTokenExpiry DATETIME`, (err) => {});
            }
        });
    }
});

module.exports = db;
