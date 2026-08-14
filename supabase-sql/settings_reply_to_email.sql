-- Run this once in the Supabase SQL editor to add a configurable
-- Reply-To address for bulk interview emails (per requirements doc §10).

alter table settings add column if not exists reply_to_email text;
