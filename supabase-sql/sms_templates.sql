-- Run this once in the Supabase SQL editor to enable the
-- "Save as Template" / "Use a saved template..." feature in
-- Conversations > Bulk Actions.

create table if not exists sms_templates (
  id bigint generated always as identity primary key,
  name text not null,
  body text not null,
  subject text,
  created_at timestamptz not null default now()
);

-- If you already ran this file before Email support was added, this
-- line adds the missing column without touching your existing templates.
alter table sms_templates add column if not exists subject text;

create index if not exists sms_templates_created_at_idx on sms_templates(created_at desc);
