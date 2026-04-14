// src/lib/db.ts
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',       // Your MySQL Workbench host
  user: 'root',            // Your MySQL username
  password: 'your_password', // Your MySQL password
  database: 'eshop_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;