import 'dotenv/config';
import { pool } from './db.js';
import { loadDemoSources } from './demo.js';

await loadDemoSources(null);
const { rows } = await pool.query(
  'SELECT id, name, type, access_label, length(content) AS chars FROM sources ORDER BY id'
);
console.table(rows);
await pool.end();