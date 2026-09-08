-- Business -> salesperson assignment. This is what the Final Lead Report
-- looks up at generation time, replacing the hardcoded ACCOUNT_MAPPING in
-- src/sales/modules/dashboard/utils/accountMapping.js as the source of
-- truth for "who owns this business right now". Reassigning a business
-- here takes effect on every future report immediately -- no CSV data or
-- old sales_leads rows need to change.
--
-- Run this once in the Supabase SQL editor (same workflow as
-- fix_rls_new_tables.sql). RLS is disabled to match every other table in
-- this project (applicants, settings, chat_messages, sales_leads,
-- csv_uploads, etc.) -- none of them use RLS policies, they're all
-- accessed directly from the client with the anon key.

create extension if not exists pgcrypto;

create table if not exists business_assignments (
  id uuid primary key default gen_random_uuid(),
  business_location text not null unique,
  salesperson_name text not null,
  salesperson_user_id uuid references profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id) on delete set null
);

alter table business_assignments disable row level security;

-- Seed from the current hardcoded ACCOUNT_OWNERS mapping so nothing goes
-- blank on cutover -- reassign any of these from the Business Assignments
-- tab whenever they actually change.
insert into business_assignments (business_location, salesperson_name) values
  ('Albany',    'Rahul'),
  ('Syracuse',  'Aqsa'),
  ('Rochester', 'Habil'),
  ('Buffalo',   'Anusha'),
  ('Erie',      'Vidhya'),
  ('Belmont',   'Shakeel'),
  ('Moore',     'Shakeel')
on conflict (business_location) do nothing;
