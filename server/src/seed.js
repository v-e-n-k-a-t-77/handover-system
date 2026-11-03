import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const users = [
  { email: 'meera@demo.test', name: 'Meera', role: 'lead' },
  { email: 'aarav@demo.test', name: 'Aarav', role: 'leaver' },
  { email: 'kiran@demo.test', name: 'Kiran', role: 'joiner' },
];

const hash = await bcrypt.hash('Demo@1234', 10);

for (const u of users) {
  await pool.query(
    `INSERT INTO users (email, name, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET name = $2, password_hash = $3, role = $4`,
    [u.email, u.name, hash, u.role]
  );
}

const { rows } = await pool.query('SELECT id, email, name, role FROM users ORDER BY id');
console.table(rows);
await pool.end();