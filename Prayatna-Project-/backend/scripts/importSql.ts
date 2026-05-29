import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

async function main() {
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  const sqlPath = path.resolve(__dirname, '../sql/LifeLink_full.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
  });

  try {
    await conn.query(sql);
    // eslint-disable-next-line no-console
    console.log(`✅ Imported SQL into MySQL at ${host}:${port}`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ SQL import failed:', err?.message || err);
  process.exit(1);
});


