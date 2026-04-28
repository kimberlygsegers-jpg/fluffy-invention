const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Database connection pool
// Support both DATABASE_URL (production) and individual params (local development)
console.log('🔍 DATABASE CONFIG:');
console.log('  DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  Using DATABASE_URL:', !!process.env.DATABASE_URL);

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        // Use Supabase connection pooler (port 6543) for better serverless compatibility
        user: 'postgres',
        host: 'db.vvjkpfyleoiamuxhbyyy.supabase.co',
        database: 'postgres',
        password: 'Groenendaeler1!',
        port: 6543,
        ssl: { rejectUnauthorized: false }
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
      }
);

// Test connection on startup
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.error('❌ Database connection failed:', err.message));

module.exports = { pool };
