import 'dotenv/config';
import fs from 'node:fs';
import { pool } from './db.js';

const sql = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
await pool.query(sql);

const { rows } = await pool.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
);
console.log('Tables:', rows.map((r) => r.table_name).join(', '));
await pool.end();