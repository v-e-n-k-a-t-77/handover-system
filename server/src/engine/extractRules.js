// Rule-based extractor. Works with no API key.
// It proposes items. Each item carries evidence: a verbatim quote + its location.
// It does NOT decide green/amber/red. That happens in verify.js.

const TOPICS = [
  ['venue', /venue/i],
  ['poster', /poster/i],
  ['logo', /logo/i],
  ['social', /social media/i],
  ['signup', /sign-?up/i],
  ['delivery', /deliver/i],
  ['receipt', /receipt/i],
  ['rain', /\brain/i],
];
const topicOf = (text) => {
  for (const [key, re] of TOPICS) if (re.test(text)) return key;
  return null;
};
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const topicFor = (text) => topicOf(text) || slug(text);

const CHAT_RE = /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap][Mm])?\]?\s*(?:-\s*)?([^:]+):\s*(.+)$/;

export function extractRules(sources) {
  const cands = [];
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const add = (type, topic, statement, evidence, rank = 0, state = null) =>
    cands.push({ key: `${type}:${topic}`, type, statement: cap(statement), evidence, rank, state });

  for (const src of sources) {
    if (src.type === 'chat') fromChat(src, add);
    else if (src.type === 'tasks') fromTasks(src, add);
    else fromNotes(src, add);
  }
  return merge(cands);
}

function fromChat(src, add) {
  src.content.split(/\r?\n/).forEach((raw, i) => {
    const m = CHAT_RE.exec(raw.trim());
    if (!m) return;
    const [, day, sender, text] = m;
    const ev = (extra = {}) => ({
      sourceId: src.id, locator: `line ${i + 1} (${sender}, ${day})`, quote: text, ...extra,
    });
    let x;

    // "I will handle the venue booking and the social media posts."
    if ((x = /\bI will (?:handle|take over|take|do|manage)\s+(.+?)\.?$/i.exec(text))) {
      for (const part of x[1].split(/\s+and\s+|,\s*/)) {
        add('task', topicFor(part), part.replace(/^the\s+/i, ''), ev({ owner: sender }));
      }
    }
    // "Booked the venue hall for 14 Dec."
    if ((x = /\b(?:booked|scheduled|fixed)\b.*?\bfor\s+(\d{1,2}\s+[A-Za-z]{3})\b/i.exec(text))) {
      add('task', topicFor(text), text, ev({ date: x[1] }));
    }
    // "Decided in the meeting: ..."
    if ((x = /^(?:decided(?: in the meeting)?|decision):\s*(.+)$/i.exec(text))) {
      add('decision', topicFor(x[1]), x[1], ev());
    }
    // "... again"
    if (/\bagain\b/i.test(text)) add('recurring_issue', topicFor(text), text, ev());
    // "... can only start once ..."
    if (/\b(?:can only start|only start|cannot start|can't start|waits? for|depends? on)\b/i.test(text)) {
      add('dependency', topicFor(text), text, ev());
    }
    // "... may be ... if ..."
    if (/\b(?:may be|might|could)\b.*\b(?:if|unless)\b/i.test(text)) {
      add('risk', topicFor(text), text, ev());
    }
    // "Who is keeping ...?"
    if ((x = /^(?:who|what|when|where|which|how)\b[^?]*\?/i.exec(text))) {
      add('open_question', topicFor(x[0]), x[0], ev());
    }
  });
}

function fromNotes(src, add) {
  src.content.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const ev = (extra = {}) => ({ sourceId: src.id, locator: `line ${i + 1}`, quote: line, ...extra });
    let x;
    if ((x = /^Decision:\s*(.+)$/i.exec(line))) {
      add('decision', topicFor(x[1]), x[1], ev(), 1);
    } else if ((x = /^Recurring issue:\s*(.+)$/i.exec(line))) {
      add('recurring_issue', topicFor(x[1]), x[1], ev(), 1);
    } else if ((x = /^Action:\s*(\w+)\s+to\s+(.+?)(?:\s+by\s+(\d{1,2}\s+[A-Za-z]{3}))?\.?$/i.exec(line))) {
      add('task', topicFor(x[2]), x[2], ev({ owner: x[1], date: x[3] }), 1);
    } else if ((x = /^Contact:\s*(.+)$/i.exec(line))) {
      add('contact', `${src.id}-${i + 1}`, line, ev(), 1);
    } else if ((x = /^Payment:\s*(.+)$/i.exec(line))) {
      add('payment', `${src.id}-${i + 1}`, x[1], ev(), 1);
    }
  });
}

function fromTasks(src, add) {
  src.content.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || i === 0) return; // line 1 is the header
    const [task, owner, due, state] = line.split(',').map((s) => s.trim());
    if (!task) return;
    add('task', topicFor(task), task,
      { sourceId: src.id, locator: `row ${i + 1}`, quote: line, owner: owner || undefined, date: due || undefined },
      2, state);
  });
}

// Items about the same thing (same type + topic) are merged. Their evidence is combined.
function merge(cands) {
  const groups = new Map();
  for (const c of cands) {
    let g = groups.get(c.key);
    if (!g) {
      g = { type: c.type, statement: c.statement, rank: c.rank, task_state: null, evidences: [] };
      groups.set(c.key, g);
    }
    if (c.rank > g.rank) { g.statement = c.statement; g.rank = c.rank; }
    if (c.state) g.task_state = c.state;
    g.evidences.push(c.evidence);
  }
  return [...groups.values()].map((g) => {
    const pick = (field) => {
      const vals = g.evidences.filter((e) => e[field]);
      const distinct = new Set(vals.map((e) => e[field].toLowerCase()));
      return distinct.size === 1 ? vals[0][field] : null; // disagreement -> null, verify.js flags it
    };
    return {
      type: g.type, statement: g.statement, owner: pick('owner'), due_date: pick('date'),
      task_state: g.task_state, evidences: g.evidences,
    };
  });
}