const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',       
  host: 'localhost',
  database: 'cerberus_db', 
  password: 'cookie', // !! PUT YOUR POSTGRES PASSWORD HERE
  port: 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};