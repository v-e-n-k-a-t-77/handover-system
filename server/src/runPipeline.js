import 'dotenv/config';
import { pool } from './db.js';
import { runPipeline } from './engine/pipeline.js';

const n = await runPipeline();
console.log(`Created ${n} items`);

const { rows } = await pool.query(`
  SELECT i.id, i.type, i.status, i.access_label AS label, left(i.statement, 38) AS statement, i.owner,
         (SELECT count(*) FROM evidence e WHERE e.item_id = i.id AND e.verified) AS quotes
  FROM items i ORDER BY i.id`);
console.table(rows);

const gaps = await pool.query(
  "SELECT id, status, status_reason FROM items WHERE status <> 'green' ORDER BY id"
);
console.table(gaps.rows);
await pool.end();