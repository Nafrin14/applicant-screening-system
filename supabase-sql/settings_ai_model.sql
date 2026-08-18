-- Run this once in the Supabase SQL editor.
-- Adds the AI model selection field to settings — UI-only for now, the
-- resume-screening backend (server/routes/aiScreening.js) still always uses
-- Groq regardless of this value until the other providers are wired up.

alter table settings add column if not exists ai_model text not null default 'groq';
