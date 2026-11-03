import { pool } from '../db.js';
import { extractRules } from './extractRules.js';
import { gradeItem } from './verify.js';

export async function runPipeline() {
  const { rows: sources } = await pool.query(
    'SELECT id, name, type, access_label, content FROM sources ORDER BY id'
  );
  const byId = new Map(sources.map((s) => [s.id, s]));
  const graded = extractRules(sources).map((c) => gradeItem(c, byId));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM items'); // evidence is deleted with it
    for (const it of graded) {
      const { rows } = await client.query(
        `INSERT INTO items (type, statement, owner, due_date, task_state, status, status_reason, access_label)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [it.type, it.statement, it.owner, it.due_date, it.task_state, it.status, it.status_reason, it.access_label]
      );
      for (const e of it.evidences) {
        await client.query(
          `INSERT INTO evidence (item_id, source_id, locator, quote, verified, kind)
           VALUES ($1,$2,$3,$4,$5,'document')`,
          [rows[0].id, e.sourceId, e.locator, e.quote, e.verified]
        );
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return graded.length;
}