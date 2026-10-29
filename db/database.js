const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || './db/decisionfatigue.db';
const schemaPath = path.join(__dirname, 'schema.sql');


const db = new Database(dbPath);


db.pragma('foreign_keys = ON');


function initializeDatabase() {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('✅ Database initialized successfully');
}


initializeDatabase();

module.exports = db;
