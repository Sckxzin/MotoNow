const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 5
});

db.query("SELECT 1", err => {
  if (err) console.error("❌ Erro banco:", err);
  else console.log("✅ Banco conectado");
});

module.exports = db;
