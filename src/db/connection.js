const { Pool } = require('pg');

// fixed — credentials from environment variables
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'taskflow'
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.log('Unexpected database error', err);
});
//Bug 4 — Commented-out dead code in connection.js
//there's a commented-out helper function for querying the database that isn't used anywhere. It's best to remove it to keep the code clean and avoid confusion.



module.exports = pool;
