const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: 'kimberlysegers',
  host: 'localhost',
  database: 'sports_tracker',
  password: undefined, // Trying common password
  port: 5432,
});

const sqlFile = '/Users/kimberlysegers/Sport app/database/12-week-schedule.sql';
const sql = fs.readFileSync(sqlFile, 'utf8');

pool.query(sql, (err, res) => {
  if (err) {
    console.error('Migration failed:', err.message);
  } else {
    console.log('Migration successful');
  }
  pool.end();
});
