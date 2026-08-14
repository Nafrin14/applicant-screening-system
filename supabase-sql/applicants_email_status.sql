-- Run this once in the Supabase SQL editor to enable per-candidate
-- interview-email status tracking (per requirements doc §11/§20.13).

alter table applicants add column if not exists email_status text;
alter table applicants add column if not exists last_email_sent_at timestamptz;
