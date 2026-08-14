-- Run this once in the Supabase SQL editor to store the actual message/subject
-- that was sent with each bulk_send_logs row, so failed sends can be resent
-- later from the Send History page without retyping the message.
-- Safe to re-run (IF NOT EXISTS).

alter table bulk_send_logs add column if not exists message text;
alter table bulk_send_logs add column if not exists subject text;
