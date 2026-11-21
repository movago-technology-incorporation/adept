-- Adept Bookkeeping schema (Neon Postgres).
-- Idempotent: safe to re-run. Apply with `npm run db:migrate`
-- (uses DATABASE_URL_UNPOOLED — migrations must use the direct connection).

-- ── Public site content ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_deadlines (
  id       SERIAL PRIMARY KEY,
  position INT NOT NULL DEFAULT 0,
  title    TEXT NOT NULL,
  lines    TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS testimonials (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT '',
  quote      TEXT NOT NULL,
  featured   BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Availability now comes live from Cal.com; the old static slots table is retired.
DROP TABLE IF EXISTS availability_slots;

-- ── CRM / pipeline ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leads (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT NOT NULL DEFAULT '',
  company    TEXT NOT NULL DEFAULT '',
  source     TEXT NOT NULL DEFAULT 'Website',
  interest   TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'new',
  last_click TEXT NOT NULL DEFAULT '',
  page       TEXT NOT NULL DEFAULT '/',
  utm        TEXT NOT NULL DEFAULT '',
  notes      TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
  id      TEXT PRIMARY KEY,
  name    TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  email   TEXT NOT NULL,
  phone   TEXT NOT NULL DEFAULT '',
  type    TEXT NOT NULL,
  since   DATE NOT NULL DEFAULT current_date
);
CREATE UNIQUE INDEX IF NOT EXISTS clients_email_idx ON clients (lower(email));

CREATE TABLE IF NOT EXISTS follow_ups (
  id            TEXT PRIMARY KEY,
  lead_id       TEXT NOT NULL,
  channel       TEXT NOT NULL,
  subject       TEXT NOT NULL,
  scheduled_for TIMESTAMP NOT NULL,
  status        TEXT NOT NULL DEFAULT 'queued'
);

CREATE TABLE IF NOT EXISTS click_events (
  id       TEXT PRIMARY KEY,
  at       TIMESTAMP NOT NULL DEFAULT now(),
  page     TEXT NOT NULL,
  cta      TEXT NOT NULL,
  referrer TEXT NOT NULL DEFAULT '',
  device   TEXT NOT NULL DEFAULT '',
  city     TEXT NOT NULL DEFAULT '',
  lead_id  TEXT
);
CREATE INDEX IF NOT EXISTS click_events_at_idx ON click_events (at DESC);

-- ── Delivery ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS appointments (
  id          TEXT PRIMARY KEY,
  client_id   TEXT REFERENCES clients(id) ON DELETE SET NULL,
  lead_id     TEXT,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  topic       TEXT NOT NULL,
  date        DATE NOT NULL,
  time        TEXT NOT NULL,
  meeting_url TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'scheduled',
  summary     TEXT,
  notes       TEXT
);
-- Cal.com booking link (bookings are created/synced through the Cal.com API).
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cal_uid TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration INT;
CREATE UNIQUE INDEX IF NOT EXISTS appointments_cal_uid_idx ON appointments (cal_uid);

CREATE TABLE IF NOT EXISTS proposals (
  id          TEXT PRIMARY KEY,
  client_id   TEXT REFERENCES clients(id) ON DELETE SET NULL,
  lead_id     TEXT,
  title       TEXT NOT NULL,
  amount      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'draft',
  sent_at     DATE,
  accepted_at DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
  id            TEXT PRIMARY KEY,
  client_id     TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'queued',
  completed_at  DATE,
  review_status TEXT NOT NULL DEFAULT 'idle',
  reminders     INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Client portal ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS documents (
  id          TEXT PRIMARY KEY,
  client_id   TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  kind        TEXT NOT NULL,
  category    TEXT NOT NULL,
  size        TEXT NOT NULL,
  uploaded_at DATE NOT NULL DEFAULT current_date,
  storage_key TEXT
);
CREATE INDEX IF NOT EXISTS documents_client_idx ON documents (client_id);

CREATE TABLE IF NOT EXISTS forms (
  id        TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title     TEXT NOT NULL,
  due       DATE NOT NULL,
  status    TEXT NOT NULL DEFAULT 'outstanding'
);
CREATE INDEX IF NOT EXISTS forms_client_idx ON forms (client_id);

CREATE TABLE IF NOT EXISTS messages (
  id        TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  author    TEXT NOT NULL,
  body      TEXT NOT NULL,
  at        TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_client_idx ON messages (client_id, at);

-- ── Email ──────────────────────────────────────────────────────────────

-- Follow-ups carry their own message and delivery result.
ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS body TEXT NOT NULL DEFAULT '';
ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS error TEXT;
CREATE INDEX IF NOT EXISTS follow_ups_due_idx ON follow_ups (status, scheduled_for);

-- Every transactional email the app sends (for support and auditing).
CREATE TABLE IF NOT EXISTS email_log (
  id         BIGSERIAL PRIMARY KEY,
  kind       TEXT NOT NULL,
  to_email   TEXT NOT NULL,
  subject    TEXT NOT NULL,
  status     TEXT NOT NULL,
  error      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_log_created_idx ON email_log (created_at DESC);

-- Set the first time a client signs in to the portal (drives the welcome email).
ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_user_id TEXT;
