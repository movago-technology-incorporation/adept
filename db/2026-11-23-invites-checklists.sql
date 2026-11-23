-- Invite-only portal registration: Adept sends a dedicated link that expires when the admin chooses.
CREATE TABLE IF NOT EXISTS portal_invites (
  id         TEXT PRIMARY KEY,
  client_id  TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portal_invites_client_idx ON portal_invites (client_id, created_at DESC);

-- Monthly checklist Adept sets up per client (e.g. "Upload bank statements"), ticked off month by month.
CREATE TABLE IF NOT EXISTS checklist_items (
  id         TEXT PRIMARY KEY,
  client_id  TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  position   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS checklist_items_client_idx ON checklist_items (client_id, position);

CREATE TABLE IF NOT EXISTS checklist_marks (
  item_id TEXT NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
  month   TEXT NOT NULL,              -- YYYY-MM
  done_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  done_by TEXT NOT NULL DEFAULT 'client', -- client | adept
  PRIMARY KEY (item_id, month)
);
