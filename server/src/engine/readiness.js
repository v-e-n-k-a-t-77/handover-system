import { pool } from '../db.js';

export async function readiness() {
  const { rows: items } = await pool.query(
    'SELECT id, type, status, review_state, task_state, successor FROM items'
  );
  const total = items.length;
  const green = items.filter((i) => i.status === 'green').length;
  const gaps = items.filter((i) => i.status !== 'green');
  const gapsClosed = gaps.filter((i) => ['approved', 'corrected'].includes(i.review_state)).length;
  const openTasks = items.filter((i) => i.type === 'task' && i.task_state !== 'done');
  const withSuccessor = openTasks.filter((i) => i.successor).length;
  const reviewed = items.filter((i) => i.review_state !== 'pending').length;

  const E = total ? green / total : 0;                       // evidence strength
  const G = gaps.length ? gapsClosed / gaps.length : 1;      // gaps closed
  const O = openTasks.length ? withSuccessor / openTasks.length : 1; // ownership named
  const R = total ? reviewed / total : 0;                    // items reviewed
  const score = Math.round(100 * (0.35 * E + 0.25 * G + 0.2 * O + 0.2 * R));

  // Knowledge held only by the leaver: every quote is a chat message sent by the leaver
  const { rows: lv } = await pool.query("SELECT name FROM users WHERE role='leaver' LIMIT 1");
  const leaver = lv[0]?.name || '';
  const { rows: only } = await pool.query(
    `SELECT i.id FROM items i
     WHERE EXISTS (SELECT 1 FROM evidence e WHERE e.item_id = i.id)
       AND NOT EXISTS (SELECT 1 FROM evidence e WHERE e.item_id = i.id
                       AND e.locator NOT LIKE '%(' || $1 || ',%')`,
    [leaver]
  );

  const pct = (x) => Math.round(x * 100);
  return {
    score,
    components: { evidence: pct(E), gapsClosed: pct(G), ownership: pct(O), reviewed: pct(R) },
    counts: {
      total, green,
      amber: items.filter((i) => i.status === 'amber').length,
      red: items.filter((i) => i.status === 'red').length,
    },
    gapsOpen: gaps.length - gapsClosed,
    openTasks: openTasks.length,
    heldOnlyByLeaver: only.length,
  };
}