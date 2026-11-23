-- Proposals become real documents: fill-in details, a private client link, decision and e-signature.
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS token_hash TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS decision_note TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS decided_at TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS signed_name TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS signed_ip TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS signed_agent TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS document_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS proposals_token_idx ON proposals (token_hash) WHERE token_hash IS NOT NULL;
