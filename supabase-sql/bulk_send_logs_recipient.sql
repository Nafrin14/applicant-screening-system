-- Run this once in the Supabase SQL editor to add a "recipient" column to
-- bulk_send_logs, so the Send History batch-detail popup can show which
-- email/phone each message actually went to, not just the candidate name.
-- Safe to re-run (IF NOT EXISTS).

alter table bulk_send_logs add column if not exists recipient text;
