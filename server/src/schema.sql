DROP TABLE IF EXISTS acknowledgements, review_actions, evidence, items, sources, users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('lead','leaver','joiner'))
);

CREATE TABLE sources (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('chat','notes','tasks')),
  access_label TEXT NOT NULL CHECK (access_label IN ('team','leads_only')),
  content TEXT NOT NULL,
  uploaded_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  statement TEXT NOT NULL,
  owner TEXT,
  due_date TEXT,
  successor TEXT,
  task_state TEXT,
  status TEXT NOT NULL CHECK (status IN ('green','amber','red')),
  status_reason TEXT NOT NULL,
  access_label TEXT NOT NULL DEFAULT 'team',
  review_state TEXT NOT NULL DEFAULT 'pending'
    CHECK (review_state IN ('pending','approved','rejected','corrected')),
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE evidence (
  id SERIAL PRIMARY KEY,
  item_id INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  source_id INT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  locator TEXT NOT NULL,
  quote TEXT NOT NULL,
  verified BOOLEAN NOT NULL,
  kind TEXT NOT NULL DEFAULT 'document'
);

CREATE TABLE review_actions (
  id SERIAL PRIMARY KEY,
  item_id INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  reviewer_id INT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE acknowledgements (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  handover_version INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);