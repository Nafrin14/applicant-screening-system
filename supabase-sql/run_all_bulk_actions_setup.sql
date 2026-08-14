-- Run this ONCE in the Supabase SQL editor to set up everything the
-- Bulk Actions / Conversations features need. Combines:
--   bulk_send_logs.sql, sms_templates.sql, settings_hr_phone.sql,
--   settings_reply_to_email.sql, applicants_email_status.sql
-- Safe to re-run — every statement is idempotent (IF NOT EXISTS).

-- 1. Bulk send history (Bulk Actions Report table)
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
alter table bulk_send_logs add column if not exists label text;
alter table bulk_send_logs add column if not exists sent_by text;
create index if not exists bulk_send_logs_batch_id_idx on bulk_send_logs(batch_id);
create index if not exists bulk_send_logs_sent_at_idx on bulk_send_logs(sent_at desc);

-- 2. SMS/WhatsApp/Email templates
create table if not exists sms_templates (
  id bigint generated always as identity primary key,
  name text not null,
  body text not null,
  subject text,
  created_at timestamptz not null default now()
);
alter table sms_templates add column if not exists subject text;
create index if not exists sms_templates_created_at_idx on sms_templates(created_at desc);

-- 3. Recruiter phone (for {{RecruiterPhone}})
alter table settings add column if not exists hr_phone text;

-- 4. Reply-To address for bulk emails
alter table settings add column if not exists reply_to_email text;

-- 5. Per-candidate email status tracking
alter table applicants add column if not exists email_status text;
alter table applicants add column if not exists last_email_sent_at timestamptz;
