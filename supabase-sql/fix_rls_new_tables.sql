-- Run this once in the Supabase SQL editor to fix:
-- "new row violates row-level security policy for table sms_templates"
--
-- The new tables (sms_templates, bulk_send_logs) got Row-Level Security
-- enabled by default with no policies, which blocks ALL access — even
-- from your own logged-in app. This matches the existing tables
-- (applicants, settings, chat_messages, etc.) which already work today,
-- so it just brings the new tables in line with them.

alter table sms_templates disable row level security;
alter table bulk_send_logs disable row level security;
