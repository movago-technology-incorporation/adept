-- Initial content, migrated from the former hardcoded src/data/mock.ts and src/data/content.ts.
-- Idempotent (ON CONFLICT DO NOTHING): never overwrites rows edited in the app.
-- Apply with `npm run db:seed`.

BEGIN;

INSERT INTO site_settings (key, value) VALUES
  ('firm', '{"name":"Adept Bookkeeping Services","short":"Adept","email":"Hello@adeptbookkeepingservices.com","phone":"+1 (306) 351-1406","hours":"M-F: 9am-6pm, Sat: 10am-4pm, Sun: Closed","city":"Regina, Saskatchewan","country":"Canada"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO tax_deadlines (position, title, lines)
SELECT * FROM (VALUES
  (0, 'Individuals', ARRAY['Tax returns due April 30', 'Payment due April 30']::text[]),
  (1, 'Self-employed', ARRAY['Tax returns due June 15', 'Spouses due June 15', 'Payments due April 30']::text[]),
  (2, 'Deceased taxpayers', ARRAY['Later of April 30 of the year after death, or 6 months after the date of death']::text[]),
  (3, 'Trust', ARRAY['Estates trust return', '90 days after the year end of the trust']::text[]),
  (4, 'RRSP', ARRAY['Contribution deadline is the last working day of February each year']::text[])
) AS v(position, title, lines)
WHERE NOT EXISTS (SELECT 1 FROM tax_deadlines);

INSERT INTO testimonials (id, name, role, quote, featured, created_at) VALUES
  ('t1', 'Jide Jokodola', 'Small business owner', 'Adept Bookkeeping Services is really experienced in the delivery of her services. I’ve been patronizing this amazing company since 2024 and I must say they are the best.', true, '2026-01-01 00:00:09'),
  ('t2', 'Bolaji Gift', 'Individual tax client', 'I have an excellent experience with my tax consultant. They are highly professional, always timely and incredibly welcoming. Their expertise made the entire process smooth and stress free. They provided clear guidance, answered all my questions with patience and ensured I got the best possible outcome.', true, '2026-01-01 00:00:08'),
  ('t3', 'Bunmi Obanawu', 'Personal tax filing', 'I used Adept Bookkeeping Services to file my taxes and the whole process was smooth and straightforward. Yemisi was highly responsive and always ready to answer all my questions. I highly recommend them.', true, '2026-01-01 00:00:07'),
  ('t4', 'Amara Cole', 'Corporation, Regina', 'Monthly books, GST, and payroll land on time. The client portal means I stop chasing email attachments at year-end.', false, '2026-01-01 00:00:06')
ON CONFLICT (id) DO NOTHING;


INSERT INTO leads (id, name, email, phone, company, source, interest, status, last_click, page, utm, notes, created_at) VALUES
  ('lead_harper', 'Harper Reid', 'harper@prairieloom.ca', '(306) 555-0144', 'Prairie Loom Studio', 'Homepage CTA', 'Bookkeeping + GST/HST', 'engaged', '2026-10-22 16:18', '/', 'utm_source=instagram&utm_campaign=fall26', 'Clicked Book a consultation twice. Interested in catch-up books from Q2.', '2026-10-18'),
  ('lead_eli', 'Eli Okonkwo', 'eli@okonkwotrades.com', '(306) 555-0190', 'Okonkwo Trades Ltd.', 'Corporation tax page', 'T2 + payroll', 'consult booked', '2026-10-21 09:42', '/tax/corporation', 'utm_source=google&utm_campaign=t2', 'Needs first T2 after incorporation in March.', '2026-10-12'),
  ('lead_sloane', 'Sloane Park', 'sloane.park@gmail.com', '(639) 555-0112', 'Self-employed', 'Tax filing request', 'T1 personal', 'new', '2026-10-23 11:05', '/tax/filing-request', 'direct', 'Started filing form, did not submit.', '2026-10-23')
ON CONFLICT (id) DO NOTHING;

INSERT INTO clients (id, name, company, email, phone, type, since) VALUES
  ('cli_northwind', 'Maya Adewale', 'Northwind Catering', 'maya@northwindcatering.ca', '(306) 555-0177', 'Corporation', '2024-03-02'),
  ('cli_jide', 'Jide Jokodola', 'Jokodola Holdings', 'jide@example.com', '(306) 555-0108', 'Sole proprietor', '2024-01-14'),
  ('cli_bolaji', 'Bolaji Gift', 'Personal', 'bolaji@example.com', '(639) 555-0166', 'Individual', '2025-03-20')
ON CONFLICT (id) DO NOTHING;

INSERT INTO follow_ups (id, lead_id, channel, subject, scheduled_for, status) VALUES
  ('fu1', 'lead_harper', 'email', 'Catch-up books for Prairie Loom', '2026-10-24 09:00', 'queued'),
  ('fu2', 'lead_sloane', 'email', 'Finish your tax filing request', '2026-10-24 11:00', 'queued'),
  ('fu3', 'lead_eli', 'sms', 'Reminder: T2 consult Oct 28, 10:00', '2026-10-27 16:00', 'queued')
ON CONFLICT (id) DO NOTHING;

INSERT INTO click_events (id, at, page, cta, referrer, device, city, lead_id) VALUES
  ('ck1', '2026-10-23 11:05', '/tax/filing-request', 'Start filing request', 'direct', 'iPhone', 'Regina', 'lead_sloane'),
  ('ck2', '2026-10-22 16:18', '/', 'Book a consultation', 'instagram.com', 'Safari / Mac', 'Saskatoon', 'lead_harper'),
  ('ck3', '2026-10-21 09:42', '/tax/corporation', 'Talk to Adept', 'google.com', 'Chrome', 'Regina', 'lead_eli'),
  ('ck4', '2026-10-20 19:11', '/bookkeeping', 'Learn more', 'facebook.com', 'Android', 'Moose Jaw', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO appointments (id, client_id, lead_id, name, email, topic, date, time, meeting_url, status, summary, notes) VALUES
  ('apt_eli', NULL, 'lead_eli', 'Eli Okonkwo', 'eli@okonkwotrades.com', 'First-year T2 planning', '2026-10-28', '10:00', 'https://meet.adeptbookkeepingservices.com/room/apt_eli', 'scheduled', NULL, NULL),
  ('apt_maya', 'cli_northwind', NULL, 'Maya Adewale', 'maya@northwindcatering.ca', 'Q4 catch-up + payroll', '2026-10-24', '14:30', 'https://meet.adeptbookkeepingservices.com/room/apt_maya', 'completed', 'Maya confirmed catering volume is up 18% heading into holiday season. Agreed to weekly receipt drops, a December payroll extra run, and a T2 planning call after year-end close. Outstanding: shareholder loan worksheet and two vendor 1099-equivalents.', 'AI notes captured from the 24-minute working session.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO proposals (id, client_id, lead_id, title, amount, status, sent_at, accepted_at) VALUES
  ('pr_eli', NULL, 'lead_eli', 'Monthly bookkeeping + T2 for Okonkwo Trades', '$425 / month + T2', 'sent', '2026-10-20', NULL),
  ('pr_north', 'cli_northwind', NULL, 'Q4 cleanup + payroll add-on', '$1,150', 'accepted', '2026-09-28', '2026-09-30')
ON CONFLICT (id) DO NOTHING;

INSERT INTO jobs (id, client_id, title, status, completed_at, review_status, reminders) VALUES
  ('job_gst', 'cli_northwind', 'Q3 GST/HST filing', 'completed', '2026-10-08', 'reminded', 1),
  ('job_books', 'cli_northwind', 'October monthly books', 'in progress', NULL, 'idle', 0),
  ('job_t1', 'cli_bolaji', '2025 T1 personal return', 'review', NULL, 'idle', 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO documents (id, client_id, name, kind, category, size, uploaded_at) VALUES
  ('doc1', 'cli_northwind', 'T2_2025_draft.pdf', 'tax', 'Corporate tax', '1.2 MB', '2026-09-12'),
  ('doc2', 'cli_northwind', 'Q3_P&L.xlsx', 'report', 'Management reports', '240 KB', '2026-10-04'),
  ('doc3', 'cli_northwind', 'GST_Q3_2026.pdf', 'tax', 'GST/HST', '180 KB', '2026-10-08'),
  ('doc4', 'cli_northwind', 'Bank_Sept_RBC.pdf', 'upload', 'Banking', '890 KB', '2026-10-02'),
  ('doc5', 'cli_northwind', 'Costco_receipt_1044.jpg', 'receipt', 'Receipts', '640 KB', '2026-10-19'),
  ('doc6', 'cli_jide', 'T1_2025.pdf', 'tax', 'Personal tax', '760 KB', '2026-04-18')
ON CONFLICT (id) DO NOTHING;

INSERT INTO forms (id, client_id, title, due, status) VALUES
  ('frm1', 'cli_northwind', '2026 T2 organizer', '2026-11-15', 'outstanding'),
  ('frm2', 'cli_northwind', 'Shareholder loan worksheet', '2026-10-31', 'in progress'),
  ('frm3', 'cli_northwind', 'Payroll authorization', '2026-09-01', 'completed')
ON CONFLICT (id) DO NOTHING;

INSERT INTO messages (id, client_id, author, body, at) VALUES
  ('m1', 'cli_northwind', 'adept', 'Maya, Q3 books are closed. GST return is in your tax documents folder for review.', '2026-10-08 10:22'),
  ('m2', 'cli_northwind', 'client', 'Thank you. I uploaded September RBC statements and a Costco receipt from the catering weekend.', '2026-10-19 18:41'),
  ('m3', 'cli_northwind', 'adept', 'Received. We still need the shareholder loan worksheet before we can lock the T2 draft.', '2026-10-20 09:05')
ON CONFLICT (id) DO NOTHING;

COMMIT;
