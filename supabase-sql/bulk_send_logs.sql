-- Run this once in the Supabase SQL editor to enable persistent
-- history for the Bulk Actions Report table in Conversations > Bulk Actions.

create table if not exists bulk_send_logs (
  id bigint generated always as identity primary key,
  batch_id text not null,
  candidate_id bigint references applicants(id) on delete set null,
  candidate_name text,
  channel text not null default 'sms',
  status text not null,
  error text,
  label text,
  sent_by text,
  sent_at timestamptz not null default now()
);

-- If you already ran this file before Action Label / User tracking was
-- added, these lines add the missing columns without touching existing rows.
alter table bulk_send_logs add column if not exists label text;
alter table bulk_send_logs add column if not exists sent_by text;

create index if not exists bulk_send_logs_batch_id_idx on bulk_send_logs(batch_id);
create index if not exists bulk_send_logs_sent_at_idx on bulk_send_logs(sent_at desc);
