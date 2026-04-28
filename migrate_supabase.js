const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  user: 'postgres.vvjkpfyleoiamuxhbyyy',
  host: 'aws-0-eu-west-1.pooler.supabase.com',
  database: 'postgres',
  password: 'Groenendaeler1!',
  port: 6543,
  ssl: { rejectUnauthorized: false }
});

const sqlFile = './database/12-week-schedule.sql'; 
const sql = fs.readFileSync(sqlFile, 'utf8');

pool.query(sql)
  .then(() => {
    console.log('✅ 12-week schedule successfully loaded to Supabase!');
    return pool.query('SELECT day_of_week, workout_type FROM training_schedules WHERE user_id = 1 ORDER BY CASE day_of_week WHEN \'monday\' THEN 1 WHEN \'tuesday\' THEN 2 WHEN \'wednesday\' THEN 3 WHEN \'thursday\' THEN 4 WHEN \'friday\' THEN 5 WHEN \'saturday\' THEN 6 WHEN \'sunday\' THEN 7 END');
  })
  .then(res => {
    console.log('\n📅 Schedule loaded:');
    res.rows.forEach(row => {
      console.log(`  ${row.day_of_week}: ${row.workout_type}`);
    });
    pool.end();
  })
  .catch(err => {
    console.error('❌ Migration failed:', err.message);
    pool.end();
    process.exit(1);
  });
