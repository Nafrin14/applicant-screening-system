-- Run this once in the Supabase SQL editor to set up the Mail Inbox feature.
-- Stores candidate email replies fetched by the GitHub Actions IMAP poller
-- (.github/workflows/imap-poll.yml). Matches replies back to a candidate via
-- the [Ref: id] tag already appended to every bulk email's subject.

create table if not exists email_replies (
  id bigint generated always as identity primary key,
  message_id text unique,
  candidate_id bigint references applicants(id) on delete set null,
  from_email text,
  from_name text,
  subject text,
  body_text text,
  received_at timestamptz not null default now(),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists email_replies_candidate_id_idx on email_replies(candidate_id);
create index if not exists email_replies_received_at_idx on email_replies(received_at desc);

-- Matches every other new table in this app (RLS enabled with no policies
-- blocks all access, including from the app itself).
alter table email_replies disable row level security;
