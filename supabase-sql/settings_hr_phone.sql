-- Run this once in the Supabase SQL editor to add a recruiter phone
-- number field to Settings, used to populate {{RecruiterPhone}} in
-- bulk interview-invite emails.

alter table settings add column if not exists hr_phone text;
