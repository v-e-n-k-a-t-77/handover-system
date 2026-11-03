// Verification engine. Plain code, no AI.
// 1) Every quote must really exist at its cited location.
// 2) Status rules decide green / amber / red.
// 3) An item inherits the strictest access label of its sources.

const norm = (s) => String(s).replace(/\s+/g, ' ').trim().toLowerCase();
const FORMAL = new Set(['notes', 'tasks']);

function quoteIsReal(ev, src) {
  if (!src) return false;
  const m = /^(?:line|row) (\d+)/.exec(ev.locator);
  if (!m) return false;
  const line = src.content.split(/\r?\n/)[Number(m[1]) - 1];
  return line !== undefined && norm(line).includes(norm(ev.quote));
}

export function gradeItem(item, byId) {
  for (const ev of item.evidences) ev.verified = quoteIsReal(ev, byId.get(ev.sourceId));
  const good = item.evidences.filter((e) => e.verified);
  const where = (e) => `${byId.get(e.sourceId).name}, ${e.locator.split(' (')[0]}`;

  item.access_label = item.evidences.some((e) => byId.get(e.sourceId)?.access_label === 'leads_only')
    ? 'leads_only' : 'team';
  const result = (status, reason) => ({ ...item, status, status_reason: reason });

  if (good.length === 0) {
    return result('red', 'Unsupported: no quote could be verified in its source. Hidden from the joiner.');
  }

  const disagreement = (field, label) => {
    const seen = new Map();
    for (const e of good) if (e[field] && !seen.has(norm(e[field]))) seen.set(norm(e[field]), e);
    if (seen.size < 2) return null;
    return `Sources disagree on the ${label}: ` +
      [...seen.values()].map((e) => `${e[field]} (${where(e)})`).join(' vs ');
  };
  const dateProblem = disagreement('date', 'date');
  if (dateProblem) return result('red', dateProblem);
  const ownerProblem = disagreement('owner', 'owner');
  if (ownerProblem) return result('red', ownerProblem);

  if (item.type === 'open_question') {
    return result('red', 'Open question: nobody has confirmed an owner or an answer.');
  }
  if (item.type === 'task' && !item.owner) return result('red', 'No owner is named for this task.');

  const sources = new Set(good.map((e) => e.sourceId));
  const formal = good.find((e) => FORMAL.has(byId.get(e.sourceId).type));
  if (formal) {
    const name = byId.get(formal.sourceId).name;
    return result('green', sources.size > 1
      ? `Confirmed by ${sources.size} sources, including ${name}.`
      : `Stated directly in ${name}.`);
  }
  if (sources.size > 1) return result('green', `Confirmed by ${sources.size} separate sources.`);
  return result('amber', 'Only chat messages support this and no formal record confirms it.');
}
