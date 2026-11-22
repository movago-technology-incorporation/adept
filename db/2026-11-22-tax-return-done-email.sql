-- Remember when the "your return is done" email went out, so re-marking Done after a staff reopen never emails twice.
ALTER TABLE tax_returns ADD COLUMN IF NOT EXISTS completed_emailed_at TIMESTAMPTZ;
-- Returns already finished before this change count as notified.
UPDATE tax_returns SET completed_emailed_at = updated_at WHERE status = 'done' AND completed_emailed_at IS NULL;
