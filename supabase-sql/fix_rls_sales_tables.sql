-- sales_leads and csv_uploads currently have Row-Level Security enabled
-- with no policies letting the Sales Admin dashboard (or an admin
-- uploading a CSV on a salesperson's behalf) read or write across all
-- users -- inserts fail with "new row violates row-level security policy"
-- and the Final Lead Report silently sees zero leads.
--
-- Every other table in this project (applicants, settings, chat_messages,
-- business_assignments, sms_templates, bulk_send_logs, etc.) already has
-- RLS disabled -- access control for the Sales Dashboard is enforced in
-- the app/server instead (see server/routes/salesAdmin.js). This just
-- brings these two tables in line with that same convention.
--
-- Run this once in the Supabase SQL editor.

alter table sales_leads disable row level security;
alter table csv_uploads disable row level security;
