import fs from 'node:fs';
import { pool } from './db.js';

const dataDir = new URL('../data/', import.meta.url);

const DEMO_SOURCES = [
  { file: 'chat.txt', name: 'Group chat export', type: 'chat', label: 'team' },
  { file: 'meeting_notes.md', name: 'Meeting notes (12 Nov)', type: 'notes', label: 'team' },
  { file: 'tasks.csv', name: 'Task sheet', type: 'tasks', label: 'team' },
  { file: 'sponsor_sheet.txt', name: 'Sponsor sheet', type: 'notes', label: 'leads_only' },
];

export async function loadDemoSources(uploadedBy) {
  await pool.query('DELETE FROM items');
  await pool.query('DELETE FROM sources');
  for (const s of DEMO_SOURCES) {
    const content = fs.readFileSync(new URL(s.file, dataDir), 'utf8');
    await pool.query(
      'INSERT INTO sources (name, type, access_label, content, uploaded_by) VALUES ($1,$2,$3,$4,$5)',
      [s.name, s.type, s.label, content, uploadedBy]
    );
  }
}