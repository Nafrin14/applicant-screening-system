-- Run this once in the Supabase SQL editor. Adds the columns/table the
-- rebuilt Settings page needs:
--   - notify_interview_reminders / notify_mail_replies: on/off toggles for
--     the two notification types this app creates.
--   - email_from_name: the sender display name used for bulk emails (paired
--     with an EmailJS template change — see the app's Settings page note).
--   - sync_status: one row the mail poller (scripts/pollMail.js) updates
--     every run, so Settings can show "Last synced X ago".

alter table settings add column if not exists notify_interview_reminders boolean not null default true;
alter table settings add column if not exists notify_mail_replies boolean not null default true;
alter table settings add column if not exists email_from_name text;

create table if not exists sync_status (
  id bigint primary key default 1,
  last_synced_at timestamptz,
  constraint sync_status_singleton check (id = 1)
);
insert into sync_status (id, last_synced_at) values (1, null)
  on conflict (id) do nothing;

alter table sync_status disable row level security;
