import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { loadDemoSources } from '../demo.js';
import { runPipeline } from '../engine/pipeline.js';
import { readiness } from '../engine/readiness.js';

const router = Router();
router.use(requireAuth);

// Who may see which items. Fixed strings, never built from user input.
function visibleWhere(role) {
  if (role === 'lead') return 'TRUE';
  if (role === 'leaver') return "access_label = 'team'";
  return "access_label = 'team' AND review_state IN ('approved','corrected')"; // joiner
}

router.get('/items', async (req, res) => {
  const role = req.user.role;
  const { rows: items } = await pool.query(
    `SELECT id, type, statement, owner, due_date, successor, task_state, status,
            status_reason, access_label, review_state, version
     FROM items WHERE ${visibleWhere(role)} ORDER BY id`
  );

  let evidence = [];
  if (items.length) {
    const r = await pool.query(
      `SELECT e.item_id, e.locator, e.quote, e.verified, s.name AS source
       FROM evidence e JOIN sources s ON s.id = e.source_id
       WHERE e.item_id = ANY($1) AND ($2 OR s.access_label = 'team')
       ORDER BY e.id`,
      [items.map((i) => i.id), role === 'lead']
    );
    evidence = r.rows;
  }

  let restricted = 0;
  if (role !== 'lead') {
    const stateFilter = role === 'joiner' ? "AND review_state IN ('approved','corrected')" : '';
    const r = await pool.query(
      `SELECT count(*)::int AS n FROM items WHERE access_label = 'leads_only' ${stateFilter}`
    );
    restricted = r.rows[0].n;
  }

  const v = await pool.query('SELECT count(*)::int + 1 AS v FROM review_actions');
  const version = v.rows[0].v;
    let underReview = 0;
  if (role === 'joiner') {
    const u = await pool.query(
      "SELECT count(*)::int AS n FROM items WHERE access_label = 'team' AND review_state = 'pending'"
    );
    underReview = u.rows[0].n;
  }
  let acknowledged = false;
  if (role === 'joiner') {
    const a = await pool.query(
      'SELECT 1 FROM acknowledgements WHERE user_id = $1 AND handover_version = $2',
      [req.user.id, version]
    );
    acknowledged = a.rowCount > 0;
  }

  res.json({
    items: items.map((i) => ({ ...i, evidence: evidence.filter((e) => e.item_id === i.id) })),
    restricted, underReview, version, acknowledged,
  });
});

// Lead only: reload the sample project and rebuild all items (this resets reviews)
router.post('/handover/load-demo', requireRole('lead'), async (req, res) => {
  await pool.query('DELETE FROM acknowledgements');
  await loadDemoSources(req.user.id);
  const created = await runPipeline();
  res.json({ created });
});

const reviewSchema = z.object({
  action: z.enum(['approve', 'reject', 'correct']),
  note: z.string().max(500).optional(),
  statement: z.string().min(1).max(500).optional(),
  owner: z.string().max(100).optional(),
  successor: z.string().max(100).optional(),
});

router.post('/items/approve-green', requireRole('lead'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      "SELECT id FROM items WHERE status = 'green' AND review_state = 'pending' ORDER BY id FOR UPDATE"
    );
    for (const r of rows) {
      await client.query("UPDATE items SET review_state = 'approved', version = version + 1 WHERE id = $1", [r.id]);
      await client.query(
        "INSERT INTO review_actions (item_id, reviewer_id, action, note) VALUES ($1,$2,'approve','Bulk approve: green items')",
        [r.id, req.user.id]
      );
    }
    await client.query('COMMIT');
    res.json({ approved: rows.length });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

router.post('/items/:id/review', requireRole('lead'), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = reviewSchema.safeParse(req.body);
  if (!Number.isInteger(id) || !parsed.success) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  const { action, note, statement, owner, successor } = parsed.data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query('SELECT id FROM items WHERE id = $1 FOR UPDATE', [id]);
    if (!found.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Item not found' });
    }
    const state = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'corrected';
    const upd = await client.query(
      `UPDATE items SET review_state = $1, version = version + 1,
              statement = COALESCE($2, statement),
              owner = COALESCE($3, owner),
              successor = COALESCE($4, successor)
       WHERE id = $5 RETURNING *`,
      [state, statement ?? null, owner ?? null, successor ?? null, id]
    );
    await client.query(
      'INSERT INTO review_actions (item_id, reviewer_id, action, note) VALUES ($1,$2,$3,$4)',
      [id, req.user.id, action, note ?? null]
    );
    await client.query('COMMIT');
    res.json({ item: upd.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

router.get('/readiness', requireRole('lead'), async (req, res) => {
  res.json(await readiness());
});

router.post('/handover/acknowledge', requireRole('joiner'), async (req, res) => {
  const v = await pool.query('SELECT count(*)::int + 1 AS v FROM review_actions');
  const version = v.rows[0].v;
  const exists = await pool.query(
    'SELECT 1 FROM acknowledgements WHERE user_id = $1 AND handover_version = $2',
    [req.user.id, version]
  );
  if (!exists.rowCount) {
    await pool.query('INSERT INTO acknowledgements (user_id, handover_version) VALUES ($1,$2)', [req.user.id, version]);
  }
  res.json({ acknowledged: true, version });
});

export default router;